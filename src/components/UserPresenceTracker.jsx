
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { startUserPresence } from "../utils/userPresence";

export default function UserPresenceTracker() {
  useEffect(() => {
    let stopTracking = null;
    let activeUid = null;

    const stopCurrentTracking = () => {
      stopTracking?.();
      stopTracking = null;
      activeUid = null;
    };

    const handlePresenceStop = (event) => {
      if (event.detail?.uid === activeUid) {
        stopCurrentTracking();
      }
    };

    window.addEventListener(
      "rboard:presence-stop",
      handlePresenceStop
    );

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid === activeUid) return;

      stopCurrentTracking();

      if (user?.uid) {
        activeUid = user.uid;
        stopTracking = startUserPresence(user.uid);
      }
    });

    return () => {
      unsubscribe();
      stopCurrentTracking();

      window.removeEventListener(
        "rboard:presence-stop",
        handlePresenceStop
      );
    };
  }, []);

  return null;
}
