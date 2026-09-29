import { useEffect, useState } from "react";
import {
  Phone,
  Instagram,
  Facebook,
  Copy,
} from "lucide-react";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../firebase";
import {
  FaTelegramPlane,
  FaViber,
  FaWhatsapp,
} from "react-icons/fa";
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
const normalizePhoneForCompare = (value) => {
  return String(value || "").replace(/\D/g, "");
};

const getContactRows = (
  listing,
  hideMainPhone = false
) => {
  if (!listing) {
    return {
      phoneRows: [],
      links: [],
    };
  }

  const contacts = [];
  const links = [];

  const mainContact =
    listing.contactOriginal ||
    listing.contact;

  if (
    mainContact &&
    !hideMainPhone
  ) {
    contacts.push({
      key: "main",
      type: "phone",
      service: "main",
      value: mainContact,
    });
  }

  const additional =
    listing.additionalContacts || {};

  const telegramData =
    additional.telegram;

  const telegramValue =
    typeof telegramData === "string"
      ? telegramData.trim()
      : telegramData?.enabled &&
        typeof telegramData?.value === "string"
        ? telegramData.value.trim()
        : "";

  if (telegramValue) {
    const normalizedTelegram =
      telegramValue.toLowerCase();

    const isTelegramUsername =
      telegramValue.startsWith("@");

    const isTelegramLink =
      normalizedTelegram.startsWith(
        "https://t.me/"
      ) ||
      normalizedTelegram.startsWith(
        "http://t.me/"
      ) ||
      normalizedTelegram.startsWith(
        "t.me/"
      ) ||
      normalizedTelegram.startsWith(
        "https://telegram.me/"
      ) ||
      normalizedTelegram.startsWith(
        "http://telegram.me/"
      ) ||
      normalizedTelegram.startsWith(
        "telegram.me/"
      );

    if (
      isTelegramUsername ||
      isTelegramLink
    ) {
      let telegramUrl =
        telegramValue;

      if (isTelegramUsername) {
        telegramUrl =
          `https://t.me/${telegramValue.slice(
            1
          )}`;
      } else if (
        !/^https?:\/\//i.test(
          telegramValue
        )
      ) {
        telegramUrl =
          `https://${telegramValue}`;
      }

      links.push({
        key: "telegram",
        service: "telegram",
        value: telegramUrl,
      });
    } else {
      contacts.push({
        key: "telegram",
        type: "phone",
        service: "telegram",
        value: telegramValue,
      });
    }
  }

  ["viber", "whatsapp"].forEach(
    (service) => {
      const value =
        additional[service];

      if (
        typeof value ===
        "string" &&
        value.trim()
      ) {
        contacts.push({
          key: service,
          type: "phone",
          service,
          value: value.trim(),
        });
      }
    }
  );

  const phoneRows = [];

  contacts.forEach((contact) => {
    const normalized =
      normalizePhoneForCompare(
        contact.value
      );

    if (!normalized) {
      return;
    }

    const existingRow =
      phoneRows.find(
        (row) =>
          row.normalized ===
          normalized
      );

    if (existingRow) {
      if (
        !existingRow.services.includes(
          contact.service
        )
      ) {
        existingRow.services.push(
          contact.service
        );
      }

      return;
    }

    phoneRows.push({
      key: contact.key,
      normalized,
      value: contact.value,
      services: [
        contact.service,
      ],
    });
  });

  if (
    typeof additional.instagram ===
    "string" &&
    additional.instagram.trim()
  ) {
    links.push({
      key: "instagram",
      service: "instagram",
      value:
        additional.instagram.trim(),
    });
  }

  if (
    typeof additional.facebook ===
    "string" &&
    additional.facebook.trim()
  ) {
    links.push({
      key: "facebook",
      service: "facebook",
      value:
        additional.facebook.trim(),
    });
  }

  return {
    phoneRows,
    links,
  };
};

const getSafeUrl = (value) => {
  const trimmed = String(value || "").trim();

  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
};
const ListingDetailsModal = ({
  listing,
  onClose,
}) => {
  const [currentTime, setCurrentTime] =
    useState(Date.now());
  const [
    hideMainPhone,
    setHideMainPhone,
  ] = useState(false);

  const [
    phoneVisibilityLoading,
    setPhoneVisibilityLoading,
  ] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadPhoneVisibility =
      async () => {
        /*
         * Поки перевіряємо налаштування,
         * основний номер не показуємо.
         *
         * Це важливо, щоб прихований номер
         * не мигнув на екрані на мить.
         */
        setPhoneVisibilityLoading(true);
        setHideMainPhone(true);

        const authorUid =
          listing?.author?.uid;

        /*
         * Якщо UID немає — це, наприклад,
         * гостьове оголошення.
         *
         * Для нього працює стара поведінка:
         * основний контакт показуємо.
         */
        if (!authorUid) {
          if (isActive) {
            setHideMainPhone(false);
            setPhoneVisibilityLoading(false);
          }

          return;
        }

        try {
          const userSnapshot =
            await getDoc(
              doc(
                db,
                "users",
                authorUid
              )
            );

          if (!isActive) {
            return;
          }

          if (!userSnapshot.exists()) {
            setHideMainPhone(false);
            return;
          }

          setHideMainPhone(
            userSnapshot.data()
              .hidePhoneInListings === true
          );
        } catch (error) {
          console.error(
            "Помилка завантаження налаштувань контактів:",
            error
          );

          /*
           * При помилці безпечніше
           * не показувати основний номер.
           */
          if (isActive) {
            setHideMainPhone(true);
          }
        } finally {
          if (isActive) {
            setPhoneVisibilityLoading(false);
          }
        }
      };

    loadPhoneVisibility();

    return () => {
      isActive = false;
    };
  }, [
    listing?.id,
    listing?.author?.uid,
  ]);
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
  const {
    phoneRows,
    links: socialLinks,
  } = getContactRows(
    listing,
    hideMainPhone
  );


  const handleCopyContact = async (
    contact
  ) => {
    if (!contact) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        contact
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Контакт скопійовано",
        showConfirmButton: false,
        timer: 1600,
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
  const getServiceIcon = (
    service,
    size = 17
  ) => {
    switch (service) {
      case "telegram":
        return (
          <FaTelegramPlane
            size={size}
          />
        );

      case "viber":
        return (
          <FaViber
            size={size}
          />
        );

      case "whatsapp":
        return (
          <FaWhatsapp
            size={size}
          />
        );

      case "instagram":
        return (
          <Instagram
            size={size}
            strokeWidth={2}
          />
        );

      case "facebook":
        return (
          <Facebook
            size={size}
            strokeWidth={2}
          />
        );

      case "main":
      default:
        return (
          <Phone
            size={size}
            strokeWidth={2}
          />
        );
    }
  };
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
              className="mt-5 max-w-full break-words text-2xl font-black leading-tight text-slate-950 sm:text-4xl"
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
                  Місце:{" "} {listing.location ||
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
                {phoneVisibilityLoading ? (
                  <p className="mt-1.5 text-xs font-semibold text-slate-400">
                    Завантаження...
                  </p>
                ) : phoneRows.length === 0 &&
                  socialLinks.length === 0 ? (
                  <p className="mt-1.5 text-xs font-semibold text-slate-800">
                    Не вказано
                  </p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {phoneRows.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
                          Телефон та месенджери
                        </p>

                        <div className="space-y-1.5">
                          {phoneRows.map((row) => (
                            <div
                              key={row.normalized}
                              className="rounded-xl border border-slate-200 bg-white p-2.5"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                {row.services.map((service) => {
                                  const serviceLabel =
                                    service === "main"
                                      ? "Телефон"
                                      : service === "telegram"
                                        ? "Telegram"
                                        : service === "viber"
                                          ? "Viber"
                                          : "WhatsApp";

                                  return (
                                    <span
                                      key={service}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700"
                                    >
                                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                        {getServiceIcon(
                                          service,
                                          15
                                        )}
                                      </span>

                                      <span>
                                        {serviceLabel}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>

                              <div className="mt-2 flex min-w-0 items-center gap-2 border-t border-slate-100 pt-2">
                                <span className="min-w-0 flex-1 break-all text-sm font-bold text-slate-900">
                                  {row.value}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyContact(
                                      row.value
                                    )
                                  }
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                                  title="Скопіювати номер"
                                  aria-label="Скопіювати номер"
                                >
                                  <Copy size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {socialLinks.length > 0 && (
                      <div className="border-t border-slate-200 pt-2.5">
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Соціальні мережі та посилання
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {socialLinks.map(
                            (contact) => {
                              const serviceData = {
                                instagram: {
                                  label: "Instagram",
                                  title:
                                    "Відкрити Instagram",
                                },

                                telegram: {
                                  label: "Telegram",
                                  title:
                                    "Відкрити Telegram",
                                },

                                facebook: {
                                  label: "Facebook",
                                  title:
                                    "Відкрити Facebook",
                                },
                              };

                              const currentService =
                                serviceData[
                                contact.service
                                ];

                              if (!currentService) {
                                return null;
                              }

                              return (
                                <a
                                  key={contact.key}
                                  href={getSafeUrl(
                                    contact.value
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={
                                    currentService.title
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                    {getServiceIcon(
                                      contact.service,
                                      15
                                    )}
                                  </span>

                                  <span>
                                    {
                                      currentService.label
                                    }
                                  </span>
                                </a>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
};

export default ListingDetailsModal;