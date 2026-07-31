import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import Swal from "sweetalert2";

import { auth } from "../../firebase";

const AdminNavbar = () => {
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
      isActive
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  const handleLogout = async () => {
    try {
      await signOut(auth);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error("Помилка виходу:", error);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Не вдалося вийти із системи",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <NavLink
          to="/dashboard"
          end
          className="shrink-0 text-xl font-black tracking-tight text-slate-950"
        >
          RBoard Admin
        </NavLink>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink
            to="/dashboard/listings"
            className={navLinkClass}
          >
            Оголошення
          </NavLink>

          <NavLink
            to="/dashboard/users"
            className={navLinkClass}
          >
            Користувачі
          </NavLink>

          <NavLink
            to="/dashboard/contacts"
            className={navLinkClass}
          >
            Зв’язок
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          </svg>

          Вийти
        </button>
      </div>

    
      <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-3 md:hidden">
        <NavLink
          to="/dashboard/listings"
          className={navLinkClass}
        >
          Оголошення
        </NavLink>

        <NavLink
          to="/dashboard/users"
          className={navLinkClass}
        >
          Користувачі
        </NavLink>

        <NavLink
          to="/dashboard/contacts"
          className={navLinkClass}
        >
          Зв’язок
        </NavLink>
      </nav>
    </header>
  );
};

export default AdminNavbar;