
import { useRef, useState } from "react";
import Swal from "sweetalert2";
import {
    collection,
    doc,
    documentId,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    writeBatch,
} from "firebase/firestore";
import {
    Database,
    Search,
    Play,
    ShieldCheck,
    LoaderCircle,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";

import { auth, db } from "../../firebase";

const BATCH_SIZE = 200;

const createEmptyStats = () => ({
    total: 0,
    missing: 0,
    standard: 0,
    partner: 0,
    other: 0,
});

const getListingKindStatus = (data) => {
    const hasPartnerFields =
        data.listingKind === "partner" ||
        ["partnerUid", "partnerType", "realEstate"].some(
            (field) =>
                Object.prototype.hasOwnProperty.call(
                    data,
                    field
                )
        );

    if (hasPartnerFields) {
        return "partner";
    }

    if (data.listingKind === "standard") {
        return "standard";
    }

    if (
        data.listingKind === undefined ||
        data.listingKind === null ||
        data.listingKind === ""
    ) {
        return "missing";
    }

    return "other";
};

const checkAdminAccess = async () => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error(
            "Потрібно увійти в обліковий запис адміністратора."
        );
    }

    const snapshot = await getDoc(
        doc(db, "users", user.uid)
    );

    if (
        !snapshot.exists() ||
        snapshot.data()?.role !== "admin"
    ) {
        throw new Error(
            "Ця операція доступна лише адміністратору."
        );
    }
};

const processAllListings = async (onPage) => {
    let cursor = null;

    while (true) {
        const constraints = [
            orderBy(documentId()),
            limit(BATCH_SIZE),
        ];

        if (cursor) {
            constraints.push(startAfter(cursor));
        }

        const snapshot = await getDocs(
            query(
                collection(db, "listings"),
                ...constraints
            )
        );

        if (snapshot.empty) {
            break;
        }

        await onPage(snapshot.docs);

        cursor =
            snapshot.docs[snapshot.docs.length - 1];

        if (snapshot.docs.length < BATCH_SIZE) {
            break;
        }
    }
};

export default function AdminTouristPlaces() {
    const [busy, setBusy] = useState("");
    const [stats, setStats] = useState(null);
    const [progress, setProgress] = useState({
        scanned: 0,
        updated: 0,
    });

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const busyRef = useRef(false);

    const handleScan = async () => {
        if (busyRef.current) return;

        busyRef.current = true;

        setBusy("scan");
        setStats(null);
        setError("");
        setMessage("");
        setProgress({
            scanned: 0,
            updated: 0,
        });

        try {
            await checkAdminAccess();

            const result = createEmptyStats();

            await processAllListings(async (documents) => {
                documents.forEach((document) => {
                    const status = getListingKindStatus(
                        document.data()
                    );

                    result.total += 1;
                    result[status] += 1;
                });

                setStats({ ...result });

                setProgress({
                    scanned: result.total,
                    updated: 0,
                });
            });

            setStats({ ...result });

            setMessage(
                result.missing > 0
                    ? `Перевірку завершено. Знайдено ${result.missing} оголошень для оновлення.`
                    : "Перевірку завершено. Усі відповідні оголошення вже мають тип."
            );
        } catch (error) {
            console.error(
                "Помилка перевірки оголошень:",
                error
            );

            setStats(null);
            setError(
                error.message ||
                "Не вдалося перевірити базу даних."
            );
        } finally {
            busyRef.current = false;
            setBusy("");
        }
    };

    const handleMigration = async () => {
        if (
            busyRef.current ||
            !stats ||
            stats.missing === 0
        ) {
            return;
        }

        busyRef.current = true;

        try {
            const confirmation = await Swal.fire({
                icon: "warning",
                title: "Оновити оголошення?",
                html: `
                    <div style="text-align:left;line-height:1.7;font-size:14px;">
                        <p>
                            Буде додано поле
                            <strong>listingKind: "standard"</strong>
                            до звичайних оголошень без цього поля.
                        </p>
                        <p style="margin-top:10px;">
                            За результатами останньої перевірки:
                            <strong>${stats.missing}</strong>
                            документів потребують оновлення.
                        </p>
                        <p style="margin-top:10px;">
                            Партнерські оголошення не змінюються.
                            Інші поля документів залишаються без змін.
                        </p>
                    </div>
                `,
                input: "text",
                inputPlaceholder: "Введіть STANDARD",
                showCancelButton: true,
                confirmButtonText: "Запустити оновлення",
                cancelButtonText: "Скасувати",
                confirmButtonColor: "#2563eb",
                cancelButtonColor: "#64748b",
                reverseButtons: true,
                preConfirm: (value) => {
                    if (
                        String(value)
                            .trim()
                            .toUpperCase() !== "STANDARD"
                    ) {
                        Swal.showValidationMessage(
                            "Введіть STANDARD для підтвердження."
                        );

                        return false;
                    }

                    return true;
                },
            });

            if (!confirmation.isConfirmed) {
                return;
            }

            setBusy("migration");
            setError("");
            setMessage("");
            setProgress({
                scanned: 0,
                updated: 0,
            });

            await checkAdminAccess();

            const result = createEmptyStats();
            let updated = 0;

            await processAllListings(async (documents) => {
                const batch = writeBatch(db);
                let batchUpdates = 0;

                documents.forEach((document) => {
                    const status = getListingKindStatus(
                        document.data()
                    );

                    result.total += 1;
                    result[status] += 1;

                    if (status !== "missing") {
                        return;
                    }

                    batch.update(document.ref, {
                        listingKind: "standard",
                    });

                    batchUpdates += 1;
                });

                if (batchUpdates > 0) {
                    await batch.commit();

                    updated += batchUpdates;

                    result.standard += batchUpdates;
                    result.missing -= batchUpdates;
                }

                setProgress({
                    scanned: result.total,
                    updated,
                });
            });

            setStats({ ...result });

            setMessage(
                `Оновлення завершено! Поле listingKind: "standard" додано до ${updated} оголошень.`
            );

            await Swal.fire({
                icon: "success",
                title: "Готово!",
                html: `
                    <p>Міграцію успішно завершено.</p>
                    <p style="margin-top:10px;">
                        Оновлено документів:
                        <strong>${updated}</strong>
                    </p>
                `,
                confirmButtonText: "Зрозуміло",
                confirmButtonColor: "#2563eb",
            });
        } catch (error) {
            console.error(
                "Помилка міграції оголошень:",
                error
            );

            setStats(null);

            setError(
                "Не вдалося завершити міграцію. " +
                "Попередні пакети могли бути збережені. " +
                "Виконайте повторну перевірку. " +
                (error.message || "")
            );
        } finally {
            busyRef.current = false;
            setBusy("");
        }
    };

    return (
        <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Database size={24} />
                    </div>

                    <div>
                        <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
                            Обслуговування бази RBoard
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Перевірка та міграція оголошень
                            у колекції Firestore listings.
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2">
                    <ShieldCheck
                        size={20}
                        className="text-blue-600"
                    />

                    <h2 className="text-base font-bold text-slate-900">
                        Міграція типів оголошень
                    </h2>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                    Інструмент додає поле
                    <strong> listingKind: "standard" </strong>
                    до звичайних оголошень, у яких воно
                    відсутнє або порожнє.
                    Партнерські записи та невідомі типи
                    автоматично пропускаються.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={handleScan}
                        disabled={Boolean(busy)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy === "scan" ? (
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                        ) : (
                            <Search size={18} />
                        )}

                        {busy === "scan"
                            ? "Перевіряємо..."
                            : "Перевірити базу"}
                    </button>

                    <button
                        type="button"
                        onClick={handleMigration}
                        disabled={
                            Boolean(busy) ||
                            !stats ||
                            stats.missing === 0
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy === "migration" ? (
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                        ) : (
                            <Play size={18} />
                        )}

                        {busy === "migration"
                            ? "Оновлюємо..."
                            : "Додати listingKind: standard"}
                    </button>
                </div>

                {busy && (
                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2">
                            <LoaderCircle
                                size={17}
                                className="animate-spin text-blue-600"
                            />

                            <span className="text-sm font-semibold text-slate-700">
                                {busy === "scan"
                                    ? "Перевірка документів..."
                                    : "Оновлення документів..."}
                            </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                            Перевірено: {progress.scanned}
                            {" · "}
                            Оновлено: {progress.updated}
                        </p>

                        {busy === "migration" &&
                            stats?.total > 0 && (
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full rounded-full bg-blue-600 transition-all"
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                Math.round(
                                                    progress.scanned /
                                                    stats.total *
                                                    100
                                                )
                                            )}%`,
                                        }}
                                    />
                                </div>
                            )}
                    </div>
                )}

                {error && (
                    <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertTriangle
                            size={18}
                            className="shrink-0 text-red-600"
                        />
                        <p className="text-sm text-red-700">
                            {error}
                        </p>
                    </div>
                )}

                {message && (
                    <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <CheckCircle2
                            size={18}
                            className="shrink-0 text-emerald-600"
                        />
                        <p className="text-sm text-emerald-700">
                            {message}
                        </p>
                    </div>
                )}
            </div>

            {stats && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            label: "Усього документів",
                            value: stats.total,
                            color: "text-slate-900",
                        },
                        {
                            label: "Потребують оновлення",
                            value: stats.missing,
                            color: "text-amber-600",
                        },
                        {
                            label: "Звичайні (standard)",
                            value: stats.standard,
                            color: "text-blue-600",
                        },
                        {
                            label: "Партнерські",
                            value: stats.partner,
                            color: "text-violet-600",
                        },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <p className="text-xs font-semibold text-slate-500">
                                {item.label}
                            </p>

                            <p className={`mt-2 text-3xl font-black ${item.color}`}>
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {stats?.other > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Знайдено {stats.other} документів
                    із невідомим значенням listingKind.
                    Вони не змінюються автоматично.
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-bold text-slate-900">
                    Як працює міграція
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Документи читаються послідовно
                    пакетами по {BATCH_SIZE}.
                    Оновлюється лише поле listingKind.
                    Статуси, дати, фотографії,
                    контакти, searchTokens та інформація
                    про авторів залишаються незмінними.
                </p>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                    Під час оновлення не закривайте сторінку.
                    Повторний запуск безпечний:
                    документи зі значенням standard або
                    ознаками партнерства пропускаються.
                </p>
            </div>
        </section>
    );
}
