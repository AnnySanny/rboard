
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const HEARTBEAT_INTERVAL = 3 * 60 * 1000;

export const startUserPresence = (uid) => {
  if (!uid) return () => {};

  const presenceRef = doc(db, "userPresence", uid);

  let stopped = false;
  let writing = false;
  let verified = false;

  // Перевірка активної авторизації
  const isCurrentUser = () => {
    return (
      !stopped &&
      auth.currentUser?.uid === uid
    );
  };

  // Перевірка профілю перед запуском
  const verifyUser = async () => {
    if (!isCurrentUser()) return false;

    try {
      const userSnapshot = await getDoc(
        doc(db, "users", uid)
      );

      if (!isCurrentUser()) return false;

      if (!userSnapshot.exists()) {
        return false;
      }

      if (userSnapshot.data().blocked === true) {
        return false;
      }

      return true;
    } catch (error) {
      if (!stopped) {
        console.error(
          "Помилка перевірки користувача:",
          error
        );
      }

      return false;
    }
  };

  // Оновлення онлайн-статусу
  const updatePresence = async () => {
    if (!isCurrentUser() || writing) return;

    writing = true;

    try {
      // Спочатку перевіряємо користувача
      if (!verified) {
        verified = await verifyUser();
      }

      if (!verified || !isCurrentUser()) {
        return;
      }

      await setDoc(
        presenceRef,
        {
          lastSeenAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      if (!stopped) {
        console.error(
          "Помилка оновлення статусу:",
          error
        );
      }
    } finally {
      writing = false;
    }
  };

  // Перше оновлення
  updatePresence();

  // Періодичне оновлення
  const interval = setInterval(() => {
    if (document.visibilityState === "visible") {
      updatePresence();
    }
  }, HEARTBEAT_INTERVAL);

  // Повернення користувача на вкладку
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      updatePresence();
    }
  };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  // Зупинка відстеження
  return () => {
    stopped = true;

    clearInterval(interval);

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  };
};

// Зупинка та видалення онлайн-статусу
export const stopAndRemoveUserPresence = async (uid) => {
  if (!uid) return;

  // Повідомляємо UserPresenceTracker
  window.dispatchEvent(
    new CustomEvent("rboard:presence-stop", {
      detail: { uid },
    })
  );

  // Видаляємо запис онлайн-статусу
  await deleteDoc(
    doc(db, "userPresence", uid)
  );
};
