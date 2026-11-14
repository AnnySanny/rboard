
import {
    Globe,
    Link2,
    Plus,
    Trash2,
    MapPin,
    ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
    FaYoutube,
    FaFacebookF,
    FaLinkedinIn,
    FaTiktok,
    FaInstagram,
    FaTelegramPlane,
    FaWhatsapp,
    FaTwitter,
    FaPinterestP,
    FaTwitch,
    FaDiscord,
    FaGithub,
    FaRedditAlien,
} from "react-icons/fa";

import {
    MAX_ADDITIONAL_LINKS,
    parseAdditionalLink,
} from "../../utils/additionalLinks";

const LINK_ICONS = {
    youtube: FaYoutube,
    facebook: FaFacebookF,
    linkedin: FaLinkedinIn,
    tiktok: FaTiktok,
    instagram: FaInstagram,
    telegram: FaTelegramPlane,
    whatsapp: FaWhatsapp,
    twitter: FaTwitter,
    pinterest: FaPinterestP,
    twitch: FaTwitch,
    discord: FaDiscord,
    github: FaGithub,
    reddit: FaRedditAlien,
    maps: MapPin,
    website: Globe,
};

export default function ListingAdditionalLinks({
    value = [],
    onChange,
    disabled = false,
    error = "",
}) {

    const [isOpen, setIsOpen] = useState(
        () => value.some((link) => link.trim())
    );

    useEffect(() => {
        if (error) {
            setIsOpen(true);
        }
    }, [error]);

    const handleAdd = () => {
        if (
            disabled ||
            value.length >= MAX_ADDITIONAL_LINKS
        ) {
            return;
        }

        onChange([...value, ""]);
    };

    const handleChange = (index, newValue) => {
        onChange(
            value.map((link, currentIndex) =>
                currentIndex === index
                    ? newValue
                    : link
            )
        );
    };

    const handleRemove = (index) => {
        onChange(
            value.filter(
                (_, currentIndex) =>
                    currentIndex !== index
            )
        );
    };

    const handleBlur = (index) => {
        const details = parseAdditionalLink(value[index]);

        if (
            details &&
            details.url !== value[index]
        ) {
            handleChange(index, details.url);
        }
    };

    const filledCount = value.filter(
        (link) => link.trim()
    ).length;

   
return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">

        {/* ЗАГОЛОВОК / ЗГОРТАННЯ */}
        <button
            type="button"
            onClick={() => setIsOpen((previous) => !previous)}
            aria-expanded={isOpen}
            className="flex w-full items-center gap-3 text-left"
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Link2 size={20} />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900 sm:text-base">
                    Додаткові посилання
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                    {filledCount > 0
                        ? `Додано посилань: ${filledCount} із ${MAX_ADDITIONAL_LINKS}`
                        : "Вебсайти, соцмережі та інші ресурси"}
                </span>
            </span>

            <ChevronDown
                size={20}
                className={`shrink-0 text-blue-600 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                }`}
            />
        </button>

        {/* РОЗГОРНУТИЙ ВМІСТ */}
        {isOpen && (
            <div className="mt-5 border-t border-slate-100 pt-5">

                <p className="mb-4 text-xs leading-5 text-slate-500">
                    Додайте до 5 посилань. Тип сервісу
                    визначається автоматично.
                </p>

                {/* СПИСОК ПОСИЛАНЬ */}
                {value.length > 0 && (
                    <div className="mx-auto max-w-2xl space-y-2">
                        {value.map((link, index) => {
                            const details =
                                parseAdditionalLink(link);

                            const Icon = details
                                ? LINK_ICONS[details.type] || Globe
                                : Link2;

                            return (
                                <div
                                    key={index}
                                    className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 transition hover:border-blue-200 sm:gap-3"
                                >
                                    {/* НОМЕР */}
                                    <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">
                                        {index + 1}.
                                    </span>

                                    {/* ІКОНКА СЕРВІСУ */}
                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                            details
                                                ? "bg-blue-50 text-blue-600"
                                                : "bg-white text-slate-400"
                                        }`}
                                        title={
                                            details?.label ||
                                            "Посилання"
                                        }
                                    >
                                        <Icon size={18} />
                                    </div>

                                    {/* ПОЛЕ ПОСИЛАННЯ */}
                                    <input
                                        id={`additional-link-${index}`}
                                        type="url"
                                        inputMode="url"
                                        aria-label={`Посилання ${index + 1}`}
                                        value={link}
                                        onChange={(event) =>
                                            handleChange(
                                                index,
                                                event.target.value
                                            )
                                        }
                                        onBlur={() =>
                                            handleBlur(index)
                                        }
                                        disabled={disabled}
                                        maxLength={500}
                                        autoComplete="off"
                                        placeholder="https://example.com"
                                        className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    />

                                    {/* ВИДАЛЕННЯ */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemove(index)
                                        }
                                        disabled={disabled}
                                        aria-label={`Видалити посилання ${index + 1}`}
                                        title="Видалити"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* КНОПКА ДОДАВАННЯ */}
                {value.length < MAX_ADDITIONAL_LINKS && (
                    <div className="mt-4 flex justify-center">
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={disabled}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={17} />
                            Додати посилання
                        </button>
                    </div>
                )}

                {value.length === MAX_ADDITIONAL_LINKS && (
                    <p className="mt-4 text-center text-xs text-slate-500">
                        Досягнуто ліміту: 5 посилань.
                    </p>
                )}

                {error && (
                    <p
                        role="alert"
                        className="mt-3 text-center text-sm font-medium text-red-600"
                    >
                        {error}
                    </p>
                )}
            </div>
        )}
    </section>
);

}
