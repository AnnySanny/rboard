
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebase";

const ONLINE_TIMEOUT = 5 * 60 * 1000;

export default function useUserPresence(uid) {
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    let active = true;
    let unsubscribePresence = null;

    setLastSeenAt(null);
    setLoading(Boolean(uid));

    if (!uid) {
      setLoading(false);
      return undefined;
    }

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        // Зупиняємо попередню підписку
        if (unsubscribePresence) {
          unsubscribePresence();
          unsubscribePresence = null;
        }

        if (!active) return;

        // Гість не має доступу до онлайн-статусу
        if (!user) {
          setLastSeenAt(null);
          setLoading(false);
          return;
        }

        setLoading(true);

        // Підписка тільки для авторизованих
        unsubscribePresence = onSnapshot(
          doc(db, "userPresence", uid),
          (snapshot) => {
            if (!active) return;

            setLastSeenAt(
              snapshot.exists()
                ? snapshot.data().lastSeenAt?.toMillis?.() ?? null
                : null
            );

            setNow(Date.now());
            setLoading(false);
          },
          (error) => {
            if (!active) return;

            console.error(
              "Помилка отримання статусу:",
              error
            );

            setLastSeenAt(null);
            setLoading(false);
          }
        );
      }
    );

    return () => {
      active = false;
      unsubscribeAuth();

      if (unsubscribePresence) {
        unsubscribePresence();
      }
    };
  }, [uid]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  const online =
    !loading &&
    lastSeenAt !== null &&
    now - lastSeenAt >= 0 &&
    now - lastSeenAt < ONLINE_TIMEOUT;

  return {
    online,
    text: loading
      ? "Перевірка статусу..."
      : online
        ? "На платформі"
        : "Не в мережі",
  };
}
