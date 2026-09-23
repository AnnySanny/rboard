import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    collection,
    onSnapshot,
} from "firebase/firestore";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import {
    Users,
    FileText,
    CheckCircle2,
    Clock3,
    Eye,
    CalendarX2,
} from "lucide-react";

import { db } from "../../firebase";

const TYPE_COLORS = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#9333ea",
    "#dc2626",
    "#0891b2",
    "#ea580c",
    "#4f46e5",
    "#0d9488",
    "#db2777",
    "#65a30d",
    "#475569",
];

const STATUS_COLORS = {
    approved: "#16a34a",
    pending: "#f59e0b",
    cancelled: "#dc2626",
    expired: "#64748b",
};

const getDateFromFirestore = (
    value
) => {
    if (!value) {
        return null;
    }

    if (
        typeof value.toDate ===
        "function"
    ) {
        return value.toDate();
    }

    const date = new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
};

const isExpired = (listing) => {
    if (
        listing.status !==
        "approved"
    ) {
        return false;
    }

    const expiresAt =
        getDateFromFirestore(
            listing.expiresAt
        );

    if (!expiresAt) {
        return false;
    }

    return (
        expiresAt.getTime() <=
        Date.now()
    );
};

const getDayStart = (date) => {
    const result = new Date(date);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
};

const formatShortDate = (
    date
) => {
    return new Intl.DateTimeFormat(
        "uk-UA",
        {
            day: "2-digit",
            month: "2-digit",
        }
    ).format(date);
};

const StatisticCard = ({
    title,
    value,
    description,
    icon: Icon,
    iconClassName,
    iconBackground,
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground}`}
                >
                    <Icon
                        className={`h-5 w-5 ${iconClassName}`}
                    />
                </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
                {description}
            </p>
        </div>
    );
};

const ChartCard = ({
    title,
    description,
    children,
}) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
                <h2 className="text-lg font-black text-slate-900">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 text-sm text-slate-500">
                        {description}
                    </p>
                )}
            </div>

            {children}
        </div>
    );
};

const EmptyChart = () => {
    return (
        <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm font-semibold text-slate-400">
                Недостатньо даних
                для відображення
            </p>
        </div>
    );
};

const AdminStatistics = () => {
    const [listings, setListings] =
        useState([]);

    const [users, setUsers] =
        useState([]);

    const [listingsLoading, setListingsLoading] =
        useState(true);

    const [usersLoading, setUsersLoading] =
        useState(true);

    useEffect(() => {
        const unsubscribe =
            onSnapshot(
                collection(
                    db,
                    "listings"
                ),

                (snapshot) => {
                    setListings(
                        snapshot.docs.map(
                            (document) => ({
                                id:
                                    document.id,

                                ...document.data(),
                            })
                        )
                    );

                    setListingsLoading(
                        false
                    );
                },

                (error) => {
                    console.error(
                        "Помилка завантаження оголошень:",
                        error
                    );

                    setListingsLoading(
                        false
                    );
                }
            );

        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe =
            onSnapshot(
                collection(
                    db,
                    "users"
                ),

                (snapshot) => {
                    setUsers(
                        snapshot.docs.map(
                            (document) => ({
                                id:
                                    document.id,

                                ...document.data(),
                            })
                        )
                    );

                    setUsersLoading(
                        false
                    );
                },

                (error) => {
                    console.error(
                        "Помилка завантаження користувачів:",
                        error
                    );

                    setUsersLoading(
                        false
                    );
                }
            );

        return unsubscribe;
    }, []);

    const loading =
        listingsLoading ||
        usersLoading;
    const statistics =
        useMemo(() => {
            let approved = 0;
            let pending = 0;
            let cancelled = 0;
            let expired = 0;
            let views = 0;

            listings.forEach(
                (listing) => {
                    views += Number(
                        listing.views || 0
                    );

                    if (
                        isExpired(
                            listing
                        )
                    ) {
                        expired += 1;

                        return;
                    }

                    switch (
                    listing.status
                    ) {
                        case "approved":
                            approved += 1;
                            break;

                        case "pending":
                            pending += 1;
                            break;

                        case "cancelled":
                            cancelled += 1;
                            break;

                        default:
                            break;
                    }
                }
            );

            return {
                total:
                    listings.length,

                approved,
                pending,
                cancelled,
                expired,
                views,
            };
        }, [listings]);
    const typeData =
        useMemo(() => {
            const counts = {};

            listings.forEach(
                (listing) => {
                    const type =
                        listing.type ||
                        "Інше";

                    counts[type] =
                        (counts[
                            type
                        ] || 0) + 1;
                }
            );

            return Object.entries(
                counts
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
                    (a, b) =>
                        b.value -
                        a.value
                );
        }, [listings]);
    const statusData =
        useMemo(() => {
            return [
                {
                    name:
                        "Активні",
                    key:
                        "approved",
                    value:
                        statistics.approved,
                },

                {
                    name:
                        "На перевірці",
                    key:
                        "pending",
                    value:
                        statistics.pending,
                },

                {
                    name:
                        "Відхилені",
                    key:
                        "cancelled",
                    value:
                        statistics.cancelled,
                },

                {
                    name:
                        "Прострочені",
                    key:
                        "expired",
                    value:
                        statistics.expired,
                },
            ].filter(
                (item) =>
                    item.value > 0
            );
        }, [statistics]);
    const lastSevenDays =
        useMemo(() => {
            const today =
                getDayStart(
                    new Date()
                );

            const days = [];

            for (
                let index = 6;
                index >= 0;
                index -= 1
            ) {
                const date =
                    new Date(
                        today
                    );

                date.setDate(
                    today.getDate() -
                    index
                );

                days.push({
                    date,
                    key:
                        date.toISOString()
                            .slice(
                                0,
                                10
                            ),

                    name:
                        formatShortDate(
                            date
                        ),

                    count: 0,
                });
            }

            listings.forEach(
                (listing) => {
                    const createdAt =
                        getDateFromFirestore(
                            listing.createdAt
                        );

                    if (!createdAt) {
                        return;
                    }

                    const createdDay =
                        getDayStart(
                            createdAt
                        );

                    const day =
                        days.find(
                            (
                                item
                            ) =>
                                item.date.getTime() ===
                                createdDay.getTime()
                        );

                    if (day) {
                        day.count +=
                            1;
                    }
                }
            );

            return days;
        }, [listings]);

    const topTypes =
        typeData.slice(0, 6);
    const blockedUsersCount = useMemo(() => {
        return users.filter(
            (user) => user.blocked === true
        ).length;
    }, [users]);
    if (loading) {
        return (
            <section className="rounded-3xl border border-slate-200 bg-white px-6 py-24 text-center shadow-sm">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="mt-4 text-sm font-bold text-slate-500">
                    Завантаження
                    статистики...
                </p>
            </section>
        );
    }

    return (
        <section>

            <div className="mb-7">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                    Аналітика
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Статистика
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Основні показники
                    користувачів,
                    оголошень та
                    активності сервісу.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <StatisticCard
                    title="Користувачі"
                    value={users.length}
                    description={
                        <>
                            Зареєстровано у системі{" "}
                            <span className="font-bold text-red-600">
                                ({blockedUsersCount} заблоковано)
                            </span>
                        </>
                    }
                    icon={Users}
                    iconBackground="bg-blue-50"
                    iconClassName="text-blue-600"
                />

                <StatisticCard
                    title="Оголошення"
                    value={
                        statistics.total
                    }
                    description="Усього створено"
                    icon={FileText}
                    iconBackground="bg-indigo-50"
                    iconClassName="text-indigo-600"
                />

                <StatisticCard
                    title="Активні"
                    value={
                        statistics.approved
                    }
                    description="Зараз опубліковані"
                    icon={
                        CheckCircle2
                    }
                    iconBackground="bg-emerald-50"
                    iconClassName="text-emerald-600"
                />

                <StatisticCard
                    title="На перевірці"
                    value={
                        statistics.pending
                    }
                    description="Очікують модерації"
                    icon={Clock3}
                    iconBackground="bg-amber-50"
                    iconClassName="text-amber-600"
                />

                <StatisticCard
                    title="Прострочені"
                    value={
                        statistics.expired
                    }
                    description="Завершився термін"
                    icon={
                        CalendarX2
                    }
                    iconBackground="bg-slate-100"
                    iconClassName="text-slate-600"
                />

                <StatisticCard
                    title="Перегляди"
                    value={
                        statistics.views.toLocaleString(
                            "uk-UA"
                        )
                    }
                    description="Усіх оголошень"
                    icon={Eye}
                    iconBackground="bg-violet-50"
                    iconClassName="text-violet-600"
                />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <ChartCard
                    title="Нові оголошення"
                    description="Кількість створених оголошень за останні 7 днів"
                >
                    <div className="h-[300px]">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <BarChart
                                data={
                                    lastSevenDays
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
                                    dataKey="name"
                                    tickLine={
                                        false
                                    }
                                    axisLine={
                                        false
                                    }
                                    fontSize={
                                        12
                                    }
                                    stroke="#94a3b8"
                                />

                                <YAxis
                                    allowDecimals={
                                        false
                                    }
                                    tickLine={
                                        false
                                    }
                                    axisLine={
                                        false
                                    }
                                    fontSize={
                                        12
                                    }
                                    stroke="#94a3b8"
                                />

                                <Tooltip
                                    cursor={{
                                        fill:
                                            "#f8fafc",
                                    }}
                                    formatter={(
                                        value
                                    ) => [
                                            value,
                                            "Оголошень",
                                        ]}
                                    labelFormatter={(
                                        value
                                    ) =>
                                        `Дата: ${value}`
                                    }
                                />

                                <Bar
                                    dataKey="count"
                                    name="Оголошення"
                                    fill="#2563eb"
                                    radius={[
                                        7,
                                        7,
                                        0,
                                        0,
                                    ]}
                                    maxBarSize={
                                        50
                                    }
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Статуси оголошень"
                    description="Поточний стан усіх оголошень"
                >
                    {statusData.length >
                        0 ? (
                        <>
                            <div className="h-[220px]">
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
                                            innerRadius={
                                                60
                                            }
                                            outerRadius={
                                                90
                                            }
                                            paddingAngle={
                                                3
                                            }
                                        >
                                            {statusData.map(
                                                (
                                                    item
                                                ) => (
                                                    <Cell
                                                        key={
                                                            item.key
                                                        }
                                                        fill={
                                                            STATUS_COLORS[
                                                            item
                                                                .key
                                                            ]
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>

                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {statusData.map(
                                    (
                                        item
                                    ) => (
                                        <div
                                            key={
                                                item.key
                                            }
                                            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            STATUS_COLORS[
                                                            item
                                                                .key
                                                            ],
                                                    }}
                                                />

                                                <span className="truncate text-xs font-semibold text-slate-600">
                                                    {
                                                        item.name
                                                    }
                                                </span>
                                            </div>

                                            <strong className="text-sm text-slate-900">
                                                {
                                                    item.value
                                                }
                                            </strong>
                                        </div>
                                    )
                                )}
                            </div>
                        </>
                    ) : (
                        <EmptyChart />
                    )}
                </ChartCard>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.3fr]">
                <ChartCard
                    title="Оголошення за типами"
                    description="Розподіл усіх оголошень"
                >
                    {typeData.length >
                        0 ? (
                        <div className="h-[330px]">
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
                                        innerRadius={
                                            65
                                        }
                                        outerRadius={
                                            105
                                        }
                                        paddingAngle={
                                            2
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
                                                        TYPE_COLORS[
                                                        index %
                                                        TYPE_COLORS.length
                                                        ]
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart />
                    )}
                </ChartCard>

                <ChartCard
                    title="Найпопулярніші типи"
                    description="Типи з найбільшою кількістю оголошень"
                >
                    {topTypes.length >
                        0 ? (
                        <div className="h-[330px]">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        topTypes
                                    }
                                    layout="vertical"
                                    margin={{
                                        top: 5,
                                        right: 20,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        horizontal={
                                            false
                                        }
                                        stroke="#e2e8f0"
                                    />

                                    <XAxis
                                        type="number"
                                        allowDecimals={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                        axisLine={
                                            false
                                        }
                                        fontSize={
                                            12
                                        }
                                        stroke="#94a3b8"
                                    />

                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={
                                            130
                                        }
                                        tickLine={
                                            false
                                        }
                                        axisLine={
                                            false
                                        }
                                        fontSize={
                                            11
                                        }
                                        stroke="#64748b"
                                    />

                                    <Tooltip
                                        formatter={(
                                            value
                                        ) => [
                                                value,
                                                "Оголошень",
                                            ]}
                                    />

                                    <Bar
                                        dataKey="value"
                                        name="Оголошення"
                                        fill="#2563eb"
                                        radius={[
                                            0,
                                            7,
                                            7,
                                            0,
                                        ]}
                                        maxBarSize={
                                            32
                                        }
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart />
                    )}
                </ChartCard>
            </div>
        </section>
    );
};

export default AdminStatistics;