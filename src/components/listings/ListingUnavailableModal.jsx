import {
    FileX,
    Clock3,
    AlertCircle,
    House,
    LoaderCircle,
} from "lucide-react";

const messages = {
    loading: {
        icon: LoaderCircle,
        title: "Завантаження оголошення",
        description: "Завантажуємо детальну інформацію про оголошення.",
    },

    "not-found": {
        icon: FileX,
        title: "Оголошення не знайдено",
        description: "Можливо, автор видалив оголошення або посилання більше не актуальне.",
    },

    expired: {
        icon: Clock3,
        title: "Оголошення неактивне",
        description: "Термін публікації цього оголошення закінчився.",
    },

    unavailable: {
        icon: FileX,
        title: "Оголошення недоступне",
        description: "Наразі це оголошення недоступне для перегляду.",
    },

    error: {
        icon: AlertCircle,
        title: "Не вдалося завантажити оголошення",
        description: "Виникла помилка під час завантаження. Спробуйте повторити спробу.",
    },
};

export default function ListingUnavailableModal({
    status,
    onClose,
}) {
    const message = messages[status];

    if (!message) return null;

    const Icon = message.icon;

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-md">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="listing-unavailable-title"
                className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-9"
            >
                <div
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
                        status === "loading"
                            ? "bg-blue-50 text-blue-500"
                            : "bg-red-50 text-red-500"
                    }`}
                >
                    <Icon
                        size={38}
                        strokeWidth={1.8}
                        className={
                            status === "loading"
                                ? "animate-spin"
                                : ""
                        }
                    />
                </div>

                <h2
                    id="listing-unavailable-title"
                    className="mt-6 text-2xl font-black text-slate-900"
                >
                    {message.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                    {message.description}
                </p>

                {status === "error" && (
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-6 w-full rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                    >
                        Спробувати ще раз
                    </button>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    <House size={18} strokeWidth={2} />
                    Повернутися на головну
                </button>

                <p className="mt-4 text-xs text-slate-400">
                    На RBoard є інші актуальні оголошення.
                </p>
            </div>
        </div>
    );
}