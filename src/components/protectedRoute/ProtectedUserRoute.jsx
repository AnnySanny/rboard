
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../firebase";

export default function ProtectedUserRoute({ children }) {
  const [user, setUser] = useState(
    () => auth.currentUser
  );

  const [loading, setLoading] = useState(
    () => !auth.currentUser
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Очікуємо лише початкове визначення сесії Firebase
  if (loading) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center bg-[#f5f8ff]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      </div>
    );
  }

  // Немає активної сесії — 403
  if (!user) {
    return <Navigate to="/403" replace />;
  }

  // Авторизований — доступ дозволено
  return children;
}
