import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import Swal from "sweetalert2";

import { auth, db } from "../firebase";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const showErrorToast = (message) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const showSuccessToast = () => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Вхід виконано успішно",
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      showErrorToast("Заповніть електронну пошту та пароль");
      return;
    }

    try {
      setIsLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const authenticatedUser = userCredential.user;

      const userDocumentReference = doc(
        db,
        "users",
        authenticatedUser.uid
      );

      const userDocument = await getDoc(userDocumentReference);

      if (!userDocument.exists()) {
        await signOut(auth);

        showErrorToast("Користувача не знайдено в системі");
        return;
      }

      const userData = userDocument.data();

      if (userData.role !== "admin") {
        await signOut(auth);

        showErrorToast("У вас немає доступу до панелі керування");
        return;
      }

      showSuccessToast();

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Помилка входу:", error);

      let errorMessage = "Не вдалося виконати вхід";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Некоректна електронна пошта";
          break;

        case "auth/invalid-credential":
          errorMessage = "Неправильна пошта або пароль";
          break;

        case "auth/user-disabled":
          errorMessage = "Цей обліковий запис заблоковано";
          break;

        case "auth/too-many-requests":
          errorMessage =
            "Забагато спроб входу. Спробуйте пізніше";
          break;

        case "auth/network-request-failed":
          errorMessage = "Перевірте підключення до інтернету";
          break;

        case "permission-denied":
        case "firestore/permission-denied":
          errorMessage = "Немає доступу до даних користувача";
          break;

        default:
          errorMessage = "Помилка входу. Перевірте введені дані";
      }

      showErrorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70 sm:p-8">
        <h1 className="text-center text-3xl font-black tracking-tight text-slate-950">
          Вхід
        </h1>

        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit}
        >
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Електронна пошта"
            autoComplete="email"
            disabled={isLoading}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Пароль"
            autoComplete="current-password"
            disabled={isLoading}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Перевірка...
              </span>
            ) : (
              "Увійти"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}