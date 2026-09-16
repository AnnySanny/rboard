import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";

import Swal from "sweetalert2";
import UserListingsStatistics from "../../components/listings/UserListingsStatistics";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { db } from "../../firebase";

const LISTING_TYPES = [
    "Усі типи",
    "Продаж",
    "Купівля",
    "Оренда",
    "Послуга",
    "Робота",
    "Питання",
    "Обмін",
    "Віддам безкоштовно",
    "Загублено / знайдено",
    "Подія",
    "Оголошення громади",
    "Інше",
];

const STATUS_OPTIONS = [
    {
        value: "all",
        label: "Усі статуси",
    },
    {
        value: "approved",
        label: "Опубліковані",
    },
    {
        value: "pending",
        label: "На перевірці",
    },
    {
        value: "cancelled",
        label: "Відхилені",
    },
];

const formatDate = (value) => {
    if (!value) {
        return "Дата не вказана";
    }

    const date =
        value?.toDate?.() ||
        (value instanceof Date
            ? value
            : new Date(value));

    if (Number.isNaN(date.getTime())) {
        return "Дата не вказана";
    }

    return date.toLocaleString("uk-UA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStatusData = (status) => {
    switch (status) {
        case "approved":
            return {
                label: "Опубліковано",
                className:
                    "border-emerald-100 bg-emerald-50 text-emerald-700",
            };

        case "cancelled":
            return {
                label: "Відхилено",
                className:
                    "border-red-100 bg-red-50 text-red-700",
            };

        case "pending":
        default:
            return {
                label: "На перевірці",
                className:
                    "border-amber-100 bg-amber-50 text-amber-700",
            };
    }
};

const getCurrentUser = () => {
    try {
        const savedUser =
            localStorage.getItem("rboardUser");

        if (!savedUser) {
            return null;
        }

        return JSON.parse(savedUser);
    } catch {
        return null;
    }
};

const UserListings = () => {
    const [listings, setListings] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [loadError, setLoadError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [typeFilter, setTypeFilter] =
        useState("Усі типи");

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [sortOrder, setSortOrder] =
        useState("newest");

    const [deletingId, setDeletingId] =
        useState(null);
    const [
        showStatistics,
        setShowStatistics,
    ] = useState(false);
    useEffect(() => {
        const currentUser =
            getCurrentUser();

        if (!currentUser?.id) {
            setListings([]);
            setLoading(false);
            setLoadError(
                "Не вдалося визначити користувача."
            );

            return;
        }

        const listingsQuery = query(
            collection(db, "listings"),
            where(
                "author.uid",
                "==",
                currentUser.id
            )
        );

        const unsubscribe = onSnapshot(
            listingsQuery,
            (snapshot) => {
                const receivedListings =
                    snapshot.docs.map(
                        (document) => {
                            const data =
                                document.data();

                            return {
                                id: document.id,

                                title:
                                    data.title || "",

                                comment:
                                    data.comment || "",

                                type:
                                    data.type || "Інше",

                                authorName:
                                    data.authorName || "",

                                contact:
                                    data.contactOriginal ||
                                    data.contact ||
                                    "",

                                city:
                                    data.city || null,

                                street:
                                    data.street || "",

                                status:
                                    data.status ||
                                    "pending",

                                views:
                                    Number(
                                        data.views ?? 0
                                    ),

                                createdAt:
                                    data.createdAt || null,
                            };
                        }
                    );

                setListings(
                    receivedListings
                );

                setLoading(false);
                setLoadError("");
            },
            (error) => {
                console.error(
                    "Помилка завантаження оголошень:",
                    error
                );

                setLoadError(
                    "Не вдалося завантажити ваші оголошення."
                );

                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    const filteredListings =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLowerCase();

            const result =
                listings.filter(
                    (listing) => {
                        const matchesType =
                            typeFilter ===
                            "Усі типи" ||
                            listing.type ===
                            typeFilter;

                        const matchesStatus =
                            statusFilter ===
                            "all" ||
                            listing.status ===
                            statusFilter;

                        const cityName =
                            typeof listing.city ===
                                "string"
                                ? listing.city
                                : listing.city?.name ||
                                listing.city
                                    ?.label ||
                                "";

                        const searchableText = [
                            listing.title,
                            listing.comment,
                            listing.type,
                            listing.authorName,
                            listing.contact,
                            cityName,
                            listing.street,
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();

                        const matchesSearch =
                            !normalizedSearch ||
                            searchableText.includes(
                                normalizedSearch
                            );

                        return (
                            matchesType &&
                            matchesStatus &&
                            matchesSearch
                        );
                    }
                );

            result.sort(
                (
                    firstListing,
                    secondListing
                ) => {
                    const firstDate =
                        firstListing.createdAt
                            ?.toDate?.()
                            ?.getTime?.() || 0;

                    const secondDate =
                        secondListing.createdAt
                            ?.toDate?.()
                            ?.getTime?.() || 0;

                    if (
                        sortOrder === "oldest"
                    ) {
                        return (
                            firstDate -
                            secondDate
                        );
                    }

                    if (
                        sortOrder ===
                        "alphabetical"
                    ) {
                        return firstListing.title.localeCompare(
                            secondListing.title,
                            "uk"
                        );
                    }

                    return (
                        secondDate -
                        firstDate
                    );
                }
            );

            return result;
        }, [
            listings,
            search,
            typeFilter,
            statusFilter,
            sortOrder,
        ]);

    const getCityName = (city) => {
        if (!city) {
            return "";
        }

        if (
            typeof city === "string"
        ) {
            return city;
        }

        return (
            city.name ||
            city.label ||
            city.city ||
            ""
        );
    };

    const getLocation = (
        listing
    ) => {
        const parts = [
            getCityName(
                listing.city
            ),
            listing.street,
        ].filter(Boolean);

        return (
            parts.join(", ") ||
            "Не вказано"
        );
    };

    const handleDelete = async (
        listing
    ) => {
        const result =
            await Swal.fire({
                icon: "warning",
                title:
                    "Видалити оголошення?",
                html: `
          <div style="margin-top:8px">
            Оголошення
            <strong>«${listing.title}»</strong>
            буде назавжди видалено.
          </div>
        `,
                showCancelButton: true,
                confirmButtonText:
                    "Видалити",
                cancelButtonText:
                    "Скасувати",
                confirmButtonColor:
                    "#dc2626",
                cancelButtonColor:
                    "#64748b",
                reverseButtons: true,
            });

        if (!result.isConfirmed) {
            return;
        }

        try {
            setDeletingId(
                listing.id
            );

            await deleteDoc(
                doc(
                    db,
                    "listings",
                    listing.id
                )
            );

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title:
                    "Оголошення видалено",
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error(
                "Помилка видалення оголошення:",
                error
            );

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title:
                    "Не вдалося видалити оголошення",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
                    <div className="space-y-6">
                        {/* Заголовок */}
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <span className="text-sm font-bold uppercase tracking-widest text-blue-600">
                                        Особистий кабінет
                                    </span>

                                    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                                        Мої оголошення
                                    </h1>

                                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                                        Переглядайте та
                                        керуйте своїми
                                        оголошеннями.
                                    </p>
                                </div>

                                {!loading &&
                                    !loadError && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="shrink-0 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                                                Оголошень:{" "}
                                                {listings.length}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowStatistics(
                                                        (previous) => !previous
                                                    )
                                                }
                                                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${showStatistics
                                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                                    : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                                    }`}
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M3 3v18h18" />
                                                    <path d="M7 16v-4" />
                                                    <path d="M12 16V8" />
                                                    <path d="M17 16v-7" />
                                                </svg>

                                                {showStatistics
                                                    ? "Сховати статистику"
                                                    : "Показати статистику"}
                                            </button>
                                        </div>
                                    )}
                            </div>
                        </section>
                        {showStatistics && (
                            <UserListingsStatistics
                                listings={listings}
                                onClose={() =>
                                    setShowStatistics(false)
                                }
                            />
                        )}
                        {/* Пошук і фільтри */}
                        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex flex-col gap-3 lg:flex-row">
                                {/* Пошук */}
                                <div className="relative flex-1">
                                    <svg
                                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle
                                            cx="11"
                                            cy="11"
                                            r="8"
                                        />

                                        <path d="m21 21-4.3-4.3" />
                                    </svg>

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(
                                            event
                                        ) =>
                                            setSearch(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Пошук серед моїх оголошень..."
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                {/* Тип */}
                                <div className="relative lg:w-52">
                                    <select
                                        value={typeFilter}
                                        onChange={(
                                            event
                                        ) =>
                                            setTypeFilter(
                                                event.target
                                                    .value
                                            )
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    >
                                        {LISTING_TYPES.map(
                                            (type) => (
                                                <option
                                                    key={type}
                                                    value={type}
                                                >
                                                    {type}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <SelectArrow />
                                </div>

                                {/* Статус */}
                                <div className="relative lg:w-48">
                                    <select
                                        value={
                                            statusFilter
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setStatusFilter(
                                                event.target
                                                    .value
                                            )
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    >
                                        {STATUS_OPTIONS.map(
                                            (status) => (
                                                <option
                                                    key={
                                                        status.value
                                                    }
                                                    value={
                                                        status.value
                                                    }
                                                >
                                                    {
                                                        status.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <SelectArrow />
                                </div>

                                {/* Сортування */}
                                <div className="relative lg:w-48">
                                    <select
                                        value={sortOrder}
                                        onChange={(
                                            event
                                        ) =>
                                            setSortOrder(
                                                event.target
                                                    .value
                                            )
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="newest">
                                            Спочатку нові
                                        </option>

                                        <option value="oldest">
                                            Спочатку старі
                                        </option>

                                        <option value="alphabetical">
                                            За назвою
                                        </option>
                                    </select>

                                    <SelectArrow />
                                </div>
                            </div>
                        </section>

                        {/* Завантаження */}
                        {loading && (
                            <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                                <p className="mt-4 text-sm font-semibold text-slate-500">
                                    Завантаження
                                    оголошень...
                                </p>
                            </section>
                        )}

                        {/* Помилка */}
                        {!loading &&
                            loadError && (
                                <section className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                                    <p className="font-semibold text-red-700">
                                        {loadError}
                                    </p>
                                </section>
                            )}

                        {/* Порожній результат */}
                        {!loading &&
                            !loadError &&
                            filteredListings.length ===
                            0 && (
                                <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                        <svg
                                            className="h-7 w-7"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M4 6h16" />
                                            <path d="M4 12h16" />
                                            <path d="M4 18h10" />
                                        </svg>
                                    </div>

                                    <h2 className="mt-4 text-lg font-black text-slate-900">
                                        Оголошень не
                                        знайдено
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Тут з’являться
                                        ваші оголошення
                                        або змініть
                                        параметри пошуку.
                                    </p>
                                </section>
                            )}

                        {/* Оголошення */}
                        {!loading &&
                            !loadError &&
                            filteredListings.length >
                            0 && (
                                <div className="space-y-4">
                                    {filteredListings.map(
                                        (listing) => {
                                            const status =
                                                getStatusData(
                                                    listing.status
                                                );

                                            return (
                                                <article
                                                    key={
                                                        listing.id
                                                    }
                                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
                                                >
                                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            {/* Верх картки */}
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                                                    {
                                                                        listing.type
                                                                    }
                                                                </span>

                                                                <span
                                                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
                                                                >
                                                                    {
                                                                        status.label
                                                                    }
                                                                </span>

                                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                                                    <ClockIcon />

                                                                    {formatDate(
                                                                        listing.createdAt
                                                                    )}
                                                                </span>

                                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                                                                    <EyeIcon />

                                                                    {
                                                                        listing.views
                                                                    }
                                                                </span>
                                                            </div>

                                                            {/* Назва */}
                                                            <h2 className="mt-4 text-xl font-black leading-snug text-slate-950 sm:text-2xl">
                                                                {listing.title ||
                                                                    "Без назви"}
                                                            </h2>

                                                            {/* Дані */}
                                                            <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                                                                <InfoItem
                                                                    label="Автор"
                                                                    value={
                                                                        listing.authorName ||
                                                                        "Не вказано"
                                                                    }
                                                                />

                                                                <InfoItem
                                                                    label="Контакт"
                                                                    value={
                                                                        listing.contact ||
                                                                        "Не вказано"
                                                                    }
                                                                    blue
                                                                />

                                                                <InfoItem
                                                                    label="Місце"
                                                                    value={getLocation(
                                                                        listing
                                                                    )}
                                                                />
                                                            </div>

                                                            {/* Опис */}
                                                            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                                                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                                    Опис
                                                                </p>

                                                                <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                                                                    {listing.comment ||
                                                                        "Опис не вказано"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Видалити */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    listing
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                listing.id
                                                            }
                                                            className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 lg:self-start"
                                                            aria-label="Видалити оголошення"
                                                            title="Видалити оголошення"
                                                        >
                                                            {deletingId ===
                                                                listing.id ? (
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                                                            ) : (
                                                                <TrashIcon />
                                                            )}
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

const InfoItem = ({
    label,
    value,
    blue = false,
}) => {
    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p
                className={`mt-1 break-words text-sm font-semibold ${blue
                    ? "text-blue-600"
                    : "text-slate-800"
                    }`}
            >
                {value}
            </p>
        </div>
    );
};

const SelectArrow = () => (
    <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const ClockIcon = () => (
    <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
    >
        <circle
            cx="12"
            cy="12"
            r="9"
        />
        <path d="M12 7v5l3 2" />
    </svg>
);

const EyeIcon = () => (
    <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle
            cx="12"
            cy="12"
            r="3"
        />
    </svg>
);

const TrashIcon = () => (
    <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
    </svg>
);

export default UserListings;