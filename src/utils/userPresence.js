
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const HEARTBEAT_INTERVAL = 3 * 60 * 1000;

export const startUserPresence = (uid) => {
  if (!uid) return async () => {};

  const sessionsRef = collection(
    db,
    "userPresence",
    uid,
    "sessions"
  );

  const presenceRef = doc(sessionsRef);

  let stopped = false;
  let verified = false;
  let created = false;
  let writing = null;
  let stopping = null;

  const isCurrentUser = () =>
    !stopped && auth.currentUser?.uid === uid;

  const verifyUser = async () => {
    if (!isCurrentUser()) return false;

    try {
      const snapshot = await getDoc(
        doc(db, "users", uid)
      );

      if (!isCurrentUser()) return false;

      return (
        snapshot.exists() &&
        snapshot.data().blocked !== true
      );
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

  const updatePresence = async () => {
    if (!isCurrentUser() || writing) return;

    const task = (async () => {
      try {
        if (!verified) {
          verified = await verifyUser();
        }

        if (!verified || !isCurrentUser()) {
          return;
        }

        await setDoc(presenceRef, {
          lastSeenAt: serverTimestamp(),
        });

        created = true;
      } catch (error) {
        if (!stopped) {
          console.error(
            "Помилка оновлення онлайн-статусу:",
            error
          );
        }
      }
    })();

    writing = task;

    try {
      await task;
    } finally {
      if (writing === task) {
        writing = null;
      }
    }
  };

  updatePresence();

  const interval = setInterval(() => {
    if (
      document.visibilityState === "visible" &&
      navigator.onLine
    ) {
      updatePresence();
    }
  }, HEARTBEAT_INTERVAL);

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      updatePresence();
    }
  };

  const handleOnline = () => {
    updatePresence();
  };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  window.addEventListener("online", handleOnline);

  const stopTracking = () => {
    if (stopping) return stopping;

    stopped = true;

    clearInterval(interval);

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.removeEventListener(
      "online",
      handleOnline
    );

    stopping = (async () => {
      if (writing) {
        await writing;
      }

      if (!created) return;

      try {
        await deleteDoc(presenceRef);
      } catch (error) {
        console.error(
          "Помилка видалення сесії:",
          error
        );
      }
    })();

    return stopping;
  };

  return stopTracking;
};

export const stopAndRemoveUserPresence = async (uid) => {
  if (!uid) return;

  const pending = [];

  window.dispatchEvent(
    new CustomEvent("rboard:presence-stop", {
      detail: {
        uid,
        pending,
      },
    })
  );

  await Promise.allSettled(pending);
};
