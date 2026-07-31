import { useEffect } from "react";

const formatDate = (value) => {
  if (!value) {
    return "Не вказано";
  }

  const normalizedDate =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(normalizedDate.getTime())) {
    return "Не вказано";
  }

  return normalizedDate.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InfoItem = ({ label, value }) => {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "Не вказано"}
      </p>
    </div>
  );
};

const ListingDetailsModal = ({
  listing,
  onClose,
}) => {
  useEffect(() => {
    if (!listing) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [listing, onClose]);

  if (!listing) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="presentation"
    >
      <article
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Закрити вікно"
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 pr-16 sm:p-8 sm:pr-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                {listing.category || "Інше"}
              </span>

              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
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
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>

                {formatDate(listing.createdAt)}
              </span>
            </div>

            <h2
              id="listing-modal-title"
              className="mt-5 text-2xl font-black leading-tight text-slate-950 sm:text-4xl"
            >
              {listing.title}
            </h2>

            <div className="mt-5 flex items-start gap-2 text-sm font-semibold text-slate-600">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
              </svg>

              <span>
                {listing.location ||
                  "Місце не вказано"}
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section>
            <h3 className="text-lg font-black text-slate-950">
              Опис оголошення
            </h3>

            <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-700">
              {listing.description ||
                "Детальний опис оголошення не вказано."}
            </p>
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-black text-slate-950">
              Контактна інформація
            </h3>

            <div className="mt-5 space-y-5">
              <InfoItem
                label="Автор"
                value={listing.authorName}
              />

              <InfoItem
                label="Контакт"
                value={listing.contact}
              />

              <InfoItem
                label="Місце"
                value={listing.location}
              />
            </div>

            {listing.contact && (
              <a
                href={
                  listing.contact.includes("@")
                    ? `mailto:${listing.contact}`
                    : `tel:${listing.contact.replace(
                        /[^\d+]/g,
                        ""
                      )}`
                }
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Зв’язатися
              </a>
            )}
          </aside>
        </div>
      </article>
    </div>
  );
};

export default ListingDetailsModal;