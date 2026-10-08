
import { useEffect, useRef, useState } from "react";

import {
    X,
    Copy,
    Check,
    RotateCcw,
    ExternalLink,
    Image as ImageIcon,
    Clipboard,
    Loader2,
} from "lucide-react";

import { FaFacebookF } from "react-icons/fa";

import { generateFacebookPost } from "../../utils/facebookPostGenerator";

const FacebookPostModal = ({
    isOpen,
    onClose,
    listing,
}) => {
    const [postText, setPostText] = useState("");
    const [copied, setCopied] = useState(false);
    const [copyingImage, setCopyingImage] = useState(null);
    const [imageToast, setImageToast] = useState(null);

    const toastTimerRef = useRef(null);
    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);
    // Автоматична генерація допису
    useEffect(() => {
        if (!isOpen || !listing) return;

        setPostText(generateFacebookPost(listing));
        setCopied(false);
    }, [isOpen, listing]);

    // Закриття Escape та блокування прокрутки сторінки
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen || !listing) return null;

    // Фотографії Cloudinary із Firestore
    const images = Array.isArray(listing.images)
        ? listing.images
            .map((image) => {
                if (typeof image === "string") {
                    return image;
                }

                return (
                    image?.imageUrl ||
                    image?.secure_url ||
                    image?.url ||
                    ""
                );
            })
            .filter(
                (url) =>
                    typeof url === "string" &&
                    /^https?:\/\//i.test(url)
            )
        : [];


    const listingUrl = listing.id
        ? `https://rboard.netlify.app/listing/${encodeURIComponent(listing.id)}`
        : "https://rboard.netlify.app";

    // Копіювання допису
    const copyText = async () => {
        try {
            await navigator.clipboard.writeText(postText);
            setCopied(true);
        } catch (error) {
            console.error("Помилка копіювання:", error);
            window.alert("Не вдалося скопіювати текст.");
        }
    };

    // Відновлення автоматично сформованого допису
    const resetText = () => {
        setPostText(generateFacebookPost(listing));
        setCopied(false);
    };

    const showImageToast = (message, type = "success") => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        setImageToast({ message, type });

        toastTimerRef.current = setTimeout(() => {
            setImageToast(null);
            toastTimerRef.current = null;
        }, 2000);
    };

    const copyImage = async (src, index) => {
        if (
            !navigator.clipboard?.write ||
            typeof ClipboardItem === "undefined"
        ) {
            showImageToast(
                "Браузер не підтримує копіювання фото",
                "error"
            );
            return;
        }

        setCopyingImage(index);

        try {
            // ClipboardItem створюємо одразу після натискання,
            // щоб зберегти дозвіл на роботу з буфером обміну.
            const imagePromise = fetch(src, {
                mode: "cors",
            }).then(async (response) => {
                if (!response.ok) {
                    throw new Error("Не вдалося завантажити фото");
                }

                const blob = await response.blob();

                // Для максимальної сумісності конвертуємо
                // зображення у PNG.
                const bitmap = await createImageBitmap(blob);

                try {
                    const canvas = document.createElement("canvas");

                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;

                    const context = canvas.getContext("2d");

                    if (!context) {
                        throw new Error("Canvas недоступний");
                    }

                    context.drawImage(bitmap, 0, 0);

                    return await new Promise((resolve, reject) => {
                        canvas.toBlob(
                            (pngBlob) => {
                                if (pngBlob) {
                                    resolve(pngBlob);
                                } else {
                                    reject(
                                        new Error("Не вдалося створити PNG")
                                    );
                                }
                            },
                            "image/png"
                        );
                    });
                } finally {
                    bitmap.close();
                }
            });

            await navigator.clipboard.write([
                new ClipboardItem({
                    "image/png": imagePromise,
                }),
            ]);

            showImageToast("Фото скопійовано");
        } catch (error) {
            console.error("Помилка копіювання фото:", error);

            showImageToast(
                "Не вдалося скопіювати фото",
                "error"
            );
        } finally {
            setCopyingImage(null);
        }
    };
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="facebook-post-title"
                className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                {/* Заголовок */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <FaFacebookF size={19} />
                        </div>

                        <div className="min-w-0">
                            <h2
                                id="facebook-post-title"
                                className="text-lg font-black text-slate-950"
                            >
                                Допис для Facebook
                            </h2>

                            <p className="mt-1 truncate text-xs text-slate-500">
                                {listing.title || "Оголошення"}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрити"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Прокручуваний вміст */}
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">

                    {/* Фотографії */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800">
                                Фотографії оголошення
                            </h3>

                            <span className="text-xs text-slate-500">
                                {images.length} фото
                            </span>
                        </div>


                        {images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {images.map((src, index) => (
                                    <div
                                        key={`${src}-${index}`}
                                        className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                                    >
                                        {/* Фотографія */}
                                        <a
                                            href={src}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Відкрити фотографію"
                                            className="block h-full w-full"
                                        >
                                            <img
                                                src={src}
                                                alt={`Фото оголошення ${index + 1}`}
                                                loading="lazy"
                                                className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                                            />
                                        </a>

                                        {/* Номер фотографії */}
                                        <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                                            {index + 1}
                                        </span>

                                        {/* Кнопка копіювання */}
                                        <button
                                            type="button"
                                            onClick={() => copyImage(src, index)}
                                            disabled={copyingImage !== null}
                                            title="Скопіювати фотографію"
                                            aria-label={`Скопіювати фото ${index + 1}`}
                                            className="
                        absolute bottom-2 right-2
                        inline-flex items-center gap-1.5
                        rounded-lg border border-white/70
                        bg-white/95 px-2.5 py-2
                        text-xs font-semibold text-slate-700
                        shadow-sm backdrop-blur-sm
                        transition
                        hover:bg-blue-600 hover:text-white
                        disabled:cursor-wait disabled:opacity-60
                    "
                                        >
                                            {copyingImage === index ? (
                                                <Loader2
                                                    size={15}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Clipboard size={15} />
                                            )}

                                            <span className="hidden sm:inline">
                                                {copyingImage === index
                                                    ? "Копіювання..."
                                                    : "Копіювати"}
                                            </span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-slate-400">
                                <ImageIcon size={26} />

                                <p className="mt-2 text-sm">
                                    Фотографії відсутні
                                </p>
                            </div>
                        )}

                    </div>

                    {/* Редактор Facebook-допису */}
                    <div className="mt-6">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">
                                    Текст допису
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Можна редагувати перед копіюванням
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetText}
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                            >
                                <RotateCcw size={14} />
                                Відновити текст
                            </button>
                        </div>

                        <textarea
                            value={postText}
                            onChange={(event) => {
                                setPostText(event.target.value);
                                setCopied(false);
                            }}
                            rows={16}
                            spellCheck
                            className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            placeholder="Текст допису..."
                        />

                        <div className="mt-2 flex justify-between gap-3 text-xs text-slate-400">
                            <span>
                                Текст сформовано автоматично
                            </span>

                            <span className="shrink-0">
                                {postText.length} символів
                            </span>
                        </div>
                    </div>

                    {/* Посилання на оголошення */}
                    <a
                        href={listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                        <ExternalLink size={16} />
                        Переглянути оголошення на RBoard
                    </a>
                </div>

                {/* Нижня панель */}
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                        Закрити
                    </button>

                    <button
                        type="button"
                        onClick={copyText}
                        disabled={!postText.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {copied ? (
                            <>
                                <Check size={17} />
                                Скопійовано
                            </>
                        ) : (
                            <>
                                <Copy size={17} />
                                Скопіювати допис
                            </>
                        )}
                    </button>
                </div>
                {imageToast && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="
            pointer-events-none
            fixed bottom-6 left-1/2 z-[200]
            flex -translate-x-1/2 items-center gap-2
            whitespace-nowrap
            rounded-xl border border-slate-200
            bg-white px-4 py-3
            text-sm font-semibold text-slate-700
            shadow-xl
        "
                    >
                        {imageToast.type === "success" ? (
                            <Check size={17} className="text-emerald-600" />
                        ) : (
                            <X size={17} className="text-red-500" />
                        )}

                        {imageToast.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacebookPostModal;
