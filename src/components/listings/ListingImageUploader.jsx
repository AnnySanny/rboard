import { useRef, useState } from "react";
import Swal from "sweetalert2";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ListingImageUploader({
    images,
    onChange,
    disabled = false,
}) {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] =
        useState(false);
const processImages = async (files) => {
    const selectedFiles = Array.from(
        files || []
    );

    if (selectedFiles.length === 0) {
        return;
    }

    const availableSlots =
        MAX_IMAGES - images.length;

    if (availableSlots <= 0) {
        await Swal.fire({
            icon: "info",
            title: "Досягнуто ліміт",
            text: "До одного оголошення можна додати максимум 10 фотографій.",
            confirmButtonText: "Добре",
            confirmButtonColor: "#2563eb",
        });

        return;
    }

    if (
        selectedFiles.length >
        availableSlots
    ) {
        await Swal.fire({
            icon: "warning",
            title: "Забагато фотографій",
            text: `Можна додати ще максимум ${availableSlots}.`,
            confirmButtonText: "Добре",
            confirmButtonColor: "#2563eb",
        });

        return;
    }

    const invalidType =
        selectedFiles.find(
            (file) =>
                !file.type.startsWith(
                    "image/"
                )
        );

    if (invalidType) {
        await Swal.fire({
            icon: "warning",
            title: "Неправильний формат",
            text: "Можна додавати лише зображення.",
            confirmButtonText: "Добре",
            confirmButtonColor: "#2563eb",
        });

        return;
    }

    const oversizedFile =
        selectedFiles.find(
            (file) =>
                file.size > MAX_FILE_SIZE
        );

    if (oversizedFile) {
        await Swal.fire({
            icon: "warning",
            title: "Файл завеликий",
            text: "Розмір однієї фотографії не повинен перевищувати 5 МБ.",
            confirmButtonText: "Добре",
            confirmButtonColor: "#2563eb",
        });

        return;
    }

    const newImages =
        selectedFiles.map((file) => ({
            file,
            previewUrl:
                URL.createObjectURL(file),
            id: `${file.name}-${file.size}-${file.lastModified}`,
        }));

    onChange([
        ...images,
        ...newImages,
    ]);
};

const handleSelectImages = async (event) => {
    await processImages(
        event.target.files
    );

    event.target.value = "";
};
const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (
        disabled ||
        images.length >= MAX_IMAGES
    ) {
        return;
    }

    setIsDragging(true);
};

const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (
        disabled ||
        images.length >= MAX_IMAGES
    ) {
        return;
    }

    event.dataTransfer.dropEffect =
        "copy";

    setIsDragging(true);
};

const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
};

const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    if (
        disabled ||
        images.length >= MAX_IMAGES
    ) {
        return;
    }

    await processImages(
        event.dataTransfer.files
    );
};
    const handleRemoveImage = (index) => {
        const imageToRemove =
            images[index];

        if (
            !imageToRemove?.isExisting &&
            imageToRemove?.previewUrl
        ) {
            URL.revokeObjectURL(
                imageToRemove.previewUrl
            );
        }

        onChange(
            images.filter(
                (_, imageIndex) =>
                    imageIndex !== index
            )
        );
    };

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-4">
                <label className="text-sm font-semibold text-slate-700">
                    Фотографії{" "}
                    <span className="font-normal text-slate-400">
                        — необов’язково
                    </span>
                </label>

                <span className="text-xs font-medium text-slate-400">
                    {images.length}/{MAX_IMAGES}
                </span>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleSelectImages}
                disabled={
                    disabled ||
                    images.length >= MAX_IMAGES
                }
                className="hidden"
            />

<div
    onClick={() => {
        if (
            !disabled &&
            images.length < MAX_IMAGES
        ) {
            inputRef.current?.click();
        }
    }}
    onDragEnter={handleDragEnter}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    role="button"
    tabIndex={0}
    onKeyDown={(event) => {
        if (
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();

            if (
                !disabled &&
                images.length <
                    MAX_IMAGES
            ) {
                inputRef.current?.click();
            }
        }
    }}
    className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-7 text-sm font-semibold transition ${
        isDragging
            ? "scale-[1.01] border-blue-500 bg-blue-100 text-blue-700"
            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
    } ${
        disabled ||
        images.length >= MAX_IMAGES
            ? "cursor-not-allowed opacity-60"
            : ""
    }`}
>
    <svg
        className={`h-7 w-7 transition ${
            isDragging
                ? "text-blue-700"
                : "text-blue-600"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
        />

        <circle
            cx="8.5"
            cy="8.5"
            r="1.5"
        />

        <path d="m21 15-5-5L5 21" />
    </svg>

    <span>
        {images.length >= MAX_IMAGES
            ? "Додано максимум фотографій"
            : isDragging
                ? "Відпустіть фотографії тут"
                : "Додати або перетягнути фотографії"}
    </span>

    {images.length < MAX_IMAGES &&
        !disabled && (
            <span className="text-xs font-normal text-slate-400">
                Натисніть або перетягніть
                файли в цю область
            </span>
        )}
</div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
                До 10 фотографій. JPG, PNG
                або WebP. Максимальний розмір
                одного файлу — 5 МБ.
            </p>

            {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {images.map(
                        (image, index) => (
                            <div
                                key={image.id}
                                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                            >
                                <img
                                    src={
                                        image.previewUrl
                                    }
                                    alt={`Фото ${index + 1
                                        }`}
                                    className="h-full w-full object-cover"
                                />

                                {index === 0 && (
                                    <span className="absolute bottom-2 left-2 rounded-lg bg-slate-950/75 px-2 py-1 text-[10px] font-bold text-white">
                                        Головне
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleRemoveImage(
                                            index
                                        )
                                    }
                                    disabled={disabled}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-red-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Видалити фото"
                                >
                                    <svg
                                        className="h-4 w-4"
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
                                </button>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}