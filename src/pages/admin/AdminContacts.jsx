import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

import Swal from "sweetalert2";

import { db } from "../../firebase";

const FEEDBACK_TYPES = [
  "Усі типи",
  "Пропозиція",
  "Проблеми з сайтом",
  "Інше",
];

const formatDate = (value) => {
  if (!value) {
    return "Дата не вказана";
  }

  const date =
    value?.toDate?.() ||
    (value instanceof Date
      ? value
      : new Date(value));

  if (Number.isNaN(date.getTime())) {
    return "Дата не вказана";
  }

  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminContacts = () => {
  const [feedback, setFeedback] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("Усі типи");

  const [sortOrder, setSortOrder] =
    useState("newest");

  const [deletingId, setDeletingId] =
    useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "feedback"),
      (snapshot) => {
        const receivedFeedback =
          snapshot.docs.map((document) => {
            const data = document.data();

            return {
              id: document.id,

              contact:
                data.contact || "",

              name:
                data.name || "",

              type:
                data.type || "Інше",

              comment:
                data.comment || "",

              status:
                data.status || "new",
              createdAt:
                data.createdAt || null,
            };
          });

        setFeedback(receivedFeedback);
        setLoading(false);
        setLoadError("");
      },
      (error) => {
        console.error(
          "Помилка завантаження звернень:",
          error
        );

        setLoadError(
          "Не вдалося завантажити звернення."
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredFeedback =
    useMemo(() => {
      const normalizedSearch = search
        .trim()
        .toLowerCase();

      const result = feedback.filter(
        (item) => {
          const matchesType =
            typeFilter === "Усі типи" ||
            item.type === typeFilter;

          const searchableText = [
            item.name,
            item.contact,
            item.type,
            item.comment,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            searchableText.includes(
              normalizedSearch
            );

          return (
            matchesType &&
            matchesSearch
          );
        }
      );

      result.sort(
        (firstItem, secondItem) => {
          const firstDate =
            firstItem.createdAt
              ?.toDate?.()
              ?.getTime?.() || 0;

          const secondDate =
            secondItem.createdAt
              ?.toDate?.()
              ?.getTime?.() || 0;

          if (sortOrder === "oldest") {
            return (
              firstDate - secondDate
            );
          }

          return (
            secondDate - firstDate
          );
        }
      );

      return result;
    }, [
      feedback,
      search,
      typeFilter,
      sortOrder,
    ]);

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Видалити звернення?",
      text:
        "Це звернення буде назавжди видалено з бази даних.",
      showCancelButton: true,
      confirmButtonText: "Видалити",
      cancelButtonText: "Скасувати",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(item.id);

      await deleteDoc(
        doc(
          db,
          "feedback",
          item.id
        )
      );

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Звернення видалено",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error(
        "Помилка видалення звернення:",
        error
      );

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title:
          "Не вдалося видалити звернення",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Адміністрування
            </span>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Зворотний зв’язок
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Переглядайте та керуйте
              зверненнями користувачів
              RBoard.
            </p>
          </div>

          {!loading && !loadError && (
            <div className="shrink-0 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              Звернень:{" "}
              {filteredFeedback.length}
            </div>
          )}
        </div>
      </section>

      {/* Пошук і фільтри */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Пошук */}
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
              />
              <path d="m21 21-4.3-4.3" />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Пошук за ім’ям, контактом або текстом..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* Тип */}
          <div className="relative lg:w-56">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {FEEDBACK_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}
            </select>

            <svg
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* Сортування */}
          <div className="relative lg:w-48">
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="newest">
                Спочатку нові
              </option>

              <option value="oldest">
                Спочатку старі
              </option>
            </select>

            <svg
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </section>

      {/* Завантаження */}
      {loading && (
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Завантаження звернень...
          </p>
        </section>
      )}

      {/* Помилка */}
      {!loading && loadError && (
        <section className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="font-semibold text-red-700">
            {loadError}
          </p>
        </section>
      )}

      {/* Нічого немає */}
      {!loading &&
        !loadError &&
        filteredFeedback.length === 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
              </svg>
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-900">
              Звернень не знайдено
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Спробуйте змінити пошук
              або параметри фільтрації.
            </p>
          </section>
        )}

      {/* Список звернень */}
      {!loading &&
        !loadError &&
        filteredFeedback.length > 0 && (
          <div className="space-y-4">
            {filteredFeedback.map(
              (item) => (
                <article
                  key={item.id}
                  className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    {/* Основна інформація */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {item.type}
                        </span>



                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                            />
                            <path d="M12 7v5l3 2" />
                          </svg>

                          {formatDate(
                            item.createdAt
                          )}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[180px_minmax(220px,0.8fr)_1fr]">
                        {/* Ім'я */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Ім’я
                          </p>

                          <p className="mt-1 break-words text-sm font-bold text-slate-900">
                            {item.name ||
                              "Не вказано"}
                          </p>
                        </div>

                        {/* Контакт */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Контакт
                          </p>

                          <p className="mt-1 break-all text-sm font-semibold text-blue-600">
                            {item.contact ||
                              "Не вказано"}
                          </p>
                        </div>

                        {/* Коментар */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Повідомлення
                          </p>

                          <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                            {item.comment ||
                              "Коментар не вказано"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Видалення */}
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(item)
                      }
                      disabled={
                        deletingId === item.id
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 lg:self-start"
                      aria-label="Видалити звернення"
                      title="Видалити звернення"
                    >
                      {deletingId ===
                      item.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                      ) : (
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v5" />
                          <path d="M14 11v5" />
                        </svg>
                      )}
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
    </div>
  );
};

export default AdminContacts;