import {
    AtSign,
    Facebook,
    Instagram,
    Mail,
    Phone,
} from "lucide-react";

import {
    FaTelegramPlane,
    FaViber,
    FaWhatsapp,
} from "react-icons/fa";

import {
    CONTACT_TYPES,
    detectContactType,
    getContactLabel,
} from "../../utils/contactUtils";

const getContactIcon = (type) => {
    switch (type) {
        case CONTACT_TYPES.PHONE:
            return Phone;

        case CONTACT_TYPES.EMAIL:
            return Mail;

        case CONTACT_TYPES.TELEGRAM:
            return FaTelegramPlane;

        case CONTACT_TYPES.INSTAGRAM:
            return Instagram;

        case CONTACT_TYPES.FACEBOOK:
            return Facebook;

        case CONTACT_TYPES.WHATSAPP:
            return FaWhatsapp;

        case CONTACT_TYPES.VIBER:
            return FaViber;

        default:
            return AtSign;
    }
};

export default function GuestContactInput({
    value,
    onChange,
    error,
    disabled = false,
}) {
    const hasValue = Boolean(value?.trim());

    const contactType = hasValue
        ? detectContactType(value)
        : null;

    const ContactIcon = contactType
        ? getContactIcon(contactType)
        : null;

    const contactLabel = contactType
        ? getContactLabel(contactType)
        : null;

    const recognized =
        contactType &&
        contactType !== CONTACT_TYPES.OTHER;

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <label
                    htmlFor="guestContact"
                    className="block text-sm font-semibold text-slate-700"
                >
                    Зв’язок із вами{" "}
                    <span className="text-red-500">
                        *
                    </span>
                </label>

                {hasValue && ContactIcon && (
                    <div
                        className={`flex items-center gap-1.5 text-xs font-semibold ${
                            recognized
                                ? "text-blue-600"
                                : "text-slate-400"
                        }`}
                    >
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                                recognized
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-slate-100 text-slate-400"
                            }`}
                        >
                            <ContactIcon size={14} />
                        </span>

                        <span>
                            {contactLabel}
                        </span>
                    </div>
                )}
            </div>

            <input
                id="guestContact"
                type="text"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                disabled={disabled}
                placeholder="Телефон, Електрона пошта, Telegram, Instagram, Facebook, WhatsApp або Viber"
                autoComplete="off"
                inputMode="text"
                maxLength={250}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                    error
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                } disabled:cursor-not-allowed disabled:bg-slate-50`}
            />

            {error && (
                <p className="mt-1.5 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}