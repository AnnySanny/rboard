
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  UserRound,
  Trash2,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
} from "lucide-react";
import Cropper from "react-easy-crop";
import Swal from "sweetalert2";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const createCroppedFile = async (imageSrc, cropPixels) => {

  const image = new Image();
  image.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () =>
      reject(new Error("Не вдалося завантажити фотографію для редагування."));

    image.src = imageSrc;
  });


  const canvas = document.createElement("canvas");
  const size = 512;

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Не вдалося обробити фотографію.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    size,
    size
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Не вдалося створити фотографію."));
      },
      "image/jpeg",
      0.9
    );
  });

  return new File(
    [blob],
    `rboard-avatar-${Date.now()}.jpg`,
    { type: "image/jpeg" }
  );
};

export default function ProfileAvatar({
  avatarUrl = "",
  file,
  onFileChange,
  onRemove,
  disabled = false,
}) {
  const inputRef = useRef(null);

  const [preview, setPreview] = useState("");
  const [cropSrc, setCropSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);


  useEffect(() => {
    if (!cropSrc || !cropSrc.startsWith("blob:")) return;

    return () => URL.revokeObjectURL(cropSrc);
  }, [cropSrc]);



  useEffect(() => {
    if (!cropSrc) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [cropSrc]);

  const imageUrl = preview || avatarUrl;

  const openFilePicker = () => {
    if (disabled || processing) return;
    inputRef.current?.click();
  };

  const editCurrentAvatar = () => {
    if (!imageUrl || disabled || processing) return;

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropPixels(null);

    if (file) {
      setCropSrc(URL.createObjectURL(file));
    } else {
      setCropSrc(avatarUrl);
    }
  };

  const closeCrop = () => {
    if (processing) return;
    setCropSrc("");
    setCropPixels(null);
  };

  const handleFile = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      await Swal.fire({
        icon: "warning",
        title: "Непідтримуваний формат",
        text: "Оберіть JPG, PNG або WebP.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      await Swal.fire({
        icon: "warning",
        title: "Завелика фотографія",
        text: "Максимальний розмір — 5 МБ.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropPixels(null);
    setCropSrc(URL.createObjectURL(selectedFile));
  };

  const handleCropComplete = (_, pixels) => {
    setCropPixels(pixels);
  };

  const handleCropSave = async () => {
    if (!cropSrc || !cropPixels || processing) return;

    setProcessing(true);

    try {
      const croppedFile = await createCroppedFile(
        cropSrc,
        cropPixels
      );

      onFileChange(croppedFile);
      setCropSrc("");
      setCropPixels(null);
    } catch (error) {
      console.error("Помилка кадрування:", error);

      await Swal.fire({
        icon: "error",
        title: "Не вдалося обробити фото",
        text: "Спробуйте вибрати іншу фотографію.",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async () => {
    if (!imageUrl || disabled || !onRemove) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Видалити фото профілю?",
      text: "Замість фотографії буде встановлено стандартну іконку користувача.",
      showCancelButton: true,
      confirmButtonText: "Видалити",
      cancelButtonText: "Скасувати",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      onRemove();
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <div className="relative w-fit pb-4 pr-16 sm:pr-6">
          <button
            type="button"
            disabled={disabled}
            onClick={openFilePicker}
            aria-label={
              imageUrl
                ? "Змінити фото профілю"
                : "Додати фото профілю"
            }
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-blue-100 bg-slate-100 shadow-md transition-all duration-300 hover:border-blue-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 sm:h-36 sm:w-36"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Аватар профілю"
                className="h-full w-full object-cover transition-transform duration-300 sm:group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserRound
                  size={42}
                  className="text-slate-400 sm:h-14 sm:w-14"
                />
              </div>
            )}

            <div className="absolute inset-0 hidden flex-col items-center justify-center gap-1 bg-slate-950/60 px-3 text-center text-white opacity-0 transition-opacity duration-300 sm:flex sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
              <Camera size={23} />
              <span className="text-[10px] font-semibold leading-4">
                {imageUrl
                  ? "Натисніть, щоб змінити"
                  : "Додати фото"}
              </span>
            </div>
          </button>

          <div className="absolute bottom-0 right-0 z-10 flex items-center gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={openFilePicker}
              aria-label="Змінити фотографію"
              title="Змінити фотографію"
              className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
            >
              <Camera size={17} strokeWidth={2.2} />
            </button>

            {imageUrl && (
              <button
                type="button"
                disabled={disabled || processing}
                onClick={editCurrentAvatar}
                aria-label="Налаштувати фотографію"
                title="Налаштувати положення та масштаб фото"
                className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-slate-600 text-white shadow-md transition hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
              >
                <SlidersHorizontal size={17} strokeWidth={2.2} />
              </button>
            )}

            {imageUrl && (
              <button
                type="button"
                disabled={disabled || !onRemove}
                onClick={handleRemove}
                aria-label="Видалити фотографію"
                title="Видалити фотографію"
                className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-red-500 text-white shadow-md transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
              >
                <Trash2 size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs leading-5 text-slate-500 sm:hidden">
          Натисніть на аватар або камеру, щоб змінити фото
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {cropSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Налаштування фотографії"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
        >
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Налаштування фото
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Оберіть потрібну частину фотографії
                </p>
              </div>

              <button
                type="button"
                onClick={closeCrop}
                disabled={processing}
                aria-label="Закрити"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="relative h-[280px] w-full bg-slate-900 sm:h-[340px]">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                minZoom={1}
                maxZoom={3}
                zoomSpeed={0.1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>

            <div className="space-y-4 p-5">
              <p className="text-center text-xs text-slate-500">
                Перетягуйте фото пальцем або мишкою.
                Для масштабування використайте повзунок.
              </p>

              <div className="flex items-center gap-3">
                <ZoomOut
                  size={19}
                  className="shrink-0 text-slate-400"
                />

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(event) =>
                    setZoom(Number(event.target.value))
                  }
                  aria-label="Масштаб фотографії"
                  className="h-2 w-full cursor-pointer accent-blue-600"
                />

                <ZoomIn
                  size={19}
                  className="shrink-0 text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Зменшити</span>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setZoom(1);
                    setCrop({ x: 0, y: 0 });
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  Скинути
                </button>
                <span>Збільшити</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeCrop}
                  disabled={processing}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Скасувати
                </button>

                <button
                  type="button"
                  onClick={handleCropSave}
                  disabled={processing || !cropPixels}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {processing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Обробка...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Готово
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
