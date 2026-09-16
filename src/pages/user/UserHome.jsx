import { Link } from "react-router-dom";
import {
    Plus,
    List,
    User,
    ArrowRight,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const UserHome = () => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">

                    {/* Привітання */}
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <span className="text-sm font-bold uppercase tracking-widest text-blue-600">
                            Особистий кабінет
                        </span>

                        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                            Вітаємо в RBoard!
                        </h1>

                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                            Керуйте своїми оголошеннями, створюйте
                            нові публікації та змінюйте дані профілю.
                        </p>
                    </section>

                    {/* Швидкі дії */}
                    <section className="mt-8">
                        <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                            Швидкі дії
                        </h2>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">

                            {/* Додати оголошення */}
                            <Link
                                to="/user/create-listing"
                                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Plus size={22} />
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-slate-950">
                                    Додати оголошення
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Створіть нове оголошення та
                                    опублікуйте його на RBoard.
                                </p>

                                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600">
                                    Створити

                                    <ArrowRight
                                        size={16}
                                        className="transition group-hover:translate-x-1"
                                    />
                                </div>
                            </Link>

                            {/* Мої оголошення */}
                            <Link
                                to="/user/listings"
                                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <List size={22} />
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-slate-950">
                                    Мої оголошення
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Переглядайте та керуйте
                                    власними оголошеннями.
                                </p>

                                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600">
                                    Переглянути

                                    <ArrowRight
                                        size={16}
                                        className="transition group-hover:translate-x-1"
                                    />
                                </div>
                            </Link>

                            {/* Профіль */}
                            <Link
                                to="/user/profile"
                                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <User size={22} />
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-slate-950">
                                    Мій профіль
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Переглядайте та змінюйте
                                    інформацію свого профілю.
                                </p>

                                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600">
                                    Відкрити

                                    <ArrowRight
                                        size={16}
                                        className="transition group-hover:translate-x-1"
                                    />
                                </div>
                            </Link>

                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UserHome;