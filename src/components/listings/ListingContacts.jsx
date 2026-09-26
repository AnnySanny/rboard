import {
    Instagram,
    Facebook,
} from "lucide-react";

import {
    FaTelegramPlane,
    FaViber,
    FaWhatsapp,
} from "react-icons/fa";

const CONTACT_TYPES = [
    {
        key: "instagram",
        label: "Instagram",
        placeholder:
            "https://instagram.com/username",
        icon: Instagram,
        type: "url",
        inputMode: "url",
        hint: "Вкажіть посилання на профіль Instagram",
    },
    {
        key: "telegram",
        label: "Telegram",
        placeholder: "+380 XX XXX XX XX",
        icon: FaTelegramPlane,
        type: "tel",
        inputMode: "tel",
        hint: "Вкажіть номер телефону, прив’язаний до Telegram",
    },
    {
        key: "viber",
        label: "Viber",
        placeholder: "+380 XX XXX XX XX",
        icon: FaViber,
        type: "tel",
        inputMode: "tel",
        hint: "Вкажіть номер телефону, прив’язаний до Viber",
    },
    {
        key: "whatsapp",
        label: "WhatsApp",
        placeholder: "+380 XX XXX XX XX",
        icon: FaWhatsapp,
        type: "tel",
        inputMode: "tel",
        hint: "Вкажіть номер телефону, прив’язаний до WhatsApp",
    },
    {
        key: "facebook",
        label: "Facebook",
        placeholder:
            "https://facebook.com/username",
        icon: Facebook,
        type: "url",
        inputMode: "url",
        hint: "Вкажіть посилання на профіль Facebook",
    },
];

export default function ListingContacts({
    value,
    onChange,
    disabled = false,
}) {
    const handleToggle = (key) => {
        onChange({
            ...value,
            [key]: {
                ...value[key],
                enabled: !value[key].enabled,
            },
        });
    };

    const handleChange = (key, newValue) => {
        onChange({
            ...value,
            [key]: {
                ...value[key],
                value: newValue,
            },
        });
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
            <div>
                <h3 className="text-base font-black text-slate-900">
                    Додатковий зв’язок із вами
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                    Додайте соціальні мережі або
                    месенджери, через які з вами також
                    можна зв’язатися.
                </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {CONTACT_TYPES.map((contact) => {
                    const Icon = contact.icon;
                    const contactState =
                        value[contact.key];

                    return (
                        <div
                            key={contact.key}
                            className={`rounded-2xl border bg-white transition ${
                                contactState.enabled
                                    ? "border-blue-200 shadow-sm"
                                    : "border-slate-200"
                            }`}
                        >
                            <label
                                className={`flex items-center gap-3 p-4 ${
                                    disabled
                                        ? "cursor-not-allowed opacity-60"
                                        : "cursor-pointer"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={
                                        contactState.enabled
                                    }
                                    onChange={() =>
                                        handleToggle(
                                            contact.key
                                        )
                                    }
                                    disabled={disabled}
                                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-blue-600"
                                />

                                <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                                        contactState.enabled
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-slate-100 text-slate-500"
                                    }`}
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={2}
                                    />
                                </span>

                                <span className="text-sm font-bold text-slate-700">
                                    {contact.label}
                                </span>
                            </label>

                            {contactState.enabled && (
                                <div className="px-4 pb-4">
                                    <input
                                        type={
                                            contact.type
                                        }
                                        inputMode={
                                            contact.inputMode
                                        }
                                        value={
                                            contactState.value
                                        }
                                        onChange={(event) =>
                                            handleChange(
                                                contact.key,
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder={
                                            contact.placeholder
                                        }
                                        disabled={disabled}
                                        autoComplete="off"
                                        maxLength={250}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                                    />

                                    <p className="mt-2 text-xs leading-5 text-slate-400">
                                        {contact.hint}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}