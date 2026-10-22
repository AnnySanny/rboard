
import { useEffect, useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
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
  <div className="flex flex-col items-center gap-2 sm:items-start">
    {/* Аватар */}
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      aria-label={
        imageUrl
          ? "Змінити фото профілю"
          : "Додати фото профілю"
      }
      className="
        group relative
        h-24 w-24
        sm:h-36 sm:w-36
        shrink-0 overflow-hidden
        rounded-full
        border-4 border-blue-100
        bg-slate-100 shadow-md
        transition-all duration-300
        hover:border-blue-300 hover:shadow-lg
        focus-visible:outline-none
        focus-visible:ring-4 focus-visible:ring-blue-200
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
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

      {/* Затемнення при наведенні — тільки ПК */}
      <div className="absolute inset-0 hidden flex-col items-center justify-center gap-1 bg-slate-950/60 px-3 text-center text-white opacity-0 transition-opacity duration-300 sm:flex sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
        <Camera size={23} />

        <span className="text-[10px] font-semibold leading-4">
          {imageUrl
            ? "Натисніть, щоб змінити"
            : "Додати фото"}
        </span>
      </div>
    </button>

    {/* Підказка тільки на телефонах */}
    <p className="text-center text-xs leading-5 text-slate-500 sm:hidden">
      Натисніть на аватар, щоб змінити фото
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
);

}
