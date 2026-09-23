import {
    ArrowRight,
    ChevronUp,
    ExternalLink,
    Image as ImageIcon,
    Link2,
} from "lucide-react";

import { useState } from "react";


const UserNotificationCard = ({
    notification,
}) => {
    const [
        showDetails,
        setShowDetails,
    ] = useState(false);

    if (!notification) {
        return null;
    }

    const formatDate = (value) => {
        if (!value) {
            return "Дата не вказана";
        }

        try {
            const date =
                typeof value?.toDate ===
                "function"
                    ? value.toDate()
                    : new Date(value);

            return new Intl.DateTimeFormat(
                "uk-UA",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }
            ).format(date);
        } catch {
            return "Дата не вказана";
        }
    };

    const links =
        Array.isArray(
            notification?.links
        )
            ? notification.links.filter(
                  (link) =>
                      link &&
                      link.url
              )
            : [];

    const linksCount =
        links.length;

    const text =
        typeof notification?.text ===
        "string"
            ? notification.text
            : "";

    const title =
        typeof notification?.title ===
        "string" &&
        notification.title.trim()
            ? notification.title
            : "Без назви";

    const imageUrl =
        notification?.imageUrl ||
        null;

    const shortText =
        text.length > 150
            ? `${text.slice(
                  0,
                  150
              )}...`
            : text;

    const getLinksLabel = () => {
        if (linksCount === 1) {
            return "посилання";
        }

        if (
            linksCount >= 2 &&
            linksCount <= 4
        ) {
            return "посилання";
        }

        return "посилань";
    };


    return (
        <article
            className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                showDetails
                    ? "border-blue-200 shadow-sm"
                    : "border-slate-200 shadow-sm hover:border-slate-300"
            }`}
        >

            <div className="px-5 py-4 sm:px-6">

                <div className="flex flex-wrap items-center gap-2">

                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {formatDate(
                            notification?.createdAt
                        )}
                    </span>


                    {imageUrl && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">

                            <ImageIcon className="h-3.5 w-3.5" />

                            Фото

                        </span>
                    )}


                    {linksCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">

                            <Link2 className="h-3.5 w-3.5" />

                            {linksCount}{" "}
                            {getLinksLabel()}

                        </span>
                    )}

                </div>


                <h2 className="mt-3 break-words text-lg font-black leading-snug text-slate-950">
                    {title}
                </h2>


                {!showDetails && (
                    <p className="mt-1.5 break-words text-sm leading-6 text-slate-600">
                        {shortText ||
                            "Текст повідомлення відсутній."}
                    </p>
                )}


                {showDetails && (
                    <div className="mt-4 border-t border-slate-100 pt-4">

                        <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                            {text ||
                                "Текст повідомлення відсутній."}
                        </div>


                        {imageUrl && (
                            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="max-h-[500px] w-full object-contain"
                                />

                            </div>
                        )}


                        {linksCount > 0 && (
                            <div className="mt-5">

                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                    Посилання
                                </p>

                                <div className="space-y-2">

                                    {links.map(
                                        (
                                            link,
                                            index
                                        ) => (
                                            <a
                                                key={`${link.url}-${index}`}
                                                href={
                                                    link.url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
                                            >

                                                <span className="min-w-0 break-words">
                                                    {link.label ||
                                                        link.url}
                                                </span>

                                                <ExternalLink className="h-4 w-4 shrink-0" />

                                            </a>
                                        )
                                    )}

                                </div>

                            </div>
                        )}

                    </div>
                )}


                <div
                    className={
                        showDetails
                            ? "mt-5 border-t border-slate-100 pt-4"
                            : "mt-3"
                    }
                >

                    <button
                        type="button"
                        onClick={() =>
                            setShowDetails(
                                (
                                    previousValue
                                ) =>
                                    !previousValue
                            )
                        }
                        className="group inline-flex items-center gap-4 py-1 text-sm font-bold text-blue-600 transition hover:text-blue-700"
                    >

                        <span>
                            {showDetails
                                ? "Згорнути"
                                : "Детальніше"}
                        </span>


                        {showDetails ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        )}

                    </button>

                </div>

            </div>

        </article>
    );
};


export default UserNotificationCard;