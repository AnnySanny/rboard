import { NavLink } from "react-router-dom";

const Dashboard = () => {
    return (
        <section>
            <div>
                <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
                    Панель керування
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Вітаємо в адміністративній панелі
                </h1>

                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                    Дасть Бог — тут буде зручне керування
                    всім сервісом RBoard.
                </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
                <NavLink
                    to="/dashboard/listings"
                    className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <span className="text-xl">
                            О
                        </span>
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-slate-950">
                        Оголошення
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Перегляд і керування
                        оголошеннями сервісу.
                    </p>
                </NavLink>

                <NavLink
                    to="/dashboard/users"
                    className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <span className="text-xl">
                            К
                        </span>
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-slate-950">
                        Користувачі
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Перегляд і керування
                        користувачами.
                    </p>
                </NavLink>

                <NavLink
                    to="/dashboard/contacts"
                    className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <span className="text-xl">
                            З
                        </span>
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-slate-950">
                        Зв’язок
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Повідомлення від
                        користувачів.
                    </p>
                </NavLink>
            </div>
        </section>
    );
};

export default Dashboard;