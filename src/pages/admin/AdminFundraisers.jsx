
import { useEffect, useRef, useState } from "react";

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import {
    ExternalLink,
    HandCoins,
    Loader2,
    Pencil,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";

import Swal from "sweetalert2";

import { db } from "../../firebase";

const COLLECTION_NAME = "fundraisers";

const initialForm = {
    recipient: "",
    purpose: "",
    amount: "",
    bankUrl: "",
    description: "",
};

const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
});

const showToast = (icon, title) => {
    return toast.fire({ icon, title });
};

const formatMoney = (amount) => {
    return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: "UAH",
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
};

const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "";

    return timestamp.toDate().toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const isValidBankUrl = (value) => {
    try {
        const url = new URL(value);

        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );
    } catch {
        return false;
    }
};

const AdminFundraisers = () => {
    const [fundraisers, setFundraisers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(initialForm);

    const formRef = useRef(null);

    // ==============================
    // ЗАВАНТАЖЕННЯ ЗБОРІВ
    // ==============================

    useEffect(() => {
        const fundraisersQuery = query(
            collection(db, COLLECTION_NAME),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            fundraisersQuery,
            (snapshot) => {
                const items = snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data(),
                }));

                setFundraisers(items);
                setLoading(false);
            },
            (error) => {
                console.error(
                    "Помилка завантаження зборів:",
                    error
                );

                setLoading(false);

                showToast(
                    "error",
                    "Не вдалося завантажити збори"
                );
            }
        );

        return () => unsubscribe();
    }, []);

    // ==============================
    // ОНОВЛЕННЯ ПОЛІВ
    // ==============================

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    // ==============================
    // ОЧИЩЕННЯ ФОРМИ
    // ==============================

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
    };

    // ==============================
    // ЗБЕРЕЖЕННЯ ЗБОРУ
    // ==============================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving) return;

        const recipient = form.recipient.trim();
        const purpose = form.purpose.trim();
        const amount = Number(form.amount);
        const bankUrl = form.bankUrl.trim();
        const description = form.description.trim();

        if (!recipient || !purpose || !bankUrl) {
            showToast(
                "warning",
                "Заповніть усі обов'язкові поля"
            );
            return;
        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            showToast(
                "warning",
                "Вкажіть коректну суму збору"
            );
            return;
        }

        if (!isValidBankUrl(bankUrl)) {
            showToast(
                "warning",
                "Вкажіть коректне посилання на банку"
            );
            return;
        }

        setSaving(true);

        try {
            const fundraiserData = {
                recipient,
                purpose,
                amount,
                bankUrl,
                description,
                updatedAt: serverTimestamp(),
            };

            if (editingId) {
                await updateDoc(
                    doc(db, COLLECTION_NAME, editingId),
                    fundraiserData
                );

                showToast(
                    "success",
                    "Зміни успішно збережено"
                );
            } else {
                await addDoc(
                    collection(db, COLLECTION_NAME),
                    {
                        ...fundraiserData,
                        createdAt: serverTimestamp(),
                    }
                );

                showToast(
                    "success",
                    "Збір успішно додано"
                );
            }

            resetForm();
        } catch (error) {
            console.error(
                "Помилка збереження збору:",
                error
            );

            showToast(
                "error",
                "Не вдалося зберегти збір"
            );
        } finally {
            setSaving(false);
        }
    };

    // ==============================
    // РЕДАГУВАННЯ ЗБОРУ
    // ==============================

    const handleEdit = (fundraiser) => {
        if (saving) return;

        setEditingId(fundraiser.id);

        setForm({
            recipient: fundraiser.recipient || "",
            purpose: fundraiser.purpose || "",
            amount: String(fundraiser.amount ?? ""),
            bankUrl: fundraiser.bankUrl || "",
            description: fundraiser.description || "",
        });

        formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    // ==============================
    // ВИДАЛЕННЯ ЗБОРУ
    // ==============================

    const handleDelete = async (fundraiser) => {
        if (saving) return;

        const result = await Swal.fire({
            title: "Видалити збір?",
            text: `Збір «${fundraiser.purpose}» буде видалено без можливості відновлення.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Так, видалити",
            cancelButtonText: "Скасувати",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            await deleteDoc(
                doc(db, COLLECTION_NAME, fundraiser.id)
            );

            if (editingId === fundraiser.id) {
                resetForm();
            }

            showToast(
                "success",
                "Збір успішно видалено"
            );
        } catch (error) {
            console.error(
                "Помилка видалення збору:",
                error
            );

            showToast(
                "error",
                "Не вдалося видалити збір"
            );
        }
    };

    // ==============================
    // СТИЛІ
    // ==============================

    const inputClass =
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60";

    const labelClass =
        "mb-2 block text-sm font-semibold text-slate-700";

    return (
        <div className="space-y-8">

            {/* ==============================
                ЗАГОЛОВОК
            ============================== */}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                        <HandCoins className="h-4 w-4" />
                        Керування зборами
                    </div>

                    <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                        Збори
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Створюйте та редагуйте благодійні збори.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                    <div className="text-xs font-medium text-slate-500">
                        Усього зборів
                    </div>

                    <div className="mt-1 text-2xl font-black text-slate-900">
                        {fundraisers.length}
                    </div>
                </div>
            </div>

            {/* ==============================
                ФОРМА
            ============================== */}

            <section
                ref={formRef}
                className="scroll-mt-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            {editingId ? (
                                <Pencil className="h-5 w-5" />
                            ) : (
                                <Plus className="h-5 w-5" />
                            )}
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingId
                                    ? "Редагувати збір"
                                    : "Додати новий збір"}
                            </h2>

                            <p className="text-xs text-slate-500">
                                Поля із * обов'язкові
                            </p>
                        </div>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                            Скасувати
                        </button>
                    )}
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 p-5 sm:p-7"
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        {/* Для кого збір */}

                        <div>
                            <label
                                htmlFor="fundraiser-recipient"
                                className={labelClass}
                            >
                                Для кого збір *
                            </label>

                            <input
                                id="fundraiser-recipient"
                                type="text"
                                required
                                maxLength={150}
                                disabled={saving}
                                value={form.recipient}
                                onChange={(event) =>
                                    updateField(
                                        "recipient",
                                        event.target.value
                                    )
                                }
                                placeholder="Наприклад, для військових"
                                className={inputClass}
                            />
                        </div>

                        {/* На що збір */}

                        <div>
                            <label
                                htmlFor="fundraiser-purpose"
                                className={labelClass}
                            >
                                На що збір *
                            </label>

                            <input
                                id="fundraiser-purpose"
                                type="text"
                                required
                                maxLength={200}
                                disabled={saving}
                                value={form.purpose}
                                onChange={(event) =>
                                    updateField(
                                        "purpose",
                                        event.target.value
                                    )
                                }
                                placeholder="Наприклад, на автомобіль"
                                className={inputClass}
                            />
                        </div>

                        {/* Сума */}

                        <div>
                            <label
                                htmlFor="fundraiser-amount"
                                className={labelClass}
                            >
                                Сума збору, грн *
                            </label>

                            <input
                                id="fundraiser-amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                                disabled={saving}
                                value={form.amount}
                                onChange={(event) =>
                                    updateField(
                                        "amount",
                                        event.target.value
                                    )
                                }
                                placeholder="Наприклад, 50000"
                                className={inputClass}
                            />
                        </div>

                        {/* Посилання на банку */}

                        <div>
                            <label
                                htmlFor="fundraiser-bank"
                                className={labelClass}
                            >
                                Посилання на банку *
                            </label>

                            <input
                                id="fundraiser-bank"
                                type="url"
                                required
                                disabled={saving}
                                value={form.bankUrl}
                                onChange={(event) =>
                                    updateField(
                                        "bankUrl",
                                        event.target.value
                                    )
                                }
                                placeholder="https://send.monobank.ua/jar/..."
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Опис */}

                    <div>
                        <label
                            htmlFor="fundraiser-description"
                            className={labelClass}
                        >
                            Опис збору

                            <span className="ml-2 font-normal text-slate-400">
                                Необов'язково
                            </span>
                        </label>

                        <textarea
                            id="fundraiser-description"
                            rows={5}
                            maxLength={5000}
                            disabled={saving}
                            value={form.description}
                            onChange={(event) =>
                                updateField(
                                    "description",
                                    event.target.value
                                )
                            }
                            placeholder="Детальна інформація про збір..."
                            className={`${inputClass} resize-y`}
                        />
                    </div>

                    {/* Кнопка збереження */}

                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Збереження...
                                </>
                            ) : editingId ? (
                                <>
                                    <Save className="h-4 w-4" />
                                    Зберегти зміни
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    Додати збір
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </section>

            {/* ==============================
                СПИСОК ЗБОРІВ
            ============================== */}

            <section className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Додані збори
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Усі збори, збережені в базі даних
                        </p>
                    </div>

                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                        {fundraisers.length}
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        Завантаження зборів...
                    </div>
                ) : fundraisers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <HandCoins className="h-8 w-8" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">
                            Зборів поки немає
                        </h3>

                        <p className="mt-2 max-w-sm text-sm text-slate-500">
                            Заповніть форму вище, щоб додати
                            перший збір.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {fundraisers.map((fundraiser) => (
                            <article
                                key={fundraiser.id}
                                className="
                group relative
                rounded-2xl border border-slate-200
                bg-white p-4 shadow-sm
                transition-all duration-200
                hover:border-slate-300 hover:shadow-md
                sm:p-5
            "
                            >
                                {/* Верхня частина */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                                            <HandCoins className="h-3.5 w-3.5" />
                                            Благодійний збір
                                        </div>

                                        <h3 className="break-words text-base font-bold leading-snug text-slate-900">
                                            {fundraiser.purpose}
                                        </h3>
                                    </div>

                                    {/* Кнопки керування */}
                                    <div className="flex shrink-0 items-center gap-2">
                                        {/* Редагувати */}
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => handleEdit(fundraiser)}
                                            title="Редагувати збір"
                                            aria-label="Редагувати збір"
                                            className="
            flex h-9 w-9 items-center justify-center
            rounded-xl border border-blue-200
            bg-blue-50 text-blue-600
            transition-colors
            hover:bg-blue-100
            disabled:cursor-not-allowed disabled:opacity-50
        "
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>

                                        {/* Видалити */}
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => handleDelete(fundraiser)}
                                            title="Видалити збір"
                                            aria-label="Видалити збір"
                                            className="
            flex h-9 w-9 items-center justify-center
            rounded-xl border border-red-200
            bg-red-50 text-red-600
            transition-colors
            hover:bg-red-100
            disabled:cursor-not-allowed disabled:opacity-50
        "
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Для кого збір */}
                                <p className="mt-2 break-words text-sm text-slate-500">
                                    Для кого:{" "}
                                    <span className="font-medium text-slate-700">
                                        {fundraiser.recipient}
                                    </span>
                                </p>

                                {/* Сума */}
                                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                                    <span className="text-xs font-medium text-blue-600">
                                        Мета:
                                    </span>

                                    <span className="text-sm font-bold text-blue-700">
                                        {formatMoney(fundraiser.amount)}
                                    </span>
                                </div>

                                {/* Опис */}
                                {fundraiser.description && (
                                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                                        {fundraiser.description}
                                    </p>
                                )}

                                {/* Нижня частина */}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                    <a
                                        href={fundraiser.bankUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="
                        inline-flex items-center gap-1.5
                        text-xs font-semibold text-blue-600
                        transition hover:text-blue-700
                    "
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Відкрити банку
                                    </a>

                                    {fundraiser.createdAt && (
                                        <span className="text-xs text-slate-400">
                                            {formatDate(fundraiser.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminFundraisers;
