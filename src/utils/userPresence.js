
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const HEARTBEAT_INTERVAL = 3 * 60 * 1000;

export const startUserPresence = (uid) => {
  if (!uid) return () => {};

  const presenceRef = doc(db, "userPresence", uid);
  let stopped = false;
  let writing = false;

  const updatePresence = async () => {
    if (stopped || writing) return;

    writing = true;

    try {
      await setDoc(
        presenceRef,
        {
          lastSeenAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Помилка оновлення статусу:", error);
    } finally {
      writing = false;
    }
  };

  updatePresence();

  const interval = setInterval(() => {
    if (document.visibilityState === "visible") {
      updatePresence();
    }
  }, HEARTBEAT_INTERVAL);

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      updatePresence();
    }
  };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  return () => {
    stopped = true;
    clearInterval(interval);

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  };
};

export const stopAndRemoveUserPresence = async (uid) => {
  if (!uid) return;

  window.dispatchEvent(
    new CustomEvent("rboard:presence-stop", {
      detail: { uid },
    })
  );

  await deleteDoc(doc(db, "userPresence", uid));
};
