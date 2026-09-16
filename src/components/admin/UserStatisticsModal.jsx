import { useMemo } from "react";

import {
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";


const CHART_COLORS = [
    "#2563eb",
    "#0ea5e9",
    "#14b8a6",
    "#22c55e",
    "#f59e0b",
    "#f97316",
    "#8b5cf6",
    "#ec4899",
    "#64748b",
];


const STATUS_COLORS = {
    approved: "#22c55e",
    pending: "#f59e0b",
    cancelled: "#ef4444",
};


const UserStatisticsModal = ({
    user,
    onClose,
}) => {
    /*
     * Усі оголошення користувача.
     */
    const listings = useMemo(
        () =>
            Array.isArray(user?.listings)
                ? user.listings
                : [],
        [user]
    );


    /*
     * Основна статистика
     */
    const statistics = useMemo(() => {
        const total = listings.length;

        const approved =
            listings.filter(
                (listing) =>
                    listing.status ===
                    "approved"
            ).length;

        const pending =
            listings.filter(
                (listing) =>
                    listing.status ===
                    "pending"
            ).length;

        const cancelled =
            listings.filter(
                (listing) =>
                    listing.status ===
                    "cancelled"
            ).length;


        const totalViews =
            listings.reduce(
                (totalValue, listing) =>
                    totalValue +
                    Number(
                        listing.views ?? 0
                    ),
                0
            );


        const averageViews =
            total > 0
                ? Math.round(
                      totalViews / total
                  )
                : 0;


        const approvalRate =
            total > 0
                ? Math.round(
                      (approved / total) *
                          100
                  )
                : 0;


        /*
         * Найбільше переглядів
         */
        const mostViewed =
            listings.length > 0
                ? [...listings].sort(
                      (first, second) =>
                          Number(
                              second.views ??
                                  0
                          ) -
                          Number(
                              first.views ??
                                  0
                          )
                  )[0]
                : null;


        return {
            total,
            approved,
            pending,
            cancelled,
            totalViews,
            averageViews,
            approvalRate,
            mostViewed,
        };
    }, [listings]);


    /*
     * КРУГОВА ДІАГРАМА №1
     *
     * Розподіл за статусами
     */
    const statusData =
        useMemo(() => {
            const result = [
                {
                    name:
                        "Опубліковані",
                    value:
                        statistics.approved,
                    color:
                        STATUS_COLORS.approved,
                },

                {
                    name:
                        "На перевірці",
                    value:
                        statistics.pending,
                    color:
                        STATUS_COLORS.pending,
                },

                {
                    name:
                        "Скасовані",
                    value:
                        statistics.cancelled,
                    color:
                        STATUS_COLORS.cancelled,
                },
            ];

            return result.filter(
                (item) =>
                    item.value > 0
            );
        }, [statistics]);


    /*
     * КРУГОВА ДІАГРАМА №2
     *
     * Розподіл за категоріями
     */
    const typeData =
        useMemo(() => {
            const typeCounts = {};

            listings.forEach(
                (listing) => {
                    const type =
                        listing.type ||
                        "Інше";

                    typeCounts[type] =
                        (typeCounts[
                            type
                        ] || 0) + 1;
                }
            );


            return Object.entries(
                typeCounts
            )
                .map(
                    ([
                        name,
                        value,
                    ]) => ({
                        name,
                        value,
                    })
                )
                .sort(
                    (first, second) =>
                        second.value -
                        first.value
                );
        }, [listings]);


    /*
     * Найчастіша категорія
     */
    const mostPopularType =
        useMemo(() => {
            if (
                typeData.length === 0
            ) {
                return null;
            }

            return typeData[0];
        }, [typeData]);


    /*
     * ГРАФІК ЗА 30 ДНІВ
     */
    const publicationData =
        useMemo(() => {
            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );


            const days = [];


            /*
             * Створюємо всі 30 днів,
             * навіть якщо в конкретний
             * день оголошень не було.
             */
            for (
                let i = 29;
                i >= 0;
                i--
            ) {
                const date =
                    new Date(today);

                date.setDate(
                    today.getDate() -
                        i
                );


                days.push({
                    key:
                        getLocalDateKey(
                            date
                        ),

                    date:
                        date.toLocaleDateString(
                            "uk-UA",
                            {
                                day:
                                    "2-digit",

                                month:
                                    "2-digit",
                            }
                        ),

                    fullDate:
                        date.toLocaleDateString(
                            "uk-UA",
                            {
                                day:
                                    "numeric",

                                month:
                                    "long",

                                year:
                                    "numeric",
                            }
                        ),

                    count: 0,
                });
            }


            const daysMap =
                new Map(
                    days.map(
                        (day) => [
                            day.key,
                            day,
                        ]
                    )
                );


            /*
             * Розкладаємо оголошення
             * по днях.
             */
            listings.forEach(
                (listing) => {
                    const createdDate =
                        getListingDate(
                            listing.createdAt
                        );

                    if (
                        !createdDate
                    ) {
                        return;
                    }


                    const key =
                        getLocalDateKey(
                            createdDate
                        );


                    const day =
                        daysMap.get(
                            key
                        );


                    if (day) {
                        day.count += 1;
                    }
                }
            );


            return days;
        }, [listings]);


    /*
     * Скільки оголошень
     * створено за останні 30 днів.
     */
    const listingsLast30Days =
        useMemo(
            () =>
                publicationData.reduce(
                    (
                        total,
                        day
                    ) =>
                        total +
                        day.count,
                    0
                ),
            [publicationData]
        );


    /*
     * Найактивніший день
     */
    const mostActiveDay =
        useMemo(() => {
            const daysWithListings =
                publicationData.filter(
                    (day) =>
                        day.count > 0
                );

            if (
                daysWithListings.length ===
                0
            ) {
                return null;
            }


            return [
                ...daysWithListings,
            ].sort(
                (first, second) =>
                    second.count -
                    first.count
            )[0];
        }, [publicationData]);


    if (!user) {
        return null;
    }


    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

                {/* HEADER */}
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-7">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                            Аналітика
                        </span>

                        <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                            {user.login ||
                                "Користувач"}
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Статистика
                            оголошень та
                            активності
                            користувача на
                            RBoard.
                        </p>
                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Закрити"
                    >
                        <CloseIcon />
                    </button>
                </div>


                {/* SCROLL CONTENT */}
                <div className="overflow-y-auto p-5 sm:p-7">

                    {/* ГОЛОВНІ ПОКАЗНИКИ */}
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

                        <ModalStat
                            label="Оголошень"
                            value={
                                statistics.total
                            }
                            description={`${statistics.pending} на перевірці`}
                        />

                        <ModalStat
                            label="Активних"
                            value={
                                statistics.approved
                            }
                            description={`${statistics.approvalRate}% від усіх`}
                            green
                        />

                        <ModalStat
                            label="Переглядів"
                            value={
                                statistics.totalViews
                            }
                            description="Загальна кількість"
                            blue
                        />

                        <ModalStat
                            label="Середні перегляди"
                            value={
                                statistics.averageViews
                            }
                            description="На одне оголошення"
                        />
                    </div>


                    {/* ДВІ КРУГОВІ */}
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">

                        {/* STATUS PIE */}
                        <ChartCard
                            title="Статуси оголошень"
                            description="Розподіл усіх оголошень користувача за статусом."
                        >
                            {statusData.length >
                            0 ? (
                                <>
                                    <div className="h-[270px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={
                                                        statusData
                                                    }
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="48%"
                                                    outerRadius="76%"
                                                    paddingAngle={
                                                        3
                                                    }
                                                    strokeWidth={
                                                        0
                                                    }
                                                >
                                                    {statusData.map(
                                                        (
                                                            item
                                                        ) => (
                                                            <Cell
                                                                key={
                                                                    item.name
                                                                }
                                                                fill={
                                                                    item.color
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </Pie>

                                                <Tooltip
                                                    content={
                                                        <PieTooltip />
                                                    }
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>


                                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                        {statusData.map(
                                            (
                                                item
                                            ) => (
                                                <LegendItem
                                                    key={
                                                        item.name
                                                    }
                                                    color={
                                                        item.color
                                                    }
                                                    label={
                                                        item.name
                                                    }
                                                    value={
                                                        item.value
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </>
                            ) : (
                                <EmptyChart />
                            )}
                        </ChartCard>


                        {/* TYPE PIE */}
                        <ChartCard
                            title="Типи оголошень"
                            description="Які категорії користувач використовує найчастіше."
                        >
                            {typeData.length >
                            0 ? (
                                <>
                                    <div className="h-[270px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={
                                                        typeData
                                                    }
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="48%"
                                                    outerRadius="76%"
                                                    paddingAngle={
                                                        2
                                                    }
                                                    strokeWidth={
                                                        0
                                                    }
                                                >
                                                    {typeData.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <Cell
                                                                key={
                                                                    item.name
                                                                }
                                                                fill={
                                                                    CHART_COLORS[
                                                                        index %
                                                                            CHART_COLORS.length
                                                                    ]
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </Pie>

                                                <Tooltip
                                                    content={
                                                        <PieTooltip />
                                                    }
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>


                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {typeData.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <LegendItem
                                                    key={
                                                        item.name
                                                    }
                                                    color={
                                                        CHART_COLORS[
                                                            index %
                                                                CHART_COLORS.length
                                                        ]
                                                    }
                                                    label={
                                                        item.name
                                                    }
                                                    value={
                                                        item.value
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </>
                            ) : (
                                <EmptyChart />
                            )}
                        </ChartCard>
                    </div>


                    {/* ГРАФІК 30 ДНІВ */}
                    <div className="mt-6">
                        <ChartCard
                            title="Публікації за останні 30 днів"
                            description="Кількість створених оголошень користувача по днях."
                        >
                            <div className="mt-4 h-[310px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <LineChart
                                        data={
                                            publicationData
                                        }
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -20,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="4 4"
                                            vertical={
                                                false
                                            }
                                            stroke="#e2e8f0"
                                        />

                                        <XAxis
                                            dataKey="date"
                                            axisLine={
                                                false
                                            }
                                            tickLine={
                                                false
                                            }
                                            tick={{
                                                fill:
                                                    "#94a3b8",
                                                fontSize: 11,
                                            }}
                                            interval={
                                                4
                                            }
                                        />

                                        <YAxis
                                            allowDecimals={
                                                false
                                            }
                                            axisLine={
                                                false
                                            }
                                            tickLine={
                                                false
                                            }
                                            tick={{
                                                fill:
                                                    "#94a3b8",
                                                fontSize: 11,
                                            }}
                                        />

                                        <Tooltip
                                            content={
                                                <LineTooltip />
                                            }
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#2563eb"
                                            strokeWidth={
                                                3
                                            }
                                            dot={
                                                false
                                            }
                                            activeDot={{
                                                r: 5,
                                                fill:
                                                    "#2563eb",
                                                stroke:
                                                    "#ffffff",
                                                strokeWidth: 2,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    </div>


                    {/* АНАЛІТИКА */}
                    <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <AnalyticsIcon />
                            </div>

                            <div>
                                <h3 className="text-lg font-black text-slate-950">
                                    Коротка
                                    аналітика
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Основні
                                    показники
                                    активності
                                    цього
                                    користувача.
                                </p>
                            </div>
                        </div>


                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                            <AnalyticsItem
                                label="За останні 30 днів"
                                value={`${listingsLast30Days} оголошень`}
                            />

                            <AnalyticsItem
                                label="Частка опублікованих"
                                value={`${statistics.approvalRate}%`}
                            />

                            <AnalyticsItem
                                label="Середні перегляди"
                                value={`${statistics.averageViews} на оголошення`}
                            />

                            <AnalyticsItem
                                label="Найчастіший тип"
                                value={
                                    mostPopularType
                                        ? `${mostPopularType.name} (${mostPopularType.value})`
                                        : "Немає даних"
                                }
                            />

                            <AnalyticsItem
                                label="Найактивніший день"
                                value={
                                    mostActiveDay
                                        ? `${mostActiveDay.fullDate} — ${mostActiveDay.count}`
                                        : "Немає активності"
                                }
                            />

                            <AnalyticsItem
                                label="Відхилених"
                                value={`${statistics.cancelled} з ${statistics.total}`}
                            />
                        </div>


                        {/* MOST VIEWED */}
                        <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                Найбільш
                                переглядуване
                                оголошення
                            </p>

                            {statistics.mostViewed &&
                            statistics.totalViews >
                                0 ? (
                                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <div className="min-w-0">
                                        <p className="truncate font-black text-slate-900">
                                            {statistics
                                                .mostViewed
                                                .title ||
                                                "Без назви"}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {statistics
                                                .mostViewed
                                                .type ||
                                                "Інше"}
                                        </p>
                                    </div>


                                    <div className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
                                        <EyeIcon />

                                        {Number(
                                            statistics
                                                .mostViewed
                                                .views ??
                                                0
                                        )}

                                        <span className="font-semibold">
                                            переглядів
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-slate-500">
                                    Переглядів
                                    поки немає.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


/*
 * Верхня картка
 */
const ModalStat = ({
    label,
    value,
    description,
    green = false,
    blue = false,
}) => {
    let valueClass =
        "text-slate-950";

    if (green) {
        valueClass =
            "text-emerald-600";
    }

    if (blue) {
        valueClass =
            "text-blue-600";
    }


    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">
                {label}
            </p>

            <p
                className={`mt-2 text-2xl font-black sm:text-3xl ${valueClass}`}
            >
                {value}
            </p>

            {description && (
                <p className="mt-1 text-xs font-medium text-slate-400">
                    {description}
                </p>
            )}
        </div>
    );
};


/*
 * Контейнер графіка
 */
const ChartCard = ({
    title,
    description,
    children,
}) => (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
            <h3 className="text-base font-black text-slate-950 sm:text-lg">
                {title}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
            </p>
        </div>

        {children}
    </section>
);


/*
 * Legend
 */
const LegendItem = ({
    color,
    label,
    value,
}) => (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
            <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                    backgroundColor:
                        color,
                }}
            />

            <span className="truncate text-xs font-semibold text-slate-600">
                {label}
            </span>
        </div>

        <span className="shrink-0 text-xs font-black text-slate-900">
            {value}
        </span>
    </div>
);


/*
 * Tooltip Pie
 */
const PieTooltip = ({
    active,
    payload,
}) => {
    if (
        !active ||
        !payload?.length
    ) {
        return null;
    }

    const item =
        payload[0];

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
            <p className="text-xs font-semibold text-slate-500">
                {item.name}
            </p>

            <p className="mt-1 text-sm font-black text-slate-950">
                {item.value} огол.
            </p>
        </div>
    );
};


/*
 * Tooltip Line
 */
const LineTooltip = ({
    active,
    payload,
}) => {
    if (
        !active ||
        !payload?.length
    ) {
        return null;
    }

    const data =
        payload[0]?.payload;

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
            <p className="text-xs font-semibold text-slate-500">
                {data?.fullDate}
            </p>

            <p className="mt-1 text-sm font-black text-blue-600">
                {data?.count ?? 0} огол.
            </p>
        </div>
    );
};


/*
 * Analytics item
 */
const AnalyticsItem = ({
    label,
    value,
}) => (
    <div className="rounded-2xl border border-blue-100 bg-white p-4">
        <p className="text-xs font-bold text-slate-400">
            {label}
        </p>

        <p className="mt-2 text-sm font-black leading-5 text-slate-900">
            {value}
        </p>
    </div>
);


/*
 * Empty state
 */
const EmptyChart = () => (
    <div className="flex h-[270px] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
            Недостатньо даних
            для побудови
            діаграми
        </p>
    </div>
);


/*
 * Firestore Timestamp -> Date
 */
const getListingDate = (
    value
) => {
    if (!value) {
        return null;
    }

    const date =
        value?.toDate?.() ||
        (value instanceof Date
            ? value
            : new Date(value));

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
};


/*
 * Локальний YYYY-MM-DD.
 *
 * Не використовуємо
 * toISOString(), щоб дата
 * не зміщувалась через UTC.
 */
const getLocalDateKey = (
    date
) => {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


/*
 * Icons
 */
const CloseIcon = () => (
    <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);


const AnalyticsIcon = () => (
    <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
    >
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
    </svg>
);


const EyeIcon = () => (
    <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle
            cx="12"
            cy="12"
            r="3"
        />
    </svg>
);


export default UserStatisticsModal;