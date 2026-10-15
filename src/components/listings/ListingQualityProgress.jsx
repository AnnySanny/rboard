
import { useMemo } from "react";

import {
    ArrowRight,
    Award,
    Camera,
    CheckCircle2,
    FileText,
    ListFilter,
    MapPin,
    MessageCircle,
    Phone,
    Sparkles,
    TrendingUp,
    UserRound,
} from "lucide-react";

// ==============================
// ТИПИ ОГОЛОШЕНЬ
// ==============================

const LISTING_TYPES = [
    "Продаж",
    "Купівля",
    "Оренда",
    "Послуга",
    "Робота",
    "Питання",
    "Обмін",
    "Віддам безкоштовно",
    "Загублено / знайдено",
    "Подія",
    "Оголошення громади",
    "Інше",
];

// ==============================
// РОЗРАХУНОК ПРОГРЕСУ
// ==============================

const getQualityData = ({
    form,
    images,
    isAuthenticated,
    contactValid,
}) => {
    const name = form?.authorName?.trim() || "";
    const title = form?.title?.trim() || "";
    const comment = form?.comment?.trim() || "";
    const street = form?.street?.trim() || "";

    const imageCount = isAuthenticated
        ? images?.length || 0
        : 0;

    const nameValid =
        name.length >= 2 && name.length <= 80;

    const titleValid =
        title.length >= 5 && title.length <= 120;

    const typeValid = LISTING_TYPES.includes(
        form?.type
    );

    const cityValid = Boolean(
        form?.city?.name?.trim()
    );

    const streetValid =
        street.length > 0 && street.length <= 120;

    // Бали за обов'язкові поля — до 50%.
    const requiredFields = [
        nameValid,
        Boolean(contactValid),
        titleValid,
        typeValid,
        cityValid,
    ];

    const requiredPoints =
        requiredFields.filter(Boolean).length * 10;

    // Бали за опис — до 20%.
    let descriptionPoints = 0;

    if (comment.length >= 300) {
        descriptionPoints = 20;
    } else if (comment.length >= 150) {
        descriptionPoints = 15;
    } else if (comment.length >= 60) {
        descriptionPoints = 10;
    } else if (comment.length > 0) {
        descriptionPoints = 5;
    }

    // Бали за вулицю — до 5%.
    const streetPoints = streetValid ? 5 : 0;

    // Бали за фотографії — до 20%.
    const photoPoints = isAuthenticated
        ? Math.min(imageCount, 5) * 4
        : 0;

    // Бали за додаткові контакти — до 5%.
    const additionalContacts = Object.values(
        form?.additionalContacts || {}
    );

    const enabledContacts = additionalContacts.filter(
        (item) => item.enabled
    );

    const additionalContactValid =
        enabledContacts.length > 0 &&
        enabledContacts.every(
            (item) => Boolean(item.value?.trim())
        );

    const additionalPoints =
        isAuthenticated && additionalContactValid
            ? 5
            : 0;

    // Підсумок.
    const score = Math.min(
        100,
        requiredPoints +
            descriptionPoints +
            streetPoints +
            photoPoints +
            additionalPoints
    );

    // ==============================
    // СТАТУС ЯКОСТІ
    // ==============================

    let status = {
        text: "Почніть заповнювати",
        icon: FileText,
        color: "text-slate-500",
    };

    if (score >= 85) {
        status = {
            text: "Чудове заповнення",
            icon: Award,
            color: "text-emerald-600",
        };
    } else if (score >= 65) {
        status = {
            text: "Хороше заповнення",
            icon: CheckCircle2,
            color: "text-blue-600",
        };
    } else if (score >= 40) {
        status = {
            text: "Можна покращити",
            icon: TrendingUp,
            color: "text-amber-600",
        };
    } else if (score > 0) {
        status = {
            text: "Гарний початок",
            icon: Sparkles,
            color: "text-blue-500",
        };
    }

    // ==============================
    // НАСТУПНА РЕКОМЕНДАЦІЯ
    // ==============================

    let recommendation = {
        text: "Вкажіть ім'я",
        icon: UserRound,
    };

    if (!nameValid) {
        recommendation = {
            text: "Вкажіть ім'я",
            icon: UserRound,
        };
    } else if (!contactValid) {
        recommendation = {
            text: "Додайте контакт",
            icon: Phone,
        };
    } else if (!titleValid) {
        recommendation = {
            text: "Вкажіть назву",
            icon: FileText,
        };
    } else if (!typeValid) {
        recommendation = {
            text: "Оберіть категорію",
            icon: ListFilter,
        };
    } else if (!cityValid) {
        recommendation = {
            text: "Оберіть місто",
            icon: MapPin,
        };
    } else if (comment.length < 60) {
        recommendation = {
            text: "Додайте опис",
            icon: MessageCircle,
        };
    } else if (comment.length < 150) {
        recommendation = {
            text: "Розширте опис до 150 символів",
            icon: MessageCircle,
        };
    } else if (comment.length < 300) {
        recommendation = {
            text: "Доповніть опис до 300 символів",
            icon: MessageCircle,
        };
    } else if (!streetValid) {
        recommendation = {
            text: "Вкажіть вулицю",
            icon: MapPin,
        };
    } else if (!isAuthenticated) {
        recommendation = {
            text: "Зареєструйтеся, щоб додати фото",
            icon: Camera,
        };
    } else if (imageCount < 5) {
        recommendation = {
            text: `Додайте ще ${5 - imageCount} фото`,
            icon: Camera,
        };
    } else if (!additionalContactValid) {
        recommendation = {
            text: "Додайте додатковий контакт",
            icon: Phone,
        };
    } else {
        recommendation = {
            text: "Усі критерії виконано",
            icon: CheckCircle2,
        };
    }

    return {
        score,
        status,
        recommendation,
    };
};

// ==============================
// КОМПОНЕНТ
// ==============================

const ListingQualityProgress = ({
    form,
    images = [],
    isAuthenticated = false,
    contactValid = false,
    onOpenRegister,
}) => {
    const { score, status, recommendation } = useMemo(
        () =>
            getQualityData({
                form,
                images,
                isAuthenticated,
                contactValid,
            }),
        [
            form,
            images,
            isAuthenticated,
            contactValid,
        ]
    );

    const StatusIcon = status.icon;
    const RecommendationIcon = recommendation.icon;

    // Відкриття реєстрації.
    const handleRegister = () => {
        if (typeof onOpenRegister === "function") {
            onOpenRegister();
            return;
        }

        window.dispatchEvent(
            new CustomEvent("rboard:open-register")
        );
    };

    // Колір прогресу.
    const progressColor =
        score >= 85
            ? "from-emerald-400 to-emerald-600"
            : score >= 40
              ? "from-blue-500 to-indigo-500"
              : "from-sky-400 to-blue-500";

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* ОСНОВНИЙ ПРОГРЕС */}

            <div className="px-4 py-4 sm:px-5">

                {/* ЗАГОЛОВОК ТА ВІДСОТОК */}

                <div className="flex items-center justify-between gap-3">

                    <h2 className="text-sm font-bold text-slate-900">
                        Якість оголошення
                    </h2>

                    <span
                        className={`text-xl font-black tabular-nums ${
                            score >= 85
                                ? "text-emerald-600"
                                : "text-blue-600"
                        }`}
                        aria-live="polite"
                    >
                        {score}%
                    </span>
                </div>

                {/* ПРОГРЕС-БАР */}

                <div
                    className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label="Повнота оголошення"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={score}
                >
                    <div
                        className={`
                            h-full rounded-full
                            bg-gradient-to-r ${progressColor}
                            transition-all duration-500 ease-out
                        `}
                        style={{
                            width: `${score}%`,
                        }}
                    />
                </div>

                {/* СТАТУС + ПОРАДА */}

                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">

                    <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${status.color}`}
                    >
                        <StatusIcon
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                        />

                        {status.text}
                    </span>

                    <span className="text-slate-300">
                        |
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-slate-500">

                        <RecommendationIcon
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                        />

                        {recommendation.text}
                    </span>
                </div>
            </div>

            {/* РЕЄСТРАЦІЯ — ТІЛЬКИ ГОСТЯМ */}

            {!isAuthenticated && (
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">

                    <p className="text-xs leading-5 text-slate-600 sm:max-w-lg">

                        <span className="font-bold text-slate-800">
                            Хочете досягти 100%?
                        </span>{" "}

                        Зареєструйтеся, щоб додавати фото,
                        редагувати та керувати своїми
                        оголошеннями.
                    </p>

                    <button
                        type="button"
                        onClick={handleRegister}
                        className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 sm:w-auto"
                    >
                        Створити обліковий запис

                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </button>
                </div>
            )}
        </section>
    );
};

export default ListingQualityProgress;
