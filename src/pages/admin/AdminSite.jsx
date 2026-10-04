import {
    useEffect,
    useState,
} from "react";

import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
    Timestamp,
} from "firebase/firestore";

import {
    useNavigate,
} from "react-router-dom";

import {
    db,
} from "../../firebase";

import SearchFilters from "../../components/SearchFilters";
import ListingsSection from "../../components/listings/ListingsSection";
import ListingDetailsModal from "../../components/listings/ListingDetailsModal";


const LISTINGS_PER_PAGE = 24;


const searchPhrases = [
    "Шукаю козу...",
    "Загубив телефон...",
    "Шукаю транспорт...",
    "Потрібен майстер...",
    "Шукаю квартиру...",
    "Продам велосипед...",
    "Шукаю роботу...",
    "Віддам кошенят...",
];


const isListingActive = (expiresAt) => {
    if (!expiresAt) {
        return false;
    }

    const expirationDate =
        expiresAt?.toDate?.() ||
        (
            expiresAt instanceof Date
                ? expiresAt
                : new Date(expiresAt)
        );

    if (
        Number.isNaN(
            expirationDate.getTime()
        )
    ) {
        return false;
    }

    return (
        expirationDate.getTime() >
        Date.now()
    );
};


const AdminSite = () => {
    const navigate = useNavigate();

    const [search, setSearch] =
        useState("");
    const [
        debouncedSearch,
        setDebouncedSearch,
    ] = useState("");

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

    const [
        searchPlaceholder,
        setSearchPlaceholder,
    ] = useState("");

    const [
        activeCategory,
        setActiveCategory,
    ] = useState("Усі");

    const [
        sortOrder,
        setSortOrder,
    ] = useState("newest");

    const [
        viewMode,
        setViewMode,
    ] = useState("grid");

    const [
        listings,
        setListings,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        loadError,
        setLoadError,
    ] = useState("");

    const [
        loadingMore,
        setLoadingMore,
    ] = useState(false);

    const [
        lastDocument,
        setLastDocument,
    ] = useState(null);

    const [
        hasMoreListings,
        setHasMoreListings,
    ] = useState(true);

    const [
        selectedListing,
        setSelectedListing,
    ] = useState(null);


    /* ========================= */
    /* АНІМАЦІЯ PLACEHOLDER */
    /* ========================= */

    useEffect(() => {
        let phraseIndex = 0;
        let charIndex = 0;
        let timeoutId;

        const typePhrase = () => {
            const currentPhrase =
                searchPhrases[
                phraseIndex
                ];

            if (
                charIndex <
                currentPhrase.length
            ) {
                charIndex++;

                setSearchPlaceholder(
                    currentPhrase.slice(
                        0,
                        charIndex
                    )
                );

                timeoutId =
                    setTimeout(
                        typePhrase,
                        100
                    );

                return;
            }

            timeoutId =
                setTimeout(() => {
                    setSearchPlaceholder(
                        ""
                    );

                    phraseIndex =
                        (
                            phraseIndex +
                            1
                        ) %
                        searchPhrases.length;

                    charIndex = 0;

                    timeoutId =
                        setTimeout(
                            typePhrase,
                            300
                        );
                }, 2000);
        };

        typePhrase();

        return () => {
            clearTimeout(
                timeoutId
            );
        };
    }, []);
    const mapListingDocument = (document) => {
        const data = document.data();

        return {
            id: document.id,

            title:
                data.title || "",

            description:
                data.comment || "",

            category:
                data.type || "Інше",

            city:
                data.city?.name || "",

            region:
                data.city?.region || "",

            district:
                data.city?.district || "",

            street:
                data.street || "",

            location: [
                data.city?.name,
                data.street,
            ]
                .filter(Boolean)
                .join(", "),

            contact:
                data.contactOriginal ||
                data.contact ||
                "",

            hidePhone:
                data.hidePhone === true,

            additionalContacts:
                data.additionalContacts &&
                    typeof data.additionalContacts === "object"
                    ? data.additionalContacts
                    : {},

            authorName:
                data.authorName || "",

            author:
                data.author &&
                    typeof data.author === "object"
                    ? data.author
                    : null,

            views:
                Number(data.views ?? 0),

            createdAt:
                data.createdAt
                    ?.toDate?.() ||
                null,

            expiresAt:
                data.expiresAt
                    ?.toDate?.() ||
                null,

            images:
                Array.isArray(data.images)
                    ? data.images
                    : [],

            favoriteUserIds:
                Array.isArray(
                    data.favoriteUserIds
                )
                    ? data.favoriteUserIds
                    : [],
        };
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
        const constraints = [
            where(
                "status",
                "==",
                "approved"
            ),
            where(
                "expiresAt",
                ">",
                Timestamp.now()
            ),
        ];

        if (
            activeCategory !== "Усі" &&
            activeCategory !== "Обрані"
        ) {
            constraints.push(
                where(
                    "type",
                    "==",
                    activeCategory
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

    const buildSearchQuery = (
        lastVisibleDocument = null
    ) => {
        const searchValue =
            debouncedSearch.trim();

        const constraints = [
            where(
                "status",
                "==",
                "approved"
            ),
            where(
                "title",
                ">=",
                searchValue
            ),
            where(
                "title",
                "<=",
                searchValue + "\uf8ff"
            ),
            orderBy(
                "title",
                "asc"
            ),
        ];

        if (
            activeCategory !== "Усі" &&
            activeCategory !== "Обрані"
        ) {
            constraints.push(
                where(
                    "type",
                    "==",
                    activeCategory
                )
            );
        }

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

    const loadListings = async () => {
        setLoading(true);
        setLoadError("");

        try {
            const listingsQuery =
                debouncedSearch
                    ? buildSearchQuery()
                    : buildListingsQuery();

            const snapshot =
                await getDocs(
                    listingsQuery
                );

            const receivedListings =
                snapshot.docs
                    .filter((document) => {
                        const data =
                            document.data();

                        return isListingActive(
                            data.expiresAt
                        );
                    })
                    .map(
                        mapListingDocument
                    );

            setListings(
                receivedListings
            );

            const lastDoc =
                snapshot.docs[
                snapshot.docs.length - 1
                ] || null;

            setLastDocument(
                lastDoc
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
            loadingMore
        ) {
            return;
        }

        setLoadingMore(true);
        setLoadError("");

        try {
            const listingsQuery =
                debouncedSearch
                    ? buildSearchQuery(
                        lastDocument
                    )
                    : buildListingsQuery(
                        lastDocument
                    );

            const snapshot =
                await getDocs(
                    listingsQuery
                );

            const receivedListings =
                snapshot.docs
                    .filter((document) => {
                        const data =
                            document.data();

                        return isListingActive(
                            data.expiresAt
                        );
                    })
                    .map(
                        mapListingDocument
                    );

            setListings(
                (currentListings) => [
                    ...currentListings,
                    ...receivedListings,
                ]
            );

            const lastDoc =
                snapshot.docs[
                snapshot.docs.length - 1
                ] || null;

            setLastDocument(
                lastDoc
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
        activeCategory,
        sortOrder,
        debouncedSearch,
    ]);
    /* ========================= */
    /* ВІДКРИТТЯ ОГОЛОШЕННЯ */
    /* ========================= */

    const openListing = (
        listing
    ) => {
        setSelectedListing(
            listing
        );
    };


    const closeListing = () => {
        setSelectedListing(
            null
        );
    };


    /* ========================= */
    /* СТВОРЕННЯ ОГОЛОШЕННЯ */
    /* ========================= */

    const handleCreateListing =
        () => {
            navigate(
                "/dashboard/admin-create-listing"
            );
        };


    return (
        <>
            <div className="min-w-0">

                {/* ========================= */}
                {/* ВЕРХНІЙ БЛОК */}
                {/* ========================= */}

                <div className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                Головна сайту
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Перегляд активних оголошень так, як вони відображаються на сайті.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleCreateListing
                            }
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M12 5v14" />
                                <path d="M5 12h14" />
                            </svg>

                            Додати оголошення
                        </button>
                    </div>
                </div>


                {/* ========================= */}
                {/* ФІЛЬТРИ */}
                {/* ========================= */}

                <SearchFilters
                    search={search}
                    setSearch={setSearch}
                    searchPlaceholder={
                        searchPlaceholder
                    }
                    activeCategory={
                        activeCategory
                    }
                    setActiveCategory={
                        setActiveCategory
                    }
                    sortOrder={
                        sortOrder
                    }
                    setSortOrder={
                        setSortOrder
                    }
                    viewMode={
                        viewMode
                    }
                    setViewMode={
                        setViewMode
                    }
                />



                {loading && (
                    <div className="py-16 text-center text-slate-500">
                        Завантаження оголошень...
                    </div>
                )}


                {loadError && (
                    <div className="my-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
                        {loadError}
                    </div>
                )}



                {!loading &&
                    !loadError && (
                        <>
                            <ListingsSection
                                listings={listings}
                                viewMode={viewMode}
                                onListingClick={openListing}
                            />

                            {hasMoreListings && (
                                <div className="mt-10 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={loadMoreListings}
                                        disabled={loadingMore}
                                        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loadingMore
                                            ? "Завантаження..."
                                            : "Завантажити ще"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
            </div>


            {/* ========================= */}
            {/* ДЕТАЛІ ОГОЛОШЕННЯ */}
            {/* ========================= */}

            <ListingDetailsModal
                listing={
                    selectedListing
                }
                onClose={
                    closeListing
                }
            />
        </>
    );
};


export default AdminSite;