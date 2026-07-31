import { Link } from "react-router-dom";

export default function AddListingButton() {
    return (
        <div className="mb-10 flex justify-center">
            <Link
                to="/create-listing"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
            >
                <span className="text-xl leading-none">
                    +
                </span>

                Додати своє оголошення
            </Link>
        </div>
    );
}