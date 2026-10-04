import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
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
    onAuthStateChanged,
} from "firebase/auth";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchFilters from "../components/SearchFilters";
import ListingsSection from "../components/listings/ListingsSection";
import AddListingButton from "../components/listings/AddListingButton";
import ListingDetailsModal from "../components/listings/ListingDetailsModal";
import {
    auth,
    db,
} from "../firebase";


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
const categoryRoutes = {
    sale: "Продаж",
    buy: "Купівля",
    rent: "Оренда",
    services: "Послуга",
    jobs: "Робота",
    questions: "Питання",
    exchange: "Обмін",
    free: "Віддам безкоштовно",
    "lost-found": "Загублено / знайдено",
    events: "Подія",
    community: "Оголошення громади",
    other: "Інше",
};
const categorySeo = {
    sale: {
        title: "Продаж у Рахові — оголошення про продаж | RBoard",
        description:
            "Оголошення про продаж у Рахові та Рахівському районі. Товари, техніка, речі та інші пропозиції від місцевих жителів на RBoard.",
    },

    buy: {
        title: "Купівля у Рахові — оголошення про купівлю | RBoard",
        description:
            "Оголошення про купівлю в Рахові та Рахівському районі. Знайдіть актуальні пропозиції від місцевих жителів на RBoard.",
    },

    rent: {
        title: "Оренда в Рахові — житло та інші оголошення | RBoard",
        description:
            "Актуальні оголошення про оренду в Рахові та Рахівському районі. Житло, приміщення та інші пропозиції на RBoard.",
    },

    services: {
        title: "Послуги в Рахові — місцеві майстри та спеціалісти | RBoard",
        description:
            "Послуги в Рахові та Рахівському районі. Знайдіть майстрів, спеціалістів та актуальні пропозиції послуг на RBoard.",
    },

    jobs: {
        title: "Робота в Рахові — вакансії та оголошення | RBoard",
        description:
            "Робота та вакансії в Рахові й Рахівському районі. Актуальні оголошення роботодавців і пошук роботи на RBoard.",
    },

    questions: {
        title: "Питання та пошук допомоги в Рахові | RBoard",
        description:
            "Питання від жителів Рахова та Рахівського району. Пошук інформації, рекомендацій і допомоги на локальній дошці RBoard.",
    },

    exchange: {
        title: "Обмін у Рахові — оголошення | RBoard",
        description:
            "Оголошення про обмін у Рахові та Рахівському районі. Переглядайте актуальні пропозиції обміну на RBoard.",
    },

    free: {
        title: "Віддам безкоштовно в Рахові | RBoard",
        description:
            "Безкоштовні оголошення в Рахові та Рахівському районі. Речі та інші пропозиції, які місцеві жителі віддають безкоштовно.",
    },

    "lost-found": {
        title: "Загублено та знайдено в Рахові | RBoard",
        description:
            "Загублені та знайдені речі в Рахові й Рахівському районі. Переглядайте та публікуйте оголошення на RBoard.",
    },

    events: {
        title: "Події в Рахові — місцеві оголошення | RBoard",
        description:
            "Події та заходи в Рахові й Рахівському районі. Актуальні місцеві оголошення про події на RBoard.",
    },

    community: {
        title: "Оголошення громади Рахова | RBoard",
        description:
            "Оголошення громади Рахова та Рахівського району. Важлива місцева інформація та актуальні повідомлення на RBoard.",
    },

    other: {
        title: "Інші оголошення в Рахові | RBoard",
        description:
            "Інші актуальні оголошення Рахова та Рахівського району, які не належать до основних категорій RBoard.",
    },
};
const categorySlugs = Object.fromEntries(
    Object.entries(categoryRoutes).map(
        ([slug, category]) => [
            category,
            slug,
        ]
    )
);
const LISTINGS_PER_PAGE = 20;
const isListingActive = (expiresAt) => {
    if (!expiresAt) {
        return false;
    }

    const expirationDate =
        expiresAt?.toDate?.() ||
        (expiresAt instanceof Date
            ? expiresAt
            : new Date(expiresAt));

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

const Home = () => {
    const navigate = useNavigate();
    const {
        listingId,
        categorySlug,
    } = useParams();
    const [currentUser, setCurrentUser] =
        useState(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] =
        useState("");
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
    const [searchPlaceholder, setSearchPlaceholder] =
        useState("");
    useEffect(() => {
        const unsubscribe =
            onAuthStateChanged(
                auth,
                (user) => {
                    setCurrentUser(user);
                }
            );

        return unsubscribe;
    }, []);
    useEffect(() => {
        let phraseIndex = 0;
        let charIndex = 0;
        let timeoutId;

        const typePhrase = () => {
            const currentPhrase =
                searchPhrases[phraseIndex];
            if (charIndex < currentPhrase.length) {
                charIndex++;

                setSearchPlaceholder(
                    currentPhrase.slice(0, charIndex)
                );

                timeoutId = setTimeout(
                    typePhrase,
                    100
                );

                return;
            }
            timeoutId = setTimeout(() => {
                setSearchPlaceholder("");

                phraseIndex =
                    (phraseIndex + 1) %
                    searchPhrases.length;

                charIndex = 0;
                timeoutId = setTimeout(
                    typePhrase,
                    300
                );
            }, 2000);
        };
        typePhrase();

        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    const [activeCategory, setActiveCategory] =
        useState("Усі");
    useEffect(() => {
        if (!categorySlug) {
            return;
        }

        const category =
            categoryRoutes[categorySlug];

        if (category) {
            setActiveCategory(category);
        }
    }, [categorySlug]);


    const handleCategoryChange = (category) => {
        setActiveCategory(category);

        if (category === "Усі") {
            navigate("/");
            return;
        }
        if (category === "Обрані") {
            navigate("/");
            return;
        }

        const slug =
            categorySlugs[category];

        if (slug) {
            navigate(`/category/${slug}`);
        }
    };

    const [sortOrder, setSortOrder] =
        useState("newest");

    const [viewMode, setViewMode] =
        useState("grid");

    const [listings, setListings] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [loadingMore, setLoadingMore] =
        useState(false);

    const [loadError, setLoadError] =
        useState("");

    const [lastDocument, setLastDocument] =
        useState(null);

    const [hasMoreListings, setHasMoreListings] =
        useState(true);

    const [showScrollTop, setShowScrollTop] =
        useState(false);
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(
                window.scrollY > 600
            );
        };

        window.addEventListener(
            "scroll",
            handleScroll
        );

        handleScroll();

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            );
        };
    }, []);
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


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

        if (
            activeCategory === "Обрані" &&
            currentUser?.uid
        ) {
            constraints.push(
                where(
                    "favoriteUserIds",
                    "array-contains",
                    currentUser.uid
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

        if (
            activeCategory === "Обрані" &&
            currentUser?.uid
        ) {
            constraints.push(
                where(
                    "favoriteUserIds",
                    "array-contains",
                    currentUser.uid
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

            setLastDocument(lastDoc);

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

            setLastDocument(lastDoc);

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
        currentUser?.uid,
        debouncedSearch,
    ]);
    const selectedListing = useMemo(() => {
        if (!listingId) {
            return null;
        }

        return (
            listings.find(
                (listing) =>
                    listing.id === listingId
            ) || null
        );
    }, [listings, listingId]);


    useEffect(() => {
        const defaultTitle =
            "RBoard — оголошення Рахів | Купівля, продаж, робота та послуги";

        const defaultDescription =
            "RBoard — локальна дошка оголошень Рахова. Купівля та продаж товарів, робота, оренда, послуги, події та оголошення громади.";

        const descriptionMeta = document.querySelector(
            'meta[name="description"]'
        );

        const canonicalLink = document.querySelector(
            'link[rel="canonical"]'
        );

        const ogTitle = document.querySelector(
            'meta[property="og:title"]'
        );

        const ogDescription = document.querySelector(
            'meta[property="og:description"]'
        );

        const ogUrl = document.querySelector(
            'meta[property="og:url"]'
        );

        if (selectedListing) {
            const location =
                selectedListing.city ||
                selectedListing.location ||
                "Рахів";

            const listingTitle =
                `${selectedListing.title} — ${location} | RBoard`;

            const rawDescription =
                selectedListing.description?.trim() ||
                `${selectedListing.category || "Оголошення"} у ${location}. Переглянути детальну інформацію на RBoard.`;

            const listingDescription =
                rawDescription.length > 160
                    ? `${rawDescription.slice(0, 157)}...`
                    : rawDescription;

            const listingUrl =
                `https://rboard.netlify.app/listing/${selectedListing.id}`;

            document.title = listingTitle;

            descriptionMeta?.setAttribute(
                "content",
                listingDescription
            );

            canonicalLink?.setAttribute(
                "href",
                listingUrl
            );

            ogTitle?.setAttribute(
                "content",
                listingTitle
            );

            ogDescription?.setAttribute(
                "content",
                listingDescription
            );

            ogUrl?.setAttribute(
                "content",
                listingUrl
            );

            return;
        }
        const currentCategorySeo =
            categorySlug
                ? categorySeo[categorySlug]
                : null;

        if (currentCategorySeo) {
            const categoryUrl =
                `https://rboard.netlify.app/category/${categorySlug}`;

            document.title =
                currentCategorySeo.title;

            descriptionMeta?.setAttribute(
                "content",
                currentCategorySeo.description
            );

            canonicalLink?.setAttribute(
                "href",
                categoryUrl
            );

            ogTitle?.setAttribute(
                "content",
                currentCategorySeo.title
            );

            ogDescription?.setAttribute(
                "content",
                currentCategorySeo.description
            );

            ogUrl?.setAttribute(
                "content",
                categoryUrl
            );

            return;
        }
        document.title = defaultTitle;

        descriptionMeta?.setAttribute(
            "content",
            defaultDescription
        );

        canonicalLink?.setAttribute(
            "href",
            "https://rboard.netlify.app/"
        );

        ogTitle?.setAttribute(
            "content",
            "RBoard — оголошення Рахів"
        );

        ogDescription?.setAttribute(
            "content",
            "Локальна дошка оголошень Рахова. Купуйте, продавайте, знаходьте роботу, житло та послуги поруч."
        );

        ogUrl?.setAttribute(
            "content",
            "https://rboard.netlify.app/"
        );
    }, [selectedListing, categorySlug]);

    useEffect(() => {
        const scriptId = "listing-structured-data";

        const oldScript =
            document.getElementById(scriptId);

        if (oldScript) {
            oldScript.remove();
        }

        if (!selectedListing) {
            return;
        }

        const listingUrl =
            `https://rboard.netlify.app/listing/${selectedListing.id}`;

        const location =
            selectedListing.city ||
            selectedListing.location ||
            "Рахів";

        const description =
            selectedListing.description ||
            `${selectedListing.category || "Оголошення"} у ${location}`;

        const structuredData = {
            "@context": "https://schema.org",
            "@type": "WebPage",

            "@id": listingUrl,
            url: listingUrl,

            name: selectedListing.title,
            description,

            inLanguage: "uk",

            mainEntity: {
                "@type": "CreativeWork",

                name: selectedListing.title,
                description,

                url: listingUrl,

                ...(selectedListing.images?.length > 0 && {
                    image: selectedListing.images,
                }),

                ...(selectedListing.createdAt instanceof Date && {
                    datePublished:
                        selectedListing.createdAt.toISOString(),
                }),

                contentLocation: {
                    "@type": "Place",

                    name: location,

                    address: {
                        "@type": "PostalAddress",

                        addressLocality:
                            selectedListing.city ||
                            location,

                        ...(selectedListing.region && {
                            addressRegion:
                                selectedListing.region,
                        }),

                        addressCountry: "UA",
                    },
                },
            },
        };

        const script =
            document.createElement("script");

        script.id = scriptId;
        script.type = "application/ld+json";

        script.textContent =
            JSON.stringify(structuredData);

        document.head.appendChild(script);

        return () => {
            const currentScript =
                document.getElementById(scriptId);

            if (currentScript) {
                currentScript.remove();
            }
        };
    }, [selectedListing]);

    const openListing = (listing) => {
        navigate(
            `/listing/${listing.id}`,
            {
                state: {
                    fromHome: true,
                },
            }
        );
    };

    const closeListing = () => {
        navigate("/");
    };


    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
                    <h1 className="sr-only">
                        Оголошення Рахів — локальна дошка оголошень RBoard
                    </h1>
                    <AddListingButton />

                    <SearchFilters
                        search={search}
                        setSearch={setSearch}
                        searchPlaceholder={searchPlaceholder}
                        activeCategory={activeCategory}
                        setActiveCategory={handleCategoryChange}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                    />

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="h-11 w-11 rounded-full border-4 border-blue-100" />

                                <div className="absolute inset-0 h-11 w-11 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
                            </div>

                            <p className="mt-5 text-sm font-semibold text-slate-700">
                                Завантаження оголошень
                                <span className="animate-pulse">
                                    ...
                                </span>
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Зачекайте кілька секунд
                            </p>
                        </div>
                    )}

                    {loadError && (
                        <div className="my-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
                            {loadError}
                        </div>
                    )}

                    {!loading && !loadError && (
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
            </main>
            <ListingDetailsModal
                listing={selectedListing}
                onClose={closeListing}
            />
            <Footer />
            {showScrollTop && (
                <button
                    type="button"
                    onClick={scrollToTop}
                    aria-label="Повернутися наверх"
                    title="Наверх"
                    className="fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition duration-200 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl sm:bottom-7 sm:right-7 sm:h-14 sm:w-14"
                >
                    <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m18 15-6-6-6 6" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default Home;