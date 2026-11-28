import { useNavigate, Link } from "react-router-dom";

import Navbar from "../../components/pageComponent/Navbar";
import CreateListingForm from "../../components/listings/CreateListingForm";
import { useContest } from "../../context/ContestContext";
const CreateListing = () => {
    const navigate = useNavigate();
    const {
        canCollectBoots,
        hasFound,
        claimItem,
        claimingBootId,
    } = useContest();
    const handleSuccess = () => {
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <Navbar />

            <main className="px-4 py-8 sm:px-6 sm:py-12">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-7">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                            Нове оголошення
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-3">
                            <h1 className="min-w-0 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                                Додати оголошення
                            </h1>

                            {canCollectBoots && !hasFound("s6k3v9m2r8") && (
                                <button
                                    type="button"
                                    disabled={Boolean(claimingBootId)}
                                    onClick={() => claimItem("s6k3v9m2r8")}
                                    aria-label="Забрати чобіток"
                                    className="h-14 w-14 shrink-0 cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-90 disabled:opacity-50 sm:h-20 sm:w-20"
                                >
                                    <img
                                        src="/images/contest-boot.png"
                                        alt=""
                                        draggable={false}
                                        className="h-full w-full object-contain drop-shadow-md"
                                    />
                                </button>
                            )}
                        </div>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            Заповніть інформацію про оголошення. Після надсилання воно
                            потрапить на перевірку адміністратору. Якщо виникли проблеми,{" "}
                            <Link
                                to="/help"
                                className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
                            >
                                перегляньте розділ допомоги
                            </Link>
                            .
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