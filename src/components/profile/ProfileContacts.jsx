
import {
  Instagram,
  Facebook,
  Phone,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

import {
  FaTelegramPlane,
  FaViber,
  FaWhatsapp,
  FaTiktok,
} from "react-icons/fa";

// Контакти, які не є номерами телефону.
const SOCIAL_CONTACTS = [
  {
    key: "telegram",
    label: "Telegram",
    Icon: FaTelegramPlane,
    iconStyle: "bg-sky-50 text-sky-500 ring-sky-200",
    hoverStyle: "hover:border-sky-300 hover:bg-sky-50",
  },
  {
    key: "instagram",
    label: "Instagram",
    Icon: Instagram,
    iconStyle: "bg-pink-50 text-pink-600 ring-pink-200",
    hoverStyle: "hover:border-pink-300 hover:bg-pink-50",
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: Facebook,
    iconStyle: "bg-blue-50 text-blue-600 ring-blue-200",
    hoverStyle: "hover:border-blue-300 hover:bg-blue-50",
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: FaTiktok,
    iconStyle: "bg-slate-100 text-slate-950 ring-slate-300",
    hoverStyle: "hover:border-slate-400 hover:bg-slate-50",
  },
];

const MESSENGERS = [
  {
    key: "viber",
    label: "Viber",
    Icon: FaViber,
    iconStyle: "bg-violet-50 text-violet-600 ring-violet-200",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    Icon: FaWhatsapp,
    iconStyle: "bg-green-50 text-green-600 ring-green-200",
  },
];

// Приводимо номери до одного формату для порівняння.
const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 10) {
    return `380${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith("380")) {
    return digits;
  }

  return digits;
};

const formatPhone = (number) => {
  if (number.startsWith("380") && number.length === 12) {
    return `+${number}`;
  }

  return `+${number}`;
};

const messengerHref = (key, number) => {
  if (key === "viber") {
    return `viber://chat?number=%2B${number}`;
  }

  if (key === "whatsapp") {
    return `https://wa.me/${number}`;
  }

  return null;
};

const socialHref = (key, rawValue) => {
  const value = rawValue.trim();

  if (key === "telegram") {
    if (/^@[a-zA-Z0-9_]{5,32}$/.test(value)) {
      return `https://t.me/${value.slice(1)}`;
    }

    if (/^https:\/\/(t\.me|telegram\.me)\//i.test(value)) {
      return value;
    }

    return null;
  }

  const domains = {
    instagram: ["instagram.com"],
    facebook: ["facebook.com", "fb.com", "fb.me"],
    tiktok: ["tiktok.com"],
  };

  try {
    const url = new URL(value);

    const validDomain = domains[key]?.some(
      (domain) =>
        url.hostname === domain ||
        url.hostname.endsWith(`.${domain}`)
    );

    return url.protocol === "https:" && validDomain
      ? url.href
      : null;
  } catch {
    return null;
  }
};

export default function ProfileContacts({ profile }) {
  const contacts = profile.additionalContacts || {};
  const phone = profile.phone || "";

  // Групуємо основний номер і номери месенджерів.
  const phoneGroups = new Map();

  const addPhone = (value, type) => {
    if (!value) return;

    const number = normalizePhone(value);

    if (number.length < 10 || number.length > 15) {
      return;
    }

    if (!phoneGroups.has(number)) {
      phoneGroups.set(number, {
        number,
        types: new Set(),
      });
    }

    phoneGroups.get(number).types.add(type);
  };

  addPhone(phone, "phone");

  MESSENGERS.forEach(({ key }) => {
    addPhone(contacts[key], key);
  });

  const groupedPhones = Array.from(phoneGroups.values());

  const availableSocials = SOCIAL_CONTACTS.map((item) => ({
    ...item,
    href:
      typeof contacts[item.key] === "string"
        ? socialHref(item.key, contacts[item.key])
        : null,
  })).filter((item) => item.href);

  if (
    groupedPhones.length === 0 &&
    availableSocials.length === 0
  ) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
        <MessageCircle
          size={21}
          className="text-blue-600"
        />
        Зв'язок зі мною
      </h2>

      <div className="mt-5 flex flex-wrap gap-3">
        {/* Групи номерів телефонів */}
        {groupedPhones.map(({ number, types }) => (
          <div
            key={number}
            className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50/40 px-3 py-2.5"
          >
            {/* Звичайний телефон */}
            {types.has("phone") && (
              <a
                href={`tel:+${number}`}
                title="Зателефонувати"
                aria-label={`Зателефонувати на ${formatPhone(number)}`}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200 transition hover:bg-blue-100"
              >
                <Phone size={18} />
              </a>
            )}

            {/* Іконки месенджерів */}
            {MESSENGERS.filter(({ key }) =>
              types.has(key)
            ).map(({ key, label, Icon, iconStyle }) => (
              <a
                key={key}
                href={messengerHref(key, number)}
                title={label}
                aria-label={`Відкрити ${label} для ${formatPhone(number)}`}
                target={key === "whatsapp" ? "_blank" : undefined}
                rel={key === "whatsapp" ? "noopener noreferrer" : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition hover:brightness-95 ${iconStyle}`}
              >
                <Icon size={18} />
              </a>
            ))}

            {/* Номер один для всієї групи */}
            <span className="ml-1 text-sm font-semibold text-slate-800">
              {formatPhone(number)}
            </span>
          </div>
        ))}

        {/* Соціальні мережі */}
        {availableSocials.map(
          ({
            key,
            label,
            Icon,
            iconStyle,
            hoverStyle,
            href,
          }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 ${hoverStyle}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${iconStyle}`}
              >
                <Icon size={18} />
              </span>

              <span>{label}</span>

              <ExternalLink
                size={14}
                className="text-slate-400 transition group-hover:text-slate-600"
              />
            </a>
          )
        )}
      </div>
    </section>
  );
}
