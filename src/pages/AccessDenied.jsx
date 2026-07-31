import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg
            className="h-10 w-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9 9 15" />
            <path d="m9 9 6 6" />
          </svg>
        </div>

        <h1 className="mt-6 text-4xl font-black text-slate-900">
          Йой
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          У вас немає прав для перегляду цієї сторінки.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          На головну
        </Link>
      </div>
    </div>
  );
}