
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  Check,
  X,
  Phone,
  Instagram,
  Facebook,
  Mail,
  MapPin,
  UserRound,
  Eye,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import {
  FaTelegramPlane,
  FaViber,
  FaWhatsapp,
  FaTiktok,
} from "react-icons/fa";
import {
  CONTACT_TYPES,
  detectContactType,
  getContactHref,
} from "../../utils/contactUtils";

const services = {
  telegram: {
    label: "Telegram",
    Icon: FaTelegramPlane,
    color: "#229ED9",
  },
  viber: {
    label: "Viber",
    Icon: FaViber,
    color: "#7360F2",
  },
  whatsapp: {
    label: "WhatsApp",
    Icon: FaWhatsapp,
    color: "#25D366",
  },
  instagram: {
    label: "Instagram",
    Icon: Instagram,
    color: "#E4405F",
  },
  facebook: {
    label: "Facebook",
    Icon: Facebook,
    color: "#1877F2",
  },
  tiktok: {
    label: "TikTok",
    Icon: FaTiktok,
    color: "#8B8F99",
  },
  email: {
    label: "Email",
    Icon: Mail,
    color: "#64748B",
  },
};

const getContactValue = (value) => {
  if (typeof value === "string") return value.trim();

  if (
    value?.enabled === true &&
    typeof value.value === "string"
  ) {
    return value.value.trim();
  }

  return "";
};

const getContacts = (listing) => {
  const phones = [];
  const links = [];

  const addPhone = (value, service = "main") => {
    const phone = String(value || "").trim();
    const normalized = phone.replace(/\D/g, "");

    if (!normalized) return;

    const existing = phones.find(
      (item) => item.normalized === normalized
    );

    if (existing) {
      if (!existing.services.includes(service)) {
        existing.services.push(service);
      }
      return;
    }

    phones.push({
      value: phone,
      normalized,
      services: [service],
    });
  };

  const addLink = (service, value) => {
    const contact = String(value || "").trim();

    if (!contact) return;

    const href = getContactHref(contact);

    if (!href) return;

    if (
      links.some(
        (item) =>
          item.service === service && item.href === href
      )
    ) {
      return;
    }

    links.push({ service, href });
  };

  const mainContact =
    listing.contactOriginal || listing.contact || "";

  if (mainContact && listing.hidePhone !== true) {
    const type = detectContactType(mainContact);

    if (type === CONTACT_TYPES.PHONE) {
      addPhone(mainContact);
    } else {
      const serviceByType = {
        [CONTACT_TYPES.TELEGRAM]: "telegram",
        [CONTACT_TYPES.VIBER]: "viber",
        [CONTACT_TYPES.WHATSAPP]: "whatsapp",
        [CONTACT_TYPES.INSTAGRAM]: "instagram",
        [CONTACT_TYPES.FACEBOOK]: "facebook",
        [CONTACT_TYPES.EMAIL]: "email",
      };

      const service = serviceByType[type];

      if (service) addLink(service, mainContact);
    }
  }

  const additional = listing.additionalContacts || {};

  Object.keys(services).forEach((service) => {
    if (service === "email") return;

    const value = getContactValue(additional[service]);

    if (!value) return;

    if (
      service === "viber" ||
      service === "whatsapp" ||
      (service === "telegram" &&
        detectContactType(value) === CONTACT_TYPES.PHONE)
    ) {
      addPhone(value, service);
    } else {
      addLink(service, value);
    }
  });

  return { phones, links };
};

const formatDate = (value) => {
  if (!value) return "Не вказано";

  let date;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (value?.seconds !== undefined) {
    date = new Date(value.seconds * 1000);
  } else {
    date = value instanceof Date
      ? value
      : new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "Не вказано";
  }

  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const ReelDetailsPanel = ({
  listing,
  onClose,
  theme = "dark",
}) => {
  const [copiedPhone, setCopiedPhone] = useState("");

  if (!listing) return null;

  const isDark = theme === "dark";
  const { phones, links } = getContacts(listing);
  const authorUid = listing.author?.uid || null;

  const profileUrl = authorUid
    ? `/user/${encodeURIComponent(authorUid)}`
    : null;
  const ui = isDark
    ? {
      panel: "bg-[#252A34] text-white",
      header: "border-white/10 bg-[#252A34]",
      card: "border-white/[0.07] bg-[#303642]",
      inner: "border-white/10 bg-[#252A34]",
      title: "text-slate-100",
      text: "text-slate-200",
      muted: "text-slate-400",
      border: "border-white/10",
      button: "border-white/10 bg-white/5 text-slate-200",
      accent: "text-blue-300",
      iconBg: "bg-white/5",
      category:
        "border-blue-400/20 bg-blue-400/10 text-blue-300",
    }
    : {
      panel: "bg-[#E8EBF0] text-slate-900",
      header: "border-slate-300/60 bg-[#E8EBF0]",
      card: "border-slate-200 bg-[#F8FAFC]",
      inner: "border-slate-200 bg-white",
      title: "text-slate-900",
      text: "text-slate-700",
      muted: "text-slate-500",
      border: "border-slate-200",
      button: "border-slate-200 bg-white text-slate-600",
      accent: "text-blue-600",
      iconBg: "bg-slate-100",
      category:
        "border-blue-200 bg-blue-50 text-blue-700",
    };

  const copyPhone = async (phone) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
    } catch (error) {
      console.error("Помилка копіювання:", error);
    }
  };

  const InfoRow = ({ Icon, label, value }) => (
    <div className={`flex items-center gap-3 py-3 border-b last:border-b-0 ${ui.border}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ui.iconBg}`}
      >
        <Icon size={17} className={ui.accent} />
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-[11px] ${ui.muted}`}>
          {label}
        </p>
        <p className={`mt-0.5 break-words text-sm font-medium ${ui.text}`}>
          {value || "Не вказано"}
        </p>
      </div>
    </div>
  );

  return (
    <section
      aria-label="Детальна інформація про оголошення"
      className={`absolute inset-x-0 bottom-0 top-20 z-30 flex flex-col overflow-hidden rounded-t-[28px] border-t shadow-[0_-12px_50px_rgba(0,0,0,0.25)] transition-colors duration-200 ${ui.panel} ${ui.border}`}
      style={{ touchAction: "pan-y" }}
      onClick={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
    >
      <div
        className={`shrink-0 border-b px-5 pb-4 pt-3 transition-colors duration-200 ${ui.header}`}
      >
        <div className="mb-4 flex justify-center">
          <div
            className={`h-1 w-9 rounded-full ${isDark ? "bg-slate-500" : "bg-slate-400"
              }`}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${ui.title}`}>
              Про оголошення
            </h3>
            <p className={`mt-1 text-[11px] ${ui.muted}`}>
              Детальна інформація та контакти
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Згорнути деталі"
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95 ${ui.button}`}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5"
        style={{
          WebkitOverflowScrolling: "touch",
          paddingBottom:
            "max(32px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="px-1">
          <span
            className={`mb-3 inline-flex rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${ui.category}`}
          >
            {listing.type ||
              listing.category ||
              "Оголошення"}
          </span>

          <h2 className={`text-xl font-bold leading-snug tracking-tight ${ui.title}`}>
            {listing.title}
          </h2>

          {(listing.location || listing.city) && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${ui.muted}`}>
              <MapPin size={16} className={ui.accent} />
              <span>
                {listing.location || listing.city}
              </span>
            </div>
          )}
        </div>

        <div className={`rounded-2xl border p-4 transition-colors duration-200 ${ui.card}`}>
          <h4 className={`mb-3 text-sm font-bold ${ui.title}`}>
            Опис оголошення
          </h4>

          <p className={`whitespace-pre-line break-words text-sm leading-7 ${ui.text}`}>
            {listing.description ||
              "Детальний опис оголошення не вказано."}
          </p>
        </div>

        <div className={`rounded-2xl border p-4 transition-colors duration-200 ${ui.card}`}>
          <h4 className={`mb-2 text-sm font-bold ${ui.title}`}>
            Інформація
          </h4>


          {profileUrl ? (
            <Link
              to={profileUrl}
              title={`Переглянути профіль: ${listing.authorName || "Користувач RBoard"}`}
              className={`group flex items-center gap-3 border-b py-3 transition-colors ${ui.border} ${isDark
                  ? "hover:text-blue-300"
                  : "hover:text-blue-600"
                }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ui.iconBg}`}
              >
                <UserRound size={17} className={ui.accent} />
              </div>

              <div className="min-w-0 flex-1">
                <p className={`text-[11px] ${ui.muted}`}>
                  Автор
                </p>

                <p className={`mt-0.5 truncate text-sm font-semibold ${ui.text}`}>
                  {listing.authorName || "Користувач RBoard"}
                </p>
              </div>

              <ChevronRight
                size={18}
                className={`shrink-0 transition-transform group-hover:translate-x-1 ${isDark ? "text-slate-400" : "text-slate-400"
                  }`}
              />
            </Link>
          ) : (
            <InfoRow
              Icon={UserRound}
              label="Автор"
              value={listing.authorName || "Гість"}
            />
          )}


          <InfoRow
            Icon={Eye}
            label="Кількість переглядів"
            value={String(listing.views ?? 0)}
          />

          <InfoRow
            Icon={CalendarDays}
            label="Дата публікації"
            value={formatDate(listing.createdAt)}
          />
        </div>

        <div className={`rounded-2xl border p-4 transition-colors duration-200 ${ui.card}`}>
          <h4 className={`mb-4 text-sm font-bold ${ui.title}`}>
            Контактна інформація
          </h4>

          {phones.length === 0 && links.length === 0 && (
            <p className={`text-sm ${ui.muted}`}>
              Контакти не вказано
            </p>
          )}

          {phones.map((phone) => (
            <div
              key={phone.normalized}
              className={`mb-3 rounded-xl border p-3 ${ui.inner}`}
            >
              <div className="mb-3 flex flex-wrap gap-1.5">
                {phone.services.map((service) => {
                  const config = services[service];
                  const Icon = config?.Icon || Phone;

                  return (
                    <span
                      key={service}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium ${ui.iconBg} ${ui.text}`}
                    >
                      <Icon
                        size={14}
                        style={{
                          color: config?.color || "#3B82F6",
                        }}
                      />
                      {config?.label || "Телефон"}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`tel:${phone.normalized}`}
                  className={`min-w-0 flex-1 break-all text-sm font-semibold ${ui.title}`}
                >
                  {phone.value}
                </a>

                <button
                  type="button"
                  onClick={() => copyPhone(phone.value)}
                  aria-label="Скопіювати номер"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ui.iconBg} ${ui.accent}`}
                >
                  {copiedPhone === phone.value ? (
                    <Check size={17} />
                  ) : (
                    <Copy size={17} />
                  )}
                </button>
              </div>
            </div>
          ))}

          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map(({ service, href }, index) => {
                const config = services[service];
                if (!config) return null;

                const Icon = config.Icon;

                return (
                  <a
                    key={`${service}-${index}`}
                    href={href}
                    target={service === "email" ? undefined : "_blank"}
                    rel={service === "email" ? undefined : "noopener noreferrer"}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition active:scale-[0.97] ${isDark
                      ? "border-white/15 bg-white/5 text-slate-200"
                      : "border-slate-200 bg-white text-slate-700"
                      }`}
                  >
                    <Icon
                      size={17}
                      style={{ color: config.color }}
                    />
                    <span>{config.label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReelDetailsPanel;
