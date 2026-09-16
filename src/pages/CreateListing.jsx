import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import CreateListingForm from "../components/listings/CreateListingForm";

const CreateListing = () => {
    const navigate = useNavigate();

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