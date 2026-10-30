
import FavoriteButton from "./FavoriteButton";

const formatDate = (date) => {
  if (!date) {
    return "Дата не вказана";
  }

  const normalizedDate =
    date?.toDate?.() ||
    (date instanceof Date ? date : new Date(date));

  if (Number.isNaN(normalizedDate.getTime())) {
    return "Дата не вказана";
  }

  return normalizedDate.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const ListingCard = ({
  listing,
  viewMode = "grid",
  onClick,
  compact = false,
}) => {
  const isList = !compact && viewMode === "list";

  const handleKeyDown = (event) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <article
      className={`group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm outline-none transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-blue-100 ${compact
        ? "min-h-[185px] p-3 sm:min-h-[195px] sm:p-4"
        : isList
          ? "min-h-[180px] p-5 sm:flex sm:items-center sm:justify-between sm:p-6"
          : "min-h-[230px] p-5"
        }`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Відкрити оголошення: ${listing.title}`}
    >
      {/* Декоративний фон */}
      <div
        className={`pointer-events-none absolute right-0 top-0 rounded-bl-full bg-blue-50 transition duration-300 group-hover:bg-blue-100 ${compact
          ? "h-16 w-16 sm:h-20 sm:w-20"
          : "h-24 w-24"
          }`}
      />

      <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col">

        {/* Категорія, дата, перегляди */}

        {/* Категорія, дата та перегляди */}
        <div
          className={`flex ${compact
            ? "flex-col items-start gap-1.5"
            : "flex-row flex-wrap items-center gap-2"
            }`}
        >
          {/* Категорія */}

          <span
            className={`inline-flex max-w-full items-center rounded-full border border-blue-100 bg-blue-50 font-semibold text-blue-700 ${compact
              ? "px-1.5 py-0.5 text-[9px] sm:text-[10px]"
              : "px-2.5 py-1 text-[11px]"
              }`}
          >

            <span className="truncate">
              {listing.category || "Інше"}
            </span>
          </span>

          {/* Дата та перегляди */}
          <div
            className={`flex flex-wrap items-center ${compact
              ? "gap-x-2 gap-y-1"
              : "contents"
              }`}
          >
            {/* Дата */}
            <span
              className={`inline-flex items-center gap-1 font-medium text-slate-500 ${compact
                ? "text-[10px] sm:text-xs"
                : "gap-1.5 text-xs"
                }`}
            >
              <svg
                className={
                  compact
                    ? "h-3 w-3 shrink-0"
                    : "h-3.5 w-3.5 shrink-0"
                }
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>

              <span>{formatDate(listing.createdAt)}</span>
            </span>

            {/* Перегляди */}
            <span
              className={`inline-flex items-center gap-1 font-semibold text-blue-600 ${compact
                ? "text-[10px] sm:text-xs"
                : "gap-1.5 text-xs"
                }`}
            >
              <svg
                className={
                  compact
                    ? "h-3.5 w-3.5"
                    : "h-4 w-4"
                }
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

              {listing.views ?? 0}
            </span>
          </div>
        </div>


        {/* Назва оголошення */}
        <h2
          className={`max-w-full truncate font-black leading-snug text-slate-950 transition group-hover:text-blue-700 ${compact
            ? "mt-3 text-sm sm:text-base"
            : "mt-4 text-xl"
            }`}
          title={listing.title}
        >
          {listing.title}
        </h2>

        {/* Опис */}
        <p
          className={`max-w-2xl overflow-hidden text-slate-600 line-clamp-2 ${compact
            ? "mt-1 text-xs leading-5"
            : "mt-2 text-sm leading-6"
            }`}
        >
          {listing.description ||
            "Опис оголошення не вказано."}
        </p>

        {/* Нижня частина */}
        <div
          className={`mt-auto flex flex-col border-t border-slate-100 ${compact
            ? "gap-2 pt-3"
            : "gap-3 pt-5"
            } ${isList
              ? "sm:flex-row sm:items-center sm:justify-between"
              : ""
            }`}
        >
          {/* Місто */}
          <div
            className={`flex min-w-0 items-center font-medium text-slate-600 ${compact
              ? "gap-1.5 text-xs"
              : "gap-2 text-sm"
              }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-full bg-slate-100 ${compact
                ? "h-6 w-6"
                : "h-8 w-8"
                }`}
            >
              <svg
                className={`text-blue-600 ${compact
                  ? "h-3.5 w-3.5"
                  : "h-4 w-4"
                  }`}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
              </svg>
            </span>

            <span className="truncate">
              {listing.location ||
                "Місце не вказано"}
            </span>
          </div>

          {/* Детальніше */}
          <span
            className={`inline-flex items-center self-start font-bold text-blue-600 transition group-hover:text-blue-700 ${compact
              ? "gap-1 text-xs group-hover:gap-2"
              : "gap-2 text-sm group-hover:gap-3"
              }`}
          >
            Детальніше

            <svg
              className={
                compact
                  ? "h-3.5 w-3.5"
                  : "h-4 w-4"
              }
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </span>
        </div>

        {/* Обране */}
        <div
          className={
            isList
              ? "absolute right-[-20px] top-[55px] z-20 origin-center scale-150"
              : ""
          }
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <FavoriteButton listing={listing} />
        </div>
      </div>
    </article>
  );
};

export default ListingCard;
