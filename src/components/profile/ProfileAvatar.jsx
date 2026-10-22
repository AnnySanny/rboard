
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Trash2,
  UserRound,
  ImagePlus,
} from "lucide-react";
import Swal from "sweetalert2";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ProfileAvatar({
  avatarUrl = "",
  file,
  onFileChange,
  onRemove,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

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

    onFileChange(selectedFile);
  };

  const imageUrl = preview || avatarUrl;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-blue-100 bg-slate-100 shadow-sm sm:h-32 sm:w-32">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Аватар профілю"
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound
              size={52}
              className="text-slate-400"
            />
          )}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-label="Обрати фото профілю"
          className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Camera size={17} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
        <div>
          <h3 className="text-base font-black text-slate-900">
            Фото профілю
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            JPG, PNG або WebP. Максимум 5 МБ.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
          >
            <ImagePlus size={16} />
            {imageUrl ? "Змінити фото" : "Додати фото"}
          </button>

          {imageUrl && (
            <button
              type="button"
              disabled={disabled}
              onClick={onRemove}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={15} />
              Видалити
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
