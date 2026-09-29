import { useState } from "react";
import Swal from "sweetalert2";

import {
    addDoc,
    collection,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import {
    createAdminLog,
    ADMIN_LOG_ACTIONS,
} from "../../utils/adminLogger";
import { db } from "../../firebase";

import CityAutocomplete from "../listings/CityAutocomplete";
import ListingImageUploader from "../listings/ListingImageUploader";

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

const LISTING_LIFETIME_DAYS = 7;

const CLOUDINARY_CLOUD_NAME = "djjhf64uc";
const CLOUDINARY_UPLOAD_PRESET = "user_photos";

const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneRegex =
    /^\+?[0-9\s\-()]{9,20}$/;

const initialForm = {
    authorName: "",
    contact: "",
    title: "",
    type: "",
    city: null,
    street: "",
    comment: "",
};

const normalizeName = (name) => {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

const normalizeContact = (contact) => {
    const normalizedValue =
        contact.trim().toLowerCase();

    if (emailRegex.test(normalizedValue)) {
        return normalizedValue;
    }

    let phone =
        normalizedValue.replace(/\D/g, "");

    if (phone.startsWith("380")) {
        phone = `+${phone}`;
    } else if (phone.startsWith("0")) {
        phone = `+38${phone}`;
    } else if (phone.length > 0) {
        phone = `+${phone}`;
    }

    return phone;
};

const getCleanCity = (city) => {
    return {
        id: city?.id ?? null,
        name: city?.name?.trim() || "",
        region: city?.region?.trim() || "",
        district:
            city?.district?.trim() || "",
        latitude:
            city?.latitude ?? null,
        longitude:
            city?.longitude ?? null,
    };
};

const uploadToCloudinary = async (file) => {
    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error?.message ||
            "Не вдалося завантажити фотографію"
        );
    }

    return {
        imageUrl: data.secure_url,
        imagePublicId: data.public_id,
    };
};

const AdminCreateListingForm = ({
    onSuccess,
}) => {
    const [form, setForm] =
        useState(initialForm);

    const [images, setImages] =
        useState([]);

    const [errors, setErrors] =
        useState({});

    const [submitting, setSubmitting] =
        useState(false);

    const handleChange = (event) => {
        const { name, value } =
            event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));

        setErrors((previousErrors) => ({
            ...previousErrors,
            [name]: "",
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
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        const authorName =
            form.authorName.trim();

        const contact =
            form.contact.trim();

        const title =
            form.title.trim();

        const street =
            form.street.trim();

        const comment =
            form.comment.trim();

        if (!authorName) {
            newErrors.authorName =
                "Вкажіть ім’я автора.";
        } else if (
            authorName.length < 2
        ) {
            newErrors.authorName =
                "Ім’я повинно містити щонайменше 2 символи.";
        } else if (
            authorName.length > 80
        ) {
            newErrors.authorName =
                "Ім’я не може перевищувати 80 символів.";
        }

        if (!contact) {
            newErrors.contact =
                "Вкажіть контакт.";
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
        } else if (
            title.length < 5
        ) {
            newErrors.title =
                "Назва повинна містити щонайменше 5 символів.";
        } else if (
            title.length > 120
        ) {
            newErrors.title =
                "Назва не може перевищувати 120 символів.";
        }

        if (!form.type) {
            newErrors.type =
                "Оберіть тип оголошення.";
        } else if (
            !LISTING_TYPES.includes(
                form.type
            )
        ) {
            newErrors.type =
                "Оберіть коректний тип оголошення.";
        }

        if (!form.city?.name) {
            newErrors.city =
                "Оберіть населений пункт.";
        }

        if (street.length > 120) {
            newErrors.street =
                "Назва вулиці не може перевищувати 120 символів.";
        }

        if (comment.length > 1500) {
            newErrors.comment =
                "Опис не може перевищувати 1500 символів.";
        }

        setErrors(newErrors);

        return (
            Object.keys(newErrors).length ===
            0
        );
    };

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        if (!validateForm()) {
            await Swal.fire({
                icon: "warning",
                title: "Перевірте форму",
                text: "Заповніть обов’язкові поля правильно.",
                confirmButtonText: "Добре",
                confirmButtonColor:
                    "#2563eb",
            });

            return;
        }

        setSubmitting(true);

        try {
            /*
             * 1. Завантажуємо фотографії
             */
            let uploadedImages = [];

            if (images.length > 0) {
                uploadedImages =
                    await Promise.all(
                        images.map(
                            (image) =>
                                uploadToCloudinary(
                                    image.file
                                )
                        )
                    );
            }

            /*
             * 2. Адміністратор одразу
             * публікує оголошення.
             */
            const now = new Date();

            const expiresAt = new Date(
                now.getTime() +
                LISTING_LIFETIME_DAYS *
                24 *
                60 *
                60 *
                1000
            );

            /*
             * 3. Створюємо документ.
             */
            const createdListingRef =
                await addDoc(
                    collection(
                        db,
                        "listings"
                    ),
                    {
                        authorName:
                            form.authorName.trim(),

                        normalizedAuthorName:
                            normalizeName(
                                form.authorName
                            ),

                        contact:
                            normalizeContact(
                                form.contact
                            ),

                        contactOriginal:
                            form.contact.trim(),

                        title:
                            form.title.trim(),

                        type:
                            form.type,

                        city:
                            getCleanCity(
                                form.city
                            ),

                        street:
                            form.street.trim(),

                        comment:
                            form.comment.trim(),

                        images:
                            uploadedImages,

                        status:
                            "approved",

                        views: 0,

                        /*
                         * Це оголошення створив
                         * адміністратор, а не
                         * звичайний користувач.
                         */
                        author: {
                            isAuthenticated:
                                false,

                            uid: null,

                            login: null,

                            phone: null,

                            label:
                                "Створено адміністратором",
                        },

                        moderation: {
                            reviewedBy:
                                "admin",

                            reviewedAt:
                                serverTimestamp(),

                            rejectionReason:
                                null,
                        },

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp(),

                        approvedAt:
                            serverTimestamp(),

                        expiresAt:
                            Timestamp.fromDate(
                                expiresAt
                            ),

                        createdByAdmin:
                            true,
                    }
                );
            await createAdminLog({
                action:
                    ADMIN_LOG_ACTIONS.LISTING_CREATED,

                category:
                    "listings",

                title:
                    "Створено оголошення",

                description:
                    `Адміністратор створив та одразу опублікував ` +
                    `оголошення «${form.title.trim()}» ` +
                    `у категорії «${form.type}» ` +
                    `для населеного пункту «${form.city?.name || "—"}».`,

                targetId:
                    createdListingRef.id,

                targetName:
                    form.title.trim(),
            });
            /*
             * 4. Прибираємо локальні
             * preview URL.
             */
            images.forEach((image) => {
                if (
                    image.previewUrl
                ) {
                    URL.revokeObjectURL(
                        image.previewUrl
                    );
                }
            });

            /*
             * 5. Очищаємо форму.
             */
            setForm(initialForm);
            setImages([]);
            setErrors({});

            await Swal.fire({
                icon: "success",
                title:
                    "Оголошення опубліковано",
                text:
                    "Оголошення створено та одразу опубліковано на 7 днів.",
                confirmButtonText:
                    "До оголошень",
                confirmButtonColor:
                    "#2563eb",
            });

            if (
                typeof onSuccess ===
                "function"
            ) {
                onSuccess();
            }
        } catch (error) {
            console.error(
                "Помилка створення оголошення адміністратором:",
                error
            );

            await Swal.fire({
                icon: "error",
                title:
                    "Не вдалося створити оголошення",
                text:
                    error?.message ||
                    "Спробуйте ще раз.",
                confirmButtonText:
                    "Закрити",
                confirmButtonColor:
                    "#2563eb",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = (
        fieldName
    ) => {
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
            {/* ========================= */}
            {/* АВТОР + КОНТАКТ */}
            {/* ========================= */}

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="authorName"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Ім’я автора{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        id="authorName"
                        name="authorName"
                        type="text"
                        value={
                            form.authorName
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Наприклад: Іван"
                        maxLength={80}
                        className={inputClass(
                            "authorName"
                        )}
                    />

                    {errors.authorName && (
                        <p className="mt-1.5 text-sm text-red-600">
                            {
                                errors.authorName
                            }
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="contact"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Контакт{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        id="contact"
                        name="contact"
                        type="text"
                        value={form.contact}
                        onChange={
                            handleChange
                        }
                        placeholder="+380... або email@example.com"
                        maxLength={120}
                        className={inputClass(
                            "contact"
                        )}
                    />

                    {errors.contact && (
                        <p className="mt-1.5 text-sm text-red-600">
                            {
                                errors.contact
                            }
                        </p>
                    )}
                </div>
            </div>

            {/* ========================= */}
            {/* НАЗВА */}
            {/* ========================= */}

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
                    className={inputClass(
                        "title"
                    )}
                />

                <div className="mt-1.5 flex items-start justify-between gap-4">
                    <div>
                        {errors.title && (
                            <p className="text-sm text-red-600">
                                {
                                    errors.title
                                }
                            </p>
                        )}
                    </div>

                    <span className="shrink-0 text-xs text-slate-400">
                        {form.title.length}
                        /120
                    </span>
                </div>
            </div>

            {/* ========================= */}
            {/* ТИП */}
            {/* ========================= */}

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
                    className={inputClass(
                        "type"
                    )}
                >
                    <option value="">
                        Оберіть тип
                    </option>

                    {LISTING_TYPES.map(
                        (type) => (
                            <option
                                key={type}
                                value={type}
                            >
                                {type}
                            </option>
                        )
                    )}
                </select>

                {errors.type && (
                    <p className="mt-1.5 text-sm text-red-600">
                        {errors.type}
                    </p>
                )}
            </div>

            {/* ========================= */}
            {/* МІСТО */}
            {/* ========================= */}

            <CityAutocomplete
                value={form.city}
                onChange={
                    handleCityChange
                }
                error={errors.city}
            />

            {/* ========================= */}
            {/* ВУЛИЦЯ */}
            {/* ========================= */}

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
                    maxLength={120}
                    className={inputClass(
                        "street"
                    )}
                />

                {errors.street && (
                    <p className="mt-1.5 text-sm text-red-600">
                        {errors.street}
                    </p>
                )}
            </div>

            {/* ========================= */}
            {/* ФОТО */}
            {/* ========================= */}

            <ListingImageUploader
                images={images}
                onChange={setImages}
                disabled={submitting}
            />

            {/* ========================= */}
            {/* ОПИС */}
            {/* ========================= */}

            <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                        htmlFor="comment"
                        className="text-sm font-semibold text-slate-700"
                    >
                        Опис{" "}
                        <span className="font-normal text-slate-400">
                            — необов’язково
                        </span>
                    </label>

                    <span className="text-xs text-slate-400">
                        {
                            form.comment
                                .length
                        }
                        /1500
                    </span>
                </div>

                <textarea
                    id="comment"
                    name="comment"
                    value={form.comment}
                    onChange={handleChange}
                    placeholder="Детально опишіть оголошення"
                    rows={6}
                    maxLength={1500}
                    className={`${inputClass(
                        "comment"
                    )} min-h-36 resize-y`}
                />

                {errors.comment && (
                    <p className="mt-1.5 text-sm text-red-600">
                        {
                            errors.comment
                        }
                    </p>
                )}
            </div>

            {/* ========================= */}
            {/* ІНФОРМАЦІЯ */}
            {/* ========================= */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                    <svg
                        className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                        />

                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                    </svg>

                    <div>
                        <p className="text-sm font-bold text-blue-900">
                            Публікація адміністратором
                        </p>

                        <p className="mt-1 text-sm leading-6 text-blue-800">
                            Оголошення не
                            потребуватиме
                            модерації та буде
                            опубліковано одразу
                            після створення.
                            Стандартний термін
                            публікації — 7 днів.
                        </p>
                    </div>
                </div>
            </div>

            {/* ========================= */}
            {/* SUBMIT */}
            {/* ========================= */}

            <div className="flex justify-end border-t border-slate-100 pt-6">
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-w-[190px] items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? (
                        <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                            Публікація...
                        </>
                    ) : (
                        "Опублікувати оголошення"
                    )}
                </button>
            </div>
        </form>
    );
};

export default AdminCreateListingForm;