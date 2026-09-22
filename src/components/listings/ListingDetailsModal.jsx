import { useEffect, useState } from "react";

import { registerListingView } from "../../utils/listingViews";
import Swal from "sweetalert2";
import ListingImageGallery from "./ListingImageGallery";
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
const getRemainingTime = (
  expiresAt,
  currentTime
) => {
  if (!expiresAt) {
    return null;
  }

  const expirationDate =
    expiresAt instanceof Date
      ? expiresAt
      : new Date(expiresAt);

  if (
    Number.isNaN(
      expirationDate.getTime()
    )
  ) {
    return null;
  }

  const difference =
    expirationDate.getTime() -
    currentTime;

  if (difference <= 0) {
    return null;
  }

  const totalMinutes =
    Math.floor(
      difference / (1000 * 60)
    );

  const days =
    Math.floor(
      totalMinutes / (60 * 24)
    );

  const hours =
    Math.floor(
      (totalMinutes % (60 * 24)) /
      60
    );

  const minutes =
    totalMinutes % 60;

  return {
    days,
    hours,
    minutes,
  };
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
  const [currentTime, setCurrentTime] =
    useState(Date.now());

  useEffect(() => {
    const interval = setInterval(
      () => {
        setCurrentTime(Date.now());
      },
      60 * 1000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const remainingTime =
    getRemainingTime(
      listing?.expiresAt,
      currentTime
    );
  const handleCopyContact = async () => {
    if (!listing?.contact) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        listing.contact
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Контакт скопійовано в буфер обміну",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error(
        "Помилка копіювання контакту:",
        error
      );
    }
  };
  useEffect(() => {
    if (!listing?.id) {
      return;
    }

    const registerView = async () => {
      try {
        await registerListingView(
          listing.id
        );
      } catch (error) {
        console.error(
          "Помилка реєстрації перегляду:",
          error
        );
      }
    };

    registerView();
  }, [listing?.id]);

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

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
              <div className="flex items-start gap-2">
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

              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 shrink-0 text-blue-600"
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

                <span>
                  Кількість переглядів:{" "}
                  <span className="font-bold text-blue-600">
                    {listing.views ?? 0}
                  </span>
                </span>
              </div>
              {remainingTime && (
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 shrink-0 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path d="M12 7v5l3 2" />
                  </svg>

                  <span>
                    Оголошення активно ще:{" "}

                    <span className="font-bold text-blue-600">
                      {remainingTime.days}
                    </span>
                    д,{" "}

                    <span className="font-bold text-blue-600">
                      {remainingTime.hours}
                    </span>
                    г,{" "}

                    <span className="font-bold text-blue-600">
                      {remainingTime.minutes}
                    </span>
                    хв.
                  </span>
                </div>
              )}
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

            <ListingImageGallery
              images={listing.images}
            />
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

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Контакт
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <p className="min-w-0 flex-1 break-all text-sm font-semibold text-slate-800">
                    {listing.contact || "Не вказано"}
                  </p>

                  {listing.contact && (
                    <button
                      type="button"
                      onClick={handleCopyContact}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      aria-label="Скопіювати контакт"
                      title="Скопіювати контакт"
                    >
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
                        <rect
                          width="14"
                          height="14"
                          x="8"
                          y="8"
                          rx="2"
                          ry="2"
                        />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <InfoItem
                label="Місце"
                value={listing.location}
              />
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
};

export default ListingDetailsModal;