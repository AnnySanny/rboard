
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
  viewMode,
  onClick,
}) => {
  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className={`group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm outline-none transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-blue-100 ${viewMode === "list"
          ? "min-h-[180px] sm:flex sm:items-center sm:justify-between sm:p-6"
          : "min-h-[230px]"
        }`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Відкрити оголошення: ${listing.title}`}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blue-50 transition duration-300 group-hover:bg-blue-100" />

      <div className="relative z-10 flex h-full flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {listing.category || "Інше"}
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
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
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>

            {formatDate(listing.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
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
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>

            {listing.views ?? 0}
          </span>
        </div>

        <h2 className="mt-4 text-xl font-black leading-snug text-slate-950 transition group-hover:text-blue-700">
          {listing.title}
        </h2>

        <p
          className={`mt-2 max-w-2xl text-sm leading-6 text-slate-600 ${viewMode === "grid"
              ? "line-clamp-3"
              : "line-clamp-2"
            }`}
        >
          {listing.description ||
            "Опис оголошення не вказано."}
        </p>

        <div
          className={`mt-auto flex flex-col gap-3 border-t border-slate-100 pt-5 ${viewMode === "list"
              ? "sm:flex-row sm:items-center sm:justify-between"
              : ""
            }`}
        >
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-4 w-4 text-blue-600"
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

          <span className="inline-flex items-center gap-2 self-start text-sm font-bold text-blue-600 transition group-hover:gap-3 group-hover:text-blue-700">
            Детальніше

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
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </span>
        </div>
              <FavoriteButton
    listing={listing}
/>
      </div>
    </article>
  );
};

export default ListingCard;