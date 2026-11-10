
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "../../firebase";

const ONLINE_TIMEOUT = 5 * 60 * 1000;

export default function useUserPresence(uid) {
  const [sessions, setSessions] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    let active = true;
    let unsubscribePresence = null;

    setSessions([]);
    setLoading(Boolean(uid));

    if (!uid) {
      setLoading(false);
      return undefined;
    }

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (unsubscribePresence) {
          unsubscribePresence();
          unsubscribePresence = null;
        }

        if (!active) return;

        if (!user) {
          setSessions([]);
          setLoading(false);
          return;
        }

        setLoading(true);

        const sessionsRef = collection(
          db,
          "userPresence",
          uid,
          "sessions"
        );

        unsubscribePresence = onSnapshot(
          sessionsRef,
          (snapshot) => {
            if (!active) return;

            const timestamps = snapshot.docs
              .map((session) =>
                session.data().lastSeenAt?.toMillis?.()
              )
              .filter((value) =>
                Number.isFinite(value)
              );

            setSessions(timestamps);
            setNow(Date.now());
            setLoading(false);
          },
          (error) => {
            if (!active) return;

            console.error(
              "Помилка отримання онлайн-статусу:",
              error
            );

            setSessions([]);
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
    sessions.some(
      (lastSeenAt) =>
        now - lastSeenAt >= 0 &&
        now - lastSeenAt < ONLINE_TIMEOUT
    );

  return {
    online,
    text: loading
      ? "Перевірка статусу..."
      : online
        ? "На платформі"
        : "Не в мережі",
  };
}
