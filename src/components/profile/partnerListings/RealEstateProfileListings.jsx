
import { useEffect, useMemo, useRef, useState } from "react";
import {
    collection,
    getDocs,
    orderBy,
    query,
    Timestamp,
    where,
} from "firebase/firestore";
import {
    House,
    LoaderCircle,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";

import { db } from "../../../firebase";
import RealEstateCard from "../../partners/realEstate/RealEstateCard";
import RealEstateDetailsModal from "../../partners/realEstate/RealEstateDetailsModal";
import { useContest } from "../../../context/ContestContext";
const PAGE_SIZE = 8;

const buildQuery = (profileUid) => {
    return query(
        collection(db, "listings"),
        where("partnerUid", "==", profileUid),
        where("partnerType", "==", "real_estate"),
        where("status", "==", "approved"),
        where("expiresAt", ">", Timestamp.now()),
        orderBy("expiresAt", "asc")
    );
};

const getCityName = (listing) => {
    return typeof listing.city === "string"
        ? listing.city
        : listing.city?.name || "";
};

const normalizeText = (value) => {
    return String(value || "")
        .toLocaleLowerCase("uk-UA")
        .trim()
        .replace(/\s+/g, " ");
};

// Для ділянок із ціною за сотку
// порівнюємо орієнтовну загальну вартість
const getSortingPrice = (listing) => {
    const realEstate = listing.realEstate || {};
    const price = Number(realEstate.price);

    if (!Number.isFinite(price) || price < 0) {
        return null;
    }

    if (
        realEstate.propertyType === "land" &&
        realEstate.priceMode === "per_sotka"
    ) {
        const landArea = Number(realEstate.landArea);

        return Number.isFinite(landArea) && landArea > 0
            ? price * landArea
            : null;
    }

    return price;
};

export default function RealEstateProfileListings({
    profileUid,
}) {
    const {
        canCollectBoots,
        hasFound,
        claimItem,
        claimingBootId,
    } = useContest();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedListing, setSelectedListing] = useState(null);

    // Пошук і фільтри
    const [search, setSearch] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [sortOrder, setSortOrder] = useState("default");
    const [selectedVideo, setSelectedVideo] = useState("");
    // Кількість видимих результатів
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const requestVersionRef = useRef(0);

    // Завантаження оголошень партнера
    useEffect(() => {
        const requestVersion = requestVersionRef;
        const version = ++requestVersion.current;

        setListings([]);
        setError("");
        setLoading(true);
        setSelectedListing(null);

        setSearch("");
        setSelectedCity("");
        setSelectedType("");
        setSelectedVideo("");
        setSortOrder("default");
        setVisibleCount(PAGE_SIZE);

        if (!profileUid) {
            setLoading(false);
            return;
        }

        const loadInitial = async () => {
            try {
                const snapshot = await getDocs(
                    buildQuery(profileUid)
                );

                if (version !== requestVersionRef.current) {
                    return;
                }

                const items = snapshot.docs.map(
                    (document) => ({
                        id: document.id,
                        ...document.data(),
                    })
                );

                setListings(items);
            } catch (err) {
                if (version !== requestVersionRef.current) {
                    return;
                }

                console.error(
                    "Помилка завантаження нерухомості:",
                    err
                );

                setError(
                    "Не вдалося завантажити об'єкти нерухомості."
                );
            } finally {
                if (version === requestVersionRef.current) {
                    setLoading(false);
                }
            }
        };

        loadInitial();

        return () => {
            requestVersion.current++;
        };
    }, [profileUid]);

    // Список доступних міст
    const cities = useMemo(() => {
        const uniqueCities = new Map();

        listings.forEach((listing) => {
            const city = getCityName(listing).trim();

            if (!city) return;

            const key = normalizeText(city);

            if (!uniqueCities.has(key)) {
                uniqueCities.set(key, city);
            }
        });

        return [...uniqueCities.values()].sort((a, b) =>
            a.localeCompare(b, "uk")
        );
    }, [listings]);

    // Пошук, фільтрація та сортування
    const filteredListings = useMemo(() => {
        const searchWords = normalizeText(search)
            .split(" ")
            .filter(Boolean);

        const result = listings.filter((listing) => {
            // Пошук за назвою та містом
            if (searchWords.length > 0) {
                const searchableText = normalizeText(
                    [
                        listing.title || "",
                        getCityName(listing),
                    ].join(" ")
                );

                const matchesSearch = searchWords.every(
                    (word) => searchableText.includes(word)
                );

                if (!matchesSearch) {
                    return false;
                }
            }

            // Фільтр за містом
            if (
                selectedCity &&
                normalizeText(getCityName(listing)) !==
                normalizeText(selectedCity)
            ) {
                return false;
            }

            // Фільтр за типом
            if (
                selectedType &&
                listing.realEstate?.propertyType !== selectedType
            ) {
                return false;
            }
            // Фільтр за відеооглядом
            if (selectedVideo === "with_video") {
                if (!listing.realEstate?.video?.url?.trim()) {
                    return false;
                }
            }
            return true;
        });

        // За замовчуванням зберігаємо порядок Firestore
        if (sortOrder === "default") {
            return result;
        }

        result.sort((a, b) => {
            const priceA = getSortingPrice(a);
            const priceB = getSortingPrice(b);

            // Об'єкти без коректної ціни в кінці
            if (priceA === null && priceB === null) {
                return 0;
            }

            if (priceA === null) return 1;
            if (priceB === null) return -1;

            return sortOrder === "price_asc"
                ? priceA - priceB
                : priceB - priceA;
        });

        return result;
    }, [
        listings,
        search,
        selectedCity,
        selectedType,
        sortOrder,
        selectedVideo,
    ]);

    const visibleListings = useMemo(() => {
        return filteredListings.slice(0, visibleCount);
    }, [filteredListings, visibleCount]);

    const hasMore = visibleCount < filteredListings.length;

    const hasActiveFilters = Boolean(
        search.trim() ||
        selectedCity ||
        selectedType ||
        selectedVideo ||
        sortOrder !== "default"
    );

    const handleSearchChange = (value) => {
        setSearch(value);
        setVisibleCount(PAGE_SIZE);
    };

    const handleCityChange = (value) => {
        setSelectedCity(value);
        setVisibleCount(PAGE_SIZE);
    };

    const handleTypeChange = (value) => {
        setSelectedType(value);
        setVisibleCount(PAGE_SIZE);
    };
    const handleVideoChange = (value) => {
        setSelectedVideo(value);
        setVisibleCount(PAGE_SIZE);
    };
    const handleSortChange = (value) => {
        setSortOrder(value);
        setVisibleCount(PAGE_SIZE);
    };

    const resetFilters = () => {
        setSearch("");
        setSelectedCity("");
        setSelectedType("");
        setSelectedVideo("");
        setSortOrder("default");
        setVisibleCount(PAGE_SIZE);
    };

    const loadMore = () => {
        setVisibleCount((current) => current + PAGE_SIZE);
    };

    const selectClass =
        "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">

            {/* Заголовок */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <House
                        size={21}
                        className="shrink-0 text-blue-600"
                    />

                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                        Об'єкти нерухомості
                    </h2>
                    {canCollectBoots && !hasFound("v8m3q6r2n5") && (
                        <button
                            type="button"
                            disabled={Boolean(claimingBootId)}
                            onClick={() => claimItem("v8m3q6r2n5")}
                            aria-label="Забрати чобіток"
                            className="h-8 w-8 shrink-0 cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-90 disabled:opacity-50 sm:h-10 sm:w-10"
                        >
                            <img
                                src="/images/contest-boot.png"
                                alt=""
                                draggable={false}
                                className="h-full w-full object-contain drop-shadow-md"
                            />
                        </button>
                    )}
                </div>

                {!loading && !error && (
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                        Знайдено: {filteredListings.length}
                    </span>
                )}
            </div>

            {/* Пошук і фільтри */}
            {!loading && !error && listings.length > 0 && (
                <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4">

                    {/* Пошук */}
                    <div className="relative">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                handleSearchChange(event.target.value)
                            }
                            placeholder="Пошук за назвою або містом..."
                            aria-label="Пошук нерухомості"
                            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => handleSearchChange("")}
                                aria-label="Очистити пошук"
                                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Фільтри */}
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                        {/* Місто */}
                        <div className="min-w-0">
                            <label
                                htmlFor="realEstateCityFilter"
                                className="mb-1.5 block text-[11px] font-semibold text-slate-500"
                            >
                                Місто
                            </label>

                            <select
                                id="realEstateCityFilter"
                                value={selectedCity}
                                onChange={(event) =>
                                    handleCityChange(event.target.value)
                                }
                                className={selectClass}
                            >
                                <option value="">
                                    Усі міста
                                </option>

                                {cities.map((city) => (
                                    <option
                                        key={city}
                                        value={city}
                                    >
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Тип нерухомості */}
                        <div className="min-w-0">
                            <label
                                htmlFor="realEstateTypeFilter"
                                className="mb-1.5 block text-[11px] font-semibold text-slate-500"
                            >
                                Тип нерухомості
                            </label>

                            <select
                                id="realEstateTypeFilter"
                                value={selectedType}
                                onChange={(event) =>
                                    handleTypeChange(event.target.value)
                                }
                                className={selectClass}
                            >
                                <option value="">Усі типи</option>
                                <option value="house">Будинок</option>
                                <option value="land">Земельна ділянка</option>
                                <option value="commercial">Комерція</option>
                            </select>
                        </div>

                        {/* Сортування */}
                        <div className="min-w-0">
                            <label
                                htmlFor="realEstateSortFilter"
                                className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"
                            >
                                <SlidersHorizontal size={13} />
                                Сортування
                            </label>

                            <select
                                id="realEstateSortFilter"
                                value={sortOrder}
                                onChange={(event) =>
                                    handleSortChange(event.target.value)
                                }
                                className={selectClass}
                            >
                                <option value="default">
                                    За замовчуванням
                                </option>

                                <option value="price_asc">
                                    Спочатку дешевші
                                </option>

                                <option value="price_desc">
                                    Спочатку дорожчі
                                </option>
                            </select>
                        </div>
                        {/* Відеоогляд */}
                        <div className="min-w-0">
                            <label
                                htmlFor="realEstateVideoFilter"
                                className="mb-1.5 block text-[11px] font-semibold text-slate-500"
                            >
                                Відеоогляд
                            </label>

                            <select
                                id="realEstateVideoFilter"
                                value={selectedVideo}
                                onChange={(event) =>
                                    handleVideoChange(event.target.value)
                                }
                                className={selectClass}
                            >
                                <option value="">Усі оголошення</option>
                                <option value="with_video">З відеооглядом</option>
                            </select>
                        </div>
                    </div>

                    {/* Скидання фільтрів */}
                    {hasActiveFilters && (
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3">
                            <span className="text-[11px] text-slate-500">
                                Відображено: {visibleListings.length} із {filteredListings.length}
                            </span>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                            >
                                <X size={14} />
                                Скинути фільтри
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Завантаження */}
            {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                    <LoaderCircle
                        size={20}
                        className="animate-spin text-blue-600"
                    />

                    Завантаження нерухомості...
                </div>
            ) : error ? (
                <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </p>
            ) : (
                <>
                    {visibleListings.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                            {visibleListings.map((listing) => (
                                <RealEstateCard
                                    key={listing.id}
                                    listing={listing}
                                    onClick={setSelectedListing}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                            <House
                                size={34}
                                className="text-blue-400"
                            />

                            <p className="mt-3 text-sm font-bold text-slate-800">
                                {hasActiveFilters
                                    ? "За вашим запитом нічого не знайдено"
                                    : "Поки немає об'єктів нерухомості"}
                            </p>

                            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                                {hasActiveFilters
                                    ? "Спробуйте змінити пошуковий запит або фільтри."
                                    : "Після публікації нові об'єкти партнера з'являться тут."}
                            </p>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Скинути фільтри
                                </button>
                            )}
                        </div>
                    )}

                    {/* Пагінація */}
                    {hasMore && (
                        <div className="mt-7 flex flex-col items-center gap-2">
                            <button
                                type="button"
                                onClick={loadMore}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                            >
                                Завантажити ще
                            </button>

                            <p className="text-[11px] text-slate-400">
                                Показано {visibleListings.length} із {filteredListings.length}
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Модалка нерухомості */}
            <RealEstateDetailsModal
                listing={selectedListing}
                onClose={() => setSelectedListing(null)}
                onSelectRelated={setSelectedListing}
            />
        </section>
    );
}
