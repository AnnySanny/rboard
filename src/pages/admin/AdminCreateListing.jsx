import { useNavigate } from "react-router-dom";

import AdminCreateListingForm from "../../components/admin/AdminCreateListingForm";

const AdminCreateListing = () => {
    const navigate = useNavigate();

    return (
        <section>
            <div className="mb-7">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                    Панель адміністратора
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Додати оголошення
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Створіть нове оголошення.
                    Воно буде опубліковане
                    одразу без додаткової
                    модерації.
                </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                <AdminCreateListingForm
                    onSuccess={() =>
                        navigate(
                            "/dashboard/listings"
                        )
                    }
                />
            </div>
        </section>
    );
};

export default AdminCreateListing;