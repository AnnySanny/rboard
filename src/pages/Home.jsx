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
    onSnapshot,
    query,
    where,
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
const LISTINGS_PER_PAGE = 24;
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
     const { listingId } = useParams();
    const [currentUser, setCurrentUser] =
        useState(null);
    const [search, setSearch] = useState("");
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

    const [sortOrder, setSortOrder] =
        useState("newest");

    const [viewMode, setViewMode] =
        useState("grid");

    const [listings, setListings] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [loadError, setLoadError] =
        useState("");
    const [visibleCount, setVisibleCount] =
        useState(LISTINGS_PER_PAGE);

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
    useEffect(() => {
        const approvedListingsQuery = query(
            collection(db, "listings"),
            where("status", "==", "approved")
        );

        const unsubscribe = onSnapshot(
            approvedListingsQuery,
            (snapshot) => {
                const receivedListings =
                    snapshot.docs
                        .filter((document) => {
                            const data =
                                document.data();

                            return isListingActive(
                                data.expiresAt
                            );
                        })
                        .map((document) => {
                            const data =
                                document.data();

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
                                additionalContacts:
                                    data.additionalContacts &&
                                        typeof data.additionalContacts === "object"
                                        ? data.additionalContacts
                                        : {},
                                authorName:
                                    data.authorName || "",
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
                        });

                setListings(receivedListings);
                setLoading(false);
                setLoadError("");
            },
            (error) => {
                console.error(
                    "Помилка завантаження оголошень:",
                    error
                );

                setLoadError(
                    "Не вдалося завантажити оголошення."
                );

                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);
    const currentUserId =
        currentUser?.uid || null;
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
    const filteredListings = useMemo(() => {
        const normalizedSearch = search
            .trim()
            .toLowerCase();

        const result = listings.filter(
            (listing) => {
                const matchesCategory =
                    activeCategory === "Усі"
                        ? true
                        : activeCategory === "Обрані"
                            ? Boolean(
                                currentUserId &&
                                listing.favoriteUserIds.includes(
                                    currentUserId
                                )
                            )
                            : listing.category ===
                            activeCategory;

                const searchableText = [
                    listing.title,
                    listing.description,
                    listing.category,
                    listing.city,
                    listing.region,
                    listing.district,
                    listing.street,
                    listing.location,
                    listing.authorName,
                    listing.contact,
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
                    matchesCategory &&
                    matchesSearch
                );
            }
        );

        result.sort(
            (firstListing, secondListing) => {
                const firstDate =
                    firstListing.createdAt
                        ?.getTime?.() || 0;

                const secondDate =
                    secondListing.createdAt
                        ?.getTime?.() || 0;

                const firstTitle =
                    firstListing.title
                        ?.trim()
                        .toLowerCase() || "";

                const secondTitle =
                    secondListing.title
                        ?.trim()
                        .toLowerCase() || "";

                switch (sortOrder) {
                    case "oldest":
                        return (
                            firstDate -
                            secondDate
                        );

                    case "alphabetical-asc":
                        return firstTitle.localeCompare(
                            secondTitle,
                            "uk"
                        );

                    case "alphabetical-desc":
                        return secondTitle.localeCompare(
                            firstTitle,
                            "uk"
                        );

                    case "views-desc":
                        return (
                            Number(secondListing.views ?? 0) -
                            Number(firstListing.views ?? 0)
                        );

                    case "views-asc":
                        return (
                            Number(firstListing.views ?? 0) -
                            Number(secondListing.views ?? 0)
                        );

                    case "newest":
                    default:
                        return (
                            secondDate -
                            firstDate
                        );
                }
            }
        );

        return result;
    }, [
        listings,
        search,
        activeCategory,
        sortOrder,
        currentUserId,
    ]);
    useEffect(() => {
        setVisibleCount(LISTINGS_PER_PAGE);
    }, [
        search,
        activeCategory,
        sortOrder,
    ]);
    const visibleListings = useMemo(() => {
        return filteredListings.slice(
            0,
            visibleCount
        );
    }, [
        filteredListings,
        visibleCount,
    ]);

    const hasMoreListings =
        visibleCount < filteredListings.length;
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
                        setActiveCategory={setActiveCategory}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                    />

                    {loading && (
                        <div className="py-16 text-center text-slate-500">
                            Завантаження
                            оголошень...
                        </div>
                    )}

                    {loadError && (
                        <div className="my-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
                            {loadError}
                        </div>
                    )}
                    {filteredListings.length > 0 && (
                        <div className="mt-8 text-center text-sm text-slate-500">
                            Показано{" "}
                            <span className="font-semibold text-slate-700">
                                {visibleListings.length}
                            </span>{" "}
                            з{" "}
                            <span className="font-semibold text-slate-700">
                                {filteredListings.length}
                            </span>{" "}
                            оголошень
                        </div>
                    )}
                    {!loading && !loadError && (
                        <>
                            <ListingsSection
                                listings={visibleListings}
                                viewMode={viewMode}
                                onListingClick={openListing}
                            />

                            {hasMoreListings && (
                                <div className="mt-10 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setVisibleCount(
                                                (currentCount) =>
                                                    currentCount +
                                                    LISTINGS_PER_PAGE
                                            )
                                        }
                                        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                    >
                                        Завантажити ще
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