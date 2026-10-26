
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const ONLINE_TIMEOUT = 5 * 60 * 1000;

export default function useUserPresence(uid) {
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    setLastSeenAt(null);
    setLoading(Boolean(uid));

    if (!uid) return undefined;

    const unsubscribe = onSnapshot(
      doc(db, "userPresence", uid),
      (snapshot) => {
        setLastSeenAt(
          snapshot.exists()
            ? snapshot.data().lastSeenAt?.toMillis?.() ?? null
            : null
        );

        setNow(Date.now());
        setLoading(false);
      },
      (error) => {
        console.error("Помилка отримання статусу:", error);
        setLastSeenAt(null);
        setLoading(false);
      }
    );

    return unsubscribe;
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
