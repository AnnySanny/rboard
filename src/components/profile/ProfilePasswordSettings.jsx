
import { useState } from "react";

import {
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import Swal from "sweetalert2";

import { auth } from "../../firebase";

const showToast = (icon, title) => {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export default function ProfilePasswordSettings({
  disabled = false,
}) {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const busy = disabled || loading;

  const validate = () => {
    const nextErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword =
        "Введіть поточний пароль.";
    }

    if (newPassword.length < 8) {
      nextErrors.newPassword =
        "Новий пароль має містити щонайменше 8 символів.";
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword =
        "Новий пароль має відрізнятися від поточного.";
    }

    return nextErrors;
  };

  const handleChangePassword = async () => {
    if (busy) return;

    const validationErrors = validate();

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showToast(
        "warning",
        "Перевірте заповнені поля"
      );
      return;
    }

    const user = auth.currentUser;

    if (!user || !user.email) {
      showToast(
        "error",
        "Не вдалося визначити ваш акаунт"
      );
      return;
    }

    try {
      setLoading(true);

      // Firebase уже зберігає технічний email:
      // 380XXXXXXXXX@rboard.local
      const credential =
        EmailAuthProvider.credential(
          user.email,
          currentPassword
        );

      // Перевіряємо поточний пароль користувача.
      await reauthenticateWithCredential(
        user,
        credential
      );

      // Після повторної автентифікації
      // встановлюємо новий пароль.
      await updatePassword(
        user,
        newPassword
      );

      // Очищаємо поля після успішної зміни.
      setCurrentPassword("");
      setNewPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setErrors({});

      showToast(
        "success",
        "Пароль успішно змінено"
      );
    } catch (error) {
      console.error(
        "Помилка зміни пароля:",
        error
      );

      switch (error.code) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
        case "auth/user-mismatch":
          setErrors({
            currentPassword:
              "Поточний пароль неправильний.",
          });

          showToast(
            "error",
            "Не вдалося підтвердити поточний пароль"
          );
          break;

        case "auth/weak-password":
        case "auth/password-does-not-meet-requirements":
          setErrors({
            newPassword:
              "Новий пароль не відповідає вимогам безпеки.",
          });

          showToast(
            "error",
            "Новий пароль занадто слабкий"
          );
          break;

        case "auth/too-many-requests":
          showToast(
            "warning",
            "Забагато спроб. Спробуйте пізніше"
          );
          break;

        case "auth/requires-recent-login":
          showToast(
            "error",
            "Не вдалося підтвердити авторизацію. Спробуйте ще раз"
          );
          break;

        default:
          showToast(
            "error",
            "Не вдалося змінити пароль"
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">

      {/* Заголовок */}
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
          <LockKeyhole size={19} />
        </span>

        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800">
            Зміна пароля
          </h4>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            Введіть поточний пароль і новий,
            щоб оновити дані для входу в RBoard.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">

        {/* Поточний пароль */}
        <div>
          <label
            htmlFor="profile-current-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Поточний пароль
          </label>

          <div className="relative">
            <input
              id="profile-current-password"
              type={
                showCurrentPassword
                  ? "text"
                  : "password"
              }
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);

                if (errors.currentPassword) {
                  setErrors((previous) => ({
                    ...previous,
                    currentPassword: "",
                  }));
                }
              }}
              disabled={busy}
              autoComplete="current-password"
              placeholder="Введіть поточний пароль"
              aria-invalid={Boolean(errors.currentPassword)}
              className={`w-full rounded-xl border bg-white py-3.5 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:opacity-60 ${
                errors.currentPassword
                  ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              }`}
            />

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setShowCurrentPassword((value) => !value)
              }
              aria-label={
                showCurrentPassword
                  ? "Приховати поточний пароль"
                  : "Показати поточний пароль"
              }
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
            >
              {showCurrentPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {errors.currentPassword && (
            <p className="mt-2 text-xs leading-5 text-red-600">
              {errors.currentPassword}
            </p>
          )}
        </div>

        {/* Новий пароль */}
        <div>
          <label
            htmlFor="profile-new-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Новий пароль
          </label>

          <div className="relative">
            <input
              id="profile-new-password"
              type={
                showNewPassword
                  ? "text"
                  : "password"
              }
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);

                if (errors.newPassword) {
                  setErrors((previous) => ({
                    ...previous,
                    newPassword: "",
                  }));
                }
              }}
              disabled={busy}
              autoComplete="new-password"
              placeholder="Введіть новий пароль"
              aria-invalid={Boolean(errors.newPassword)}
              className={`w-full rounded-xl border bg-white py-3.5 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:opacity-60 ${
                errors.newPassword
                  ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              }`}
            />

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setShowNewPassword((value) => !value)
              }
              aria-label={
                showNewPassword
                  ? "Приховати новий пароль"
                  : "Показати новий пароль"
              }
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
            >
              {showNewPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {errors.newPassword && (
            <p className="mt-2 text-xs leading-5 text-red-600">
              {errors.newPassword}
            </p>
          )}
        </div>

        {/* Інформація */}
        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-white/70 px-3 py-3">
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <p className="text-xs leading-5 text-slate-500">
            Новий пароль повинен містити
            щонайменше 8 символів.
            Після зміни використовуйте його
            для наступного входу.
          </p>
        </div>

        {/* Кнопка збереження */}
        <button
          type="button"
          onClick={handleChangePassword}
          disabled={
            busy ||
            !currentPassword ||
            !newPassword
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <>
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
              Зміна пароля...
            </>
          ) : (
            <>
              <LockKeyhole size={17} />
              Змінити пароль
            </>
          )}
        </button>
      </div>
    </div>
  );
}
