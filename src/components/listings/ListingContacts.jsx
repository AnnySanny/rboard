import {
    Instagram,
    Facebook,
    PhoneOff,
} from "lucide-react";

import {
    FaTelegramPlane,
    FaViber,
    FaWhatsapp,
    FaTiktok,
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
        iconActive:
            "bg-pink-50 text-pink-600 ring-1 ring-pink-200",
        borderActive:
            "border-pink-200 shadow-sm",
        checkboxColor: "accent-pink-600",
    },
    {
        key: "telegram",
        label: "Telegram",
        placeholder:
            "+380 XX XXX XX XX або https://t.me/username",
        icon: FaTelegramPlane,
        type: "text",
        inputMode: "text",
        hint: "Вкажіть номер телефону або посилання на профіль Telegram",
        iconActive:
            "bg-sky-50 text-sky-500 ring-1 ring-sky-200",
        borderActive:
            "border-sky-200 shadow-sm",
        checkboxColor: "accent-sky-500",
    },
    {
        key: "viber",
        label: "Viber",
        placeholder: "+380 XX XXX XX XX",
        icon: FaViber,
        type: "tel",
        inputMode: "tel",
        hint: "Вкажіть номер телефону, прив’язаний до Viber",
        iconActive:
            "bg-violet-50 text-violet-600 ring-1 ring-violet-200",
        borderActive:
            "border-violet-200 shadow-sm",
        checkboxColor: "accent-violet-600",
    },
    {
        key: "whatsapp",
        label: "WhatsApp",
        placeholder: "+380 XX XXX XX XX",
        icon: FaWhatsapp,
        type: "tel",
        inputMode: "tel",
        hint: "Вкажіть номер телефону, прив’язаний до WhatsApp",
        iconActive:
            "bg-green-50 text-green-600 ring-1 ring-green-200",
        borderActive:
            "border-green-200 shadow-sm",
        checkboxColor: "accent-green-600",
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
        iconActive:
            "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
        borderActive:
            "border-blue-200 shadow-sm",
        checkboxColor: "accent-blue-600",
    },
      {
    key: "tiktok",
    label: "TikTok",
    placeholder:
        "https://www.tiktok.com/@username",
    icon: FaTiktok,
    type: "url",
    inputMode: "url",
    hint: "Вкажіть посилання на профіль TikTok",
    iconActive:
        "bg-slate-100 text-slate-950 ring-1 ring-slate-300",
    borderActive:
        "border-slate-300 shadow-sm",
    checkboxColor: "accent-slate-900",
},
];
export default function ListingContacts({
    value,
    onChange,
    hidePhone = false,
    onHidePhoneChange,
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

    const handleChange = (
        key,
        newValue
    ) => {
        onChange({
            ...value,
            [key]: {
                ...value[key],
                value: newValue,
            },
        });
    };



    return (
        <div className="rounded-2xl border border-blue-300 bg-blue-50 p-5 sm:p-6">
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

            {/* Видимість основного номера */}
            <div
                className={`
                    mt-5
                    rounded-2xl
                    border
                    bg-white
                    transition
                 ${hidePhone
                        ? "border-red-300 shadow-sm"
                        : "border-slate-200"
                    }
                `}
            >
                <label
                    className={`
        flex
        items-center
        gap-3
        p-4
        ${disabled
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer"
                        }
    `}
                >
                    <input
                        type="checkbox"
                        checked={hidePhone}
                        onChange={(event) => {
                            if (typeof onHidePhoneChange === "function") {
                                onHidePhoneChange(event);
                            }
                        }}
                        disabled={disabled}
                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-red-500"
                    />

                    <span
                        className={`
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            transition
${hidePhone
                                ? "bg-red-50 text-red-500 ring-1 ring-red-200"
                                : "bg-slate-100 text-slate-500"
                            }
                        `}
                    >
                        <PhoneOff
                            size={18}
                            strokeWidth={2}
                        />
                    </span>

                    <div className="min-w-0">
                        <span className="block text-sm font-bold text-slate-700">
                            Не показувати номер телефону
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                            Приховати основний номер
                            телефону в цьому оголошенні
                        </span>
                    </div>
                </label>

                {hidePhone && (
                    <div className="border-t border-blue-100 px-4 py-3">
                        <p className="text-xs leading-5 text-blue-700">
                            Рекомендуємо додати хоча б
                            один додатковий спосіб
                            зв’язку, щоб користувачі
                            могли зв’язатися з вами.
                        </p>
                    </div>
                )}
            </div>

            {/* Додаткові контакти */}
            <div className="mt-3 grid items-start gap-3 sm:grid-cols-2">
                {CONTACT_TYPES.map(
                    (contact) => {
                        const Icon =
                            contact.icon;

                        const contactState =
                            value[
                            contact.key
                            ];

                        return (
                            <div
                                key={
                                    contact.key
                                }
                                className={`rounded-2xl border bg-white transition ${contactState.enabled
                                    ? contact.borderActive
                                    : "border-slate-200"
                                    }`}
                            >
                                <label
                                    className={`flex items-center gap-3 p-4 ${disabled
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
                                        disabled={
                                            disabled
                                        }
                                        className={`h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 ${contact.checkboxColor}`}
                                    />

                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${contactState.enabled
                                                ? contact.iconActive
                                                : "bg-slate-100 text-slate-500"
                                            }`}
                                    >
                                        <Icon
                                            size={
                                                18
                                            }
                                            strokeWidth={
                                                2
                                            }
                                        />
                                    </span>

                                    <span className="text-sm font-bold text-slate-700">
                                        {
                                            contact.label
                                        }
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
                                            onChange={(
                                                event
                                            ) =>
                                                handleChange(
                                                    contact.key,
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder={
                                                contact.placeholder
                                            }
                                            disabled={
                                                disabled
                                            }
                                            autoComplete="off"
                                            maxLength={
                                                250
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                                        />

                                        <p className="mt-2 text-xs leading-5 text-slate-400">
                                            {
                                                contact.hint
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    }
                )}
            </div>
        </div>
    );
}