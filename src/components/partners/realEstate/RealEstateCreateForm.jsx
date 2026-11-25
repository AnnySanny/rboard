
import { useEffect, useState } from "react";
import {
    House,
    Mountain,
    MapPin,
    Wallet,
    Phone,
    Images,
    Video,
    WandSparkles,
    Building2,
} from "lucide-react";
import Swal from "sweetalert2";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";

import CityAutocomplete from "../../listings/CityAutocomplete";
import ListingImageUploader from "../../listings/ListingImageUploader";
import FacebookVideoPreview from "./FacebookVideoPreview";
import { timecodeToSeconds } from "./VideoTimecodes";
import { normalizeContactValue } from "../../../utils/contactUtils";
import { parseRealEstateDescription } from "../../../utils/parseRealEstateDescription";
const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 6000,
    timerProgressBar: true,
});

const CLOUDINARY_CLOUD_NAME = "djjhf64uc";
const CLOUDINARY_UPLOAD_PRESET = "user_photos";

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
            "Не вдалося завантажити фотографію."
        );
    }

    return {
        imageUrl: data.secure_url,
        imagePublicId: data.public_id,
    };
};

const isPositiveNumber = (value) =>
    String(value).trim() !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) > 0;

const isValidPhone = (value) => {
    const phone = value.replace(/\D/g, "");

    return /^(380\d{9}|0\d{9})$/.test(phone);
};

const isValidFacebookUrl = (value) => {
    try {
        const url = new URL(value.trim());

        return (
            url.protocol === "https:" &&
            (
                url.hostname === "facebook.com" ||
                url.hostname.endsWith(".facebook.com")
            )
        );
    } catch {
        return false;
    }
};

const createInitialForm = () => ({
    title: "",
    propertyType: "house",

    city: null,
    street: "",
    description: "",
    buildingArea: "",
    landArea: "",
    floors: "",

    price: "",
    currency: "USD",
    priceMode: "total",
    negotiable: false,

    contact: "",
    secondContact: "",

    hasVideoReview: false,
    videoUrl: "",
    videoTimecodes: [],
});

const inputClass =
    "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function SectionTitle({ icon: Icon, children }) {
    return (
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
            <Icon size={18} className="text-blue-600" />
            {children}
        </h2>
    );
}

export default function RealEstateCreateForm() {
    const [form, setForm] = useState(createInitialForm);
    const [images, setImages] = useState([]);
    const [profileLoading, setProfileLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    // Отримуємо телефон із публічного профілю
    useEffect(() => {
        let active = true;
        let requestVersion = 0;

        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                const version = ++requestVersion;

                if (!active) return;

                setProfileLoading(true);

                if (!user) {
                    setForm(createInitialForm());
                    setProfileLoading(false);
                    return;
                }

                try {
                    const snapshot = await getDoc(
                        doc(db, "publicProfiles", user.uid)
                    );

                    if (!active || version !== requestVersion) {
                        return;
                    }

                    const phone = snapshot.exists()
                        ? snapshot.data().phone || ""
                        : "";

                    setForm((previous) => ({
                        ...previous,
                        contact: phone,
                    }));
                } catch (error) {
                    console.error(
                        "Помилка завантаження телефону:",
                        error
                    );
                } finally {
                    if (active && version === requestVersion) {
                        setProfileLoading(false);
                    }
                }
            }
        );

        return () => {
            active = false;
            requestVersion++;
            unsubscribe();
        };
    }, []);

    const updateField = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        updateField(
            name,
            type === "checkbox" ? checked : value
        );
    };

    const handleAutoFillFromDescription = async () => {
        if (!form.description.trim()) {
            Toast.fire({
                icon: "info",
                title: "Спочатку введіть опис об'єкта.",
            });
            return;
        }

        const { fields, notes } = parseRealEstateDescription(
            form.description
        );

        const entries = Object.entries(fields);

        if (entries.length === 0) {
            Toast.fire({
                icon: "info",
                title: "Не вдалося знайти дані для заповнення.",
                text: "Спробуйте уточнити ціну, площу, адресу або контакти.",
            });
            return;
        }

        const labels = {
            propertyType: "Тип об'єкта",
            buildingArea:
                fields.propertyType === "commercial"
                    ? "Площа приміщення"
                    : "Площа будинку",
            landArea: "Площа ділянки",
            floors: "Поверхи",
            price: "Ціна",
            currency: "Валюта",
            priceMode: "Тип ціни",
            negotiable: "Можливий торг",
            contact: "Основний телефон",
            secondContact: "Другий телефон",
            street: "Вулиця",
        };

        const values = {
            house: "Будинок",
            land: "Земельна ділянка",
            commercial: "Комерція",
            USD: "USD",
            EUR: "EUR",
            UAH: "UAH",
            per_sotka: "За сотку",
        };

        const preview = entries.map(([key, value]) => {
            const displayValue =
                typeof value === "boolean"
                    ? value ? "Так" : "Ні"
                    : values[value] || value;

            return `${labels[key] || key}: ${displayValue}`;
        });

        const result = await Swal.fire({
            icon: "question",
            title: "Заповнити дані з опису?",
            text: [
                "Знайдено:",
                ...preview,
                "",
                ...notes,
                "",
                "Перевірте всі значення після заповнення.",
            ].join("\n"),
            showCancelButton: true,
            confirmButtonText: "Заповнити",
            cancelButtonText: "Скасувати",
            confirmButtonColor: "#2563eb",
            width: 520,
        });

        if (!result.isConfirmed) return;

        setForm((previous) => {
            const updated = {
                ...previous,
                ...fields,
            };

            if (fields.propertyType === "land") {
                updated.buildingArea = "";
                updated.floors = "";
                updated.priceMode = fields.priceMode || "total";
            }

            if (["house", "commercial"].includes(fields.propertyType)) {
                updated.priceMode = "total";
            }

            return updated;
        });

        Toast.fire({
            icon: "success",
            title: "Дані підставлено!",
            text: "Перевірте заповнені поля перед збереженням.",
        });
    };

    const handlePropertyTypeChange = (propertyType) => {
        setForm((previous) => ({
            ...previous,
            propertyType,
            buildingArea: "",
            landArea: "",
            floors: "",
            priceMode: "total",
        }));
    };

    const validateForm = () => {
        const errors = [];

        // Назва
        if (form.title.trim().length < 5) {
            errors.push(
                "Назва оголошення повинна містити щонайменше 5 символів."
            );
        }

        // Тип нерухомості
        if (!["house", "land", "commercial"].includes(form.propertyType)) {
            errors.push("Оберіть тип нерухомості.");
        }

        // Населений пункт
        if (!form.city?.name?.trim()) {
            errors.push("Оберіть населений пункт зі списку.");
        }

        // Характеристики будинку та комерційної нерухомості
        if (["house", "commercial"].includes(form.propertyType)) {
            if (
                form.buildingArea !== "" &&
                !isPositiveNumber(form.buildingArea)
            ) {
                errors.push("Площа будинку має бути більшою за 0.");
            }

            if (
                form.floors !== "" &&
                (
                    !Number.isInteger(Number(form.floors)) ||
                    Number(form.floors) < 1
                )
            ) {
                errors.push("Кількість поверхів має бути цілим числом від 1.");
            }

            if (
                form.landArea !== "" &&
                !isPositiveNumber(form.landArea)
            ) {
                errors.push("Площа земельної ділянки має бути більшою за 0.");
            }
        }

        // Характеристики земельної ділянки
        if (form.propertyType === "land") {
            if (!isPositiveNumber(form.landArea)) {
                errors.push("Вкажіть коректну площу земельної ділянки.");
            }

            if (!["total", "per_sotka"].includes(form.priceMode)) {
                errors.push("Оберіть тип ціни земельної ділянки.");
            }
        }

        // Ціна та валюта
        if (!isPositiveNumber(form.price)) {
            errors.push("Вкажіть коректну ціну, більшу за 0.");
        }

        if (!["USD", "EUR", "UAH"].includes(form.currency)) {
            errors.push("Оберіть валюту.");
        }

        // Контактні телефони
        const contact = form.contact.trim();
        const secondContact = form.secondContact.trim();

        if (!contact && !secondContact) {
            errors.push("Вкажіть хоча б один контактний номер.");
        }

        if (contact && !isValidPhone(contact)) {
            errors.push("Основний номер телефону має неправильний формат.");
        }

        if (secondContact && !isValidPhone(secondContact)) {
            errors.push("Другий номер телефону має неправильний формат.");
        }

        if (
            contact &&
            secondContact &&
            isValidPhone(contact) &&
            isValidPhone(secondContact)
        ) {
            const normalizePhone = (phone) => {
                const digits = phone.replace(/\D/g, "");
                return digits.startsWith("0")
                    ? `38${digits}`
                    : digits;
            };

            if (
                normalizePhone(contact) ===
                normalizePhone(secondContact)
            ) {
                errors.push("Контактні номери не повинні дублюватися.");
            }
        }

        // Обов'язково хоча б одне: фото або відео
        if (
            images.length === 0 &&
            !(
                form.hasVideoReview &&
                isValidFacebookUrl(form.videoUrl)
            )
        ) {
            errors.push(
                "Додайте хоча б одну фотографію або Facebook-відео."
            );
        }

        // Відеоогляд
        if (form.hasVideoReview) {
            if (!isValidFacebookUrl(form.videoUrl)) {
                errors.push(
                    "Вкажіть коректне HTTPS-посилання на Facebook-відео."
                );
            }

            // Таймкоди необов'язкові,
            // але якщо додані — перевіряємо всі
            const usedSeconds = new Set();

            form.videoTimecodes.forEach((item, index) => {
                const seconds = timecodeToSeconds(item.time);

                if (seconds === null) {
                    errors.push(
                        `Таймкод №${index + 1}: неправильний формат часу.`
                    );
                }

                if (!item.title?.trim()) {
                    errors.push(
                        `Таймкод №${index + 1}: вкажіть назву фрагмента.`
                    );
                }

                if (seconds !== null) {
                    if (usedSeconds.has(seconds)) {
                        errors.push(
                            `Таймкод №${index + 1}: цей час уже використовується.`
                        );
                    }

                    usedSeconds.add(seconds);
                }

                if (
                    !["none", "right", "left"].includes(
                        item.rotation || "none"
                    )
                ) {
                    errors.push(
                        `Таймкод №${index + 1}: некоректний поворот відео.`
                    );
                }
            });
        }

        // Показуємо всі помилки одним Toast
        if (errors.length > 0) {
            Toast.fire({
                icon: "warning",
                title: "Перевірте оголошення",
                timer: 8000,
                html: `
                <div style="text-align:left; font-size:13px; line-height:1.6;">
                    ${errors.map((error) => `
                        <div style="margin-bottom:5px;">
                            • ${error}
                        </div>
                    `).join("")}
                </div>
            `,
            });

            return false;
        }

        return true;
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting || !validateForm()) {
            return;
        }

        const user = auth.currentUser;

        if (!user) {
            Toast.fire({
                icon: "error",
                title: "Для створення оголошення потрібно увійти в акаунт.",
            });
            return;
        }

        setSubmitting(true);

        try {
            // Перевіряємо статус партнера перед завантаженням фото
            const [userSnapshot, partnerSnapshot] = await Promise.all([
                getDoc(doc(db, "users", user.uid)),
                getDoc(doc(db, "partners", user.uid)),
            ]);

            if (!userSnapshot.exists() || !partnerSnapshot.exists()) {
                throw new Error("Профіль партнера не знайдено.");
            }

            const userData = userSnapshot.data();
            const partnerData = partnerSnapshot.data();

            if (
                userData.blocked === true ||
                userData.partner !== true ||
                userData.partnerType !== "real_estate" ||
                partnerData.active !== true ||
                partnerData.partnerType !== "real_estate"
            ) {
                throw new Error(
                    "Ваш акаунт не має активного доступу до створення оголошень нерухомості."
                );
            }

            const authorName = String(userData.login || "").trim();

            if (!authorName) {
                throw new Error(
                    "У профілі відсутнє ім'я користувача."
                );
            }

            // Завантажуємо фото тільки під час збереження
            const uploadedImages = images.length > 0
                ? await Promise.all(
                    images.map((image) =>
                        uploadToCloudinary(image.file)
                    )
                )
                : [];

            // Якщо основний номер порожній,
            // використовуємо другий як контакт оголошення
            const contact = (
                form.contact.trim() ||
                form.secondContact.trim()
            );

            const secondContact = (
                form.contact.trim() &&
                form.secondContact.trim()
            )
                ? normalizeContactValue(form.secondContact)
                : "";

            // Підготовка відео та таймкодів
            const video = form.hasVideoReview
                ? {
                    provider: "facebook",
                    url: form.videoUrl.trim(),
                    timecodes: form.videoTimecodes
                        .map((item) => ({
                            seconds: timecodeToSeconds(item.time),
                            title: item.title.trim(),
                            rotation: item.rotation || "none",
                        }))
                        .sort((a, b) => a.seconds - b.seconds),
                }
                : null;

            // Єдина структура для звичайних
            // і спеціалізованих оголошень
            const listingData = {
                authorName,
                normalizedAuthorName: authorName
                    .toLowerCase()
                    .replace(/\s+/g, " "),

                hidePhone: false,

                contact: normalizeContactValue(contact),
                contactOriginal: contact,

                title: form.title.trim(),
                type: "Продаж",

                city: {
                    id: form.city?.id ?? null,
                    name: form.city?.name?.trim() || "",
                    region: form.city?.region?.trim() || "",
                    district: form.city?.district?.trim() || "",
                    latitude: form.city?.latitude ?? null,
                    longitude: form.city?.longitude ?? null,
                },

                street: form.street.trim(),
                comment: form.description.trim(),
                images: uploadedImages,

                status: "pending",
                views: 0,

                author: {
                    isAuthenticated: true,
                    uid: user.uid,
                    login: authorName,
                    phone: userData.phone ||
                        normalizeContactValue(contact),
                    label: "Авторизований користувач",
                },

                moderation: {
                    reviewedBy: null,
                    reviewedAt: null,
                    rejectionReason: null,
                },

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                approvedAt: null,
                expiresAt: null,

                // Ідентифікація партнерського оголошення
                listingKind: "partner",
                partnerType: "real_estate",
                partnerUid: user.uid,

                // Спеціалізовані поля нерухомості
                realEstate: {
                    propertyType: form.propertyType,

                    buildingArea:
                        ["house", "commercial"].includes(form.propertyType) &&
                            form.buildingArea !== ""
                            ? Number(form.buildingArea)
                            : null,

                    landArea: form.landArea !== ""
                        ? Number(form.landArea)
                        : null,

                    floors:
                        ["house", "commercial"].includes(form.propertyType) &&
                            form.floors !== ""
                            ? Number(form.floors)
                            : null,

                    price: Number(form.price),
                    currency: form.currency,

                    priceMode: form.propertyType === "land"
                        ? form.priceMode
                        : "total",

                    negotiable: form.negotiable,

                    secondContact,
                    video,
                },
            };

            const listingRef = doc(
                collection(db, "listings")
            );

            await setDoc(listingRef, listingData);

            // Сповіщення адміністратору не повинно
            // впливати на успішне збереження
            try {
                const response = await fetch(
                    "/.netlify/functions/notify-admin",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            action: "created",
                            listingId: listingRef.id,
                            title: form.title.trim(),
                            author: authorName,
                            isAuthenticated: true,
                            description: form.description.trim(),
                            city: form.city?.name || "",
                            type: "Продаж",
                        }),
                    }
                );

                if (!response.ok) {
                    console.warn(
                        "Не вдалося повідомити адміністратора:",
                        response.status
                    );
                }
            } catch (error) {
                console.warn(
                    "Помилка сповіщення адміністратора:",
                    error
                );
            }

            // Очищаємо фото після успішного збереження
            images.forEach((image) => {
                if (image.previewUrl) {
                    URL.revokeObjectURL(image.previewUrl);
                }
            });

            setImages([]);
            setForm({
                ...createInitialForm(),
                contact: form.contact,
            });

            Toast.fire({
                icon: "success",
                title: "Оголошення надіслано на модерацію!",
                text: "Після перевірки адміністратором воно з'явиться на сайті.",
                timer: 6000,
            });

        } catch (error) {
            console.error(
                "Помилка створення нерухомості:",
                error
            );

            const message =
                error.code === "permission-denied"
                    ? "Немає дозволу на створення оголошення. Перевірте правила Firestore."
                    : error.message ||
                    "Не вдалося зберегти оголошення.";

            Toast.fire({
                icon: "error",
                title: "Помилка збереження",
                text: message,
                timer: 7000,
            });
        } finally {
            setSubmitting(false);
        }
    };


    if (profileLoading) {
        return (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span className="text-sm text-slate-500">
                    Завантаження даних...
                </span>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            noValidate
        >
            {/* ТИП НЕРУХОМОСТІ */}
            <section>
                <SectionTitle icon={House}>
                    Тип нерухомості
                </SectionTitle>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                        {
                            value: "house",
                            label: "Будинок",
                            Icon: House,
                        },
                        {
                            value: "land",
                            label: "Земельна ділянка",
                            Icon: Mountain,
                        },
                        {
                            value: "commercial",
                            label: "Комерція",
                            Icon: Building2,
                        },
                    ].map(({ value, label, Icon }) => {
                        const selected = form.propertyType === value;

                        return (
                            <label
                                key={value}
                                className={`cursor-pointer ${value === "commercial"
                                    ? "col-span-2 sm:col-span-1"
                                    : ""
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="propertyType"
                                    value={value}
                                    checked={selected}
                                    onChange={() =>
                                        handlePropertyTypeChange(value)
                                    }
                                    className="peer sr-only"
                                />

                                <div
                                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100 ${selected
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon size={19} />
                                    <span>{label}</span>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </section>

            {/* НАЗВА ТА АДРЕСА */}
            <section className="border-t border-slate-100 pt-5">
                <SectionTitle icon={MapPin}>
                    Основна інформація
                </SectionTitle>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label
                            htmlFor="realEstateTitle"
                            className="mb-1.5 block text-sm font-semibold text-slate-700"
                        >
                            Назва оголошення *
                        </label>

                        <input
                            id="realEstateTitle"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            maxLength={120}
                            placeholder={
                                form.propertyType === "house"
                                    ? "Продається будинок у Рахові"
                                    : form.propertyType === "commercial"
                                        ? "Продається комерційне приміщення у Рахові"
                                        : "Земельна ділянка на Драгобраті"
                            }
                            className={inputClass}
                        />
                    </div>

                    <div className="min-w-0">
                        <CityAutocomplete
                            value={form.city}
                            onChange={(city) =>
                                updateField("city", city)
                            }
                        />
                    </div>

                    <div className="min-w-0">
                        <label
                            htmlFor="realEstateStreet"
                            className="mb-1.5 block text-sm font-semibold text-slate-700"
                        >
                            Вулиця та номер
                            <span className="ml-1 text-xs font-normal text-slate-400">
                                необов'язково
                            </span>
                        </label>

                        <input
                            id="realEstateStreet"
                            name="street"
                            value={form.street}
                            onChange={handleChange}
                            maxLength={120}
                            placeholder="вул. Перемоги, 13"
                            className={inputClass}

                        />
                    </div>

                    {/* Опис нерухомості */}
                    <div className="sm:col-span-2">
                        <label
                            htmlFor="realEstateDescription"
                            className="mb-1.5 block text-sm font-semibold text-slate-700"
                        >
                            Опис об'єкта
                            <span className="ml-1 text-xs font-normal text-slate-400">
                                необов'язково
                            </span>
                        </label>

                        <textarea
                            id="realEstateDescription"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            maxLength={3000}
                            rows={5}
                            placeholder={
                                form.propertyType === "house"
                                    ? "Опишіть стан будинку, планування, ремонт, комунікації, опалення та інші особливості..."
                                    : form.propertyType === "commercial"
                                        ? "Опишіть призначення приміщення, площу, планування, обладнання, під'їзд, парковку та можливості використання для бізнесу..."
                                        : "Опишіть розташування ділянки, під'їзд, комунікації, цільове призначення та інші переваги..."
                            }
                            className={`${inputClass} resize-y`}
                        />
                        <div className="mt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={handleAutoFillFromDescription}
                                disabled={!form.description.trim() || submitting}
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <WandSparkles size={16} />
                                Розподілити дані
                            </button>
                        </div>
                        <div className="mt-1 flex justify-between gap-3 text-[11px] text-slate-400">
                            <span>
                                Додайте інформацію, яка допоможе покупцю.
                            </span>

                            <span className="shrink-0 tabular-nums">
                                {form.description.length}/3000
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ХАРАКТЕРИСТИКИ */}

            <section className="border-t border-slate-100 pt-5">
                <SectionTitle icon={House}>
                    Характеристики
                </SectionTitle>

                {["house", "commercial"].includes(form.propertyType) ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

                        <div>
                            <label
                                htmlFor="buildingArea"
                                className="mb-1.5 block text-sm font-semibold text-slate-700"
                            >
                                {form.propertyType === "commercial"
                                    ? "Площа приміщення, м²"
                                    : "Площа будинку, м²"}

                                <span className="ml-1 text-xs font-normal text-slate-400">
                                    необов'язково
                                </span>
                            </label>

                            <input
                                id="buildingArea"
                                name="buildingArea"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.buildingArea}
                                onChange={handleChange}
                                placeholder="120"
                                className={inputClass}
                            />
                        </div>


                        <div>
                            <label
                                htmlFor="floors"
                                className="mb-1.5 block text-sm font-semibold text-slate-700"
                            >
                                Поверхів
                            </label>

                            <input
                                id="floors"
                                name="floors"
                                type="number"
                                min="1"
                                step="1"
                                value={form.floors}
                                onChange={handleChange}
                                placeholder="1"
                                className={inputClass}
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label
                                htmlFor="houseLandArea"
                                className="mb-1.5 block text-sm font-semibold text-slate-700"
                            >
                                Ділянка, сотки
                            </label>

                            <input
                                id="houseLandArea"
                                name="landArea"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.landArea}
                                onChange={handleChange}
                                placeholder="20"
                                className={inputClass}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="max-w-sm">
                        <label
                            htmlFor="landArea"
                            className="mb-1.5 block text-sm font-semibold text-slate-700"
                        >
                            Площа земельної ділянки, сотки *
                        </label>

                        <input
                            id="landArea"
                            name="landArea"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.landArea}
                            onChange={handleChange}
                            placeholder="10"
                            className={inputClass}
                        />

                        <p className="mt-1.5 text-xs text-slate-400">
                            1 сотка = 0,01 га
                        </p>
                    </div>
                )}
            </section>

            {/* ЦІНА */}
            <section className="border-t border-slate-100 pt-5">
                <SectionTitle icon={Wallet}>
                    Вартість об'єкта
                </SectionTitle>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="col-span-2 sm:col-span-1">
                        <label
                            htmlFor="realEstatePrice"
                            className="mb-1.5 block text-sm font-semibold text-slate-700"
                        >
                            Ціна *
                        </label>

                        <input
                            id="realEstatePrice"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={handleChange}
                            placeholder="17000"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="currency"
                            className="mb-1.5 block text-sm font-semibold text-slate-700"
                        >
                            Валюта
                        </label>

                        <select
                            id="currency"
                            name="currency"
                            value={form.currency}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="USD">$ — Долари</option>
                            <option value="UAH">₴ — Гривні</option>
                            <option value="EUR">€ — Євро</option>
                        </select>
                    </div>

                    {form.propertyType === "land" && (
                        <div>
                            <label
                                htmlFor="priceMode"
                                className="mb-1.5 block text-sm font-semibold text-slate-700"
                            >
                                Тип ціни
                            </label>

                            <select
                                id="priceMode"
                                name="priceMode"
                                value={form.priceMode}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="total">За всю ділянку</option>
                                <option value="per_sotka">За 1 сотку</option>
                            </select>
                        </div>
                    )}
                </div>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5">
                    <input
                        type="checkbox"
                        name="negotiable"
                        checked={form.negotiable}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />

                    <span className="text-sm font-medium text-slate-700">
                        Можливий торг
                    </span>
                </label>
            </section>

            {/* КОНТАКТИ */}
            <section className="border-t border-slate-100 pt-5">
                <SectionTitle icon={Phone}>
                    Контактні телефони
                </SectionTitle>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="realEstateContact"
                            className="mb-1.5 block text-sm font-semibold text-slate-700"
                        >
                            Основний номер *
                        </label>

                        <input
                            id="realEstateContact"
                            name="contact"
                            type="tel"
                            value={form.contact}
                            onChange={handleChange}
                            placeholder="+380..."
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="secondContact"
                            className="mb-1.5 block text-sm font-semibold text-slate-700"
                        >
                            Другий номер
                            <span className="ml-1 text-xs font-normal text-slate-400">
                                необов'язково
                            </span>
                        </label>

                        <input
                            id="secondContact"
                            name="secondContact"
                            type="tel"
                            value={form.secondContact}
                            onChange={handleChange}
                            placeholder="+380..."
                            className={inputClass}
                        />
                    </div>
                </div>
            </section>

            {/* ФОТО */}
            <section className="border-t border-slate-100 pt-5">
                <SectionTitle icon={Images}>
                    Фотографії
                </SectionTitle>

                <ListingImageUploader
                    images={images}
                    onChange={setImages}
                    disabled={false}
                />
            </section>

            {/* ВІДЕООГЛЯД */}
            <section className="border-t border-slate-100 pt-5">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200">
                    <span className="flex items-center gap-3">
                        <Video
                            size={21}
                            className="shrink-0 text-blue-600"
                        />

                        <span>
                            <span className="block text-sm font-bold text-slate-900">
                                Є відеоогляд
                            </span>

                            <span className="mt-0.5 block text-xs text-slate-500">
                                Додати відео об'єкта
                            </span>
                        </span>
                    </span>

                    <input
                        type="checkbox"
                        name="hasVideoReview"
                        checked={form.hasVideoReview}
                        onChange={handleChange}
                        className="h-5 w-5 shrink-0 accent-blue-600"
                    />
                </label>

                {form.hasVideoReview && (
                    <div className="mt-4">
                        <FacebookVideoPreview
                            value={form.videoUrl}
                            onChange={(url) =>
                                updateField("videoUrl", url)
                            }
                            timecodes={form.videoTimecodes}
                            onTimecodesChange={(timecodes) =>
                                updateField("videoTimecodes", timecodes)
                            }
                        />
                    </div>
                )}
            </section>
            <div className="border-t border-slate-100 pt-5">
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting
                        ? "Збереження оголошення..."
                        : "Надіслати на модерацію"}
                </button>
            </div>
        </form>
    );
}
