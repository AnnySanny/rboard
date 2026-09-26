import { useState } from "react";
import Swal from "sweetalert2";

import {
    deleteField,
    doc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase";
import CityAutocomplete from "./CityAutocomplete";
import ListingImageUploader from "./ListingImageUploader";
import ListingContacts from "./ListingContacts";
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

const CLOUDINARY_CLOUD_NAME =
    "djjhf64uc";

const CLOUDINARY_UPLOAD_PRESET =
    "user_photos";

const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneRegex =
    /^\+?[0-9\s\-()]{9,20}$/;

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
        latitude: city?.latitude ?? null,
        longitude: city?.longitude ?? null,
    };
};
const createInitialAdditionalContacts = (
    additionalContacts = {}
) => {
    const getContact = (key) => {
        const value =
            typeof additionalContacts[key] ===
                "string"
                ? additionalContacts[key]
                : "";

        return {
            enabled: Boolean(value.trim()),
            value,
        };
    };

    return {
        instagram:
            getContact("instagram"),

        telegram:
            getContact("telegram"),

        viber:
            getContact("viber"),

        whatsapp:
            getContact("whatsapp"),

        facebook:
            getContact("facebook"),
    };
};
export default function EditListingForm({
    listing,
    onSuccess,
}) {
    const [form, setForm] = useState({
        authorName:
            listing.authorName || "",

        contact:
            listing.contactOriginal ||
            listing.contact ||
            "",

        title:
            listing.title || "",

        type:
            listing.type || "",

        city:
            listing.city || null,

        street:
            listing.street || "",

        comment:
            listing.comment || "",
        additionalContacts:
            createInitialAdditionalContacts(
                listing.additionalContacts
            ),
    });

    /*
     * Тут одночасно зберігаємо:
     *
     * 1. старі фотографії з Firestore;
     * 2. нові File, які користувач додасть.
     */
    const [images, setImages] = useState(
        Array.isArray(listing.images)
            ? listing.images.map(
                (image, index) => ({
                    ...image,

                    id:
                        image.imagePublicId ||
                        `existing-${index}`,

                    previewUrl:
                        image.imageUrl,

                    isExisting: true,
                })
            )
            : []
    );

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
    const handleAdditionalContactsChange = (
        additionalContacts
    ) => {
        setForm((previousForm) => ({
            ...previousForm,
            additionalContacts,
        }));

        setErrors((previousErrors) => ({
            ...previousErrors,
            additionalContacts: "",
            form: "",
        }));
    };
    const getCleanAdditionalContacts = () => {
        const phoneContacts = [
            "telegram",
            "viber",
            "whatsapp",
        ];

        return Object.entries(
            form.additionalContacts
        ).reduce(
            (result, [key, contact]) => {
                const value =
                    contact.value.trim();

                if (
                    !contact.enabled ||
                    !value
                ) {
                    return result;
                }

                result[key] =
                    phoneContacts.includes(key)
                        ? normalizeContact(value)
                        : value;

                return result;
            },
            {}
        );
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
                "Вкажіть ваше ім’я.";
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
                const enabledAdditionalContacts =
            Object.values(
                form.additionalContacts
            ).filter(
                (contact) => contact.enabled
            );

        const hasEmptyAdditionalContact =
            enabledAdditionalContacts.some(
                (contact) =>
                    !contact.value.trim()
            );

        if (hasEmptyAdditionalContact) {
            newErrors.additionalContacts =
                "Заповніть вибрані способи зв’язку або вимкніть їх.";
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
                text: "Заповніть усі обов’язкові поля правильно.",
                confirmButtonText: "Добре",
                confirmButtonColor:
                    "#2563eb",
            });

            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            /*
             * Старі фотографії вже є
             * в Cloudinary.
             */
            const existingImages =
                images
                    .filter(
                        (image) =>
                            image.isExisting &&
                            image.imageUrl
                    )
                    .map((image) => ({
                        imageUrl:
                            image.imageUrl,

                        imagePublicId:
                            image.imagePublicId ||
                            null,
                    }));

            /*
             * Нові фотографії треба
             * завантажити в Cloudinary.
             */
            const newImages =
                images.filter(
                    (image) =>
                        !image.isExisting &&
                        image.file
                );

            let uploadedNewImages = [];

            if (newImages.length > 0) {
                uploadedNewImages =
                    await Promise.all(
                        newImages.map(
                            (image) =>
                                uploadToCloudinary(
                                    image.file
                                )
                        )
                    );
            }

            const finalImages = [
                ...existingImages,
                ...uploadedNewImages,
            ];

            const listingRef = doc(
                db,
                "listings",
                listing.id
            );
            const additionalContacts =
                getCleanAdditionalContacts();
            await updateDoc(
                listingRef,
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
                    additionalContacts:
                        Object.keys(
                            additionalContacts
                        ).length > 0
                            ? additionalContacts
                            : deleteField(),

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
                        finalImages,

                    /*
                     * Після будь-якого
                     * редагування оголошення
                     * знову йде на модерацію.
                     */
                    status: "pending",

                    updatedAt:
                        serverTimestamp(),

                    approvedAt: null,
                    expiresAt: null,

                    moderation: {
                        reviewedBy: null,
                        reviewedAt: null,
                        rejectionReason: null,
                    },
                }
            );

            /*
             * Звільняємо локальні blob URL
             * тільки для НОВИХ фото.
             */
            images.forEach((image) => {
                if (
                    !image.isExisting &&
                    image.previewUrl
                ) {
                    URL.revokeObjectURL(
                        image.previewUrl
                    );
                }
            });

            await Swal.fire({
                icon: "success",
                title: "Зміни збережено",
                html: `
                    <p style="line-height:1.6">
                        Оголошення успішно змінено.
                    </p>

                    <p style="margin-top:8px; line-height:1.6">
                        Після редагування воно повторно
                        надіслане на модерацію.
                    </p>
                `,
                confirmButtonText:
                    "До моїх оголошень",
                confirmButtonColor:
                    "#2563eb",
                allowOutsideClick: false,
                allowEscapeKey: false,
            });

            if (
                typeof onSuccess ===
                "function"
            ) {
                onSuccess();
            }
        } catch (error) {
            console.error(
                "Помилка редагування оголошення:",
                error
            );

            await Swal.fire({
                icon: "error",
                title:
                    "Не вдалося зберегти зміни",
                text:
                    "Під час збереження сталася помилка. Спробуйте ще раз.",
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
            {errors.form && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errors.form}
                </div>
            )}

            {/* Ім'я + контакт */}
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
                            {errors.contact}
                        </p>
                    )}
                </div>
            </div>

            {/* Назва */}
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

            {/* Тип */}
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
                        оголошення
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

            {/* Місто */}
            <CityAutocomplete
                value={form.city}
                onChange={
                    handleCityChange
                }
                error={errors.city}
            />

            {/* Вулиця */}
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
            {/* Додаткові контакти */}
            <ListingContacts
                value={
                    form.additionalContacts
                }
                onChange={
                    handleAdditionalContactsChange
                }
                disabled={submitting}
            />

            {errors.additionalContacts && (
                <p className="-mt-4 text-sm font-medium text-red-600">
                    {errors.additionalContacts}
                </p>
            )}

            {/* Фото */}
            <ListingImageUploader
                images={images}
                onChange={setImages}
                disabled={submitting}
            />
            {/* Коментар */}
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

            {/* Попередження */}
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
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                        />

                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>

                    <p className="text-sm leading-6 text-amber-900">
                        Після збереження
                        змін оголошення
                        отримає статус{" "}
                        <strong>
                            «На перевірці»
                        </strong>
                        . Воно буде повторно
                        опубліковане після
                        схвалення
                        адміністратором.
                    </p>
                </div>
            </div>

            {/* Зберегти */}
            <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
                {submitting ? (
                    <>
                        <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                        Збереження...
                    </>
                ) : (
                    "Зберегти зміни"
                )}
            </button>
        </form>
    );
}