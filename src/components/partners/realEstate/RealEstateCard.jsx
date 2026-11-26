
import {
    House,
    MapPin,
    Ruler,
    Trees,
    PlayCircle,
    ArrowRight,
    Clock3,
    Eye,
    Handshake,
    Layers3,
    Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import FavoriteButton from "../../listings/FavoriteButton";
const numberFormatter = new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 2,
});

const formatNumber = (value) =>
    numberFormatter.format(Number(value));

const formatDate = (value) => {
    if (!value) return "Дата не вказана";

    const date =
        value?.toDate?.() ||
        (value instanceof Date
            ? value
            : new Date(value));

    if (Number.isNaN(date.getTime())) {
        return "Дата не вказана";
    }

    return date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const hasPositiveValue = (value) =>
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) > 0;

export default function RealEstateCard({
    listing,
    onClick,
    canSeeFavorites = false,
}) {
    if (!listing) return null;

    const realEstate = listing.realEstate || {};
    const isLand = realEstate.propertyType === "land";
    const isCommercial = realEstate.propertyType === "commercial";
    const isClickable = typeof onClick === "function";

    const city =
        typeof listing.city === "string"
            ? listing.city
            : listing.city?.name || "";

    const currencySymbols = {
        USD: "$",
        EUR: "€",
        UAH: "₴",
    };

    const price =
        realEstate.price !== null &&
            realEstate.price !== undefined &&
            realEstate.price !== "" &&
            Number.isFinite(Number(realEstate.price))
            ? `${formatNumber(realEstate.price)} ${currencySymbols[realEstate.currency] ||
            realEstate.currency ||
            ""
            }`
            : "Ціна не вказана";

    const priceSuffix =
        isLand && realEstate.priceMode === "per_sotka"
            ? "/ сотку"
            : "";

    const hasVideo = Boolean(realEstate.video?.url);
    const views = Math.max(0, Number(listing.views) || 0);



    return (
        <article
            className={`group relative flex h-full min-h-[230px] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-300 sm:p-5 ${isClickable
                ? "cursor-pointer hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100"
                : ""
                }`}
        >

            {/* Декоративний фон */}
            <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-blue-50 transition-colors duration-300 group-hover:bg-amber-100 sm:h-24 sm:w-24" />
            {isClickable && (
                <Link
                    to={`/listing/${listing.id}`}
                    aria-label={`Відкрити оголошення: ${listing.title}`}
                    className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-400"
                    onClick={(event) => {
                        if (
                            event.button !== 0 ||
                            event.ctrlKey ||
                            event.metaKey ||
                            event.shiftKey ||
                            event.altKey
                        ) {
                            return;
                        }

                        event.preventDefault();
                        onClick(listing);
                    }}
                />
            )}
            <div className="relative flex h-full min-w-0 flex-1 flex-col">


                {/* Категорія, партнер, дата, перегляди */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">

                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                        <Handshake size={12} />
                        Партнер
                    </span>

                    <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                        {listing.type || "Продаж"}
                    </span>

                    {/* На мобільному окремий рядок */}
                    <div className="mt-1 flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 sm:mt-0 sm:contents">

                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 sm:text-xs">
                            <Clock3
                                size={13}
                                className="shrink-0"
                            />
                            {formatDate(listing.createdAt)}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 sm:text-xs">
                            <Eye size={14} />
                            {views}
                        </span>

                    </div>
                </div>


                {/* Назва */}
                <h3
                    title={listing.title}
                    className="mt-3 line-clamp-2 break-words text-sm font-black leading-5 text-slate-950 transition group-hover:text-blue-700 sm:mt-4 sm:text-base"
                >
                    {listing.title || "Об'єкт нерухомості"}
                </h3>

                {/* Ціна та додаткові позначки */}
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">

                    <span className="min-w-0 break-words text-lg font-black leading-tight tracking-tight text-blue-700 sm:text-xl">
                        {price}
                        {priceSuffix && (
                            <span className="ml-1 text-[10px] font-semibold text-slate-500 sm:text-xs">
                                {priceSuffix}
                            </span>
                        )}
                    </span>

                    {realEstate.negotiable === true && (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                            <span className="sm:hidden">Торг</span>
                            <span className="hidden sm:inline">Можливий торг</span>
                        </span>
                    )}

                    {hasVideo && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                            <PlayCircle size={12} />
                            Відеоогляд
                        </span>
                    )}
                </div>


                {/* Характеристики нерухомості */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-1.5">

                    {/* Тип об'єкта */}
                    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 sm:text-sm">
                        {isLand ? (
                            <Trees
                                size={17}
                                className="shrink-0 text-emerald-600"
                            />
                        ) : isCommercial ? (
                            <Building2
                                size={17}
                                className="shrink-0 text-violet-600"
                            />
                        ) : (
                            <House
                                size={17}
                                className="shrink-0 text-blue-600"
                            />
                        )}

                        {isLand
                            ? "Ділянка"
                            : isCommercial
                                ? "Комерція"
                                : "Будинок"}
                    </span>

                    {/* Площа будинку */}
                    {!isLand &&
                        hasPositiveValue(realEstate.buildingArea) && (
                            <span className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2.5 text-xs font-medium text-slate-700 sm:inline-flex sm:justify-start sm:gap-1 sm:px-2 sm:py-1 sm:text-[11px] sm:font-semibold sm:text-slate-600">
                                <Ruler
                                    className="h-4 w-4 shrink-0 text-blue-600 sm:h-3 sm:w-3"
                                />

                                {formatNumber(realEstate.buildingArea)} м²
                            </span>
                        )}

                    {/* Площа ділянки */}
                    {hasPositiveValue(realEstate.landArea) && (
                        <span className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2.5 text-xs font-medium text-slate-700 sm:inline-flex sm:justify-start sm:gap-1 sm:px-2 sm:py-1 sm:text-[11px] sm:font-semibold sm:text-slate-600">
                            <Trees
                                className="h-4 w-4 shrink-0 text-emerald-600 sm:h-3 sm:w-3"
                            />

                            {formatNumber(realEstate.landArea)} сот.
                        </span>
                    )}

                    {/* Поверховість */}
                    {!isLand &&
                        hasPositiveValue(realEstate.floors) && (
                            <span className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2.5 text-xs font-medium text-slate-700 sm:inline-flex sm:justify-start sm:gap-1 sm:px-2 sm:py-1 sm:text-[11px] sm:font-semibold sm:text-slate-600">
                                <Layers3
                                    className="h-4 w-4 shrink-0 text-blue-600 sm:h-3 sm:w-3"
                                />

                                {formatNumber(realEstate.floors)} пов.
                            </span>
                        )}
                </div>


                {/* Нижня частина */}
                <div className="mt-auto pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-slate-100 pt-3">

                        {/* Місцезнаходження */}
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">

                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-blue-600">
                                <MapPin size={14} />
                            </span>

                            <span
                                className="min-w-0 truncate text-xs font-medium text-slate-600"
                                title={
                                    [city, listing.street]
                                        .filter(Boolean)
                                        .join(", ")
                                }
                            >
                                {[city, listing.street]
                                    .filter(Boolean)
                                    .join(", ") ||
                                    "Місце не вказано"}
                            </span>
                        </div>

                        {/* Детальніше */}
                        {isClickable && (
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 transition group-hover:gap-2 group-hover:text-blue-700">
                                Детальніше
                                <ArrowRight size={14} />
                            </span>
                        )}
                    </div>
                </div>
                {/* Обране — тільки для звичайних користувачів */}
                {canSeeFavorites && (
                    <div
                        className="relative z-20 -top-6"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                    >
                        <FavoriteButton listing={listing} />
                    </div>
                )}
            </div>
        </article>
    );
}
