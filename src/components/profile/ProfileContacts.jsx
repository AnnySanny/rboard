
import {
  Instagram,
  Facebook,
  Phone,
  MessageCircle,
  Send,
  ExternalLink,
} from "lucide-react";

import {
  FaViber,
  FaWhatsapp,
  FaTiktok,
} from "react-icons/fa";

const CONTACTS = [
  { key: "telegram", label: "Telegram", Icon: Send },
  { key: "viber", label: "Viber", Icon: FaViber },
  { key: "whatsapp", label: "WhatsApp", Icon: FaWhatsapp },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "tiktok", label: "TikTok", Icon: FaTiktok },
];

const phoneHref = (value) =>
  `tel:${value.replace(/[^\d+]/g, "")}`;

const contactHref = (key, rawValue) => {
  const value = rawValue.trim();

  if (key === "viber") {
    return `viber://chat?number=${encodeURIComponent(
      value.replace(/[^\d+]/g, "")
    )}`;
  }

  if (key === "whatsapp") {
    return `https://wa.me/${value.replace(/\D/g, "")}`;
  }

  if (key === "telegram") {
    if (/^\+?[\d\s()-]{9,20}$/.test(value)) {
      return null;
    }

    if (value.startsWith("@")) {
      return `https://t.me/${value.slice(1)}`;
    }

    return /^https?:\/\/(t\.me|telegram\.me)\//i.test(value)
      ? value
      : null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return null;
};

export default function ProfileContacts({ profile }) {
  const contacts = profile.additionalContacts || {};

  const phone = profile.phone || "";

  const available = CONTACTS.filter(
    (item) =>
      typeof contacts[item.key] === "string" &&
      contacts[item.key].trim()
  );

  if (!phone && available.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
        <MessageCircle size={21} className="text-blue-600" />
        Зв'язок зі мною
      </h2>

      <div className="mt-5 flex flex-wrap gap-3">
        {phone && (
          <a
            href={phoneHref(phone)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Phone size={17} />
            {phone}
          </a>
        )}

        {available.map(({ key, label, Icon }) => {
          const href = contactHref(key, contacts[key]);

          if (!href) return null;

          return (
            <a
              key={key}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <Icon size={17} />
              {label}
              <ExternalLink size={13} />
            </a>
          );
        })}
      </div>
    </section>
  );
}
