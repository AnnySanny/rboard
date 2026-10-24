
import { useCallback, useState } from "react";
import {
    collection,
    getDocs,
    writeBatch,
    doc,
    serverTimestamp,
    query,
    where,
} from "firebase/firestore";

import {
    Users,
    Search,
    Database,
    CheckCircle2,
    AlertCircle,
    LoaderCircle,
    UserRound,
    Phone,
    ShieldCheck,
    MapPin,
} from "lucide-react";

import Swal from "sweetalert2";
import { db } from "../../firebase";

const BATCH_SIZE = 400;

const toDate = (value) => {
    if (!value) return null;

    const date =
        value?.toDate?.() ||
        (value instanceof Date
            ? value
            : new Date(value));

    return date instanceof Date &&
        !Number.isNaN(date.getTime())
        ? date
        : null;
};

const normalizePhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");

    if (digits.length === 10 && digits.startsWith("0")) {
        return `+38${digits}`;
    }

    if (digits.length === 12 && digits.startsWith("380")) {
        return `+${digits}`;
    }

    return "";
};

const getAdditionalContact = (value) => {
    if (typeof value === "string") {
        return value.trim();
    }

    if (
        value &&
        typeof value === "object" &&
        value.enabled === true &&
        typeof value.value === "string"
    ) {
        return value.value.trim();
    }

    return "";
};

const CONTACT_KEYS = [
    "telegram",
    "instagram",
    "facebook",
    "tiktok",
    "viber",
    "whatsapp",
];

const isActivePublicListing = (listing) => {
    if (listing.status !== "approved") return false;

    const expiresAt = toDate(listing.expiresAt);

    return Boolean(
        expiresAt &&
        expiresAt.getTime() > Date.now()
    );
};

const buildPublicProfile = (user, listings) => {
    const privacy = user.privacy || {};

    const publicListings = listings
        .filter(isActivePublicListing)
        .sort((a, b) => {
            const first = toDate(a.createdAt)?.getTime() || 0;
            const second = toDate(b.createdAt)?.getTime() || 0;

            return second - first;
        });

    let phone = "";

    const additionalContacts = {};

    for (const listing of publicListings) {
        if (
            !phone &&
            privacy.hidePhone !== true &&
            listing.hidePhone !== true
        ) {
            const listingPhone = normalizePhone(
                listing.contactOriginal || listing.contact
            );

            if (listingPhone) {
                phone = listingPhone;
            }
        }

        if (privacy.hideContacts !== true) {
            const additional = listing.additionalContacts || {};

            for (const key of CONTACT_KEYS) {
                if (additionalContacts[key]) continue;

                const value = getAdditionalContact(
                    additional[key]
                );

                if (!value) continue;

                if (key === "viber" || key === "whatsapp") {
                    const validPhone = normalizePhone(value);

                    if (validPhone) {
                        additionalContacts[key] = validPhone;
                    }
                } else {
                    additionalContacts[key] = value;
                }
            }
        }
    }

    const login =
        typeof user.login === "string" &&
            user.login.trim()
            ? user.login.trim()
            : "Користувач RBoard";


    let city = "";

    if (privacy.hideCity !== true) {
        if (typeof user.city === "string" && user.city.trim()) {
            city = user.city.trim();
        } else if (user.city?.name) {
            city = user.city.name.trim();
        } else {
            const listingWithCity = publicListings.find((listing) => {
                const listingCity = listing.city;

                return (
                    (typeof listingCity === "string" &&
                        listingCity.trim()) ||
                    (typeof listingCity?.name === "string" &&
                        listingCity.name.trim())
                );
            });

            if (listingWithCity) {
                city =
                    typeof listingWithCity.city === "string"
                        ? listingWithCity.city.trim()
                        : listingWithCity.city.name.trim();
            }
        }
    }


    return {
        login,
        avatarUrl: "",
        bio: "",
        city,
        phone,
        additionalContacts,
        createdAt: user.createdAt || null,
        updatedAt: serverTimestamp(),
    };
};

export default function AdminTouristPlaces() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [preview, setPreview] = useState([]);
    const [checked, setChecked] = useState(false);
    const [error, setError] = useState("");
    const [savedCount, setSavedCount] = useState(0);

    const [summary, setSummary] = useState({
        users: 0,
        existing: 0,
        missing: 0,
        listings: 0,
    });

    const checkProfiles = useCallback(async () => {
        if (loading || saving) return;

        setLoading(true);
        setChecked(false);
        setError("");
        setPreview([]);
        setSavedCount(0);

        try {
            const [usersSnapshot, publicSnapshot, listingsSnapshot] =
                await Promise.all([
                    getDocs(collection(db, "users")),
                    getDocs(collection(db, "publicProfiles")),
                    getDocs(
                        query(
                            collection(db, "listings"),
                            where("status", "==", "approved")
                        )
                    ),
                ]);

            const existingIds = new Set(
                publicSnapshot.docs.map((item) => item.id)
            );

            const listingsByUid = new Map();

            for (const listingDoc of listingsSnapshot.docs) {
                const listing = listingDoc.data();

                const authorUid = listing.author?.uid;

                if (
                    !authorUid ||
                    listing.author?.isAuthenticated !== true
                ) {
                    continue;
                }

                if (!listingsByUid.has(authorUid)) {
                    listingsByUid.set(authorUid, []);
                }

                listingsByUid.get(authorUid).push(listing);
            }

            const missingProfiles = [];

            for (const userDoc of usersSnapshot.docs) {
                const uid = userDoc.id;

                if (existingIds.has(uid)) continue;

                const user = userDoc.data();

                const userListings =
                    listingsByUid.get(uid) || [];

                const publicProfile = buildPublicProfile(
                    user,
                    userListings
                );

                missingProfiles.push({
                    uid,
                    login: publicProfile.login,
                    city: publicProfile.city,
                    phone: publicProfile.phone,
                    additionalContacts:
                        publicProfile.additionalContacts,
                    listingCount: userListings.filter(
                        isActivePublicListing
                    ).length,
                    data: publicProfile,
                });
            }

            missingProfiles.sort((a, b) =>
                a.login.localeCompare(b.login, "uk")
            );

            setPreview(missingProfiles);

            setSummary({
                users: usersSnapshot.size,
                existing:
                    usersSnapshot.docs.filter(
                        (item) => existingIds.has(item.id)
                    ).length,
                missing: missingProfiles.length,
                listings: listingsSnapshot.size,
            });

            setChecked(true);
        } catch (err) {
            console.error(
                "Помилка перевірки публічних профілів:",
                err
            );

            setError(
                "Не вдалося отримати дані Firestore. Перевірте права доступу адміністратора."
            );
        } finally {
            setLoading(false);
        }
    }, [loading, saving]);

    const createProfiles = async () => {
        if (
            saving ||
            loading ||
            !checked ||
            preview.length === 0
        ) {
            return;
        }

        const confirmation = await Swal.fire({
            title: "Створити публічні профілі?",
            html: `
        Буде створено <strong>${preview.length}</strong>
        нових публічних профілів.<br><br>
        Існуючі профілі не будуть перезаписані.
      `,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Створити",
            cancelButtonText: "Скасувати",
            confirmButtonColor: "#2563eb",
            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) return;

        setSaving(true);
        setError("");

        let created = 0;

        try {
            for (
                let i = 0;
                i < preview.length;
                i += BATCH_SIZE
            ) {
                const batch = writeBatch(db);

                const items = preview.slice(
                    i,
                    i + BATCH_SIZE
                );

                items.forEach((item) => {
                    const reference = doc(
                        db,
                        "publicProfiles",
                        item.uid
                    );

                    batch.set(reference, item.data);
                });

                await batch.commit();

                created += items.length;
                setSavedCount(created);
            }

            setChecked(false);
            setPreview([]);

            await Swal.fire({
                icon: "success",
                title: "Готово!",
                text: `Створено публічних профілів: ${created}`,
                confirmButtonColor: "#2563eb",
            });
        } catch (err) {
            console.error(
                "Помилка створення публічних профілів:",
                err
            );

            setError(
                `Створено ${created} профілів. Подальший запис не виконано. Перевірте доступ і повторно запустіть перевірку.`
            );

            setChecked(false);
            setPreview([]);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Users size={22} />
                </div>

                <div>
                    <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
                        Публічні профілі користувачів
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Перевірка користувачів та створення
                        відсутніх публічних профілів.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <button
                    type="button"
                    onClick={checkProfiles}
                    disabled={loading || saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? (
                        <LoaderCircle
                            size={17}
                            className="animate-spin"
                        />
                    ) : (
                        <Search size={17} />
                    )}

                    {loading
                        ? "Перевірка..."
                        : "Перевірити профілі"}
                </button>
            </div>

            {error && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle
                        size={18}
                        className="shrink-0"
                    />
                    {error}
                </div>
            )}

            {checked && (
                <>
                    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {[
                            {
                                label: "Користувачів",
                                value: summary.users,
                                color: "text-blue-600",
                            },
                            {
                                label: "Існує профілів",
                                value: summary.existing,
                                color: "text-green-600",
                            },
                            {
                                label: "Відсутні",
                                value: summary.missing,
                                color: "text-red-600",
                            },
                            {
                                label: "Оголошень перевірено",
                                value: summary.listings,
                                color: "text-slate-800",
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <p className="text-xs font-medium text-slate-500">
                                    {item.label}
                                </p>

                                <p
                                    className={`mt-2 text-2xl font-black ${item.color}`}
                                >
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {preview.length > 0 ? (
                        <div className="mt-6">
                            <div className="mb-4 flex items-center gap-2">
                                <Database
                                    size={19}
                                    className="text-blue-600"
                                />
                                <h2 className="text-base font-semibold text-slate-900">
                                    Попередній перегляд
                                </h2>
                            </div>

                            <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                                {preview.map((item) => (
                                    <div
                                        key={item.uid}
                                        className="rounded-xl border border-slate-200 bg-white p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                                <UserRound size={20} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {item.login}
                                                </p>

                                                <p className="break-all text-[11px] text-slate-400">
                                                    {item.uid}
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                                {item.listingCount} огол.
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                            {item.city && (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-blue-700">
                                                    <MapPin size={13} />
                                                    {item.city}
                                                </span>
                                            )}
                                            {item.phone ? (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-green-700">
                                                    <Phone size={13} />
                                                    {item.phone}
                                                </span>
                                            ) : (
                                                <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-500">
                                                    Без публічного телефону
                                                </span>
                                            )}

                                            {Object.keys(
                                                item.additionalContacts
                                            ).map((key) => (
                                                <span
                                                    key={key}
                                                    className="rounded-lg bg-blue-50 px-2 py-1 text-blue-600"
                                                >
                                                    {key}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={createProfiles}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <LoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <ShieldCheck size={17} />
                                    )}

                                    {saving
                                        ? `Створено ${savedCount}/${preview.length}`
                                        : `Створити ${preview.length} профілів`}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                            <CheckCircle2 size={19} />
                            Усі зареєстровані користувачі вже мають
                            публічні профілі.
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
