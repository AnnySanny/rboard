import { Link, useNavigate } from "react-router-dom";

import CreateListingForm from "../components/listings/CreateListingForm";

const CreateListing = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
                    <Link
                        to="/"
                        className="text-xl font-black tracking-tight text-slate-950"
                    >
                        RBoard
                    </Link>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            aria-hidden="true"
                        >
                            <path d="m15 18-6-6 6-6" />
                        </svg>

                        <span className="hidden sm:inline">
                            На головну
                        </span>

                        <span className="sm:hidden">
                            Назад
                        </span>
                    </Link>
                </div>
            </header>

            <main className="px-4 py-8 sm:px-6 sm:py-12">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-7">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                            Нове оголошення
                        </p>

                        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                            Додати оголошення
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            Заповніть інформацію про оголошення.
                            Після надсилання воно потрапить на
                            перевірку адміністратору.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                        <CreateListingForm
                            onSuccess={handleSuccess}
                        />
                    </div>

              
                </div>
            </main>
        </div>
    );
};

export default CreateListing;