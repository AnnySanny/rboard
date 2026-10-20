
import { useEffect, useState, useMemo } from "react";
import {
    ArrowUpRight,
    Layers3,
    MapPin,
    ImageOff,
    Loader2,
} from "lucide-react";

import {
    getRelatedListings,
} from "../../utils/relatedListings";



// Перше доступне зображення
const getListingImage = (listing) => {
    if (!Array.isArray(listing?.images)) {
        return null;
    }

    for (const image of listing.images) {
        if (typeof image === "string" && image) {
            return image;
        }

        if (image && typeof image === "object") {
            const url =
                image.imageUrl ||
                image.url ||
                image.secure_url;

            if (url) return url;
        }
    }

    return null;
};

const RelatedListings = ({
    listing,
    onSelect,
}) => {
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const currentListing = useMemo(
        () => ({
            id: listing?.id,
            category: listing?.category,
            city: listing?.city,
            district: listing?.district,
        }),
        [
            listing?.id,
            listing?.category,
            listing?.city,
            listing?.district,
        ]
    );

    useEffect(() => {
        if (!currentListing.id) {
            setRelated([]);
            setLoading(false);
            setError(false);
            return;
        }

        let active = true;

        const loadRelated = async () => {
            setLoading(true);
            setError(false);
            setRelated([]);

            try {
                const results = await getRelatedListings(
                    currentListing
                );

                if (active) {
                    setRelated(results);
                }
            } catch (err) {
                console.error(
                    "Помилка завантаження схожих оголошень:",
                    err
                );

                if (active) {
                    setError(true);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadRelated();

        return () => {
            active = false;
        };
    }, [currentListing]);


    if (!listing) return null;

    return (
        <section className="border-t border-slate-200 bg-slate-50/60 px-6 py-7 sm:px-8 sm:py-8">
            {/* Заголовок */}
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Layers3
                            size={19}
                            className="text-blue-600"
                        />

                        <h3 className="text-lg font-black text-slate-950 sm:text-xl">
                            Схожі оголошення
                        </h3>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                        Можливо, вас також зацікавить
                    </p>
                </div>
            </div>

            {/* Завантаження */}
            {loading && (
                <div className="flex min-h-[150px] flex-col items-center justify-center gap-3">
                    <Loader2
                        size={23}
                        className="animate-spin text-blue-600"
                    />

                    <p className="text-xs font-medium text-slate-500">
                        Шукаємо схожі оголошення...
                    </p>
                </div>
            )}

            {/* Помилка */}
            {!loading && error && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center">
                    <p className="text-sm text-slate-500">
                        Не вдалося завантажити рекомендації.
                    </p>
                </div>
            )}

            {/* Немає рекомендацій */}
            {!loading && !error && related.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-7 text-center">
                    <p className="text-sm font-medium text-slate-500">
                        Поки що немає інших актуальних оголошень.
                    </p>
                </div>
            )}

            {/* Картки */}
            {!loading && !error && related.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((item) => {
                        const imageUrl =
                            getListingImage(item);

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelect?.(item)}
                                className="
                                    group flex min-w-0 flex-col
                                    overflow-hidden rounded-2xl
                                    border border-slate-200 bg-white
                                    text-left shadow-sm
                                    transition-all duration-200
                                    hover:-translate-y-1
                                    hover:border-blue-300
                                    hover:shadow-lg
                                    hover:shadow-blue-500/10
                                    focus-visible:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-blue-500
                                "
                            >
                                {/* Фото */}
                                <div className="relative h-32 w-full overflow-hidden bg-slate-100 sm:h-36">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={item.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="
                                                h-full w-full
                                                object-cover
                                                transition-transform
                                                duration-300
                                                group-hover:scale-105
                                            "
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <ImageOff
                                                size={27}
                                                className="text-slate-300"
                                            />
                                        </div>
                                    )}

                                    <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-blue-700 shadow-sm">
                                        {item.category}
                                    </span>
                                </div>

                                {/* Інформація */}
                                <div className="flex min-h-[105px] w-full flex-1 flex-col p-3">
                                    <h4 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 transition-colors group-hover:text-blue-600">
                                        {item.title}
                                    </h4>

                                    <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                                        <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                                            <MapPin
                                                size={13}
                                                className="shrink-0 text-blue-500"
                                            />

                                            <span className="truncate">
                                                {item.city ||
                                                    item.location ||
                                                    "Місце не вказано"}
                                            </span>
                                        </div>

                                        <ArrowUpRight
                                            size={17}
                                            className="shrink-0 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-600"
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default RelatedListings;
