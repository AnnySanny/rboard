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

const UserListingsStatistics = ({
  listings,
  onClose,
}) => {
  /*
   * Основні показники
   */
  const statistics = useMemo(() => {
    const total = listings.length;

    const approved =
      listings.filter(
        (listing) =>
          listing.status === "approved"
      ).length;

    const pending =
      listings.filter(
        (listing) =>
          listing.status === "pending"
      ).length;

    const cancelled =
      listings.filter(
        (listing) =>
          listing.status === "cancelled"
      ).length;

    const totalViews =
      listings.reduce(
        (sum, listing) =>
          sum +
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

    const mostViewed =
      listings.length > 0
        ? [...listings].sort(
            (first, second) =>
              Number(
                second.views ?? 0
              ) -
              Number(
                first.views ?? 0
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
      mostViewed,
    };
  }, [listings]);

  /*
   * Дані для кругової діаграми
   */
  const typeData = useMemo(() => {
    const typeCounts = {};

    listings.forEach(
      (listing) => {
        const type =
          listing.type || "Інше";

        typeCounts[type] =
          (typeCounts[type] || 0) +
          1;
      }
    );

    return Object.entries(
      typeCounts
    )
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort(
        (first, second) =>
          second.value -
          first.value
      );
  }, [listings]);

  /*
   * Дані за останні 30 днів
   */
  const publicationData =
    useMemo(() => {
      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const days = [];

      for (
        let index = 29;
        index >= 0;
        index--
      ) {
        const date =
          new Date(today);

        date.setDate(
          today.getDate() -
            index
        );

        const key =
          getLocalDateKey(date);

        days.push({
          key,

          date:
            date.toLocaleDateString(
              "uk-UA",
              {
                day: "2-digit",
                month: "2-digit",
              }
            ),

          fullDate:
            date.toLocaleDateString(
              "uk-UA",
              {
                day: "numeric",
                month: "long",
              }
            ),

          count: 0,
        });
      }

      const daysMap =
        new Map(
          days.map((day) => [
            day.key,
            day,
          ])
        );

      listings.forEach(
        (listing) => {
          const date =
            getListingDate(
              listing.createdAt
            );

          if (!date) {
            return;
          }

          const key =
            getLocalDateKey(date);

          const day =
            daysMap.get(key);

          if (day) {
            day.count += 1;
          }
        }
      );

      return days;
    }, [listings]);

  /*
   * Найпопулярніший тип
   */
  const mostPopularType =
    typeData.length > 0
      ? typeData[0]
      : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Аналітика
          </span>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Статистика оголошень
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Коротка статистика
            активності ваших
            оголошень.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Закрити статистику"
          title="Закрити"
        >
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
        </button>
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        {/* Основні показники */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatisticCard
            title="Оголошень"
            value={statistics.total}
            description="Всього створено"
            icon={<DocumentIcon />}
          />

          <StatisticCard
            title="Опубліковано"
            value={
              statistics.approved
            }
            description={`На перевірці: ${statistics.pending}`}
            icon={<CheckIcon />}
          />

          <StatisticCard
            title="Переглядів"
            value={
              statistics.totalViews
            }
            description="Загалом"
            icon={<EyeIcon />}
          />

          <StatisticCard
            title="Середні перегляди"
            value={
              statistics.averageViews
            }
            description="На оголошення"
            icon={<ChartIcon />}
          />
        </div>

        {/* Графіки */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Кругова діаграма */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-black text-slate-950">
                Типи оголошень
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Розподіл усіх ваших
                оголошень за типами.
              </p>
            </div>

            {typeData.length >
            0 ? (
              <>
                <div className="mt-4 h-[260px] w-full sm:h-[300px]">
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
                        outerRadius="75%"
                        paddingAngle={3}
                        stroke="none"
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

                {/* Легенда */}
                <div className="grid gap-2 sm:grid-cols-2">
                  {typeData.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          item.name
                        }
                        className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                CHART_COLORS[
                                  index %
                                    CHART_COLORS.length
                                ],
                            }}
                          />

                          <span className="truncate text-xs font-semibold text-slate-600">
                            {
                              item.name
                            }
                          </span>
                        </div>

                        <span className="shrink-0 text-xs font-black text-slate-900">
                          {
                            item.value
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <EmptyChart />
            )}
          </div>

          {/* Графік публікацій */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-black text-slate-950">
                Публікації
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Створені оголошення
                за останні 30 днів.
              </p>
            </div>

            <div className="mt-6 h-[300px] w-full">
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
                    left: -25,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                    interval={4}
                  />

                  <YAxis
                    allowDecimals={
                      false
                    }
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    content={
                      <PublicationTooltip />
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#2563eb",
                      stroke:
                        "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
              <span>
                30 днів тому
              </span>

              <span>
                Сьогодні
              </span>
            </div>
          </div>
        </div>

        {/* Коротка аналітика */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <AnalyticsIcon />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-950">
                Коротко про ваші
                оголошення
              </h3>

              {statistics.total >
              0 ? (
                <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-2">
                  <AnalyticsItem>
                    Загалом ваші
                    оголошення набрали{" "}
                    <strong className="text-slate-900">
                      {
                        statistics.totalViews
                      }{" "}
                      переглядів
                    </strong>
                    .
                  </AnalyticsItem>

                  <AnalyticsItem>
                    У середньому одне
                    оголошення має{" "}
                    <strong className="text-slate-900">
                      {
                        statistics.averageViews
                      }{" "}
                      переглядів
                    </strong>
                    .
                  </AnalyticsItem>

                  {mostPopularType && (
                    <AnalyticsItem>
                      Найчастіше ви
                      публікуєте тип{" "}
                      <strong className="text-slate-900">
                        «
                        {
                          mostPopularType.name
                        }
                        »
                      </strong>{" "}
                      —{" "}
                      {
                        mostPopularType.value
                      }{" "}
                      оголошень.
                    </AnalyticsItem>
                  )}

                  {statistics.mostViewed && (
                    <AnalyticsItem>
                      Найбільше
                      переглядів має{" "}
                      <strong className="text-slate-900">
                        «
                        {
                          statistics
                            .mostViewed
                            .title
                        }
                        »
                      </strong>{" "}
                      —{" "}
                      {Number(
                        statistics
                          .mostViewed
                          .views ?? 0
                      )}
                      .
                    </AnalyticsItem>
                  )}

                  {statistics.cancelled >
                    0 && (
                    <AnalyticsItem>
                      Відхилених
                      оголошень:{" "}
                      <strong className="text-slate-900">
                        {
                          statistics.cancelled
                        }
                      </strong>
                      .
                    </AnalyticsItem>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Після створення
                  оголошень тут
                  з’явиться коротка
                  статистика вашої
                  активності.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/*
 * Картка показника
 */
const StatisticCard = ({
  title,
  value,
  description,
  icon,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
};

/*
 * Tooltip кругової діаграми
 */
const PieTooltip = ({
  active,
  payload,
}) => {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  const item =
    payload[0]?.payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-bold text-slate-500">
        {item?.name}
      </p>

      <p className="mt-1 text-sm font-black text-slate-950">
        {item?.value}{" "}
        оголошень
      </p>
    </div>
  );
};

/*
 * Tooltip графіка публікацій
 */
const PublicationTooltip = ({
  active,
  payload,
}) => {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  const item =
    payload[0]?.payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold text-slate-500">
        {item?.fullDate}
      </p>

      <p className="mt-1 text-sm font-black text-blue-600">
        {item?.count}{" "}
        оголошень
      </p>
    </div>
  );
};

const AnalyticsItem = ({
  children,
}) => (
  <div className="flex gap-2">
    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

    <p>{children}</p>
  </div>
);

const EmptyChart = () => (
  <div className="mt-6 flex h-[300px] items-center justify-center rounded-2xl bg-slate-50 text-center">
    <div>
      <p className="text-sm font-bold text-slate-600">
        Немає даних
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Створіть перше
        оголошення.
      </p>
    </div>
  </div>
);

/*
 * Допоміжні функції дат
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

const getLocalDateKey = (
  date
) => {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/*
 * Іконки
 */
const DocumentIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 2h9l5 5v15H6Z" />
    <path d="M14 2v6h6" />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const EyeIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle
      cx="12"
      cy="12"
      r="3"
    />
  </svg>
);

const ChartIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
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
    strokeLinejoin="round"
  >
    <path d="M3 3v18h18" />
    <path d="m7 16 4-5 4 3 5-7" />
  </svg>
);

export default UserListingsStatistics;