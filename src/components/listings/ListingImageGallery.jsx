import {
    useEffect,
    useState,
} from "react";

export default function ListingImageGallery({
    images = [],
}) {
    const [activeIndex, setActiveIndex] =
        useState(null);

    const validImages = images.filter(
        (image) => image?.imageUrl
    );

    const isViewerOpen =
        activeIndex !== null;

    const closeViewer = () => {
        setActiveIndex(null);
    };

    const showPrevious = () => {
        setActiveIndex(
            (previousIndex) =>
                previousIndex === 0
                    ? validImages.length - 1
                    : previousIndex - 1
        );
    };

    const showNext = () => {
        setActiveIndex(
            (previousIndex) =>
                previousIndex ===
                    validImages.length - 1
                    ? 0
                    : previousIndex + 1
        );
    };

    useEffect(() => {
        if (!isViewerOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeViewer();
            }

            if (
                event.key ===
                "ArrowLeft" &&
                validImages.length > 1
            ) {
                setActiveIndex(
                    (previousIndex) =>
                        previousIndex === 0
                            ? validImages.length -
                            1
                            : previousIndex - 1
                );
            }

            if (
                event.key ===
                "ArrowRight" &&
                validImages.length > 1
            ) {
                setActiveIndex(
                    (previousIndex) =>
                        previousIndex ===
                            validImages.length -
                            1
                            ? 0
                            : previousIndex + 1
                );
            }
        };

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow =
                previousOverflow;
        };
    }, [
        isViewerOpen,
        validImages.length,
    ]);

    if (validImages.length === 0) {
        return null;
    }

    const visibleImages =
        validImages.slice(0, 4);

    const hiddenImagesCount =
        validImages.length -
        visibleImages.length;

    return (
        <>
            {/* Галерея в оголошенні */}
            <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Фотографії
                    </p>

                    <span className="text-xs font-semibold text-slate-400">
                        {validImages.length}{" "}
                        {validImages.length === 1
                            ? "фото"
                            : "фото"}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {visibleImages.map(
                        (image, index) => {
                            const isLastVisible =
                                index ===
                                visibleImages.length -
                                1;

                            const showMoreOverlay =
                                isLastVisible &&
                                hiddenImagesCount >
                                0;

                            return (
                                <button
                                    key={
                                        image.imagePublicId ||
                                        image.imageUrl
                                    }
                                    type="button"
                                    onClick={() =>
                                        setActiveIndex(
                                            index
                                        )
                                    }
                                    className="group relative h-24 w-24 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28"
                                >
                                    <img
                                        src={
                                            image.imageUrl
                                        }
                                        alt={`Фото оголошення ${index +
                                            1
                                            }`}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />

                                    {showMoreOverlay && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                                            <span className="text-xl font-black text-white sm:text-2xl">
                                                +
                                                {
                                                    hiddenImagesCount
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {!showMoreOverlay && (
                                        <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950/60 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                                            <ExpandIcon />
                                        </div>
                                    )}
                                </button>
                            );
                        }
                    )}
                </div>
            </div>

            {/* Повноекранний перегляд */}
            {isViewerOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 sm:p-8"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeViewer();
                        }
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Перегляд фотографії"
                >
                    {/* Верхня панель */}
                    <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6">
                        <div className="rounded-xl bg-black/40 px-3 py-2 text-sm font-bold text-white backdrop-blur-sm">
                            {activeIndex + 1} /{" "}
                            {validImages.length}
                        </div>

                        <button
                            type="button"
                            onClick={
                                closeViewer
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                            aria-label="Закрити"
                            title="Закрити"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Попереднє фото */}
                    {validImages.length >
                        1 && (
                            <button
                                type="button"
                                onClick={
                                    showPrevious
                                }
                                className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-6 sm:h-14 sm:w-14"
                                aria-label="Попереднє фото"
                            >
                                <ChevronLeftIcon />
                            </button>
                        )}

                    {/* Фото */}
                    <img
                        src={
                            validImages[
                                activeIndex
                            ]?.imageUrl
                        }
                        alt={`Фото ${activeIndex + 1
                            }`}
                        className="max-h-[88vh] max-w-[92vw] select-none object-contain"
                        draggable="false"
                    />

                    {/* Наступне фото */}
                    {validImages.length >
                        1 && (
                            <button
                                type="button"
                                onClick={
                                    showNext
                                }
                                className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-6 sm:h-14 sm:w-14"
                                aria-label="Наступне фото"
                            >
                                <ChevronRightIcon />
                            </button>
                        )}

                    {/* Нижні мініатюри */}
                    {validImages.length >
                        1 && (
                            <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl bg-black/40 p-2 backdrop-blur-sm">
                                {validImages.map(
                                    (
                                        image,
                                        index
                                    ) => (
                                        <button
                                            key={
                                                image.imagePublicId ||
                                                image.imageUrl
                                            }
                                            type="button"
                                            onClick={() =>
                                                setActiveIndex(
                                                    index
                                                )
                                            }
                                            className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-14 sm:w-14 ${activeIndex ===
                                                index
                                                ? "border-white opacity-100"
                                                : "border-transparent opacity-50 hover:opacity-100"
                                                }`}
                                        >
                                            <img
                                                src={
                                                    image.imageUrl
                                                }
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                </div>
            )}
        </>
    );
}

const ExpandIcon = () => (
    <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M8 3H3v5" />
        <path d="M16 3h5v5" />
        <path d="M8 21H3v-5" />
        <path d="M16 21h5v-5" />
    </svg>
);

const CloseIcon = () => (
    <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m15 18-6-6 6-6" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);