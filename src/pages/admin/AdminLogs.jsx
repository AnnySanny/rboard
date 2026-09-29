import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";

import {
    Activity,
    BadgeCheck,
    Ban,
    CheckCircle2,
    ChevronDown,
    FilePenLine,
    FilePlus2,
    FileText,
    Filter,
    Loader2,
    MessageSquare,
    Newspaper,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    User,
    UserRoundX,
    XCircle,
} from "lucide-react";

import Swal from "sweetalert2";

import {
    db,
} from "../../firebase";


const CATEGORY_OPTIONS = [
    {
        value: "all",
        label: "Усі події",
    },
    {
        value: "listings",
        label: "Оголошення",
    },
    {
        value: "users",
        label: "Користувачі",
    },
    {
        value: "feedback",
        label: "Звернення",
    },
    {
        value: "news",
        label: "Новини",
    },
    {
        value: "touristPlaces",
        label: "Туристичні місця",
    },
];


const getActionIcon = (
    action
) => {
    switch (action) {
        case "listing_created":
            return FilePlus2;

        case "listing_updated":
            return FilePenLine;

        case "listing_approved":
            return CheckCircle2;

        case "listing_rejected":
            return XCircle;

        case "listing_deleted":
            return Trash2;

        case "user_blocked":
            return Ban;

        case "user_unblocked":
            return BadgeCheck;

        case "user_deleted":
            return UserRoundX;

        case "feedback_updated":
            return MessageSquare;

        case "feedback_deleted":
            return Trash2;

        case "news_created":
        case "news_updated":
        case "news_deleted":
            return Newspaper;

        default:
            return Activity;
    }
};


const getActionStyle = (
    action
) => {
    if (
        action.includes("deleted") ||
        action.includes("blocked") ||
        action.includes("rejected")
    ) {
        return {
            icon:
                "bg-red-50 text-red-600",

            dot:
                "bg-red-500",
        };
    }

    if (
        action.includes("approved") ||
        action.includes("unblocked")
    ) {
        return {
            icon:
                "bg-emerald-50 text-emerald-600",

            dot:
                "bg-emerald-500",
        };
    }

    if (
        action.includes("created")
    ) {
        return {
            icon:
                "bg-blue-50 text-blue-600",

            dot:
                "bg-blue-500",
        };
    }

    if (
        action.includes("updated")
    ) {
        return {
            icon:
                "bg-amber-50 text-amber-600",

            dot:
                "bg-amber-500",
        };
    }

    return {
        icon:
            "bg-slate-100 text-slate-600",

        dot:
            "bg-slate-400",
    };
};


const formatLogDate = (
    timestamp
) => {
    if (!timestamp) {
        return {
            date: "—",
            time: "—",
        };
    }

    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

    return {
        date:
            new Intl.DateTimeFormat(
                "uk-UA",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                }
            ).format(date),

        time:
            new Intl.DateTimeFormat(
                "uk-UA",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                }
            ).format(date),
    };
};


const AdminLogs = () => {
    const [logs, setLogs] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const [
        selectedCategory,
        setSelectedCategory,
    ] = useState("all");

    const [
        clearing,
        setClearing,
    ] = useState(false);


    /*
     * =========================================
     * ЗАВАНТАЖЕННЯ ЛОГІВ
     * =========================================
     */

    useEffect(() => {
        const logsQuery =
            query(
                collection(
                    db,
                    "adminLogs"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const unsubscribe =
            onSnapshot(
                logsQuery,
                (snapshot) => {
                    const data =
                        snapshot.docs.map(
                            (
                                document
                            ) => ({
                                id:
                                    document.id,

                                ...document.data(),
                            })
                        );

                    setLogs(data);
                    setLoading(false);
                },
                (error) => {
                    console.error(
                        "Помилка завантаження логів:",
                        error
                    );

                    setLoading(false);
                }
            );

        return unsubscribe;
    }, []);


    /*
     * =========================================
     * ФІЛЬТРАЦІЯ
     * =========================================
     */

    const filteredLogs =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLowerCase();

            return logs.filter(
                (log) => {
                    if (
                        selectedCategory !==
                        "all" &&
                        log.category !==
                        selectedCategory
                    ) {
                        return false;
                    }

                    if (
                        !normalizedSearch
                    ) {
                        return true;
                    }

                    const searchText = [
                        log.adminName,
                        log.title,
                        log.description,
                        log.targetName,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return searchText.includes(
                        normalizedSearch
                    );
                }
            );
        }, [
            logs,
            search,
            selectedCategory,
        ]);


    /*
     * =========================================
     * ОЧИЩЕННЯ
     * =========================================
     */

    const clearLogs = async (
        days
    ) => {
        const label =
            days === 1
                ? "старші 1 дня"
                : `старші ${days} днів`;

        const result =
            await Swal.fire({
                icon: "warning",

                title:
                    "Очистити системні логи?",

                text:
                    `Будуть видалені всі записи ${label}. Цю дію неможливо скасувати.`,

                showCancelButton:
                    true,

                confirmButtonText:
                    "Очистити",

                cancelButtonText:
                    "Скасувати",

                confirmButtonColor:
                    "#dc2626",
            });

        if (!result.isConfirmed) {
            return;
        }

        try {
            setClearing(true);

            const threshold =
                new Date();

            threshold.setDate(
                threshold.getDate() -
                days
            );

            const logsQuery =
                query(
                    collection(
                        db,
                        "adminLogs"
                    ),
                    where(
                        "createdAt",
                        "<",
                        threshold
                    )
                );

            const snapshot =
                await getDocs(
                    logsQuery
                );

            await Promise.all(
                snapshot.docs.map(
                    (logDocument) =>
                        deleteDoc(
                            doc(
                                db,
                                "adminLogs",
                                logDocument.id
                            )
                        )
                )
            );

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title:
                    "Логи очищено",
                showConfirmButton:
                    false,
                timer: 2200,
            });
        } catch (error) {
            console.error(
                "Помилка очищення логів:",
                error
            );

            await Swal.fire({
                icon: "error",
                title:
                    "Помилка",
                text:
                    "Не вдалося очистити системні логи.",
            });
        } finally {
            setClearing(false);
        }
    };


    /*
     * =========================================
     * UI
     * =========================================
     */

    return (
        <section className="space-y-6">

            {/* HEADER */}

            <div className="
                rounded-3xl
                border border-slate-200
                bg-white
                p-6
                shadow-sm
                sm:p-8
            ">
                <div className="
                    flex
                    flex-col
                    gap-5
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                ">
                    <div>
                        <div className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            font-bold
                            uppercase
                            tracking-wider
                            text-blue-600
                        ">
                            <ShieldCheck
                                size={18}
                            />

                            Системний журнал
                        </div>

                        <h1 className="
                            mt-3
                            text-3xl
                            font-black
                            tracking-tight
                            text-slate-950
                        ">
                            Логи системи
                        </h1>

                        <p className="
                            mt-3
                            max-w-2xl
                            text-base
                            leading-7
                            text-slate-600
                        ">
                            Історія адміністративних
                            дій та змін у сервісі
                            RBoard.
                        </p>
                    </div>

                    <div className="
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        bg-blue-50
                        px-5
                        py-4
                    ">
                        <Activity
                            size={22}
                            className="
                                text-blue-600
                            "
                        />

                        <div>
                            <p className="
                                text-xs
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-400
                            ">
                                Всього записів
                            </p>

                            <p className="
                                text-2xl
                                font-black
                                text-slate-950
                            ">
                                {logs.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            {/* ФІЛЬТРИ */}

            <div className="
                rounded-3xl
                border border-slate-200
                bg-white
                p-5
                shadow-sm
            ">
                <div className="
                    flex
                    flex-col
                    gap-3
                    xl:flex-row
                    xl:items-center
                    xl:justify-between
                ">

                    <div className="
                        flex
                        flex-1
                        flex-col
                        gap-3
                        sm:flex-row
                    ">

                        {/* ПОШУК */}

                        <div className="
                            relative
                            flex-1
                        ">
                            <Search
                                size={18}
                                className="
                                    absolute
                                    left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                "
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Пошук у журналі..."
                                className="
                                    h-12
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    pl-11
                                    pr-4
                                    text-sm
                                    outline-none
                                    transition
                                    focus:border-blue-500
                                    focus:bg-white
                                    focus:ring-4
                                    focus:ring-blue-100
                                "
                            />
                        </div>


                        {/* КАТЕГОРІЯ */}

                        <div className="
                            relative
                            sm:w-56
                        ">
                            <Filter
                                size={17}
                                className="
                                    pointer-events-none
                                    absolute
                                    left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                "
                            />

                            <select
                                value={
                                    selectedCategory
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSelectedCategory(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className="
                                    h-12
                                    w-full
                                    appearance-none
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    pl-11
                                    pr-10
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                    outline-none
                                    transition
                                    focus:border-blue-500
                                    focus:bg-white
                                    focus:ring-4
                                    focus:ring-blue-100
                                "
                            >
                                {CATEGORY_OPTIONS.map(
                                    (
                                        option
                                    ) => (
                                        <option
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>

                            <ChevronDown
                                size={17}
                                className="
                                    pointer-events-none
                                    absolute
                                    right-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                "
                            />
                        </div>
                    </div>


                    {/* ОЧИЩЕННЯ */}

                    <div className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                    ">
                        <span className="
                            mr-1
                            text-xs
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-400
                        ">
                            Очистити старші:
                        </span>

                        {[1, 7, 30].map(
                            (days) => (
                                <button
                                    key={days}
                                    type="button"
                                    disabled={
                                        clearing
                                    }
                                    onClick={() =>
                                        clearLogs(
                                            days
                                        )
                                    }
                                    className="
                                        rounded-lg
                                        border
                                        border-slate-200
                                        bg-white
                                        px-3
                                        py-2
                                        text-xs
                                        font-bold
                                        text-slate-600
                                        transition
                                        hover:border-red-200
                                        hover:bg-red-50
                                        hover:text-red-600
                                        disabled:opacity-50
                                    "
                                >
                                    {days} дн.
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>


            {/* ЖУРНАЛ */}

            <div className="
                overflow-hidden
                rounded-3xl
                border
                border-slate-200
                bg-white
                shadow-sm
            ">
                <div className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-slate-100
                    px-6
                    py-5
                ">
                    <div>
                        <h2 className="
                            font-black
                            text-slate-950
                        ">
                            Журнал активності
                        </h2>

                        <p className="
                            mt-1
                            text-xs
                            text-slate-400
                        ">
                            Показано:{" "}
                            {
                                filteredLogs.length
                            }
                        </p>
                    </div>

                    <RefreshCw
                        size={18}
                        className="
                            text-slate-300
                        "
                    />
                </div>


                {loading ? (
                    <div className="
                        flex
                        min-h-[300px]
                        items-center
                        justify-center
                    ">
                        <Loader2
                            size={28}
                            className="
                                animate-spin
                                text-blue-600
                            "
                        />
                    </div>
                ) : filteredLogs.length ===
                    0 ? (
                    <div className="
                        flex
                        min-h-[300px]
                        flex-col
                        items-center
                        justify-center
                        px-6
                        text-center
                    ">
                        <div className="
                            flex
                            h-14 w-14
                            items-center
                            justify-center
                            rounded-2xl
                            bg-slate-100
                            text-slate-400
                        ">
                            <FileText
                                size={25}
                            />
                        </div>

                        <h3 className="
                            mt-4
                            font-bold
                            text-slate-900
                        ">
                            Записів не знайдено
                        </h3>

                        <p className="
                            mt-1
                            text-sm
                            text-slate-500
                        ">
                            Журнал поки порожній
                            або записи не
                            відповідають фільтрам.
                        </p>
                    </div>
                ) : (
                    <div className="
    max-h-[620px]
    overflow-y-auto
    px-4
    py-2
    sm:px-6

    scrollbar-thin
    scrollbar-track-transparent
    scrollbar-thumb-slate-200
">
                        {filteredLogs.map(
                            (
                                log,
                                index
                            ) => {
                                const Icon =
                                    getActionIcon(
                                        log.action
                                    );

                                const style =
                                    getActionStyle(
                                        log.action
                                    );

                                const {
                                    date,
                                    time,
                                } =
                                    formatLogDate(
                                        log.createdAt
                                    );

                                return (
                                    <div
                                        key={
                                            log.id
                                        }
                                        className="
                                            relative
                                            flex
                                            gap-3
                                            py-3
                                        "
                                    >
                                        {/* TIMELINE */}

                                        <div className="
                                            relative
                                            flex
                                            w-8
                                            shrink-0
                                            justify-center
                                        ">
                                            {index !==
                                                filteredLogs.length -
                                                1 && (
                                                    <div className="
                                                    absolute
                                                    bottom-[-20px]
                                                    top-11
                                                    w-px
                                                    bg-slate-200
                                                " />
                                                )}

                                            <div
                                                className={`
                                                    relative
                                                    z-10
                                                    flex
                                                    h-11
                                                    w-11
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    ${style.icon}
                                                `}
                                            >
                                                <Icon
                                                    size={
                                                        19
                                                    }
                                                />
                                            </div>
                                        </div>


                                        {/* CONTENT */}

                                        <div className="
                                            min-w-0
                                            flex-1
                                            rounded-2xl
                                            border
                                            border-slate-100
                                            bg-slate-50/70
                                            p-4
                                            transition
                                            hover:border-slate-200
                                            hover:bg-slate-50
                                        ">
                                            <div className="
                                                flex
                                                flex-col
                                                gap-2
                                                sm:flex-row
                                                sm:items-start
                                                sm:justify-between
                                            ">
                                                <div>
                                                    <div className="
                                                        flex
                                                        flex-wrap
                                                        items-center
                                                        gap-2
                                                    ">
                                                        <div className="
                                                            flex
                                                            h-7
                                                            w-7
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            bg-blue-100
                                                            text-blue-600
                                                        ">
                                                            <User
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                        </div>

                                                        <span className="
                                                            text-sm
                                                            font-bold
                                                            text-slate-900
                                                        ">
                                                            {log.adminName ||
                                                                "Адміністратор"}
                                                        </span>

                                                        <span
                                                            className={`
                                                                h-1.5
                                                                w-1.5
                                                                rounded-full
                                                                ${style.dot}
                                                            `}
                                                        />
                                                    </div>

                                                    <h3 className="
                                                        mt-3
                                                        font-bold
                                                        text-slate-950
                                                    ">
                                                        {log.title}
                                                    </h3>

                                                    {log.description && (
                                                        <p className="
                                                            mt-1
                                                            text-sm
                                                            leading-6
                                                            text-slate-600
                                                        ">
                                                            {
                                                                log.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>


                                                {/* TIME */}

                                                <div className="
                                                    shrink-0
                                                    text-left
                                                    sm:text-right
                                                ">
                                                    <p className="
                                                        text-sm
                                                        font-bold
                                                        text-slate-700
                                                    ">
                                                        {time}
                                                    </p>

                                                    <p className="
                                                        mt-0.5
                                                        text-xs
                                                        text-slate-400
                                                    ">
                                                        {date}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AdminLogs;