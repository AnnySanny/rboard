import {
    ExternalLink,
    Image as ImageIcon,
    Link2,
    Maximize2,
    Trash2,
} from "lucide-react";

import {
    deleteDoc,
    doc,
} from "firebase/firestore";

import Swal from "sweetalert2";

import { db } from "../../firebase";


const NotificationCard = ({
    notification,
}) => {
    const formatDate = (timestamp) => {
        if (!timestamp) {
            return "Щойно";
        }

        try {
            const date =
                typeof timestamp.toDate ===
                "function"
                    ? timestamp.toDate()
                    : new Date(timestamp);

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
            return "Дата невідома";
        }
    };


    const handleDelete =
        async () => {
            const confirmation =
                await Swal.fire({
                    icon: "warning",

                    title:
                        "Видалити повідомлення?",

                    html: `
                        <p style="line-height:1.6;">
                            Повідомлення
                            <strong>
                                «${notification.title || "Без назви"}»
                            </strong>
                            буде повністю видалено.
                        </p>

                        <p style="
                            margin-top:10px;
                            color:#dc2626;
                            font-weight:600;
                        ">
                            Цю дію неможливо скасувати.
                        </p>
                    `,

                    showCancelButton:
                        true,

                    confirmButtonText:
                        "Так, видалити",

                    cancelButtonText:
                        "Не видаляти",

                    confirmButtonColor:
                        "#dc2626",

                    cancelButtonColor:
                        "#64748b",

                    reverseButtons:
                        true,

                    focusCancel:
                        true,
                });


            if (
                !confirmation.isConfirmed
            ) {
                return;
            }


            try {
                await deleteDoc(
                    doc(
                        db,
                        "notifications",
                        notification.id
                    )
                );


                await Swal.fire({
                    icon: "success",

                    title:
                        "Повідомлення видалено",

                    confirmButtonText:
                        "Добре",

                    confirmButtonColor:
                        "#2563eb",

                    timer: 1600,

                    timerProgressBar:
                        true,
                });

            } catch (error) {
                console.error(
                    "Помилка видалення повідомлення:",
                    error
                );


                await Swal.fire({
                    icon: "error",

                    title:
                        "Не вдалося видалити",

                    text:
                        "Перевірте з’єднання та права адміністратора.",

                    confirmButtonText:
                        "Закрити",

                    confirmButtonColor:
                        "#2563eb",
                });
            }
        };


    const handleDetails =
        async () => {
            const imageHtml =
                notification.imageUrl
                    ? `
                        <div style="
                            margin-top:20px;
                            overflow:hidden;
                            border:1px solid #e2e8f0;
                            border-radius:16px;
                            background:#f8fafc;
                        ">
                            <img
                                src="${notification.imageUrl}"
                                alt=""
                                style="
                                    display:block;
                                    width:100%;
                                    max-height:420px;
                                    object-fit:contain;
                                "
                            />
                        </div>
                    `
                    : "";


            const linksHtml =
                notification.links?.length
                    ? `
                        <div style="
                            margin-top:20px;
                            text-align:left;
                        ">

                            <div style="
                                margin-bottom:10px;
                                font-size:12px;
                                font-weight:700;
                                text-transform:uppercase;
                                letter-spacing:.05em;
                                color:#94a3b8;
                            ">
                                Посилання
                            </div>

                            <div style="
                                display:flex;
                                flex-direction:column;
                                gap:8px;
                            ">

                                ${notification.links
                                    .map(
                                        (link) => `
                                            <a
                                                href="${link.url}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style="
                                                    display:block;
                                                    padding:12px 14px;
                                                    border:1px solid #bfdbfe;
                                                    border-radius:12px;
                                                    background:#eff6ff;
                                                    color:#2563eb;
                                                    font-size:14px;
                                                    font-weight:700;
                                                    text-decoration:none;
                                                    word-break:break-word;
                                                "
                                            >
                                                ${
                                                    link.label ||
                                                    link.url
                                                }
                                            </a>
                                        `
                                    )
                                    .join("")}

                            </div>

                        </div>
                    `
                    : "";


            await Swal.fire({
                width: 720,

                showConfirmButton:
                    false,

                showCloseButton:
                    true,

                html: `
                    <div style="
                        padding:6px;
                        text-align:left;
                    ">

                        <div style="
                            display:inline-block;
                            padding:6px 12px;
                            border:1px solid #a7f3d0;
                            border-radius:999px;
                            background:#ecfdf5;
                            color:#047857;
                            font-size:12px;
                            font-weight:700;
                        ">
                            ${formatDate(
                                notification.createdAt
                            )}
                        </div>

                        <h2 style="
                            margin:16px 0 0;
                            color:#0f172a;
                            font-size:24px;
                            font-weight:800;
                            line-height:1.3;
                        ">
                            ${notification.title || "Без назви"}
                        </h2>

                        <div style="
                            margin-top:20px;
                            padding:16px;
                            border-radius:16px;
                            background:#f8fafc;
                            color:#334155;
                            font-size:14px;
                            line-height:1.7;
                            white-space:pre-wrap;
                        ">
                            ${notification.text || "Текст відсутній"}
                        </div>

                        ${imageHtml}

                        ${linksHtml}

                    </div>
                `,
            });
        };


    const shortText =
        notification.text?.length > 240
            ? `${notification.text.slice(
                  0,
                  240
              )}...`
            : notification.text;


    const linksCount =
        Array.isArray(
            notification.links
        )
            ? notification.links.length
            : 0;


    return (
        <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">

            <div className="flex flex-wrap items-center gap-2">

                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {formatDate(
                        notification.createdAt
                    )}
                </span>


                {notification.imageUrl && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">

                        <ImageIcon className="h-3.5 w-3.5" />

                        Фото

                    </span>
                )}


                {linksCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">

                        <Link2 className="h-3.5 w-3.5" />

                        {linksCount}

                        {linksCount === 1
                            ? " посилання"
                            : " посилань"}

                    </span>
                )}

            </div>


            <h3 className="mt-4 break-words text-xl font-black leading-tight text-slate-950">
                {notification.title ||
                    "Без назви"}
            </h3>


            <p className="mt-2 break-all text-xs font-medium text-slate-400">
                ID: {notification.id}
            </p>


            <div className="mt-5">

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Текст повідомлення
                </p>

                <div className="mt-2 min-h-28 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {shortText ||
                        "Текст повідомлення відсутній."}
                </div>

            </div>


            {linksCount > 0 && (

                <div className="mt-5">

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Додані посилання
                    </p>

                    <div className="mt-2 space-y-2">

                        {notification.links
                            .slice(0, 2)
                            .map(
                                (
                                    link,
                                    index
                                ) => (
                                    <a
                                        key={index}
                                        href={
                                            link.url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                    >

                                        <span className="min-w-0 truncate">
                                            {link.label ||
                                                link.url}
                                        </span>

                                        <ExternalLink className="h-4 w-4 shrink-0" />

                                    </a>
                                )
                            )}


                        {linksCount > 2 && (
                            <p className="px-1 text-xs font-semibold text-slate-400">
                                Ще{" "}
                                {linksCount - 2}{" "}
                                посилання
                            </p>
                        )}

                    </div>

                </div>
            )}


            <div className="mt-auto pt-5">

                <div className="border-t border-slate-100 pt-5">

                    <div className="flex items-center gap-3">

                        <button
                            type="button"
                            onClick={
                                handleDetails
                            }
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700"
                        >

                            <Maximize2 className="h-4 w-4" />

                            Детальніше

                        </button>


                        <button
                            type="button"
                            onClick={
                                handleDelete
                            }
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100"
                            title="Видалити повідомлення"
                            aria-label="Видалити повідомлення"
                        >

                            <Trash2 className="h-4 w-4" />

                        </button>

                    </div>

                </div>

            </div>

        </article>
    );
};


export default NotificationCard;