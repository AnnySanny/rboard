
import {
  Instagram,
  Facebook,
  Phone,
  MessageCircle,
  ExternalLink,
  Copy,
} from "lucide-react";
import Swal from "sweetalert2";
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

  const handleCopyPhone = async (number) => {
    try {
      await navigator.clipboard.writeText(formatPhone(number));

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Номер телефону скопійовано",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Помилка копіювання номера:", error);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Не вдалося скопіювати номер",
        showConfirmButton: false,
        timer: 2500,
      });
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-base font-medium text-slate-900 sm:text-lg">
        <MessageCircle
          className="h-[18px] w-[18px] shrink-0 text-blue-600 sm:h-[21px] sm:w-[21px]"
        />
        Зв'язок зі мною
      </h2>

      <div className="mt-4 flex flex-col items-center gap-3 sm:mt-5 sm:items-start lg:flex-row lg:flex-wrap lg:items-center lg:gap-2">
        {groupedPhones.map(({ number, types }) => (
          <div
            key={number}
            className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/40 px-2.5 py-2 sm:w-auto sm:rounded-2xl sm:px-3 sm:py-2.5 lg:w-auto lg:shrink-0 lg:gap-1.5 lg:px-2 lg:py-2"
          >
            {types.has("phone") && (
              <a
                href={`tel:+${number}`}
                title="Зателефонувати"
                aria-label={`Зателефонувати на ${formatPhone(number)}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-200 transition hover:bg-blue-100 sm:h-9 sm:w-9 sm:rounded-xl lg:h-8 lg:w-8 lg:rounded-lg"
              >
                <Phone className="h-4 w-4 sm:h-[18px] sm:w-[18px] lg:h-4 lg:w-4" />
              </a>
            )}

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
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition hover:brightness-95 sm:h-9 sm:w-9 sm:rounded-xl lg:h-8 lg:w-8 lg:rounded-lg ${iconStyle}`}
              >
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] lg:h-4 lg:w-4" />
              </a>
            ))}

            <button
              type="button"
              onClick={() => handleCopyPhone(number)}
              title="Натисніть, щоб скопіювати номер"
              aria-label={`Скопіювати номер ${formatPhone(number)}`}
              className="group ml-auto flex min-w-0 items-center justify-end gap-1.5 rounded-lg px-1 py-1 text-right transition hover:bg-blue-100/70 sm:ml-1"
            >
              <span className="break-all text-sm font-medium text-slate-800 transition group-hover:text-blue-700 sm:text-base lg:whitespace-nowrap lg:text-xs">
                {formatPhone(number)}
              </span>

              <Copy className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-blue-600 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5" />
            </button>
          </div>
        ))}

        {availableSocials.length > 0 && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:w-auto lg:flex-1 lg:gap-2">
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
                  className={`group flex min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition duration-200 hover:shadow-sm sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-sm lg:shrink-0 lg:gap-1.5 lg:rounded-xl lg:px-2 lg:py-2 lg:text-xs ${hoverStyle}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-9 sm:w-9 sm:rounded-xl lg:h-8 lg:w-8 lg:rounded-lg ${iconStyle}`}
                  >
                    <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] lg:h-4 lg:w-4" />
                  </span>

                  <span className="min-w-0 truncate">
                    {label}
                  </span>

                  <ExternalLink className="h-3 w-3 shrink-0 text-slate-400 transition group-hover:text-slate-600 sm:h-3.5 sm:w-3.5 lg:h-3 lg:w-3" />
                </a>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );


}
