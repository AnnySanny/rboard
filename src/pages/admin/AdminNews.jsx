
import { useEffect, useMemo, useRef, useState } from "react";

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";

import {
    Bell,
    CheckCircle2,
    ExternalLink,
    ImagePlus,
    Loader2,
    Pencil,
    Plus,
    Save,
    Send,
    ShieldCheck,
    Trash2,
    X,
} from "lucide-react";

import Swal from "sweetalert2";

import { db } from "../../firebase";

// ==============================
// НАЛАШТУВАННЯ
// ==============================

const COLLECTION_NAME = "siteNews";

const initialForm = {
    title: "",
    description: "",
    imageUrl: "",
    buttonText: "Переглянути",
    buttonUrl: "https://rboard.netlify.app",
};

const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
});

const showToast = (icon, title) => {
    return toast.fire({ icon, title });
};

const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "";

    return timestamp.toDate().toLocaleString("uk-UA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const isValidUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === "https:";
    } catch {
        return false;
    }
};

const statusLabels = {
    draft: "Чернетка",
    sending: "Надсилається",
    sent: "Надіслано",
    partial: "Частково",
    failed: "Помилка",
};

const statusClasses = {
    draft: "bg-slate-100 text-slate-600",
    sending: "bg-blue-50 text-blue-700",
    sent: "bg-emerald-50 text-emerald-700",
    partial: "bg-amber-50 text-amber-700",
    failed: "bg-red-50 text-red-700",
};

// ==============================
// КОМПОНЕНТ
// ==============================

const AdminNews = () => {
    const [news, setNews] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [editingId, setEditingId] = useState(null);

    // За замовчуванням тестовий режим
    const [testMode, setTestMode] = useState(true);

    const [form, setForm] = useState(initialForm);

    const formRef = useRef(null);

    // ==============================
    // ОТРИМАННЯ НОВИН
    // ==============================

    useEffect(() => {
        const newsQuery = query(
            collection(db, COLLECTION_NAME),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            newsQuery,
            (snapshot) => {
                const items = snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data(),
                }));

                setNews(items);
                setLoading(false);
            },
            (error) => {
                console.error(
                    "Помилка завантаження новин:",
                    error
                );

                setLoading(false);

                showToast(
                    "error",
                    "Не вдалося завантажити новини"
                );
            }
        );

        return () => unsubscribe();
    }, []);

    // ==============================
    // СТАТИСТИКА
    // ==============================

    const statistics = useMemo(() => {
        return {
            total: news.length,

            sent: news.filter(
                (item) =>
                    item.status === "sent" ||
                    item.status === "partial"
            ).length,

            drafts: news.filter(
                (item) => item.status === "draft"
            ).length,
        };
    }, [news]);

    const editingNews = news.find(
        (item) => item.id === editingId
    );

    const canEdit =
        !editingNews ||
        editingNews.status === "draft";

    // ==============================
    // СТИЛІ
    // ==============================

    const inputClass =
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60";

    const labelClass =
        "mb-2 block text-sm font-semibold text-slate-700";

    // ==============================
    // ОНОВЛЕННЯ ФОРМИ
    // ==============================

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
        setTestMode(true);
    };

    // ==============================
    // ПЕРЕВІРКА ДАНИХ
    // ==============================

    const validateForm = () => {
        if (
            !form.title.trim() ||
            !form.description.trim() ||
            !form.buttonText.trim()
        ) {
            return "Заповніть усі обов'язкові поля";
        }

        if (!isValidUrl(form.buttonUrl)) {
            return "Вкажіть коректне HTTPS-посилання";
        }

        if (
            form.imageUrl &&
            !isValidUrl(form.imageUrl)
        ) {
            return "Некоректне посилання на фото";
        }

        const messageLength = (
            `📢 ${form.title.trim()}\n\n` +
            form.description.trim()
        ).length;

        if (
            messageLength >
            (form.imageUrl ? 900 : 3800)
        ) {
            return "Текст перевищує допустиму довжину Telegram";
        }

        return null;
    };

    // ==============================
    // ЗАВАНТАЖЕННЯ ФОТО
    // ==============================

    const uploadImage = async (file) => {
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast(
                "warning",
                "Оберіть файл зображення"
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast(
                "warning",
                "Максимальний розмір фото — 5 МБ"
            );
            return;
        }

        const cloudName = "djjhf64uc";

        const uploadPreset = "user_photos";

        if (!cloudName || !uploadPreset) {
            showToast(
                "warning",
                "Не налаштовано Cloudinary"
            );
            return;
        }

        setUploading(true);

        try {
            const data = new FormData();

            data.append("file", file);
            data.append("upload_preset", uploadPreset);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: "POST",
                    body: data,
                }
            );

            const result = await response.json();

            if (!response.ok || !result.secure_url) {
                throw new Error(
                    result.error?.message ||
                    "Помилка завантаження"
                );
            }

            updateField(
                "imageUrl",
                result.secure_url
            );

            showToast(
                "success",
                "Фото успішно завантажено"
            );
        } catch (error) {
            console.error(
                "Помилка Cloudinary:",
                error
            );

            showToast(
                "error",
                "Не вдалося завантажити фото"
            );
        } finally {
            setUploading(false);
        }
    };

    // ==============================
    // ЗБЕРЕЖЕННЯ ЧЕРНЕТКИ
    // ==============================

    const handleSave = async (event) => {
        event?.preventDefault?.();

        if (
            saving ||
            uploading ||
            sending ||
            !canEdit
        ) {
            return null;
        }

        const validationError = validateForm();

        if (validationError) {
            showToast(
                "warning",
                validationError
            );
            return null;
        }

        setSaving(true);

        try {
            const newsData = {
                title: form.title.trim(),
                description: form.description.trim(),
                imageUrl: form.imageUrl.trim(),
                buttonText: form.buttonText.trim(),
                buttonUrl: form.buttonUrl.trim(),
                updatedAt: serverTimestamp(),
            };

            if (editingId) {
                await updateDoc(
                    doc(
                        db,
                        COLLECTION_NAME,
                        editingId
                    ),
                    newsData
                );

                showToast(
                    "success",
                    "Чернетку оновлено"
                );

                return editingId;
            }

            const document = await addDoc(
                collection(db, COLLECTION_NAME),
                {
                    ...newsData,

                    status: "draft",

                    createdAt: serverTimestamp(),

                    sent: 0,
                    failed: 0,
                    totalRecipients: 0,

                    testSuccess: null,
                }
            );

            setEditingId(document.id);

            showToast(
                "success",
                "Чернетку створено"
            );

            return document.id;
        } catch (error) {
            console.error(
                "Помилка збереження новини:",
                error
            );

            showToast(
                "error",
                "Не вдалося зберегти новину"
            );

            return null;
        } finally {
            setSaving(false);
        }
    };

    // ==============================
    // НАДСИЛАННЯ НОВИНИ
    // ==============================

    const handleSend = async () => {
        if (
            saving ||
            sending ||
            uploading ||
            !canEdit
        ) {
            return;
        }

        const validationError = validateForm();

        if (validationError) {
            showToast(
                "warning",
                validationError
            );
            return;
        }

        const confirmation = await Swal.fire({
            title: testMode
                ? "Надіслати тест?"
                : "Надіслати всім?",

            text: testMode
                ? "Повідомлення отримає лише Telegram ID 795778377."
                : "Новину отримають усі активні Telegram-підписники. Скасувати розсилку після запуску не можна.",

            icon: testMode
                ? "question"
                : "warning",

            showCancelButton: true,

            confirmButtonText: testMode
                ? "Надіслати тест"
                : "Так, надіслати всім",

            cancelButtonText: "Скасувати",

            confirmButtonColor: testMode
                ? "#2563eb"
                : "#dc2626",

            cancelButtonColor: "#64748b",

            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) return;

        // Зберігаємо останні зміни перед відправкою.
        const newsId = await handleSave();

        if (!newsId) return;

        setSending(true);

        try {
            const user = getAuth().currentUser;

            if (!user) {
                throw new Error(
                    "Потрібна авторизація адміністратора"
                );
            }

            const token = await user.getIdToken();

            const response = await fetch(
                "/.netlify/functions/send-news-background",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        newsId,

                        mode: testMode
                            ? "test"
                            : "all",
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Помилка запуску: HTTP ${response.status}`
                );
            }

            if (testMode) {
                showToast(
                    "success",
                    "Тест запущено. Перевірте Telegram"
                );
            } else {
                showToast(
                    "success",
                    "Масову розсилку запущено"
                );

                resetForm();
            }
        } catch (error) {
            console.error(
                "Помилка розсилки:",
                error
            );

            showToast(
                "error",
                error.message
            );
        } finally {
            setSending(false);
        }
    };

    // ==============================
    // РЕДАГУВАННЯ
    // ==============================

    const handleEdit = (item) => {
        if (item.status !== "draft") return;

        setEditingId(item.id);

        setForm({
            title: item.title || "",
            description: item.description || "",
            imageUrl: item.imageUrl || "",
            buttonText: item.buttonText || "Переглянути",
            buttonUrl: item.buttonUrl || "",
        });

        formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    // ==============================
    // ВИДАЛЕННЯ
    // ==============================

    const handleDelete = async (item) => {
        if (item.status === "sending") {
            showToast(
                "warning",
                "Не можна видалити новину під час розсилки"
            );
            return;
        }

        const result = await Swal.fire({
            title: "Видалити новину?",

            text: `Новину «${item.title}» буде видалено з історії. Уже надіслані повідомлення залишаться в Telegram.`,

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "Так, видалити",
            cancelButtonText: "Скасувати",

            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",

            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            await deleteDoc(
                doc(
                    db,
                    COLLECTION_NAME,
                    item.id
                )
            );

            if (editingId === item.id) {
                resetForm();
            }

            showToast(
                "success",
                "Новину видалено"
            );
        } catch (error) {
            console.error(
                "Помилка видалення:",
                error
            );

            showToast(
                "error",
                "Не вдалося видалити новину"
            );
        }
    };

    // ==============================
    // ІНТЕРФЕЙС
    // ==============================

    return (
        <div className="space-y-8">

            {/* ЗАГОЛОВОК */}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                        <Bell className="h-4 w-4" />
                        Керування новинами
                    </div>

                    <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                        Новини сайту
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Створюйте новини та надсилайте їх підписникам Telegram.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[
                        ["Новини", statistics.total],
                        ["Надіслані", statistics.sent],
                        ["Чернетки", statistics.drafts],
                    ].map(([name, value]) => (
                        <div
                            key={name}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                        >
                            <div className="text-xs text-slate-500">
                                {name}
                            </div>

                            <div className="mt-1 text-2xl font-black text-slate-900">
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ФОРМА */}

            <section
                ref={formRef}
                className="scroll-mt-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            {editingId ? (
                                <Pencil className="h-5 w-5" />
                            ) : (
                                <Plus className="h-5 w-5" />
                            )}
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingId
                                    ? "Редагувати чернетку"
                                    : "Створити новину"}
                            </h2>

                            <p className="text-xs text-slate-500">
                                Поля із * обов'язкові
                            </p>
                        </div>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                        >
                            <X className="h-4 w-4" />
                            Скасувати
                        </button>
                    )}
                </div>

                <form
                    onSubmit={handleSave}
                    className="space-y-6 p-5 sm:p-7"
                >

                    {/* ЗАГОЛОВОК НОВИНИ */}

                    <div>
                        <label className={labelClass}>
                            Заголовок новини *
                        </label>

                        <input
                            type="text"
                            required
                            maxLength={160}
                            disabled={!canEdit || saving}
                            value={form.title}
                            onChange={(event) =>
                                updateField(
                                    "title",
                                    event.target.value
                                )
                            }
                            placeholder="Наприклад, Нова функція на RBoard!"
                            className={inputClass}
                        />
                    </div>

                    {/* ТЕКСТ НОВИНИ */}

                    <div>
                        <label className={labelClass}>
                            Текст повідомлення *
                        </label>

                        <textarea
                            required
                            rows={5}
                            maxLength={3800}
                            disabled={!canEdit || saving}
                            value={form.description}
                            onChange={(event) =>
                                updateField(
                                    "description",
                                    event.target.value
                                )
                            }
                            placeholder="Розкажіть, що нового з'явилося на сайті..."
                            className={`${inputClass} resize-y`}
                        />
                    </div>

                    {/* КНОПКА ТА ПОСИЛАННЯ */}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className={labelClass}>
                                Текст кнопки *
                            </label>

                            <input
                                type="text"
                                required
                                maxLength={60}
                                disabled={!canEdit || saving}
                                value={form.buttonText}
                                onChange={(event) =>
                                    updateField(
                                        "buttonText",
                                        event.target.value
                                    )
                                }
                                placeholder="Переглянути"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Посилання кнопки *
                            </label>

                            <input
                                type="url"
                                required
                                disabled={!canEdit || saving}
                                value={form.buttonUrl}
                                onChange={(event) =>
                                    updateField(
                                        "buttonUrl",
                                        event.target.value
                                    )
                                }
                                placeholder="https://rboard.netlify.app"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* ФОТО */}

                    <div>
                        <label className={labelClass}>
                            Фото новини

                            <span className="ml-2 font-normal text-slate-400">
                                Необов'язково
                            </span>
                        </label>

                        <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                                {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ImagePlus className="h-4 w-4" />
                                )}

                                {uploading
                                    ? "Завантаження..."
                                    : "Завантажити фото"}

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploading || !canEdit}
                                    onChange={(event) => {
                                        uploadImage(
                                            event.target.files?.[0]
                                        );

                                        event.target.value = "";
                                    }}
                                />
                            </label>

                            {form.imageUrl && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateField(
                                            "imageUrl",
                                            ""
                                        )
                                    }
                                    className="text-sm font-semibold text-red-600"
                                >
                                    Прибрати фото
                                </button>
                            )}
                        </div>

                        <input
                            type="url"
                            value={form.imageUrl}
                            disabled={!canEdit || uploading}
                            onChange={(event) =>
                                updateField(
                                    "imageUrl",
                                    event.target.value
                                )
                            }
                            placeholder="Або вставте HTTPS-посилання на фото"
                            className={`${inputClass} mt-3`}
                        />
                    </div>

                    {/* ТЕСТОВИЙ РЕЖИМ */}

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                checked={testMode}
                                onChange={(event) =>
                                    setTestMode(
                                        event.target.checked
                                    )
                                }
                                className="h-4 w-4 accent-blue-600"
                            />

                            <span className="text-sm font-bold text-slate-900">
                                Тестувати новину
                            </span>
                        </label>

                        <p className="mt-2 pl-7 text-xs text-slate-600">
                            <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />

                            {testMode
                                ? "Повідомлення отримає тільки Telegram ID 795778377"
                                : "Повідомлення отримають усі активні Telegram-підписники"}
                        </p>
                    </div>

                    {/* ПОПЕРЕДНІЙ ПЕРЕГЛЯД */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                            <Send className="h-4 w-4 text-blue-600" />
                            Попередній перегляд Telegram
                        </div>

                        <div className="max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                            {form.imageUrl && (
                                <img
                                    src={form.imageUrl}
                                    alt="Фото новини"
                                    className="max-h-64 w-full object-cover"
                                />
                            )}

                            <div className="space-y-3 p-4">
                                <div className="break-words font-bold text-slate-900">
                                    📢 {form.title || "Заголовок новини"}
                                </div>

                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                                    {form.description || "Опис вашої новини"}
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-blue-600">
                                <ExternalLink className="h-4 w-4" />

                                {form.buttonText || "Переглянути"}
                            </div>
                        </div>
                    </div>

                    {/* КНОПКИ */}

                    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
                        <button
                            type="submit"
                            disabled={
                                saving ||
                                sending ||
                                uploading ||
                                !canEdit
                            }
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}

                            Зберегти чернетку
                        </button>

                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={
                                saving ||
                                sending ||
                                uploading ||
                                !canEdit
                            }
                            className={`
                                inline-flex min-h-12 items-center
                                justify-center gap-2 rounded-xl
                                px-6 py-3 text-sm font-bold text-white
                                transition disabled:opacity-50
                                ${testMode
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-red-600 hover:bg-red-700"
                                }
                            `}
                        >
                            {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}

                            {testMode
                                ? "Надіслати тест"
                                : "Надіслати всім"}
                        </button>
                    </div>
                </form>
            </section>

            {/* ІСТОРІЯ НОВИН */}

            <section className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Історія новин
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Створені новини та результати розсилок
                        </p>
                    </div>

                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                        {news.length}
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        Завантаження новин...
                    </div>
                ) : news.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Bell className="h-8 w-8" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">
                            Новин поки немає
                        </h3>

                        <p className="mt-2 max-w-sm text-sm text-slate-500">
                            Заповніть форму вище, щоб створити першу новину.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {news.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md sm:p-5"
                            >
                                <div className="flex items-start justify-between gap-3">

                                    <div className="min-w-0 flex-1">
                                        <span
                                            className={`
                                                inline-flex rounded-full
                                                px-3 py-1 text-xs font-bold
                                                ${statusClasses[item.status] ||
                                                statusClasses.draft
                                                }
                                            `}
                                        >
                                            {statusLabels[item.status] ||
                                                item.status}
                                        </span>

                                        <h3 className="mt-3 break-words text-base font-bold leading-snug text-slate-900">
                                            {item.title}
                                        </h3>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">

                                        {item.status === "draft" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEdit(item)
                                                }
                                                title="Редагувати новину"
                                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            disabled={
                                                item.status === "sending"
                                            }
                                            onClick={() =>
                                                handleDelete(item)
                                            }
                                            title="Видалити новину"
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-40"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-500">
                                    {item.description}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">

                                    {item.testAt && (
                                        <span className="inline-flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5" />

                                            Тест:{" "}
                                            {item.testSuccess
                                                ? "успішно"
                                                : "помилка"}
                                        </span>
                                    )}

                                    {item.status !== "draft" && (
                                        <span>
                                            Доставлено: {item.sent || 0} /
                                            {item.totalRecipients || 0},
                                            помилок: {item.failed || 0}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                                    {formatDate(item.createdAt)}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminNews;
