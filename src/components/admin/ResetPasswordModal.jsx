
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  X,
} from "lucide-react";

export default function ResetPasswordModal({
  user,
  loading = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [validationError, setValidationError] =
    useState("");

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [loading, onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setValidationError("");

    if (password.length < 8) {
      setValidationError(
        "Пароль має містити щонайменше 8 символів."
      );
      return;
    }

    if (
      new TextEncoder().encode(password).length >
      4096
    ) {
      setValidationError("Пароль занадто довгий.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Паролі не збігаються.");
      return;
    }

    onSubmit(password);
  };

  const inputClass = `
    w-full rounded-xl border border-slate-200
    bg-slate-50 py-3.5 pl-4 pr-12
    text-sm text-slate-900
    outline-none transition
    placeholder:text-slate-400
    hover:border-slate-300
    focus:border-blue-500 focus:bg-white
    focus:ring-4 focus:ring-blue-100
    disabled:cursor-not-allowed
    disabled:opacity-60
  `;

  return (
    <div
      className="
        fixed inset-0 z-[10000]
        flex items-center justify-center
        overflow-y-auto
        bg-slate-950/60
        p-3 backdrop-blur-[3px] sm:p-6
      "
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
        className="
          relative my-auto w-full max-w-[470px]
          overflow-hidden rounded-[28px]
          border border-slate-200 bg-white
          shadow-2xl
        "
      >
        {/* Верхня частина */}
        <div className="relative border-b border-slate-100 px-6 pb-5 pt-7 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Закрити"
            className="
              absolute right-5 top-5
              flex h-9 w-9 items-center
              justify-center rounded-xl
              text-slate-400 transition
              hover:bg-slate-100 hover:text-slate-700
              disabled:opacity-50
            "
          >
            <X size={19} />
          </button>
          <h2
            id="reset-password-title"
            className="text-2xl font-black tracking-tight text-slate-950"
          >
            Скидання пароля
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Встановіть новий пароль для обраного
            користувача.
          </p>

          <div
            className="
              mt-5 flex items-center gap-3
              rounded-2xl border border-slate-200
              bg-slate-50 p-3
            "
          >
            <div
              className="
                flex h-11 w-11 shrink-0
                items-center justify-center
                rounded-xl bg-blue-100
                font-black text-blue-700
              "
            >
              {user.login?.trim()?.[0]?.toUpperCase() ||
                "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {user.login || "Без імені"}
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-500">
                {user.phone || user.email || "Користувач RBoard"}
              </p>
            </div>
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6 sm:px-8">
            <div>
              <label
                htmlFor="reset-new-password"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Новий пароль
              </label>

              <div className="relative">
                <input
                  id="reset-new-password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setValidationError("");
                  }}
                  placeholder="Введіть новий пароль"
                  autoComplete="new-password"
                  maxLength={128}
                  disabled={loading}
                  className={inputClass}
                  autoFocus
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Приховати пароль"
                      : "Показати пароль"
                  }
                  className="
                    absolute right-3 top-1/2
                    flex h-9 w-9 -translate-y-1/2
                    items-center justify-center
                    rounded-lg text-slate-400
                    hover:bg-blue-50
                    hover:text-blue-600
                  "
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Мінімум 8 символів.
              </p>
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Підтвердіть пароль
              </label>

              <div className="relative">
                <input
                  id="reset-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setValidationError("");
                  }}
                  placeholder="Повторіть новий пароль"
                  autoComplete="new-password"
                  maxLength={128}
                  disabled={loading}
                  className={inputClass}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Приховати пароль"
                      : "Показати пароль"
                  }
                  className="
                    absolute right-3 top-1/2
                    flex h-9 w-9 -translate-y-1/2
                    items-center justify-center
                    rounded-lg text-slate-400
                    hover:bg-blue-50
                    hover:text-blue-600
                  "
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {(validationError || error) && (
              <div
                role="alert"
                className="
                  flex items-start gap-2.5
                  rounded-xl border border-red-200
                  bg-red-50 px-4 py-3
                  text-sm text-red-700
                "
              >
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <p>{validationError || error}</p>
              </div>
            )}

            <div
              className="
                flex items-start gap-3
                rounded-2xl border border-blue-100
                bg-blue-50/60 p-4
              "
            >
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <p className="text-xs leading-5 text-slate-600">
                Після зміни старий пароль перестане
                працювати. Переконайтеся, що ви
                перевірили власника акаунта перед
                відновленням доступу.
              </p>
            </div>
          </div>

          {/* Кнопки */}
          <div
            className="
              flex flex-col-reverse gap-3
              border-t border-slate-100
              bg-slate-50/70 px-6 py-5
              sm:flex-row sm:px-8
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                flex min-h-12 flex-1
                items-center justify-center
                rounded-xl border border-slate-200
                bg-white px-4 text-sm
                font-bold text-slate-700
                transition hover:bg-slate-100
                disabled:opacity-50
              "
            >
              Скасувати
            </button>

            <button
              type="submit"
              disabled={loading}
              className="
                flex min-h-12 flex-1
                items-center justify-center
                gap-2 rounded-xl bg-blue-600
                px-4 text-sm font-bold
                text-white shadow-sm
                transition hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <span
                    className="
                      h-4 w-4 animate-spin
                      rounded-full border-2
                      border-white/40
                      border-t-white
                    "
                  />
                  Збереження...
                </>
              ) : (
                <>
                  <KeyRound size={17} />
                  Змінити пароль
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
