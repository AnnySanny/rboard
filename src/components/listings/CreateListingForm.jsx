import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
    collection,
    doc,
    runTransaction,
    serverTimestamp,
    getDoc,
} from "firebase/firestore";

import { db } from "../../firebase";
import CityAutocomplete from "./CityAutocomplete";

const MAX_GUEST_LISTINGS = 3;
const LIMIT_PERIOD_DAYS = 7;

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

const initialForm = {
    authorName: "",
    contact: "",
    title: "",
    type: "",
    city: null,
    street: "",
    comment: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneRegex = /^\+?[0-9\s\-()]{9,20}$/;

const normalizeName = (name) => {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

const normalizeContact = (contact) => {
    const normalizedValue = contact.trim().toLowerCase();

    if (emailRegex.test(normalizedValue)) {
        return normalizedValue;
    }

    let phone = normalizedValue.replace(/\D/g, "");

    if (phone.startsWith("380")) {
        phone = `+${phone}`;
    } else if (phone.startsWith("0")) {
        phone = `+38${phone}`;
    } else if (phone.length > 0) {
        phone = `+${phone}`;
    }

    return phone;
};

const createGuestLimitId = (name, contact) => {
    const normalizedName = normalizeName(name);
    const normalizedContact = normalizeContact(contact);

    const rawValue = `${normalizedName}_${normalizedContact}`;

    return encodeURIComponent(rawValue)
        .replaceAll("%", "_")
        .replaceAll(".", "_")
        .replaceAll("/", "_")
        .slice(0, 500);
};

const formatRemainingTime = (milliseconds) => {
    const totalMinutes = Math.max(
        1,
        Math.ceil(milliseconds / (1000 * 60))
    );

    const days = Math.floor(totalMinutes / (24 * 60));

    const hours = Math.floor(
        (totalMinutes % (24 * 60)) / 60
    );

    const minutes = totalMinutes % 60;

    const parts = [];

    if (days > 0) {
        parts.push(`${days} дн.`);
    }

    if (hours > 0) {
        parts.push(`${hours} год.`);
    }

    if (minutes > 0 || parts.length === 0) {
        parts.push(`${minutes} хв.`);
    }

    return parts.join(" ");
};

const getCleanCity = (city) => {
    return {
        id: city?.id ?? null,
        name: city?.name?.trim() || "",
        region: city?.region?.trim() || "",
        district: city?.district?.trim() || "",
        latitude: city?.latitude ?? null,
        longitude: city?.longitude ?? null,
    };
};

export default function CreateListingForm({
    onSuccess,
    onOpenRegister,
}) {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const savedUser = localStorage.getItem("rboardUser");

    let currentUser = null;

    try {
        currentUser = savedUser
            ? JSON.parse(savedUser)
            : null;
    } catch {
        currentUser = null;
    }

    const isAuthenticated = Boolean(currentUser?.id);


    useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) {
        return;
    }

    const loadUserData = async () => {
        try {
            const userRef = doc(
                db,
                "users",
                currentUser.id
            );

            const userSnapshot = await getDoc(userRef);

            if (!userSnapshot.exists()) {
                return;
            }

            const userData = userSnapshot.data();

            setForm((previousForm) => ({
                ...previousForm,
                authorName:
                    userData.login || "",
                contact:
                    userData.phone || "",
            }));
        } catch (error) {
            console.error(
                "Помилка завантаження даних користувача:",
                error
            );
        }
    };

    loadUserData();
}, [isAuthenticated, currentUser?.id]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));

        setErrors((previousErrors) => ({
            ...previousErrors,
            [name]: "",
            form: "",
        }));
    };

    const handleCityChange = (city) => {
        setForm((previousForm) => ({
            ...previousForm,
            city,
        }));

        setErrors((previousErrors) => ({
            ...previousErrors,
            city: "",
            form: "",
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        const authorName = form.authorName.trim();
        const contact = form.contact.trim();
        const title = form.title.trim();
        const street = form.street.trim();
        const comment = form.comment.trim();

        if (!authorName) {
            newErrors.authorName = "Вкажіть ваше ім’я.";
        } else if (authorName.length < 2) {
            newErrors.authorName =
                "Ім’я повинно містити щонайменше 2 символи.";
        } else if (authorName.length > 80) {
            newErrors.authorName =
                "Ім’я не може перевищувати 80 символів.";
        }

        if (!contact) {
            newErrors.contact =
                "Вкажіть електронну пошту або номер телефону.";
        } else if (
            !emailRegex.test(contact) &&
            !phoneRegex.test(contact)
        ) {
            newErrors.contact =
                "Введіть коректну пошту або номер телефону.";
        }

        if (!title) {
            newErrors.title =
                "Вкажіть назву оголошення.";
        } else if (title.length < 5) {
            newErrors.title =
                "Назва повинна містити щонайменше 5 символів.";
        } else if (title.length > 120) {
            newErrors.title =
                "Назва не може перевищувати 120 символів.";
        }

        if (!form.type) {
            newErrors.type =
                "Оберіть тип оголошення.";
        } else if (!LISTING_TYPES.includes(form.type)) {
            newErrors.type =
                "Оберіть коректний тип оголошення.";
        }

        if (!form.city?.name) {
            newErrors.city =
                "Оберіть місто зі списку.";
        }

        if (street.length > 120) {
            newErrors.street =
                "Назва вулиці не може перевищувати 120 символів.";
        }

        if (comment.length > 1500) {
            newErrors.comment =
                "Коментар не може перевищувати 1500 символів.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const createListingData = () => {
        return {
            authorName: form.authorName.trim(),

            normalizedAuthorName: normalizeName(
                form.authorName
            ),

            contact: normalizeContact(form.contact),
            contactOriginal: form.contact.trim(),

            title: form.title.trim(),
            type: form.type,

            city: getCleanCity(form.city),

            street: form.street.trim(),
            comment: form.comment.trim(),

            status: "pending",
            views: 0,
            author: {
                isAuthenticated,
                uid: currentUser?.id || null,
                login: currentUser?.login || null,
                phone: currentUser?.phone || null,
                label: isAuthenticated
                    ? "Авторизований користувач"
                    : "Не авторизований",
            },

            moderation: {
                reviewedBy: null,
                reviewedAt: null,
                rejectionReason: null,
            },

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            approvedAt: null,
        };
    };

    const createAuthenticatedListing = async () => {
        const listingRef = doc(
            collection(db, "listings")
        );

        await runTransaction(db, async (transaction) => {
            transaction.set(
                listingRef,
                createListingData()
            );
        });

        return {
            listingId: listingRef.id,
            attemptsLeft: null,
        };
    };

    const createGuestListing = async () => {
        const guestLimitId = createGuestLimitId(
            form.authorName,
            form.contact
        );

        const listingRef = doc(
            collection(db, "listings")
        );

        const limitRef = doc(
            db,
            "guestListingLimits",
            guestLimitId
        );

        const result = await runTransaction(
            db,
            async (transaction) => {
                const limitSnapshot =
                    await transaction.get(limitRef);

                const now = new Date();

                const periodMilliseconds =
                    LIMIT_PERIOD_DAYS *
                    24 *
                    60 *
                    60 *
                    1000;

                let attemptsLeft = MAX_GUEST_LISTINGS;

                let periodStartedAt = now;

                let periodEndsAt = new Date(
                    now.getTime() + periodMilliseconds
                );

                if (limitSnapshot.exists()) {
                    const limitData =
                        limitSnapshot.data();

                    const savedPeriodStartedAt =
                        limitData.periodStartedAt
                            ?.toDate?.();

                    const savedPeriodEndsAt =
                        limitData.periodEndsAt
                            ?.toDate?.();

                    const periodIsActive =
                        savedPeriodEndsAt &&
                        savedPeriodEndsAt.getTime() >
                        now.getTime();

                    if (periodIsActive) {
                        attemptsLeft = Number(
                            limitData.attemptsLeft ?? 0
                        );

                        periodStartedAt =
                            savedPeriodStartedAt || now;

                        periodEndsAt =
                            savedPeriodEndsAt;
                    }
                }

                if (attemptsLeft <= 0) {
                    const remainingMilliseconds =
                        periodEndsAt.getTime() -
                        now.getTime();

                    const limitError = new Error(
                        "GUEST_LIMIT_EXCEEDED"
                    );

                    limitError.code =
                        "GUEST_LIMIT_EXCEEDED";

                    limitError.remainingTime =
                        formatRemainingTime(
                            remainingMilliseconds
                        );

                    throw limitError;
                }

                const newAttemptsLeft =
                    attemptsLeft - 1;

                const listingData = {
                    ...createListingData(),

                    guestLimit: {
                        limitId: guestLimitId,
                        maximumAttempts:
                            MAX_GUEST_LISTINGS,
                        attemptsLeftAfterSubmission:
                            newAttemptsLeft,
                        periodDays:
                            LIMIT_PERIOD_DAYS,
                    },
                };

                transaction.set(
                    listingRef,
                    listingData
                );

                transaction.set(
                    limitRef,
                    {
                        authorName:
                            form.authorName.trim(),

                        normalizedAuthorName:
                            normalizeName(
                                form.authorName
                            ),

                        contact: normalizeContact(
                            form.contact
                        ),

                        contactOriginal:
                            form.contact.trim(),

                        attemptsLeft:
                            newAttemptsLeft,

                        maximumAttempts:
                            MAX_GUEST_LISTINGS,

                        periodStartedAt,
                        periodEndsAt,

                        lastSubmissionAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp(),
                    },
                    {
                        merge: true,
                    }
                );

                return {
                    listingId: listingRef.id,
                    attemptsLeft:
                        newAttemptsLeft,
                };
            }
        );

        return result;
    };

    const saveListing = async () => {
        if (isAuthenticated) {
            return createAuthenticatedListing();
        }

        return createGuestListing();
    };

    const showValidationAlert = async () => {
        await Swal.fire({
            icon: "warning",
            title: "Перевірте форму",
            text: "Заповніть усі обов’язкові поля правильно.",
            confirmButtonText: "Добре",
            confirmButtonColor: "#2563eb",
        });
    };

    const showSuccessAlert = async (
        attemptsLeft
    ) => {
        const attemptsMessage =
            attemptsLeft !== null
                ? `
                    <p style="margin-top: 12px; line-height: 1.6;">
                        У вас залишилося безкоштовних оголошень:
                        <strong>${attemptsLeft}</strong>.
                    </p>
                `
                : "";

        await Swal.fire({
            icon: "success",
            title: "Оголошення на перевірці",
            html: `
                <p style="line-height: 1.6;">
                    Ваше оголошення успішно надіслано
                    на модерацію.
                </p>

                <p style="margin-top: 8px; line-height: 1.6;">
                    Зазвичай перевірка займає до однієї години.
                    Після схвалення оголошення з’явиться
                    на головній сторінці.
                </p>

                ${attemptsMessage}
            `,
            confirmButtonText:
                "Повернутися на головну",
            confirmButtonColor: "#2563eb",
            allowOutsideClick: false,
            allowEscapeKey: false,
        });
    };

    const showLimitAlert = async (
        remainingTime
    ) => {
        await Swal.fire({
            icon: "info",
            title: "Спроби вичерпано",
            html: `
                <p style="line-height: 1.6;">
                    Ви вже використали всі
                    <strong>${MAX_GUEST_LISTINGS}</strong>
                    безкоштовні оголошення.
                </p>

                <p style="margin-top: 10px; line-height: 1.6;">
                    Нові спроби будуть доступні через:
                </p>

                <p style="
                    margin-top: 8px;
                    font-size: 20px;
                    font-weight: 700;
                    color: #2563eb;
                ">
                    ${remainingTime}
                </p>

                <p style="margin-top: 14px; line-height: 1.6;">
                    Ви також можете зареєструватися,
                    щоб керувати своїми оголошеннями
                    та відстежувати їхній статус.
                </p>
            `,
            confirmButtonText: "Зрозуміло",
            confirmButtonColor: "#2563eb",
        });
    };

    const showErrorAlert = async (error) => {
        let message =
            "Під час збереження оголошення сталася помилка. Спробуйте ще раз.";

        if (
            error?.code === "permission-denied" ||
            error?.code ===
            "firestore/permission-denied"
        ) {
            message =
                "Немає дозволу на створення оголошення. Перевірте правила Firestore.";
        }

        if (
            error?.code === "unavailable" ||
            error?.code ===
            "firestore/unavailable"
        ) {
            message =
                "Сервіс тимчасово недоступний. Перевірте інтернет-з’єднання та спробуйте ще раз.";
        }

        await Swal.fire({
            icon: "error",
            title: "Не вдалося надіслати",
            text: message,
            confirmButtonText: "Закрити",
            confirmButtonColor: "#2563eb",
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        const formIsValid = validateForm();

        if (!formIsValid) {
            await showValidationAlert();
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            const result = await saveListing();

            setForm(initialForm);

            await showSuccessAlert(
                result.attemptsLeft
            );

            if (typeof onSuccess === "function") {
                onSuccess();
            }
        } catch (error) {
            console.error(
                "Помилка створення оголошення:",
                error
            );

            if (
                error?.code ===
                "GUEST_LIMIT_EXCEEDED" ||
                error?.message ===
                "GUEST_LIMIT_EXCEEDED"
            ) {
                await showLimitAlert(
                    error.remainingTime ||
                    "деякий час"
                );

                return;
            }

            await showErrorAlert(error);
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = (fieldName) => {
        return `w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${errors[fieldName]
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
            }`;
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
            noValidate
        >
            {errors.form && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errors.form}
                </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="authorName"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Ваше ім’я{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        id="authorName"
                        name="authorName"
                        type="text"
                        value={form.authorName}
                        onChange={handleChange}
                        placeholder="Наприклад: Іван"
                        autoComplete="name"
                        maxLength={80}
                        className={inputClass(
                            "authorName"
                        )}
                    />

                    {errors.authorName && (
                        <p className="mt-1.5 text-sm text-red-600">
                            {errors.authorName}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="contact"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Зв’язок із вами{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        id="contact"
                        name="contact"
                        type="text"
                        value={form.contact}
                        onChange={handleChange}
                        placeholder="+380... або email@example.com"
                        autoComplete="email"
                        inputMode="text"
                        maxLength={120}
                        className={inputClass(
                            "contact"
                        )}
                    />

                    {errors.contact && (
                        <p className="mt-1.5 text-sm text-red-600">
                            {errors.contact}
                        </p>
                    )}
                </div>
            </div>

            <div>
                <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Назва оголошення{" "}
                    <span className="text-red-500">
                        *
                    </span>
                </label>

                <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Наприклад: Продам велосипед"
                    maxLength={120}
                    className={inputClass("title")}
                />

                <div className="mt-1.5 flex items-start justify-between gap-4">
                    <div>
                        {errors.title && (
                            <p className="text-sm text-red-600">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    <span className="shrink-0 text-xs text-slate-400">
                        {form.title.length}/120
                    </span>
                </div>
            </div>

            <div>
                <label
                    htmlFor="type"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Тип оголошення{" "}
                    <span className="text-red-500">
                        *
                    </span>
                </label>

                <select
                    id="type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className={inputClass("type")}
                >
                    <option value="">
                        Оберіть тип оголошення
                    </option>

                    {LISTING_TYPES.map((type) => (
                        <option
                            key={type}
                            value={type}
                        >
                            {type}
                        </option>
                    ))}
                </select>

                {errors.type && (
                    <p className="mt-1.5 text-sm text-red-600">
                        {errors.type}
                    </p>
                )}
            </div>

            <CityAutocomplete
                value={form.city}
                onChange={handleCityChange}
                error={errors.city}
            />

            <div>
                <label
                    htmlFor="street"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Вулиця{" "}
                    <span className="font-normal text-slate-400">
                        — необов’язково
                    </span>
                </label>

                <input
                    id="street"
                    name="street"
                    type="text"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="Наприклад: вул. Шевченка"
                    autoComplete="street-address"
                    maxLength={120}
                    className={inputClass("street")}
                />

                {errors.street && (
                    <p className="mt-1.5 text-sm text-red-600">
                        {errors.street}
                    </p>
                )}
            </div>

            <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                        htmlFor="comment"
                        className="text-sm font-semibold text-slate-700"
                    >
                        Коментар{" "}
                        <span className="font-normal text-slate-400">
                            — необов’язково
                        </span>
                    </label>

                    <span className="text-xs text-slate-400">
                        {form.comment.length}/1500
                    </span>
                </div>

                <textarea
                    id="comment"
                    name="comment"
                    value={form.comment}
                    onChange={handleChange}
                    placeholder="Опишіть товар, послугу, запитання або іншу важливу інформацію"
                    rows={6}
                    maxLength={1500}
                    className={`${inputClass(
                        "comment"
                    )} min-h-36 resize-y`}
                />

                {errors.comment && (
                    <p className="mt-1.5 text-sm text-red-600">
                        {errors.comment}
                    </p>
                )}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="flex items-start gap-3">
                    <svg
                        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>

                    <p className="text-sm leading-6 text-amber-900">
                        Після надсилання оголошення
                        отримає статус{" "}
                        <strong>«На перевірці»</strong>.
                        Воно з’явиться на головній
                        сторінці лише після схвалення
                        адміністратором.
                    </p>
                </div>
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
                {submitting ? (
                    <>
                        <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Надсилання...
                    </>
                ) : (
                    "Надіслати на перевірку"
                )}
            </button>

            {!isAuthenticated && (
                <div className="rounded-2xl bg-slate-50 px-5 py-5 text-center">
                    <p className="text-sm leading-6 text-slate-600">
                        Зареєструйтеся, щоб переглядати
                        власні оголошення, відстежувати
                        їхній статус і керувати ними
                        зі свого профілю.
                    </p>

                    <button
                        type="button"
                        onClick={onOpenRegister}
                        className="mt-2 text-sm font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                    >
                        Створити обліковий запис
                    </button>
                </div>
            )}
        </form>
    );
}