import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    collection,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchFilters from "../components/SearchFilters";
import ListingsSection from "../components/listings/ListingsSection";
import AddListingButton from "../components/listings/AddListingButton";

import { db } from "../firebase";

const Home = () => {
    const [search, setSearch] = useState("");

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

    useEffect(() => {
        const approvedListingsQuery = query(
            collection(db, "listings"),
            where("status", "==", "approved")
        );

        const unsubscribe = onSnapshot(
            approvedListingsQuery,
            (snapshot) => {
                const receivedListings =
                    snapshot.docs.map((document) => {
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

                            authorName:
                                data.authorName || "",

                            createdAt:
                                data.createdAt
                                    ?.toDate?.() ||
                                null,
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

    const filteredListings = useMemo(() => {
        const normalizedSearch = search
            .trim()
            .toLowerCase();

        const result = listings.filter(
            (listing) => {
                const matchesCategory =
                    activeCategory === "Усі" ||
                    listing.category ===
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
    ]);

    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
                    <AddListingButton />

                    <SearchFilters
                        search={search}
                        setSearch={setSearch}
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
                            Завантаження
                            оголошень...
                        </div>
                    )}

                    {loadError && (
                        <div className="my-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
                            {loadError}
                        </div>
                    )}

                    {!loading &&
                        !loadError && (
                            <ListingsSection
                                listings={
                                    filteredListings
                                }
                                viewMode={
                                    viewMode
                                }
                            />
                        )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Home;