
import { useState } from "react";
import Swal from "sweetalert2";

import {
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

import {
  UserRound,
  Phone,
  FileText,
  ShieldCheck,
  Save,
  X,
  EyeOff,
} from "lucide-react";

import { auth, db } from "../../firebase";

import ProfileAvatar from "./ProfileAvatar";
import ProfileCityInput from "./ProfileCityInput";

import {
  CONTACT_TYPES,
  createProfileForm,
  cleanContacts,
  createPublicProfile,
} from "../../utils/profileUtils";

import {
  Instagram,
  Facebook,
} from "lucide-react";

import {
  FaTelegramPlane,
  FaViber,
  FaWhatsapp,
  FaTiktok,
} from "react-icons/fa";

const CLOUD_NAME = "djjhf64uc";

// Створи окремий unsigned preset для аватарів.
// Він має використовувати папку user_photo.
const UPLOAD_PRESET = "profile_avatars";

const CONTACT_OPTIONS = [
  {
    key: "instagram",
    label: "Instagram",
    Icon: Instagram,
    placeholder: "https://instagram.com/username",
  },
  {
    key: "telegram",
    label: "Telegram",
    Icon: FaTelegramPlane,
    placeholder: "https://t.me/username або @username",
  },
  {
    key: "viber",
    label: "Viber",
    Icon: FaViber,
    placeholder: "+380...",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    Icon: FaWhatsapp,
    placeholder: "+380...",
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: Facebook,
    placeholder: "https://facebook.com/username",
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: FaTiktok,
    placeholder: "https://tiktok.com/@username",
  },
];

const uploadToCloudinary = async (file) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
      "Не вдалося завантажити аватар."
    );
  }

  if (!data.secure_url || !data.public_id) {
    throw new Error("Cloudinary повернув неповні дані.");
  }

  return {
    imageUrl: data.secure_url,
    imagePublicId: data.public_id,
  };
};

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-60";

const PrivacyToggle = ({
  checked,
  onChange,
  title,
  description,
  disabled,
}) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) =>
        onChange(event.target.checked)
      }
      disabled={disabled}
      className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
    />

    <span className="min-w-0">
      <span className="block text-sm font-bold text-slate-800">
        {title}
      </span>

      <span className="mt-1 block text-xs leading-5 text-slate-500">
        {description}
      </span>
    </span>
  </label>
);

export default function ProfileEditor({
  profile,
  onSaved,
  onCancel,
}) {
  const [form, setForm] = useState(() =>
    createProfileForm(profile)
  );

  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const changeField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const changePrivacy = (key, value) => {
    setForm((previous) => ({
      ...previous,
      privacy: {
        ...previous.privacy,
        [key]: value,
      },
    }));
  };

  const changeContact = (key, patch) => {
    setForm((previous) => ({
      ...previous,
      additionalContacts: {
        ...previous.additionalContacts,
        [key]: {
          ...previous.additionalContacts[key],
          ...patch,
        },
      },
    }));
  };

  const removeAvatar = () => {
    setAvatarFile(null);

    setForm((previous) => ({
      ...previous,
      avatarUrl: "",
      avatarPublicId: "",
    }));
  };

  const validate = () => {
    const login = form.login.trim();

    if (login.length < 2 || login.length > 80) {
      return "Ім'я повинно містити від 2 до 80 символів.";
    }

    if (form.bio.trim().length > 500) {
      return "Опис не може перевищувати 500 символів.";
    }

    if (form.city.trim().length > 100) {
      return "Назва міста занадто довга.";
    }

    for (const key of CONTACT_TYPES) {
      const contact = form.additionalContacts[key];

      if (contact.enabled && !contact.value.trim()) {
        return "Заповніть усі вибрані контакти або вимкніть їх.";
      }
    }

    return null;
  };

  const cleanupAvatar = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const response = await fetch(
        "/.netlify/functions/delete-profile-avatar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(
          "Аватар збережено, але очищення старого фото не виконано."
        );
      }
    } catch (error) {
      console.warn(
        "Помилка очищення старого аватара:",
        error
      );
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) return;

    const validationError = validate();

    if (validationError) {
      await Swal.fire({
        icon: "warning",
        title: "Перевірте дані",
        text: validationError,
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const user = auth.currentUser;

    if (!user || user.uid !== profile.uid) {
      await Swal.fire({
        icon: "error",
        title: "Помилка авторизації",
        text: "Увійдіть у свій акаунт повторно.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setSaving(true);

    let uploadedAvatar = null;
    let batchSaved = false;

    try {
      // 1. За потреби завантажуємо новий аватар.
      let avatarUrl = form.avatarUrl;
      let avatarPublicId = form.avatarPublicId;

      if (avatarFile) {
        uploadedAvatar = await uploadToCloudinary(
          avatarFile
        );

        avatarUrl = uploadedAvatar.imageUrl;
        avatarPublicId =
          uploadedAvatar.imagePublicId;
      }

      const previousAvatarId =
        profile.avatarPublicId || "";

      const shouldDeleteOldAvatar =
        Boolean(previousAvatarId) &&
        previousAvatarId !== avatarPublicId;

      // 2. Підготовка приватних даних.
      const privateData = {
        login: form.login.trim(),
        bio: form.bio.trim(),
        city: form.city.trim(),
        avatarUrl,
        avatarPublicId,
        additionalContacts: cleanContacts(
          form.additionalContacts
        ),
        privacy: {
          ...form.privacy,
        },
        updatedAt: serverTimestamp(),
      };

      if (shouldDeleteOldAvatar) {
        privateData.avatarCleanupPublicId =
          previousAvatarId;
      }

      // 3. Публічні дані без прихованих полів.
      const publicData = createPublicProfile(
        {
          ...privateData,
          phone: form.phone,
          updatedAt: serverTimestamp(),
        },
        profile.createdAt || null
      );

      // 4. Обидва документи зберігаємо атомарно.
      const batch = writeBatch(db);

      batch.update(
        doc(db, "users", user.uid),
        privateData
      );

      batch.set(
        doc(db, "publicProfiles", user.uid),
        publicData
      );

      await batch.commit();
      batchSaved = true;

      // 5. Очищаємо попередню фотографію.
      if (shouldDeleteOldAvatar) {
        await cleanupAvatar();
      }

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Профіль оновлено",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });

      onSaved?.();
    } catch (error) {
      console.error("Помилка збереження профілю:", error);

      // Якщо Firestore не зберіг дані, нове фото
      // не повинно вважатися аватаром користувача.
      // Його необхідно очищати окремо на сервері.
      if (uploadedAvatar && !batchSaved) {
        console.warn(
          "Новий аватар завантажено, але Firestore не оновлено. Потрібне очищення незакріпленого файлу:",
          uploadedAvatar.imagePublicId
        );
      }

      await Swal.fire({
        icon: "error",
        title: "Не вдалося зберегти",
        text:
          error?.code === "permission-denied"
            ? "Немає дозволу на запис. Перевірте правила Firestore."
            : error.message ||
              "Спробуйте ще раз.",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="space-y-7"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Редагування профілю
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Налаштуйте інформацію, яку бачитимуть
            відвідувачі RBoard.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="Закрити редагування"
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
        >
          <X size={20} />
        </button>
      </div>

      {/* Фото */}
      <ProfileAvatar
        avatarUrl={form.avatarUrl}
        file={avatarFile}
        onFileChange={(file) =>
          setAvatarFile(file)
        }
        onRemove={removeAvatar}
        disabled={saving}
      />

      <div className="border-t border-slate-100" />

      {/* Особисті дані */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="profile-login"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            <UserRound size={16} className="mr-2 inline text-blue-600" />
            Ім'я / логін
          </label>

          <input
            id="profile-login"
            value={form.login}
            onChange={(event) =>
              changeField("login", event.target.value)
            }
            maxLength={80}
            disabled={saving}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="profile-phone"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            <Phone size={16} className="mr-2 inline text-blue-600" />
            Номер телефону
          </label>

          <input
            id="profile-phone"
            value={form.phone}
            readOnly
            className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
          />

          <p className="mt-2 text-xs text-slate-400">
            Номер для входу не можна змінити.
          </p>
        </div>

        <div className="md:col-span-2">
          <ProfileCityInput
            value={form.city}
            onChange={(value) =>
              changeField("city", value)
            }
            disabled={saving}
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="profile-bio"
            className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-slate-700"
          >
            <span>
              <FileText size={16} className="mr-2 inline text-blue-600" />
              Про себе
            </span>

            <span className="text-xs font-normal text-slate-400">
              {form.bio.length}/500
            </span>
          </label>

          <textarea
            id="profile-bio"
            value={form.bio}
            onChange={(event) =>
              changeField("bio", event.target.value)
            }
            maxLength={500}
            rows={5}
            disabled={saving}
            placeholder="Розкажіть трохи про себе..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Додаткові контакти */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-6">
        <h3 className="text-base font-black text-slate-900">
          Додаткові способи зв'язку
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Оберіть месенджери або соціальні мережі,
          через які з вами можна зв'язатися.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {CONTACT_OPTIONS.map(
            ({ key, label, Icon, placeholder }) => {
              const contact =
                form.additionalContacts[key];

              return (
                <div
                  key={key}
                  className={`rounded-xl border bg-white p-4 transition ${
                    contact.enabled
                      ? "border-blue-300"
                      : "border-slate-200"
                  }`}
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={contact.enabled}
                      disabled={saving}
                      onChange={(event) =>
                        changeContact(key, {
                          enabled: event.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <Icon
                      size={19}
                      className="text-blue-600"
                    />

                    <span className="text-sm font-bold text-slate-800">
                      {label}
                    </span>
                  </label>

                  {contact.enabled && (
                    <input
                      type="text"
                      value={contact.value}
                      onChange={(event) =>
                        changeContact(key, {
                          value: event.target.value,
                        })
                      }
                      placeholder={placeholder}
                      maxLength={250}
                      disabled={saving}
                      className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* Приватність */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck
            size={21}
            className="text-blue-600"
          />

          <div>
            <h3 className="text-base font-black text-slate-900">
              Приватність профілю
            </h3>

            <p className="text-xs text-slate-500">
              Оберіть інформацію, яку не потрібно
              показувати відвідувачам.
            </p>
          </div>
        </div>

        <PrivacyToggle
          checked={form.privacy.hidePhone}
          onChange={(value) =>
            changePrivacy("hidePhone", value)
          }
          disabled={saving}
          title="Не показувати номер телефону"
          description="Ваш номер буде прихований у публічному профілі."
        />

        <PrivacyToggle
          checked={form.privacy.hideCity}
          onChange={(value) =>
            changePrivacy("hideCity", value)
          }
          disabled={saving}
          title="Не показувати місто"
          description="Інші користувачі не бачитимуть ваш населений пункт."
        />

        <PrivacyToggle
          checked={form.privacy.hideContacts}
          onChange={(value) =>
            changePrivacy("hideContacts", value)
          }
          disabled={saving}
          title="Не показувати додаткові контакти"
          description="Одне налаштування приховає всі додані месенджери та соціальні мережі."
        />

        <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
          <EyeOff size={16} className="mt-0.5 shrink-0" />
          <span>
            Налаштування приватності профілю
            не впливають на контакти у ваших оголошеннях.
          </span>
        </div>
      </section>

      {/* Кнопки */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Скасувати
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Збереження...
            </>
          ) : (
            <>
              <Save size={17} />
              Зберегти зміни
            </>
          )}
        </button>
      </div>
    </form>
  );
}
