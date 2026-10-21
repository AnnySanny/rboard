import { Copy, X, Phone, Instagram, Facebook, Mail } from "lucide-react";
import {
  FaTelegramPlane,
  FaViber,
  FaWhatsapp,
  FaTiktok,
} from "react-icons/fa";
import { useState } from "react";
import {
  CONTACT_TYPES,
  detectContactType,
  getContactHref,
} from "../../utils/contactUtils";

const services = {
  telegram: {
    label: "Telegram",
    Icon: FaTelegramPlane,
    style: "border-[#229ED9]/30 bg-[#229ED9]/10 text-[#229ED9]",
  },
  viber: {
    label: "Viber",
    Icon: FaViber,
    style: "border-[#7360F2]/30 bg-[#7360F2]/10 text-[#A78BFA]",
  },
  whatsapp: {
    label: "WhatsApp",
    Icon: FaWhatsapp,
    style: "border-[#25D366]/30 bg-[#25D366]/10 text-[#4ADE80]",
  },
  instagram: {
    label: "Instagram",
    Icon: Instagram,
    style: "border-[#E4405F]/30 bg-[#E4405F]/10 text-[#FB7185]",
  },
  facebook: {
    label: "Facebook",
    Icon: Facebook,
    style: "border-[#1877F2]/30 bg-[#1877F2]/10 text-[#60A5FA]",
  },
  tiktok: {
    label: "TikTok",
    Icon: FaTiktok,
    style: "border-white/20 bg-white/10 text-white",
  },
  email: {
    label: "Email",
    Icon: Mail,
    style: "border-white/20 bg-white/10 text-white",
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
  const seenPhones = new Set();
  const seenLinks = new Set();

  const addPhone = (value, service = "main") => {
    const phone = String(value || "").trim();
    const normalized = phone.replace(/\D/g, "");

    if (!normalized || seenPhones.has(normalized)) return;

    seenPhones.add(normalized);
    phones.push({ value: phone, normalized, service });
  };

  const addLink = (service, value) => {
    const contact = String(value || "").trim();
    if (!contact) return;

    const href = getContactHref(contact);
    if (!href || seenLinks.has(`${service}:${href}`)) return;

    seenLinks.add(`${service}:${href}`);
    links.push({ service, value: contact, href });
  };

  const mainContact =
    listing.contactOriginal || listing.contact || "";

  if (listing.hidePhone !== true && mainContact) {
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

const ReelDetailsPanel = ({ listing, onClose }) => {
  const [copiedPhone, setCopiedPhone] = useState("");

  if (!listing) return null;

  const { phones, links } = getContacts(listing);

  const copyPhone = async (phone) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
    } catch (error) {
      console.error("Не вдалося скопіювати номер:", error);
    }
  };

  return (
    <section
      className="absolute inset-x-0 bottom-0 top-20 z-30 flex flex-col overflow-hidden rounded-t-3xl border-t border-white/15 bg-[#101827] text-white shadow-2xl"
      aria-label="Детальна інформація про оголошення"
      onClick={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      style={{ touchAction: "pan-y" }}
    >
      {/* Заголовок панелі */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
        <h3 className="text-base font-bold">
          Деталі оголошення
        </h3>

        <button
          type="button"
          onClick={onClose}
          aria-label="Згорнути деталі"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <X size={19} />
        </button>
      </div>

      {/* Вміст із незалежним прокручуванням */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5"
        style={{
          WebkitOverflowScrolling: "touch",
          paddingBottom: "max(32px, env(safe-area-inset-bottom))",
        }}
      >
        <h2 className="text-xl font-bold leading-snug">
          {listing.title}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {listing.type && (
            <span className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-300">
              {listing.type}
            </span>
          )}

          {(listing.location || listing.city) && (
            <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/80">
              {listing.location || listing.city}
            </span>
          )}
        </div>

        {/* Опис */}
        <div className="mt-6">
          <h4 className="text-sm font-bold">Опис</h4>

          <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-300">
            {listing.description ||
              "Детальний опис оголошення не вказано."}
          </p>
        </div>

        <div className="my-6 h-px bg-white/10" />

        {/* Інформація */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold">
            Інформація
          </h4>

          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-400">Автор</span>
            <span className="text-right font-medium">
              {listing.authorName || "Не вказано"}
            </span>
          </div>

          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-400">Переглядів</span>
            <span className="font-medium">
              {listing.views ?? 0}
            </span>
          </div>

          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-400">Опубліковано</span>
            <span className="text-right font-medium">
              {listing.createdAt
                ? new Date(listing.createdAt).toLocaleDateString("uk-UA")
                : "Не вказано"}
            </span>
          </div>
        </div>

        <div className="my-6 h-px bg-white/10" />

        {/* Контакти */}
        <div>
          <h4 className="mb-4 text-sm font-bold">
            Контактна інформація
          </h4>

          {phones.length === 0 && links.length === 0 && (
            <p className="text-sm text-slate-400">
              Контакти не вказано
            </p>
          )}

          {phones.map((phone) => (
            <div
              key={phone.normalized}
              className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <Phone size={19} className="shrink-0 text-blue-400" />

              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400">
                  {phone.service === "main"
                    ? "Телефон"
                    : services[phone.service]?.label || "Телефон"}
                </p>

                <a
                  href={`tel:${phone.normalized}`}
                  className="break-all text-sm font-semibold text-white"
                >
                  {phone.value}
                </a>
              </div>

              <button
                type="button"
                onClick={() => copyPhone(phone.value)}
                aria-label="Скопіювати номер"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-300"
              >
                <Copy size={16} />
              </button>

              {copiedPhone === phone.value && (
                <span className="text-xs text-green-400">
                  Скопійовано
                </span>
              )}
            </div>
          ))}

          {/* Соціальні мережі */}
          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
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
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition active:scale-[0.97] ${config.style}`}
                  >
                    <Icon size={17} />
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