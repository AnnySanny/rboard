import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      id="contacts"
      className="mt-16 border-t border-slate-200 bg-white"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-black text-slate-950">RBoard</p>
          <p className="mt-1 text-sm text-slate-500">
            Локальна дошка оголошень для Рахова.
          </p>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-slate-500">
          <a href="#listings" className="transition hover:text-blue-600">
            Оголошення
          </a>

          <a href="#about" className="transition hover:text-blue-600">
            Про сервіс
          </a>

          <a href="mailto:rboard@example.com" className="transition hover:text-blue-600">
            rboard@example.com
          </a>
        </div>
      </div>

<div className="border-t border-slate-100">
  <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-400 sm:px-6">
    © {new Date().getFullYear()} RBoard.{" "}

    <Link
      to="/admin-login"
      className="transition hover:text-blue-600"
    >
      Усі права захищені.
    </Link>
  </div>
</div>
    </footer>
  );
};

export default Footer;