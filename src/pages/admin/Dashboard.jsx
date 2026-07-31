import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <section>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
          Панель керування
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Вітаємо в адміністративній панелі
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          Дасть Бог — тут буде зручне керування всім сервісом RBoard.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Link
          to="/dashboard/listings"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 6h13" />
              <path d="M8 12h13" />
              <path d="M8 18h13" />
              <path d="M3 6h.01" />
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
            </svg>
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Оголошення
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Перегляд і керування оголошеннями сервісу.
          </p>
        </Link>

        <Link
          to="/dashboard/users"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Користувачі
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Перегляд зареєстрованих користувачів сайту.
          </p>
        </Link>

        <Link
          to="/dashboard/contacts"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
            </svg>
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Зв’язок
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Перегляд повідомлень із форми зворотного зв’язку.
          </p>
        </Link>
      </div>
    </section>
  );
};

export default Dashboard;