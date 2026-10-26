
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  collectionGroup,
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  query,
  where,
  Timestamp,
  count,
  sum,
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
  CalendarX2,
  Eye,
  Star,
  MessageSquareText,
  UserRoundCheck,
  RefreshCw,
  LoaderCircle,
  ChartPie,
  AlertCircle,
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
  other: "#94a3b8",
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("uk-UA");

const getDayStart = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatShortDate = (date) =>
  new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);

const getListingCategory = (listing) => {
  const raw = listing.type || listing.category;

  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }

  if (raw && typeof raw === "object") {
    const name =
      raw.name ||
      raw.label ||
      raw.value ||
      raw.title;

    if (typeof name === "string" && name.trim()) {
      return name.trim();
    }
  }

  return "Інше";
};

const normalizeCategory = (name) => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const categories = {
    "продаж": "Продаж",
    "купівля": "Купівля",
    "оренда": "Оренда",
    "послуга": "Послуга",
    "послуги": "Послуга",
    "робота": "Робота",
    "питання": "Питання",
    "обмін": "Обмін",
    "віддам безкоштовно": "Віддам безкоштовно",
    "загублено / знайдено": "Загублено / знайдено",
    "загублено/знайдено": "Загублено / знайдено",
    "подія": "Подія",
    "оголошення громади": "Оголошення громади",
    "інше": "Інше",
  };

  return categories[normalized] || name.trim();
};

const StatisticCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconBackground,
  iconClassName,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500">
          {title}
        </p>

        <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {value}
        </p>
      </div>

      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground}`}
      >
        <Icon
          size={20}
          className={iconClassName}
        />
      </span>
    </div>

    <p className="mt-4 text-xs leading-5 text-slate-400">
      {description}
    </p>
  </div>
);

const ChartCard = ({
  title,
  description,
  children,
}) => (
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

const EmptyChart = ({ message = "Недостатньо даних" }) => (
  <div className="flex h-[300px] items-center justify-center text-center">
    <p className="text-sm font-semibold text-slate-400">
      {message}
    </p>
  </div>
);

export default function AdminStatistics() {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [categories, setCategories] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [error, setError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const now = new Date();
      const nowTimestamp = Timestamp.fromDate(now);

      const usersRef = collection(db, "users");
      const listingsRef = collection(db, "listings");
      const chatsRef = collection(db, "chats");
      const viewsRef = collection(db, "listingViews");
      const reviewsRef = collectionGroup(db, "reviews");

      const lastDays = Array.from(
        { length: 7 },
        (_, index) => {
          const start = getDayStart(now);
          start.setDate(
            start.getDate() - (6 - index)
          );

          const end = new Date(start);
          end.setDate(end.getDate() + 1);

          return {
            start,
            end,
            name: formatShortDate(start),
          };
        }
      );

      const countQueries = [
        getCountFromServer(usersRef),

        getCountFromServer(
          query(
            usersRef,
            where("blocked", "==", true)
          )
        ),

        getCountFromServer(listingsRef),

        getCountFromServer(
          query(
            listingsRef,
            where("status", "==", "approved")
          )
        ),

        getCountFromServer(
          query(
            listingsRef,
            where("status", "==", "pending")
          )
        ),

        getCountFromServer(
          query(
            listingsRef,
            where("status", "==", "cancelled")
          )
        ),

        getCountFromServer(
          query(
            listingsRef,
            where("status", "==", "expired")
          )
        ),

        getCountFromServer(
          query(
            listingsRef,
            where("status", "==", "approved"),
            where("expiresAt", "<=", nowTimestamp)
          )
        ),

        getCountFromServer(chatsRef),

        getCountFromServer(viewsRef),
      ];

      const [countResults, reviewResult, dayResults] =
        await Promise.all([
          Promise.all(countQueries),

          getAggregateFromServer(reviewsRef, {
            reviewCount: count(),
            totalRating: sum("rating"),
          })
            .then((snapshot) => ({
              data: snapshot.data(),
              error: null,
            }))
            .catch((err) => ({
              data: null,
              error: err,
            })),

          Promise.all(
            lastDays.map((day) =>
              getCountFromServer(
                query(
                  listingsRef,
                  where(
                    "createdAt",
                    ">=",
                    Timestamp.fromDate(day.start)
                  ),
                  where(
                    "createdAt",
                    "<",
                    Timestamp.fromDate(day.end)
                  )
                )
              ).then((snapshot) => snapshot.data().count)
            )
          ),
        ]);

      const [
        userCount,
        blockedCount,
        listingCount,
        approvedCount,
        pendingCount,
        cancelledCount,
        explicitlyExpiredCount,
        approvedPastDeadlineCount,
        chatCount,
        viewCount,
      ] = countResults.map(
        (result) => result.data().count
      );

      if (reviewResult.error) {
        console.error(
          "Помилка завантаження статистики відгуків:",
          reviewResult.error
        );
      }

      const reviewCount =
        reviewResult.data?.reviewCount ?? null;

      const totalRating =
        reviewResult.data?.totalRating ?? 0;

      const expired =
        explicitlyExpiredCount +
        approvedPastDeadlineCount;

      const approved = Math.max(
        0,
        approvedCount - approvedPastDeadlineCount
      );

      const other = Math.max(
        0,
        listingCount -
          approvedCount -
          pendingCount -
          cancelledCount -
          explicitlyExpiredCount
      );

      setStats({
        users: userCount,
        blocked: blockedCount,
        listings: listingCount,
        approved,
        pending: pendingCount,
        cancelled: cancelledCount,
        expired,
        other,
        views: viewCount,
        chats: chatCount,
        chatParticipations: chatCount * 2,
        reviews: reviewCount,
        averageRating:
          reviewCount > 0
            ? totalRating / reviewCount
            : null,
        reviewError: Boolean(reviewResult.error),
      });

      setDaily(
        lastDays.map((day, index) => ({
          name: day.name,
          count: dayResults[index],
        }))
      );
    } catch (err) {
      console.error(
        "Помилка завантаження статистики:",
        err
      );

      setError(
        "Не вдалося завантажити статистику. Перевірте правила доступу та індекси Firestore."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const loadCategories = useCallback(async () => {
    if (loadingCategories) return;

    setLoadingCategories(true);
    setCategoriesError("");

    try {
      const snapshot = await getDocs(
        collection(db, "listings")
      );

      const counts = new Map();

      snapshot.forEach((documentSnapshot) => {
        const listing = documentSnapshot.data();

        const category = normalizeCategory(
          getListingCategory(listing)
        );

        counts.set(
          category,
          (counts.get(category) || 0) + 1
        );
      });

      const results = Array.from(
        counts.entries()
      )
        .map(([name, value]) => ({
          name,
          value,
        }))
        .sort(
          (a, b) => b.value - a.value
        );

      setCategories(results);
    } catch (err) {
      console.error(
        "Помилка завантаження категорій:",
        err
      );

      setCategoriesError(
        "Не вдалося завантажити категорії."
      );
    } finally {
      setLoadingCategories(false);
    }
  }, [loadingCategories]);

  const statusData = useMemo(() => {
    if (!stats) return [];

    return [
      {
        name: "Активні",
        key: "approved",
        value: stats.approved,
      },
      {
        name: "На перевірці",
        key: "pending",
        value: stats.pending,
      },
      {
        name: "Відхилені",
        key: "cancelled",
        value: stats.cancelled,
      },
      {
        name: "Прострочені",
        key: "expired",
        value: stats.expired,
      },
      {
        name: "Інші",
        key: "other",
        value: stats.other,
      },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const topCategories = useMemo(
    () => categories?.slice(0, 6) || [],
    [categories]
  );

  if (loading && !stats) {
    return (
      <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <LoaderCircle
          size={32}
          className="animate-spin text-blue-600"
        />

        <p className="mt-4 text-sm font-semibold text-slate-500">
          Завантаження статистики...
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            Аналітика
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Статистика
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Основні показники користувачів,
            оголошень та активності RBoard.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStatistics}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />

          Оновити
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle
            size={18}
            className="shrink-0"
          />
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <StatisticCard
              title="Користувачі"
              value={formatNumber(stats.users)}
              description={`${formatNumber(stats.blocked)} заблоковано`}
              icon={Users}
              iconBackground="bg-blue-50"
              iconClassName="text-blue-600"
            />

            <StatisticCard
              title="Оголошення"
              value={formatNumber(stats.listings)}
              description="Усього наявних у базі"
              icon={FileText}
              iconBackground="bg-indigo-50"
              iconClassName="text-indigo-600"
            />

            <StatisticCard
              title="Активні"
              value={formatNumber(stats.approved)}
              description="Схвалені та не прострочені"
              icon={CheckCircle2}
              iconBackground="bg-emerald-50"
              iconClassName="text-emerald-600"
            />

            <StatisticCard
              title="На перевірці"
              value={formatNumber(stats.pending)}
              description="Очікують модерації"
              icon={Clock3}
              iconBackground="bg-amber-50"
              iconClassName="text-amber-600"
            />

            <StatisticCard
              title="Прострочені"
              value={formatNumber(stats.expired)}
              description="Завершився термін публікації"
              icon={CalendarX2}
              iconBackground="bg-slate-100"
              iconClassName="text-slate-600"
            />

            <StatisticCard
              title="Перегляди"
              value={formatNumber(stats.views)}
              description="Унікальні записи listingViews"
              icon={Eye}
              iconBackground="bg-violet-50"
              iconClassName="text-violet-600"
            />

            <StatisticCard
              title="Чати"
              value={formatNumber(stats.chats)}
              description="Усього розмов між користувачами"
              icon={MessageSquareText}
              iconBackground="bg-cyan-50"
              iconClassName="text-cyan-600"
            />

            <StatisticCard
              title="Участі в чатах"
              value={formatNumber(stats.chatParticipations)}
              description="По два учасники на кожну розмову"
              icon={UserRoundCheck}
              iconBackground="bg-blue-50"
              iconClassName="text-blue-600"
            />

            <StatisticCard
              title="Відгуки"
              value={
                stats.reviews === null
                  ? "—"
                  : formatNumber(stats.reviews)
              }
              description={
                stats.reviewError
                  ? "Дані тимчасово недоступні"
                  : "Усі відгуки користувачів"
              }
              icon={Star}
              iconBackground="bg-amber-50"
              iconClassName="text-amber-600"
            />

            <StatisticCard
              title="Середня оцінка"
              value={
                stats.averageRating === null
                  ? stats.reviews === 0
                    ? "0 / 5"
                    : "—"
                  : `${stats.averageRating.toFixed(2)} / 5`
              }
              description={
                stats.reviewError
                  ? "Перевірте індекс reviews.rating"
                  : "Середня оцінка за відгуками"
              }
              icon={Star}
              iconBackground="bg-yellow-50"
              iconClassName="text-yellow-600"
            />
          </div>

          {stats.reviewError && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-bold">
                  Статистика відгуків недоступна
                </p>

                <p className="mt-1 leading-6">
                  Перевірте, чи завершено створення
                  індексу reviews.rating з Collection
                  group scope та чи дозволені
                  адміністраторські запити до відгуків.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <ChartCard
              title="Нові оголошення"
              description="Кількість створених оголошень за останні 7 днів"
            >
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={daily}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#e2e8f0"
                    />

                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#94a3b8"
                    />

                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#94a3b8"
                    />

                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      formatter={(value) => [
                        value,
                        "Оголошень",
                      ]}
                    />

                    <Bar
                      dataKey="count"
                      fill="#2563eb"
                      radius={[7, 7, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Статуси оголошень"
              description="Поточний розподіл оголошень за статусами"
            >
              {statusData.length > 0 ? (
                <>
                  <div className="h-[220px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {statusData.map((item) => (
                            <Cell
                              key={item.key}
                              fill={STATUS_COLORS[item.key]}
                            />
                          ))}
                        </Pie>

                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {statusData.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                STATUS_COLORS[item.key],
                            }}
                          />

                          <span className="truncate text-xs font-semibold text-slate-600">
                            {item.name}
                          </span>
                        </span>

                        <strong className="text-sm text-slate-900">
                          {formatNumber(item.value)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
            <ChartCard
              title="Оголошення за категоріями"
              description="Розподіл усіх наявних оголошень за полем type"
            >
              {categories === null ? (
                <div className="flex h-[330px] flex-col items-center justify-center gap-4 text-center">
                  {loadingCategories ? (
                    <LoaderCircle
                      size={32}
                      className="animate-spin text-blue-600"
                    />
                  ) : (
                    <ChartPie
                      size={32}
                      className="text-blue-400"
                    />
                  )}

                  <p className="max-w-sm text-sm leading-6 text-slate-500">
                    Для економії читань розподіл
                    категорій завантажується окремо.
                  </p>

                  <button
                    type="button"
                    onClick={loadCategories}
                    disabled={loadingCategories}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loadingCategories
                      ? "Завантаження..."
                      : "Завантажити категорії"}
                  </button>

                  {categoriesError && (
                    <p className="text-xs text-red-600">
                      {categoriesError}
                    </p>
                  )}
                </div>
              ) : categories.length > 0 ? (
                <div className="h-[330px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={2}
                      >
                        {categories.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={
                              TYPE_COLORS[
                                index % TYPE_COLORS.length
                              ]
                            }
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value, name) => [
                          formatNumber(value),
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="Категорій немає" />
              )}
            </ChartCard>

            <ChartCard
              title="Найпопулярніші категорії"
              description="Категорії з найбільшою кількістю оголошень"
            >
              {topCategories.length > 0 ? (
                <div className="h-[330px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={topCategories}
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
                        horizontal={false}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke="#94a3b8"
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={135}
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        stroke="#64748b"
                      />

                      <Tooltip
                        formatter={(value) => [
                          formatNumber(value),
                          "Оголошень",
                        ]}
                      />

                      <Bar
                        dataKey="value"
                        fill="#2563eb"
                        radius={[0, 7, 7, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart
                  message={
                    categories === null
                      ? "Завантажте категорії ліворуч"
                      : "Недостатньо даних"
                  }
                />
              )}
            </ChartCard>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            Статистика показує поточний стан Firestore.
            Видалені оголошення, користувачі та чати
            не враховуються в загальній кількості.
            Значення оновлюються після натискання
            кнопки «Оновити».
          </p>
        </>
      )}
    </section>
  );
}
