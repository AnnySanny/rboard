import { useState } from "react";
import Swal from "sweetalert2";

import {
    deleteField,
    doc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import {
    createAdminLog,
    ADMIN_LOG_ACTIONS,
} from "../../utils/adminLogger";
import { db } from "../../firebase";
import CityAutocomplete from "../listings/CityAutocomplete";
import ListingImageUploader from "../listings/ListingImageUploader";
import ListingContacts from "../listings/ListingContacts";
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

const CLOUDINARY_CLOUD_NAME = "djjhf64uc";
const CLOUDINARY_UPLOAD_PRESET = "user_photos";

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
        latitude:
            city?.latitude ?? null,
        longitude:
            city?.longitude ?? null,
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
const AdminEditListingForm = ({
    listing,
    onSuccess,
}) => {
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
     * Старі фотографії перетворюємо
     * у формат, який розуміє
     * ListingImageUploader.
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
                "Оберіть місто.";
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
             * Фото, які вже були
             * завантажені в Cloudinary.
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
             * Нові фотографії.
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

            /*
             * Оновлюємо ТІЛЬКИ
             * дані оголошення.
             *
             * status
             * createdAt
             * approvedAt
             * expiresAt
             * views
             *
             * НЕ змінюємо.
             */
            const additionalContacts =
                getCleanAdditionalContacts();
            const changes = [];

            const newAuthorName =
                form.authorName.trim();

            const newContact =
                form.contact.trim();

            const newTitle =
                form.title.trim();

            const newStreet =
                form.street.trim();

            const newComment =
                form.comment.trim();


            if (
                newAuthorName !==
                (listing.authorName || "")
            ) {
                changes.push(
                    `ім’я автора: «${listing.authorName || "—"}» → «${newAuthorName}»`
                );
            }


            if (
                newContact !==
                (
                    listing.contactOriginal ||
                    listing.contact ||
                    ""
                )
            ) {
                changes.push(
                    "змінено основний контакт"
                );
            }


            if (
                newTitle !==
                (listing.title || "")
            ) {
                changes.push(
                    `назва: «${listing.title || "—"}» → «${newTitle}»`
                );
            }


            if (
                form.type !==
                (listing.type || "")
            ) {
                changes.push(
                    `тип: «${listing.type || "—"}» → «${form.type}»`
                );
            }


            if (
                form.city?.name !==
                listing.city?.name
            ) {
                changes.push(
                    `населений пункт: «${listing.city?.name || "—"}» → «${form.city?.name || "—"}»`
                );
            }


            if (
                newStreet !==
                (listing.street || "")
            ) {
                changes.push(
                    `вулиця: «${listing.street || "—"}» → «${newStreet || "—"}»`
                );
            }


            if (
                newComment !==
                (listing.comment || "")
            ) {
                changes.push(
                    "змінено опис оголошення"
                );
            }


            const oldImagesCount =
                Array.isArray(listing.images)
                    ? listing.images.length
                    : 0;

            if (
                finalImages.length !==
                oldImagesCount
            ) {
                changes.push(
                    `кількість фото: ${oldImagesCount} → ${finalImages.length}`
                );
            }
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

                    contactOriginal:
                        form.contact.trim(),

                    additionalContacts:
                        Object.keys(
                            additionalContacts
                        ).length > 0
                            ? additionalContacts
                            : deleteField(),

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

                    updatedAt:
                        serverTimestamp(),
                }
            );

            /*
             * Звільняємо blob URL
             * нових локальних фото.
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
            await createAdminLog({
                action:
                    ADMIN_LOG_ACTIONS.LISTING_UPDATED,

                category:
                    "listings",

                title:
                    "Відредаговано оголошення",

                description:
                    changes.length > 0
                        ? `«${newTitle}». Зміни: ${changes.join("; ")}.`
                        : `«${newTitle}». Дані збережено без помітних змін.`,

                targetId:
                    listing.id,

                targetName:
                    newTitle,
            });
            await Swal.fire({
                icon: "success",
                title: "Зміни збережено",
                text: "Оголошення успішно оновлено.",
                confirmButtonText:
                    "До оголошень",
                confirmButtonColor:
                    "#2563eb",
                timer: 1800,
                timerProgressBar: true,
            });

            if (
                typeof onSuccess ===
                "function"
            ) {
                onSuccess();
            }
        } catch (error) {
            console.error(
                "Помилка редагування оголошення адміністратором:",
                error
            );

            await Swal.fire({
                icon: "error",
                title:
                    "Не вдалося зберегти зміни",
                text:
                    "Перевірте з’єднання та права доступу Firestore.",
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
            {/* Автор + контакт */}
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
                    placeholder="Назва оголошення"
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

            {/* Населений пункт */}
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
            <div>
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
                    <p className="mt-2 text-sm font-medium text-red-600">
                        {errors.additionalContacts}
                    </p>
                )}
            </div>


            {/* Фотографії */}
            <ListingImageUploader
                images={images}
                onChange={setImages}
                disabled={submitting}
            />

            {/* Опис */}
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
                    placeholder="Опис оголошення"
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

            {/* Інформація */}
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
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                        />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                    </svg>

                    <p className="text-sm leading-6 text-blue-900">
                        Ви редагуєте
                        оголошення як
                        адміністратор.
                        Поточний статус,
                        кількість переглядів
                        та термін дії
                        оголошення не будуть
                        змінені.
                    </p>
                </div>
            </div>

            {/* Кнопки */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                        if (
                            typeof onSuccess ===
                            "function"
                        ) {
                            onSuccess();
                        }
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Скасувати
                </button>

                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? (
                        <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Збереження...
                        </>
                    ) : (
                        "Зберегти зміни"
                    )}
                </button>
            </div>
        </form>
    );
};

export default AdminEditListingForm;