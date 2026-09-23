import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";

import {
    Image,
    Link2,
    Megaphone,
    Plus,
    Search,
    Send,
    Trash2,
    X,
} from "lucide-react";

import Swal from "sweetalert2";

import { db } from "../../firebase";
import NotificationCard
    from "../../components/admin/NotificationCard";

const CLOUDINARY_CLOUD_NAME =
    "djjhf64uc";

const CLOUDINARY_UPLOAD_PRESET =
    "user_photos";


const AdminNotifications = () => {
    const fileInputRef =
        useRef(null);

    const [title, setTitle] =
        useState("");

    const [text, setText] =
        useState("");

    const [image, setImage] =
        useState(null);

    const [imagePreview, setImagePreview] =
        useState(null);

    const [links, setLinks] =
        useState([]);

    const [sending, setSending] =
        useState(false);
const [
    notifications,
    setNotifications,
] = useState([]);

const [
    notificationsLoading,
    setNotificationsLoading,
] = useState(true);

const [
    searchTerm,
    setSearchTerm,
] = useState("");

useEffect(() => {
    const notificationsQuery =
        query(
            collection(
                db,
                "notifications"
            ),
            orderBy(
                "createdAt",
                "desc"
            )
        );

    const unsubscribe =
        onSnapshot(
            notificationsQuery,

            (snapshot) => {
                const loadedNotifications =
                    snapshot.docs.map(
                        (
                            notificationDocument
                        ) => ({
                            id:
                                notificationDocument.id,

                            ...notificationDocument.data(),
                        })
                    );

                setNotifications(
                    loadedNotifications
                );

                setNotificationsLoading(
                    false
                );
            },

            (error) => {
                console.error(
                    "Помилка завантаження повідомлень:",
                    error
                );

                setNotificationsLoading(
                    false
                );
            }
        );

    return () => {
        unsubscribe();
    };
}, []);
const filteredNotifications =
    useMemo(() => {
        const search =
            searchTerm
                .trim()
                .toLowerCase();

        if (!search) {
            return notifications;
        }

        return notifications.filter(
            (notification) => {
                const title =
                    notification.title
                        ?.toLowerCase() ||
                    "";

                const text =
                    notification.text
                        ?.toLowerCase() ||
                    "";

                const links =
                    notification.links
                        ?.map(
                            (link) =>
                                `${link.label || ""} ${link.url || ""}`
                        )
                        .join(" ")
                        .toLowerCase() ||
                    "";

                return (
                    title.includes(
                        search
                    ) ||
                    text.includes(
                        search
                    ) ||
                    links.includes(
                        search
                    )
                );
            }
        );
    }, [
        notifications,
        searchTerm,
    ]);
    const handleImageChange = (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            Swal.fire({
                icon: "warning",
                title:
                    "Неправильний формат",
                text:
                    "Оберіть зображення.",
                confirmButtonColor:
                    "#2563eb",
            });

            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            Swal.fire({
                icon: "warning",
                title:
                    "Зображення завелике",
                text:
                    "Максимальний розмір фото — 5 МБ.",
                confirmButtonColor:
                    "#2563eb",
            });

            return;
        }

        if (imagePreview) {
            URL.revokeObjectURL(
                imagePreview
            );
        }

        setImage(file);

        setImagePreview(
            URL.createObjectURL(
                file
            )
        );
    };


    const handleRemoveImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(
                imagePreview
            );
        }

        setImage(null);
        setImagePreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value =
                "";
        }
    };


    const handleAddLink = () => {
        setLinks(
            (currentLinks) => [
                ...currentLinks,
                {
                    label: "",
                    url: "",
                },
            ]
        );
    };


    const handleLinkChange = (
        index,
        field,
        value
    ) => {
        setLinks(
            (currentLinks) =>
                currentLinks.map(
                    (link, linkIndex) =>
                        linkIndex ===
                        index
                            ? {
                                  ...link,
                                  [field]:
                                      value,
                              }
                            : link
                )
        );
    };

    const handleRemoveLink = (
        index
    ) => {
        setLinks(
            (currentLinks) =>
                currentLinks.filter(
                    (
                        _,
                        linkIndex
                    ) =>
                        linkIndex !==
                        index
                )
        );
    };


    const uploadImage =
        async (file) => {
            if (!file) {
                return null;
            }

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            formData.append(
                "upload_preset",
                CLOUDINARY_UPLOAD_PRESET
            );

            const response =
                await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Не вдалося завантажити фото"
                );
            }

            const result =
                await response.json();

            return result.secure_url;
        };


    const handleSubmit =
        async (event) => {
            event.preventDefault();

            const cleanTitle =
                title.trim();

            const cleanText =
                text.trim();

            if (!cleanTitle) {
                await Swal.fire({
                    icon: "warning",
                    title:
                        "Вкажіть назву",
                    text:
                        "Назва повідомлення є обов'язковою.",
                    confirmButtonColor:
                        "#2563eb",
                });

                return;
            }

            if (!cleanText) {
                await Swal.fire({
                    icon: "warning",
                    title:
                        "Вкажіть текст",
                    text:
                        "Текст повідомлення є обов'язковим.",
                    confirmButtonColor:
                        "#2563eb",
                });

                return;
            }


            const cleanLinks =
                links
                    .map((link) => ({
                        label:
                            link.label.trim(),
                        url:
                            link.url.trim(),
                    }))
                    .filter(
                        (link) =>
                            link.label ||
                            link.url
                    );

            const invalidLink =
                cleanLinks.some(
                    (link) =>
                        !link.url
                );

            if (invalidLink) {
                await Swal.fire({
                    icon: "warning",
                    title:
                        "Перевірте посилання",
                    text:
                        "Для кожного доданого посилання потрібно вказати URL.",
                    confirmButtonColor:
                        "#2563eb",
                });

                return;
            }


            setSending(true);

            try {
                const imageUrl =
                    image
                        ? await uploadImage(
                              image
                          )
                        : null;

                await addDoc(
                    collection(
                        db,
                        "notifications"
                    ),
                    {
                        title:
                            cleanTitle,

                        text:
                            cleanText,

                        imageUrl,

                        links:
                            cleanLinks,

                        audience:
                            "all",

                        createdBy:
                            "admin",

                        createdAt:
                            serverTimestamp(),
                    }
                );

                setTitle("");
                setText("");
                setLinks([]);

                if (imagePreview) {
                    URL.revokeObjectURL(
                        imagePreview
                    );
                }

                setImage(null);
                setImagePreview(null);

                if (
                    fileInputRef.current
                ) {
                    fileInputRef.current.value =
                        "";
                }


                await Swal.fire({
                    toast: true,
                    position:
                        "top-end",
                    icon: "success",
                    title:
                        "Повідомлення відправлено",
                    showConfirmButton:
                        false,
                    timer: 2000,
                    timerProgressBar:
                        true,
                });
            } catch (error) {
                console.error(
                    "Помилка створення повідомлення:",
                    error
                );

                await Swal.fire({
                    icon: "error",
                    title: "Помилка",
                    text:
                        "Не вдалося відправити повідомлення.",
                    confirmButtonColor:
                        "#2563eb",
                });
            } finally {
                setSending(false);
            }
        };


    return (
        <div className="space-y-6">

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

                <div className="flex items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Megaphone className="h-6 w-6" />
                    </div>

                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-950">
                            Повідомлення
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            Створюйте
                            повідомлення для
                            всіх зареєстрованих
                            користувачів RBoard.
                        </p>
                    </div>

                </div>

            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="w-full">


                        <div>
                            <label
                                htmlFor="notification-title"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                Назва повідомлення
                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="notification-title"
                                type="text"
                                value={title}
                                onChange={(
                                    event
                                ) =>
                                    setTitle(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Наприклад: Нові можливості RBoard"
                                maxLength={120}
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />

                            <div className="mt-2 text-right text-xs text-slate-400">
                                {title.length}
                                /120
                            </div>
                        </div>


                        <div className="mt-6">
                            <label
                                htmlFor="notification-text"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                Текст повідомлення
                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <textarea
                                id="notification-text"
                                value={text}
                                onChange={(
                                    event
                                ) =>
                                    setText(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Введіть текст повідомлення..."
                                rows={7}
                                maxLength={3000}
                                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />

                            <div className="mt-2 text-right text-xs text-slate-400">
                                {text.length}
                                /3000
                            </div>
                        </div>

                        <div className="mt-6">

                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                Фото
                                <span className="ml-2 font-medium text-slate-400">
                                    необов'язково
                                </span>
                            </label>


                            {!imagePreview ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef
                                            .current
                                            ?.click()
                                    }
                                    className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                                >
                                    <Image className="h-5 w-5" />

                                    Додати фото
                                </button>
                            ) : (
                                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">

                                    <img
                                        src={
                                            imagePreview
                                        }
                                        alt="Попередній перегляд"
                                        className="max-h-96 w-full object-contain"
                                    />

                                    <button
                                        type="button"
                                        onClick={
                                            handleRemoveImage
                                        }
                                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600 shadow-md transition hover:bg-red-50"
                                        title="Видалити фото"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>

                                </div>
                            )}


                            <input
                                ref={
                                    fileInputRef
                                }
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={
                                    handleImageChange
                                }
                                className="hidden"
                            />

                            <p className="mt-2 text-xs text-slate-400">
                                JPG, PNG або
                                WebP. Максимум
                                5 МБ.
                            </p>

                        </div>

                        <div className="mt-8">

                            <div className="flex items-center gap-2">

                                <Link2 className="h-5 w-5 text-blue-600" />

                                <label className="text-sm font-bold text-slate-700">
                                    Посилання
                                </label>

                                <span className="text-xs font-medium text-slate-400">
                                    необов'язково
                                </span>

                            </div>


                            {links.length > 0 && (
                                <div className="mt-4 space-y-3">

                                    {links.map(
                                        (
                                            link,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    index
                                                }
                                                className="flex items-start gap-2"
                                            >

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveLink(
                                                            index
                                                        )
                                                    }
                                                    className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                    title="Видалити посилання"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>


                                                <div className="grid flex-1 gap-3 sm:grid-cols-[0.7fr_1.3fr]">

                                                    <input
                                                        type="text"
                                                        value={
                                                            link.label
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleLinkChange(
                                                                index,
                                                                "label",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Назва, наприклад: Детальніше"
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                    />

                                                    <input
                                                        type="url"
                                                        value={
                                                            link.url
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleLinkChange(
                                                                index,
                                                                "url",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="https://example.com"
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                    />

                                                </div>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}


                            <button
                                type="button"
                                onClick={
                                    handleAddLink
                                }
                                className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            >
                                <Plus className="h-4 w-4" />

                                Додати посилання
                            </button>

                        </div>


                        <div className="mt-10 border-t border-slate-100 pt-6">

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                <p className="max-w-xl text-xs leading-5 text-slate-400">
                                    Після відправлення
                                    повідомлення буде
                                    доступне всім
                                    зареєстрованим
                                    користувачам.
                                </p>


                                <button
                                    type="submit"
                                    disabled={
                                        sending
                                    }
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    {sending ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                                            Відправлення...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />

                                            Відправити всім
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </form>

            </section>
{/* =====================================
    НАДІСЛАНІ ПОВІДОМЛЕННЯ
====================================== */}
<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

    {/* HEADER */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                Історія розсилок
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Надіслані повідомлення
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Переглядайте та видаляйте повідомлення,
                які були надіслані користувачам RBoard.
            </p>
        </div>


        {/* COUNTER */}
        <div className="shrink-0 rounded-2xl bg-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Знайдено
            </p>

            <p className="mt-1 text-2xl font-black text-slate-950">
                {filteredNotifications.length}
            </p>
        </div>

    </div>


    {/* =====================================
        SEARCH
    ====================================== */}
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">

        <label
            htmlFor="notification-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
        >
            Пошук
        </label>

        <div className="relative">

            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
                id="notification-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                    setSearchTerm(
                        event.target.value
                    )
                }
                placeholder="Назва, текст або посилання..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

        </div>

    </div>


    {/* =====================================
        CONTENT
    ====================================== */}

    {notificationsLoading ? (

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-12 text-center">

            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
                Завантаження повідомлень...
            </p>

        </div>

    ) : filteredNotifications.length > 0 ? (

        <div className="mt-6 grid gap-6 xl:grid-cols-2">

            {filteredNotifications.map(
                (notification) => (
                    <NotificationCard
                        key={notification.id}
                        notification={notification}
                    />
                )
            )}

        </div>

    ) : (

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Search className="h-7 w-7 text-slate-400" />
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-950">
                {searchTerm.trim()
                    ? "Повідомлень не знайдено"
                    : "Повідомлень ще немає"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
                {searchTerm.trim()
                    ? "Спробуйте змінити пошуковий запит."
                    : "Створіть перше повідомлення за допомогою форми вище."}
            </p>

            {searchTerm.trim() && (
                <button
                    type="button"
                    onClick={() =>
                        setSearchTerm("")
                    }
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                    Очистити пошук
                </button>
            )}

        </div>

    )}

</section>
        </div>
    );
};

export default AdminNotifications;