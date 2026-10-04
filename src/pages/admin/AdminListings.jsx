import { useEffect,  useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    startAfter,
    updateDoc,
    where,
    Timestamp,
} from "firebase/firestore";

import { db, auth } from "../../firebase";
import ListingImageGallery from "../../components/listings/ListingImageGallery";
import {
    RAKHIV_DISTRICT_PLACES,
} from "../../components/listings/CityAutocomplete";
import {
    createAdminLog,
    ADMIN_LOG_ACTIONS,
} from "../../utils/adminLogger";
const LISTING_TYPES = [
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
const EXTENSION_OPTIONS = [
    {
        value: "7-days",
        label: "7 днів",
    },
    {
        value: "14-days",
        label: "14 днів",
    },
    {
        value: "1-month",
        label: "1 місяць",
    },
    {
        value: "1.5-months",
        label: "1.5 місяці",
    },
    {
        value: "2-months",
        label: "2 місяці",
    },
    {
        value: "3-months",
        label: "3 місяці",
    },
    {
        value: "6-months",
        label: "Півроку",
    },
];
const SHORTEN_OPTIONS = [
    {
        value: "30-minutes",
        label: "30 хвилин",
    },
    {
        value: "1-hour",
        label: "1 година",
    },
    {
        value: "1-day",
        label: "1 день",
    },
    {
        value: "7-days",
        label: "7 днів",
    },
    {
        value: "14-days",
        label: "14 днів",
    },
    {
        value: "1-month",
        label: "1 місяць",
    },
    {
        value: "1.5-months",
        label: "1.5 місяці",
    },
    {
        value: "2-months",
        label: "2 місяці",
    },
    {
        value: "3-months",
        label: "3 місяці",
    },
    {
        value: "6-months",
        label: "Півроку",
    },
];
const LISTING_LIFETIME_DAYS = 7;
const LISTINGS_PER_PAGE = 25;
const EXPIRED_BATCH_SIZE = 100;
const STATUS_OPTIONS = [
    {
        value: "pending",
        label: "На перевірці",
    },
    {
        value: "approved",
        label: "Опубліковано",
    },
    {
        value: "expired",
        label: "Термін закінчився",
    },
    {
        value: "cancelled",
        label: "Скасовано",
    },
];

const getStatusData = (
    status,
    expired = false
) => {
    if (expired) {
        return {
            label: "Термін закінчено",
            className:
                "border-slate-300 bg-slate-100 text-slate-700",
        };
    }

    switch (status) {
        case "approved":
            return {
                label: "Опубліковано",
                className:
                    "border-emerald-200 bg-emerald-50 text-emerald-700",
            };

        case "cancelled":
            return {
                label: "Скасовано",
                className:
                    "border-red-200 bg-red-50 text-red-700",
            };

        case "pending":
        default:
            return {
                label: "На перевірці",
                className:
                    "border-amber-200 bg-amber-50 text-amber-700",
            };
    }
};

const getDateFromFirestore = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    const parsedDate = new Date(value);

    return Number.isNaN(parsedDate.getTime())
        ? null
        : parsedDate;
};
const isListingExpired = (listing) => {
    if (listing.status === "expired") {
        return true;
    }

    if (
        listing.status !== "approved" ||
        !listing.expiresAt
    ) {
        return false;
    }

    const expiresAt =
        getDateFromFirestore(
            listing.expiresAt
        );

    if (!expiresAt) {
        return false;
    }

    return (
        expiresAt.getTime() <=
        Date.now()
    );
};

const formatDate = (value) => {
    const date = getDateFromFirestore(value);

    if (!date) {
        return "Дата не вказана";
    }

    return new Intl.DateTimeFormat("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};



const calculateExtendedDate = (
    baseDate,
    extension
) => {
    const newDate = new Date(baseDate);

    switch (extension) {
        case "7-days":
            newDate.setDate(
                newDate.getDate() + 7
            );
            break;

        case "14-days":
            newDate.setDate(
                newDate.getDate() + 14
            );
            break;

        case "1-month":
            newDate.setMonth(
                newDate.getMonth() + 1
            );
            break;

        case "1.5-months":
            /*
             * 1.5 місяці трактуємо
             * як 45 днів.
             */
            newDate.setDate(
                newDate.getDate() + 45
            );
            break;

        case "2-months":
            newDate.setMonth(
                newDate.getMonth() + 2
            );
            break;

        case "3-months":
            newDate.setMonth(
                newDate.getMonth() + 3
            );
            break;

        case "6-months":
            newDate.setMonth(
                newDate.getMonth() + 6
            );
            break;

        default:
            return null;
    }

    return newDate;
};
const calculateShortenedDate = (
    baseDate,
    extension
) => {
    const newDate = new Date(baseDate);

    switch (extension) {
        case "30-minutes":
            newDate.setMinutes(
                newDate.getMinutes() - 30
            );
            break;

        case "1-hour":
            newDate.setHours(
                newDate.getHours() - 1
            );
            break;

        case "1-day":
            newDate.setDate(
                newDate.getDate() - 1
            );
            break;

        case "7-days":
            newDate.setDate(
                newDate.getDate() - 7
            );
            break;

        case "14-days":
            newDate.setDate(
                newDate.getDate() - 14
            );
            break;

        case "1-month":
            newDate.setMonth(
                newDate.getMonth() - 1
            );
            break;

        case "1.5-months":
            newDate.setDate(
                newDate.getDate() - 45
            );
            break;

        case "2-months":
            newDate.setMonth(
                newDate.getMonth() - 2
            );
            break;

        case "3-months":
            newDate.setMonth(
                newDate.getMonth() - 3
            );
            break;

        case "6-months":
            newDate.setMonth(
                newDate.getMonth() - 6
            );
            break;

        default:
            return null;
    }

    return newDate;
};
const getListingContacts = (listing) => {
    const contacts = [];

    const mainContact =
        listing.contactOriginal ||
        listing.contact;

    if (mainContact) {
        contacts.push({
            key: "main",
            label: "Основний",
            value: mainContact.trim(),
            type: "contact",
        });
    }

    const additionalContacts =
        listing.additionalContacts || {};

    const contactConfig = {
        instagram: {
            label: "Instagram",
            type: "link",
        },
        telegram: {
            label: "Telegram",
            type: "contact",
        },
        viber: {
            label: "Viber",
            type: "contact",
        },
        tiktok: {
            label: "TikTok",
            type: "link",
        },
        whatsapp: {
            label: "WhatsApp",
            type: "contact",
        },
        facebook: {
            label: "Facebook",
            type: "link",
        },
    };

    Object.entries(contactConfig).forEach(
        ([key, config]) => {
            const value =
                additionalContacts[key];

            if (
                typeof value !== "string" ||
                !value.trim()
            ) {
                return;
            }

            contacts.push({
                key,
                label: config.label,
                value: value.trim(),
                type: config.type,
            });
        }
    );

    const groupedContacts = [];

    contacts.forEach((contact) => {
        const normalizedValue =
            contact.type === "contact"
                ? contact.value.replace(/\D/g, "")
                : contact.value
                    .toLowerCase()
                    .replace(/\/+$/, "");

        const existingGroup =
            groupedContacts.find(
                (group) =>
                    group.normalizedValue ===
                    normalizedValue
            );

        if (existingGroup) {
            existingGroup.labels.push(
                contact.label
            );
            return;
        }

        groupedContacts.push({
            key: contact.key,
            labels: [contact.label],
            value: contact.value,
            type: contact.type,
            normalizedValue,
        });
    });

    return groupedContacts;
};
const getRemainingTime = (expiresAt) => {
    const expirationDate =
        getDateFromFirestore(expiresAt);

    if (!expirationDate) {
        return null;
    }

    const difference =
        expirationDate.getTime() -
        Date.now();

    if (difference <= 0) {
        return null;
    }

    const totalMinutes =
        Math.floor(
            difference / (1000 * 60)
        );

    const days =
        Math.floor(
            totalMinutes /
            (60 * 24)
        );

    const hours =
        Math.floor(
            (totalMinutes %
                (60 * 24)) /
            60
        );

    const minutes =
        totalMinutes % 60;

    return {
        days,
        hours,
        minutes,
    };
};
const AdminListings = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [loadingMore, setLoadingMore] =
        useState(false);

    const [lastDocument, setLastDocument] =
        useState(null);

    const [hasMoreListings, setHasMoreListings] =
        useState(true);

    const [debouncedSearch, setDebouncedSearch] =
        useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(
                search.trim()
            );
        }, 500);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [search]);
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] =
        useState("all");

    const [authorizationFilter, setAuthorizationFilter] =
        useState("all");

    const [cityFilter, setCityFilter] = useState("all");

    const [sortOrder, setSortOrder] =
        useState("newest");

    const [updatingId, setUpdatingId] =
        useState(null);

    const [deletingId, setDeletingId] =
        useState(null);
    const [extendingId, setExtendingId] =
        useState(null);
    const [shorteningId, setShorteningId] =
        useState(null);
    const [expandedDescriptions, setExpandedDescriptions] =
        useState([]);
    const [expandedContacts, setExpandedContacts] =
        useState([]);
    const toggleDescription = (listingId) => {
        setExpandedDescriptions(
            (previous) =>
                previous.includes(listingId)
                    ? previous.filter(
                        (id) => id !== listingId
                    )
                    : [
                        ...previous,
                        listingId,
                    ]
        );
    };
    const toggleContacts = (listingId) => {
        setExpandedContacts(
            (previous) =>
                previous.includes(listingId)
                    ? previous.filter(
                        (id) => id !== listingId
                    )
                    : [
                        ...previous,
                        listingId,
                    ]
        );
    };

    const getSortConfig = () => {
        switch (sortOrder) {
            case "oldest":
                return {
                    field: "createdAt",
                    direction: "asc",
                };

            case "alphabetical-asc":
                return {
                    field: "title",
                    direction: "asc",
                };

            case "alphabetical-desc":
                return {
                    field: "title",
                    direction: "desc",
                };

            case "views-desc":
                return {
                    field: "views",
                    direction: "desc",
                };

            case "views-asc":
                return {
                    field: "views",
                    direction: "asc",
                };

            case "newest":
            default:
                return {
                    field: "createdAt",
                    direction: "desc",
                };
        }
    };

    const buildListingsQuery = (
        lastVisibleDocument = null
    ) => {
        const constraints = [];

        if (
            statusFilter !== "all" &&
            statusFilter !== "expired"
        ) {
            constraints.push(
                where(
                    "status",
                    "==",
                    statusFilter
                )
            );
        }

        if (statusFilter === "expired") {
            constraints.push(
                where(
                    "status",
                    "==",
                    "expired"
                )
            );
        }

        if (typeFilter !== "all") {
            constraints.push(
                where(
                    "type",
                    "==",
                    typeFilter
                )
            );
        }

        if (cityFilter !== "all") {
            constraints.push(
                where(
                    "city.name",
                    "==",
                    cityFilter
                )
            );
        }

        if (
            authorizationFilter ===
            "authenticated"
        ) {
            constraints.push(
                where(
                    "author.isAuthenticated",
                    "==",
                    true
                )
            );
        }

        if (
            authorizationFilter ===
            "guest"
        ) {
            constraints.push(
                where(
                    "author.isAuthenticated",
                    "==",
                    false
                )
            );
        }

        const sortConfig =
            getSortConfig();

        constraints.push(
            orderBy(
                sortConfig.field,
                sortConfig.direction
            )
        );

        if (lastVisibleDocument) {
            constraints.push(
                startAfter(
                    lastVisibleDocument
                )
            );
        }

        constraints.push(
            limit(LISTINGS_PER_PAGE)
        );

        return query(
            collection(db, "listings"),
            ...constraints
        );
    };

    const addSearchFilters = (
        constraints
    ) => {
        if (
            statusFilter !== "all" &&
            statusFilter !== "expired"
        ) {
            constraints.push(
                where(
                    "status",
                    "==",
                    statusFilter
                )
            );
        }

        if (statusFilter === "expired") {
            constraints.push(
                where(
                    "status",
                    "==",
                    "expired"
                )
            );
        }

        if (typeFilter !== "all") {
            constraints.push(
                where(
                    "type",
                    "==",
                    typeFilter
                )
            );
        }

        if (cityFilter !== "all") {
            constraints.push(
                where(
                    "city.name",
                    "==",
                    cityFilter
                )
            );
        }

        if (
            authorizationFilter ===
            "authenticated"
        ) {
            constraints.push(
                where(
                    "author.isAuthenticated",
                    "==",
                    true
                )
            );
        }

        if (
            authorizationFilter ===
            "guest"
        ) {
            constraints.push(
                where(
                    "author.isAuthenticated",
                    "==",
                    false
                )
            );
        }

        return constraints;
    };

    const buildSearchQuery = (
        field
    ) => {
        const searchValue =
            debouncedSearch.trim();

        const constraints = [
            where(
                field,
                ">=",
                searchValue
            ),
            where(
                field,
                "<=",
                searchValue + "\uf8ff"
            ),
            orderBy(
                field,
                "asc"
            ),
        ];

        addSearchFilters(
            constraints
        );

        constraints.push(
            limit(LISTINGS_PER_PAGE)
        );

        return query(
            collection(db, "listings"),
            ...constraints
        );
    };

    const expireOldListings = async () => {
        try {
            const expiredQuery = query(
                collection(db, "listings"),
                where(
                    "status",
                    "==",
                    "approved"
                ),
                where(
                    "expiresAt",
                    "<=",
                    Timestamp.now()
                ),
                orderBy(
                    "expiresAt",
                    "asc"
                ),
                limit(EXPIRED_BATCH_SIZE)
            );

            const snapshot =
                await getDocs(
                    expiredQuery
                );

            if (snapshot.empty) {
                return;
            }

            await Promise.all(
                snapshot.docs.map(
                    (listingDocument) =>
                        updateDoc(
                            doc(
                                db,
                                "listings",
                                listingDocument.id
                            ),
                            {
                                status:
                                    "expired",
                                updatedAt:
                                    serverTimestamp(),
                            }
                        )
                )
            );
        } catch (error) {
            console.error(
                "Помилка автоматичного завершення оголошень:",
                error
            );
        }
    };

    const loadListings = async () => {
        setLoading(true);
        setLoadError("");

        try {
            await expireOldListings();

            if (debouncedSearch) {
                const [
                    titleSnapshot,
                    authorSnapshot,
                ] = await Promise.all([
                    getDocs(
                        buildSearchQuery(
                            "title"
                        )
                    ),
                    getDocs(
                        buildSearchQuery(
                            "authorName"
                        )
                    ),
                ]);

                const listingsMap =
                    new Map();

                [
                    ...titleSnapshot.docs,
                    ...authorSnapshot.docs,
                ].forEach(
                    (listingDocument) => {
                        listingsMap.set(
                            listingDocument.id,
                            {
                                id:
                                    listingDocument.id,
                                ...listingDocument.data(),
                            }
                        );
                    }
                );

                const receivedListings =
                    Array.from(
                        listingsMap.values()
                    ).slice(
                        0,
                        LISTINGS_PER_PAGE
                    );

                setListings(
                    receivedListings
                );

                setLastDocument(null);

                setHasMoreListings(
                    false
                );

                return;
            }

            const snapshot =
                await getDocs(
                    buildListingsQuery()
                );

            const receivedListings =
                snapshot.docs.map(
                    (listingDocument) => ({
                        id:
                            listingDocument.id,
                        ...listingDocument.data(),
                    })
                );

            setListings(
                receivedListings
            );

            setLastDocument(
                snapshot.docs[
                snapshot.docs.length - 1
                ] || null
            );

            setHasMoreListings(
                snapshot.docs.length ===
                LISTINGS_PER_PAGE
            );
        } catch (error) {
            console.error(
                "Помилка завантаження оголошень:",
                error
            );

            setListings([]);

            setLoadError(
                "Не вдалося завантажити оголошення."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadMoreListings = async () => {
        if (
            !lastDocument ||
            loadingMore ||
            debouncedSearch
        ) {
            return;
        }

        setLoadingMore(true);

        try {
            const snapshot =
                await getDocs(
                    buildListingsQuery(
                        lastDocument
                    )
                );

            const receivedListings =
                snapshot.docs.map(
                    (listingDocument) => ({
                        id:
                            listingDocument.id,
                        ...listingDocument.data(),
                    })
                );

            setListings(
                (currentListings) => [
                    ...currentListings,
                    ...receivedListings,
                ]
            );

            setLastDocument(
                snapshot.docs[
                snapshot.docs.length - 1
                ] || null
            );

            setHasMoreListings(
                snapshot.docs.length ===
                LISTINGS_PER_PAGE
            );
        } catch (error) {
            console.error(
                "Помилка завантаження наступних оголошень:",
                error
            );

            setLoadError(
                "Не вдалося завантажити наступні оголошення."
            );
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        loadListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        typeFilter,
        statusFilter,
        authorizationFilter,
        cityFilter,
        sortOrder,
        debouncedSearch,
    ]);

    const filteredListings =
        listings;



    const resetFilters = () => {
        setSearch("");
        setTypeFilter("all");
        setStatusFilter("all");
        setAuthorizationFilter("all");
        setCityFilter("all");
        setSortOrder("newest");
    };

    const handleStatusChange = async (
        listing,
        newStatus
    ) => {
        if (
            !newStatus ||
            newStatus === listing.status
        ) {
            return;
        }

        const selectedStatus =
            STATUS_OPTIONS.find(
                (status) =>
                    status.value === newStatus
            );

        const confirmation =
            await Swal.fire({
                icon: "question",
                title: "Змінити статус?",
                html: `
                    <p style="line-height: 1.6;">
                        Оголошення
                        <strong>«${listing.title || "Без назви"}»</strong>
                        отримає статус
                        <strong>«${selectedStatus?.label || newStatus}»</strong>.
                    </p>
                `,
                showCancelButton: true,
                confirmButtonText: "Так, змінити",
                cancelButtonText: "Скасувати",
                confirmButtonColor: "#2563eb",
                cancelButtonColor: "#64748b",
                reverseButtons: true,
            });

        if (!confirmation.isConfirmed) {
            return;
        }

        setUpdatingId(listing.id);

        try {
            const listingRef = doc(
                db,
                "listings",
                listing.id
            );

            const updateData = {
                status: newStatus,
                updatedAt: serverTimestamp(),
                "moderation.reviewedAt":
                    serverTimestamp(),
            };

            if (newStatus === "approved") {
                const approvedAt = new Date();

                const existingExpiresAt =
                    getDateFromFirestore(
                        listing.expiresAt
                    );

                const hasFutureExpiration =
                    existingExpiresAt &&
                    existingExpiresAt.getTime() >
                    approvedAt.getTime();

                const expiresAt =
                    hasFutureExpiration
                        ? existingExpiresAt
                        : new Date(
                            approvedAt.getTime() +
                            LISTING_LIFETIME_DAYS *
                            24 *
                            60 *
                            60 *
                            1000
                        );

                updateData.approvedAt =
                    Timestamp.fromDate(
                        approvedAt
                    );

                updateData.expiresAt =
                    Timestamp.fromDate(
                        expiresAt
                    );

                updateData[
                    "moderation.rejectionReason"
                ] = null;
            }

            if (newStatus === "cancelled") {
                updateData.approvedAt = null;
                updateData.expiresAt = null;
            }

            if (newStatus === "pending") {
                updateData.approvedAt = null;
                updateData.expiresAt = null;

                updateData[
                    "moderation.reviewedAt"
                ] = null;

                updateData[
                    "moderation.rejectionReason"
                ] = null;
            }

            await updateDoc(
                listingRef,
                updateData
            );
            let logAction =
                ADMIN_LOG_ACTIONS.LISTING_UPDATED;

            let logTitle =
                "Змінено статус оголошення";

            if (newStatus === "approved") {
                logAction =
                    ADMIN_LOG_ACTIONS.LISTING_APPROVED;

                logTitle =
                    "Схвалено оголошення";
            }

            if (newStatus === "cancelled") {
                logAction =
                    ADMIN_LOG_ACTIONS.LISTING_REJECTED;

                logTitle =
                    "Скасовано оголошення";
            }

            await createAdminLog({
                action: logAction,

                category: "listings",

                title: logTitle,

                description:
                    `«${listing.title || "Без назви"}»: ` +
                    `${getStatusData(listing.status).label} → ` +
                    `${selectedStatus?.label || newStatus}`,

                targetId:
                    listing.id,

                targetName:
                    listing.title || "Без назви",
            });
            await Swal.fire({
                icon: "success",
                title: "Статус змінено",
                text: `Новий статус: ${selectedStatus?.label ||
                    newStatus
                    }.`,
                confirmButtonText: "Добре",
                confirmButtonColor: "#2563eb",
                timer: 1800,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error(
                "Помилка зміни статусу:",
                error
            );

            await Swal.fire({
                icon: "error",
                title: "Не вдалося змінити статус",
                text: "Перевірте з’єднання та правила доступу Firestore.",
                confirmButtonText: "Закрити",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setUpdatingId(null);
        }
    };
    const handleExtendListing = async (
        listing,
        extension
    ) => {
        if (!extension) {
            return;
        }

        const selectedExtension =
            EXTENSION_OPTIONS.find(
                (option) =>
                    option.value === extension
            );

        if (!selectedExtension) {
            return;
        }

        /*
         * Продовжувати можна тільки
         * опубліковані оголошення.
         */
        const canExtend =
            listing.status === "approved" ||
            listing.status === "expired";

        if (!canExtend) {
            await Swal.fire({
                icon: "warning",
                title:
                    "Неможливо продовжити термін",
                text:
                    "Продовжувати можна тільки опубліковані або прострочені оголошення.",
                confirmButtonColor:
                    "#2563eb",
            });

            return;
        }

        const oldExpiresAt =
            getDateFromFirestore(
                listing.expiresAt
            );

        const now = new Date();

        /*
         * Якщо термін ще не завершився —
         * додаємо час до існуючого expiresAt.
         *
         * Якщо вже завершився —
         * рахуємо новий термін від зараз.
         */
        const baseDate =
            oldExpiresAt &&
                oldExpiresAt.getTime() >
                now.getTime()
                ? oldExpiresAt
                : now;

        const newExpiresAt =
            calculateExtendedDate(
                baseDate,
                extension
            );

        if (!newExpiresAt) {
            return;
        }

        const confirmation =
            await Swal.fire({
                icon: "question",

                title:
                    "Продовжити термін?",

                html: `
                <div style="line-height:1.7">
                    Оголошення
                    <strong>
                        «${listing.title || "Без назви"}»
                    </strong>

                    <br><br>

                    Продовжити на:
                    <strong>
                        ${selectedExtension.label}
                    </strong>

                    <br>

                    Новий термін:
                    <strong>
                        ${formatDate(newExpiresAt)}
                    </strong>
                </div>
            `,

                showCancelButton: true,

                confirmButtonText:
                    "Так, продовжити",

                cancelButtonText:
                    "Скасувати",

                confirmButtonColor:
                    "#2563eb",

                cancelButtonColor:
                    "#64748b",

                reverseButtons: true,
            });

        if (!confirmation.isConfirmed) {
            return;
        }

        setExtendingId(listing.id);

        try {
            const listingRef = doc(
                db,
                "listings",
                listing.id
            );

            const wasExpired =
                listing.status === "expired";

            await updateDoc(
                listingRef,
                {
                    expiresAt:
                        Timestamp.fromDate(
                            newExpiresAt
                        ),

                    status: wasExpired
                        ? "pending"
                        : "approved",

                    updatedAt:
                        serverTimestamp(),

                    ...(wasExpired
                        ? {
                            approvedAt: null,

                            "moderation.reviewedAt":
                                null,

                            "moderation.rejectionReason":
                                null,
                        }
                        : {}),
                }
            );
            await createAdminLog({
                action:
                    ADMIN_LOG_ACTIONS.LISTING_UPDATED,

                category:
                    "listings",

                title:
                    "Продовжено термін оголошення",

                description:
                    `«${listing.title || "Без назви"}» — ` +
                    `продовжено на ${selectedExtension.label}. ` +
                    `Новий термін: ${formatDate(newExpiresAt)}.`,

                targetId:
                    listing.id,

                targetName:
                    listing.title || "Без назви",
            });
            await Swal.fire({
                icon: "success",

                title:
                    "Термін продовжено",

                html: `
                <div style="line-height:1.7">
                    Оголошення активне до:
                    <br>
                    <strong>
                        ${formatDate(newExpiresAt)}
                    </strong>
                </div>
            `,

                confirmButtonText:
                    "Добре",

                confirmButtonColor:
                    "#2563eb",

                timer: 2000,

                timerProgressBar: true,
            });

        } catch (error) {
            console.error(
                "Помилка продовження терміну:",
                error
            );

            await Swal.fire({
                icon: "error",

                title:
                    "Не вдалося продовжити термін",

                text:
                    "Перевірте з’єднання та права доступу Firestore.",

                confirmButtonText:
                    "Закрити",

                confirmButtonColor:
                    "#2563eb",
            });

        } finally {
            setExtendingId(null);
        }
    };

    const handleShortenListing = async (
        listing,
        extension
    ) => {
        if (!extension) {
            return;
        }

        const selectedExtension =
            SHORTEN_OPTIONS.find(
                (option) =>
                    option.value === extension
            );

        if (!selectedExtension) {
            return;
        }

        if (listing.status !== "approved") {
            await Swal.fire({
                icon: "warning",
                title: "Оголошення не опубліковане",
                text: "Скоротити термін можна тільки для опублікованого оголошення.",
                confirmButtonColor: "#2563eb",
            });

            return;
        }

        const oldExpiresAt =
            getDateFromFirestore(
                listing.expiresAt
            );

        if (!oldExpiresAt) {
            await Swal.fire({
                icon: "warning",
                title: "Термін не вказаний",
                text: "Для цього оголошення відсутня дата завершення.",
                confirmButtonColor: "#2563eb",
            });

            return;
        }

        const now = new Date();

        if (
            oldExpiresAt.getTime() <=
            now.getTime()
        ) {
            await Swal.fire({
                icon: "warning",
                title: "Термін уже закінчився",
                text: "Неможливо скоротити термін оголошення, яке вже прострочене.",
                confirmButtonColor: "#2563eb",
            });

            return;
        }

        const newExpiresAt =
            calculateShortenedDate(
                oldExpiresAt,
                extension
            );

        if (!newExpiresAt) {
            return;
        }

        const willExpire =
            newExpiresAt.getTime() <=
            now.getTime();

        if (willExpire) {
            newExpiresAt.setTime(
                now.getTime()
            );
        }

        const confirmation =
            await Swal.fire({
                icon: "question",
                title: "Скоротити термін?",
                html: `
                <div style="line-height:1.7">
                    Оголошення
                    <strong>
                        «${listing.title || "Без назви"}»
                    </strong>

                    <br><br>

                    Скоротити на:
                    <strong>
                        ${selectedExtension.label}
                    </strong>

                    <br>

                    Поточний термін:
                    <strong>
                        ${formatDate(oldExpiresAt)}
                    </strong>

                    <br>

                    Новий термін:
                    <strong>
                        ${formatDate(newExpiresAt)}
                    </strong>
                </div>
            `,
                showCancelButton: true,
                confirmButtonText:
                    "Так, скоротити",
                cancelButtonText: "Скасувати",
                confirmButtonColor: "#dc2626",
                cancelButtonColor: "#64748b",
                reverseButtons: true,
            });

        if (!confirmation.isConfirmed) {
            return;
        }

        setShorteningId(listing.id);

        try {
            const listingRef = doc(
                db,
                "listings",
                listing.id
            );

            await updateDoc(
                listingRef,
                {
                    expiresAt:
                        Timestamp.fromDate(
                            newExpiresAt
                        ),

                    ...(willExpire && {
                        status: "expired",
                    }),

                    updatedAt:
                        serverTimestamp(),
                }
            );
            await createAdminLog({
                action:
                    ADMIN_LOG_ACTIONS.LISTING_UPDATED,

                category:
                    "listings",

                title:
                    willExpire
                        ? "Завершено термін оголошення"
                        : "Скорочено термін оголошення",

                description:
                    `«${listing.title || "Без назви"}» — ` +
                    `скорочено на ${selectedExtension.label}. ` +
                    `Новий термін: ${formatDate(newExpiresAt)}.`,

                targetId:
                    listing.id,

                targetName:
                    listing.title || "Без назви",
            });
            await Swal.fire({
                icon: "success",
                title: "Термін скорочено",
                html: `
                <div style="line-height:1.7">
                    Оголошення активне до:
                    <br>
                    <strong>
                        ${formatDate(newExpiresAt)}
                    </strong>
                </div>
            `,
                confirmButtonText: "Добре",
                confirmButtonColor: "#2563eb",
                timer: 2000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error(
                "Помилка скорочення терміну:",
                error
            );

            await Swal.fire({
                icon: "error",
                title:
                    "Не вдалося скоротити термін",
                text:
                    "Перевірте з’єднання та права доступу Firestore.",
                confirmButtonText: "Закрити",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setShorteningId(null);
        }
    };



    const handleDeleteListing = async (listing) => {
        const confirmation = await Swal.fire({
            icon: "warning",
            title: "Видалити оголошення?",
            html: `
            <p style="line-height: 1.6;">
                Оголошення
                <strong>«${listing.title || "Без назви"}»</strong>
                буде повністю видалено.
            </p>
        `,
            showCancelButton: true,
            confirmButtonText: "Так, видалити",
            cancelButtonText: "Не видаляти",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            reverseButtons: true,
            focusCancel: true,
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        setDeletingId(listing.id);

        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                throw new Error("Необхідна авторизація.");
            }

            const idToken = await currentUser.getIdToken();

            const response = await fetch(
                "/.netlify/functions/delete-listing",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        listingId: listing.id,
                    }),
                }
            );

            let result = null;

            try {
                result = await response.json();
            } catch {
                result = null;
            }

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    "Не вдалося видалити оголошення."
                );
            }

            await createAdminLog({
                action: ADMIN_LOG_ACTIONS.LISTING_DELETED,
                category: "listings",
                title: "Видалено оголошення",
                description: `«${listing.title || "Без назви"}»`,
                targetId: listing.id,
                targetName: listing.title || "Без назви",
            });

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Оголошення видалено",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error(
                "Помилка видалення:",
                error
            );

            await Swal.fire({
                icon: "error",
                title: "Не вдалося видалити",
                text:
                    error?.message ||
                    "Сталася помилка під час видалення оголошення.",
                confirmButtonText: "Закрити",
                confirmButtonColor: "#2563eb",
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                            Панель адміністратора
                        </p>

                        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                            Оголошення
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                            Переглядайте, публікуйте,
                            скасовуйте та видаляйте
                            оголошення користувачів.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-100 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Знайдено
                        </p>

                        <p className="mt-1 text-2xl font-black text-slate-950">
                            {filteredListings.length}
                        </p>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="md:col-span-2 xl:col-span-3">
                            <label
                                htmlFor="listing-search"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Пошук
                            </label>

                            <div className="relative">
                                <svg
                                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <circle
                                        cx="11"
                                        cy="11"
                                        r="8"
                                    />

                                    <path d="m21 21-4.3-4.3" />
                                </svg>

                                <input
                                    id="listing-search"
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="Назва оголошення або автор..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="type-filter"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Тип оголошення
                            </label>

                            <select
                                id="type-filter"
                                value={typeFilter}
                                onChange={(event) =>
                                    setTypeFilter(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="all">
                                    Усі типи
                                </option>

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
                        </div>

                        <div>
                            <label
                                htmlFor="status-filter"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Статус
                            </label>

                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="all">
                                    Усі статуси
                                </option>

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
                                            {status.label}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="authorization-filter"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Авторизація
                            </label>

                            <select
                                id="authorization-filter"
                                value={
                                    authorizationFilter
                                }
                                onChange={(event) =>
                                    setAuthorizationFilter(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="all">
                                    Усі користувачі
                                </option>

                                <option value="authenticated">
                                    Авторизовані
                                </option>

                                <option value="guest">
                                    Не авторизовані
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="city-filter"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Місто
                            </label>

                            <select
                                id="city-filter"
                                value={cityFilter}
                                onChange={(event) =>
                                    setCityFilter(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="all">
                                    Усі міста
                                </option>

                                {RAKHIV_DISTRICT_PLACES.map(
                                    (place) => (
                                        <option
                                            key={place.id}
                                            value={place.name}
                                        >
                                            {place.name}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="sort-order"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Сортування
                            </label>

                            <select
                                id="sort-order"
                                value={sortOrder}
                                onChange={(event) =>
                                    setSortOrder(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="newest">
                                    Спочатку нові
                                </option>

                                <option value="oldest">
                                    Спочатку старі
                                </option>

                                <option value="alphabetical-asc">
                                    Від А до Я
                                </option>

                                <option value="alphabetical-desc">
                                    Від Я до А
                                </option>
                                <option value="views-desc">
                                    Найбільше переглядів
                                </option>

                                <option value="views-asc">
                                    Найменше переглядів
                                </option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                                Скинути фільтри
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="mt-4 text-sm font-medium text-slate-500">
                        Завантаження оголошень...
                    </p>
                </div>
            )}

            {loadError && !loading && (
                <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
                    {loadError}
                </div>
            )}

            {!loading &&
                !loadError &&
                filteredListings.length === 0 && (
                    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                            🔍
                        </div>

                        <h2 className="mt-5 text-xl font-black text-slate-950">
                            Оголошень не знайдено
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Спробуйте змінити пошуковий
                            запит або скинути фільтри.
                        </p>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            Скинути фільтри
                        </button>
                    </div>
                )}

            {!loading &&
                !loadError &&
                filteredListings.length > 0 && (
                    <div className="mt-6 grid gap-6 xl:grid-cols-2">
                        {filteredListings.map(
                            (listing) => {
                                const isExpired =
                                    isListingExpired(listing);

                                const statusData =
                                    getStatusData(
                                        listing.status,
                                        isExpired
                                    );
                                const isAuthenticated =
                                    Boolean(
                                        listing.author
                                            ?.isAuthenticated
                                    );

                                const location = [
                                    listing.city?.name,
                                    listing.city?.region,
                                    listing.street,
                                ]
                                    .filter(Boolean)
                                    .join(", ");

                                const isUpdating =
                                    updatingId ===
                                    listing.id;

                                const isDeleting =
                                    deletingId ===
                                    listing.id;
                                const isExtending =
                                    extendingId ===
                                    listing.id;
                                const remainingTime =
                                    getRemainingTime(
                                        listing.expiresAt
                                    );
                                const listingContacts =
                                    getListingContacts(listing);
                                const isDescriptionExpanded =
                                    expandedDescriptions.includes(
                                        listing.id
                                    );
                                const isContactsExpanded =
                                    expandedContacts.includes(
                                        listing.id
                                    );

                                const mainContact =
                                    listingContacts[0];

                                const additionalContacts =
                                    listingContacts.slice(1);
                                return (
                                    <article
                                        key={listing.id}
                                        className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusData.className}`}
                                                    >
                                                        {
                                                            statusData.label
                                                        }
                                                    </span>

                                                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                                        {listing.type ||
                                                            "Тип не вказано"}
                                                    </span>

                                                    <span
                                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${isAuthenticated
                                                            ? "border-violet-200 bg-violet-50 text-violet-700"
                                                            : "border-slate-200 bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {isAuthenticated
                                                            ? "Авторизований"
                                                            : "Не авторизований"}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                                        <svg
                                                            className="h-3.5 w-3.5"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            aria-hidden="true"
                                                        >
                                                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>

                                                        {Number(listing.views ?? 0)} переглядів
                                                    </span>


                                                </div>

                                                <h2 className="mt-4 break-words text-xl font-black leading-tight text-slate-950">
                                                    {listing.title ||
                                                        "Без назви"}
                                                </h2>

                                                <p className="mt-2 text-xs font-medium text-slate-400">
                                                    ID:{" "}
                                                    {
                                                        listing.id
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                            <InfoItem
                                                label="Автор"
                                                value={
                                                    listing.authorName ||
                                                    "Не вказано"
                                                }
                                            />
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                        Контакти
                                                    </p>

                                                    {additionalContacts.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleContacts(
                                                                    listing.id
                                                                )
                                                            }
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-100 hover:text-blue-700"
                                                            aria-label={
                                                                isContactsExpanded
                                                                    ? "Згорнути контакти"
                                                                    : "Показати додаткові контакти"
                                                            }
                                                        >
                                                            <svg
                                                                className={`h-4 w-4 transition-transform duration-200 ${isContactsExpanded
                                                                    ? "rotate-180"
                                                                    : ""
                                                                    }`}
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                aria-hidden="true"
                                                            >
                                                                <path d="m6 9 6 6 6-6" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>

                                                {mainContact ? (
                                                    <>
                                                        <div className="mt-2">
                                                            <p className="text-xs font-bold text-slate-500">
                                                                {mainContact.labels.join(", ")}
                                                            </p>

                                                            {mainContact.type === "link" ? (
                                                                <a
                                                                    href={
                                                                        mainContact.value.startsWith(
                                                                            "http://"
                                                                        ) ||
                                                                            mainContact.value.startsWith(
                                                                                "https://"
                                                                            )
                                                                            ? mainContact.value
                                                                            : `https://${mainContact.value}`
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="mt-0.5 block break-all text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
                                                                >
                                                                    {mainContact.value}
                                                                </a>
                                                            ) : (
                                                                <p className="mt-0.5 break-all text-sm font-semibold text-slate-800">
                                                                    {mainContact.value}

                                                                    {listing.hidePhone === true && (
                                                                        <span className="ml-1 font-medium text-blue-600">
                                                                            (приховано)
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {isContactsExpanded &&
                                                            additionalContacts.length > 0 && (
                                                                <div className="mt-3 divide-y divide-slate-200 border-t border-slate-200 pt-1">
                                                                    {additionalContacts.map(
                                                                        (contact) => (
                                                                            <div
                                                                                key={
                                                                                    contact.key
                                                                                }
                                                                                className="py-2 last:pb-0"
                                                                            >
                                                                                <p className="text-xs font-bold text-slate-500">
                                                                                    {contact.labels.join(
                                                                                        ", "
                                                                                    )}
                                                                                </p>

                                                                                {contact.type ===
                                                                                    "link" ? (
                                                                                    <a
                                                                                        href={
                                                                                            contact.value.startsWith(
                                                                                                "http://"
                                                                                            ) ||
                                                                                                contact.value.startsWith(
                                                                                                    "https://"
                                                                                                )
                                                                                                ? contact.value
                                                                                                : `https://${contact.value}`
                                                                                        }
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="mt-0.5 block break-all text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
                                                                                    >
                                                                                        {
                                                                                            contact.value
                                                                                        }
                                                                                    </a>
                                                                                ) : (
                                                                                    <p className="mt-0.5 break-all text-sm font-semibold text-slate-800">
                                                                                        {
                                                                                            contact.value
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </>
                                                ) : (
                                                    <p className="mt-2 text-sm font-medium text-slate-400">
                                                        Не вказано
                                                    </p>
                                                )}
                                            </div>

                                            <InfoItem
                                                label="Місто та адреса"
                                                value={
                                                    location ||
                                                    "Не вказано"
                                                }
                                            />

                                            <InfoItem
                                                label="Дата створення"
                                                value={formatDate(
                                                    listing.createdAt

                                                )}

                                            />
                                            {(
                                                listing.status === "approved" ||
                                                listing.status === "expired"
                                            ) &&
                                                listing.expiresAt && (
                                                    <InfoItem
                                                        label={
                                                            isExpired ? (
                                                                "Термін закінчився"
                                                            ) : (
                                                                <>
                                                                    Активне до{" "}
                                                                    {remainingTime && (
                                                                        <span>
                                                                            ({" "}
                                                                            <span className="text-blue-600">
                                                                                {remainingTime.days}д,{" "}
                                                                                {remainingTime.hours}г,{" "}
                                                                                {remainingTime.minutes}хв.
                                                                            </span>
                                                                            )
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )
                                                        }
                                                        value={formatDate(
                                                            listing.expiresAt
                                                        )}
                                                    />
                                                )}
                                        </div>

                                        <div className="mt-5">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Опис
                                            </p>

                                            <div className="mt-2 rounded-2xl bg-slate-50 p-4">
                                                <p
                                                    className={`whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 ${isDescriptionExpanded
                                                        ? ""
                                                        : "line-clamp-2"
                                                        }`}
                                                >
                                                    {listing.comment ||
                                                        "Коментар до оголошення не додано."}
                                                </p>

                                                {listing.comment && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleDescription(
                                                                listing.id
                                                            )
                                                        }
                                                        className="mt-2 text-sm font-bold text-blue-600 transition hover:text-blue-700"
                                                    >
                                                        {isDescriptionExpanded
                                                            ? "Згорнути"
                                                            : "Показати весь текст"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {listing.guestLimit && (
                                            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                                                    Гостьовий
                                                    ліміт
                                                </p>

                                                <p className="mt-2 text-sm text-amber-900">
                                                    Після цієї
                                                    публікації
                                                    залишилося:{" "}
                                                    <strong>
                                                        {listing
                                                            .guestLimit
                                                            ?.attemptsLeftAfterSubmission ??
                                                            "—"}
                                                    </strong>{" "}
                                                    із{" "}
                                                    <strong>
                                                        {listing
                                                            .guestLimit
                                                            ?.maximumAttempts ??
                                                            3}
                                                    </strong>
                                                </p>
                                            </div>
                                        )}
                                        <ListingImageGallery
                                            images={listing.images}
                                        />
                                        <div className="mt-auto border-t border-slate-100 pt-5">
                                            <label
                                                htmlFor={`status-${listing.id}`}
                                                className="mb-2 block text-sm font-semibold text-slate-700"
                                            >
                                                Змінити статус
                                            </label>

                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                <select
                                                    id={`status-${listing.id}`}
                                                    value={
                                                        listing.status ||
                                                        "pending"
                                                    }
                                                    disabled={
                                                        isUpdating ||
                                                        isDeleting ||
                                                        isExtending ||
                                                        shorteningId === listing.id
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleStatusChange(
                                                            listing,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {STATUS_OPTIONS
                                                        .filter(
                                                            (status) =>
                                                                status.value !== "expired"
                                                        )
                                                        .map((status) => (
                                                            <option
                                                                key={status.value}
                                                                value={status.value}
                                                            >
                                                                {status.label}
                                                            </option>
                                                        ))}
                                                </select>
                                                <select
                                                    value=""
                                                    disabled={
                                                        isUpdating ||
                                                        isDeleting ||
                                                        isExtending ||
                                                        shorteningId === listing.id ||
                                                        (
                                                            listing.status !== "approved" &&
                                                            listing.status !== "expired"
                                                        )
                                                    }
                                                    onChange={(event) => {
                                                        const value =
                                                            event.target.value;

                                                        if (!value) {
                                                            return;
                                                        }

                                                        handleExtendListing(
                                                            listing,
                                                            value
                                                        );
                                                    }}
                                                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <option value="">
                                                        {isExtending
                                                            ? "Продовження..."
                                                            : "Продовжити термін"}
                                                    </option>

                                                    {EXTENSION_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={option.value}
                                                                value={option.value}
                                                            >
                                                                {option.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                <select
                                                    value=""
                                                    disabled={
                                                        isUpdating ||
                                                        isDeleting ||
                                                        isExtending ||
                                                        shorteningId === listing.id ||
                                                        listing.status !== "approved" ||
                                                        isExpired
                                                    }
                                                    onChange={(event) => {
                                                        const value =
                                                            event.target.value;

                                                        if (!value) {
                                                            return;
                                                        }

                                                        handleShortenListing(
                                                            listing,
                                                            value
                                                        );
                                                    }}
                                                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <option value="">
                                                        {shorteningId === listing.id
                                                            ? "Скорочення..."
                                                            : "Скоротити термін"}
                                                    </option>

                                                    {SHORTEN_OPTIONS.map(
                                                        (option) => (
                                                            <option
                                                                key={option.value}
                                                                value={option.value}
                                                            >
                                                                {option.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    {/* Редагувати */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/dashboard/listings/${listing.id}/edit`
                                                            )
                                                        }
                                                        disabled={
                                                            isUpdating ||
                                                            isDeleting ||
                                                            isExtending
                                                        }
                                                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Редагувати оголошення"
                                                        aria-label="Редагувати оголошення"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            aria-hidden="true"
                                                        >
                                                            <path d="M12 20h9" />
                                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                        </svg>
                                                    </button>

                                                    {/* Видалити */}
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            isUpdating ||
                                                            isDeleting ||
                                                            isExtending
                                                        }
                                                        onClick={() =>
                                                            handleDeleteListing(
                                                                listing
                                                            )
                                                        }
                                                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Видалити оголошення"
                                                        aria-label="Видалити оголошення"
                                                    >
                                                        {isDeleting ? (
                                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-700" />
                                                        ) : (
                                                            <svg
                                                                className="h-4 w-4"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                aria-hidden="true"
                                                            >
                                                                <path d="M3 6h18" />
                                                                <path d="M8 6V4h8v2" />
                                                                <path d="M19 6l-1 14H6L5 6" />
                                                                <path d="M10 11v5" />
                                                                <path d="M14 11v5" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {isUpdating && (
                                                <p className="mt-3 text-sm font-medium text-blue-600">
                                                    Оновлення
                                                    статусу...
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                );
                            }
                        )}
                    </div>
                )}
            {!loading &&
                !loadError &&
                hasMoreListings &&
                !debouncedSearch && (
                    <div className="mt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={loadMoreListings}
                            disabled={loadingMore}
                            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loadingMore
                                ? "Завантаження..."
                                : "Завантажити ще"}
                        </button>
                    </div>
                )}
        </section>
    );
};

const InfoItem = ({
    label,
    value,
    breakAll = false,
}) => {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p
                className={`mt-2 text-sm font-semibold leading-6 text-slate-800 ${breakAll
                    ? "break-all"
                    : "break-words"
                    }`}
            >
                {value}
            </p>
        </div>
    );
};

export default AdminListings;