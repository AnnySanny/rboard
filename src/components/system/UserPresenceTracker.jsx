
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../firebase";
import { startUserPresence } from "../../utils/userPresence";

export default function UserPresenceTracker() {
  useEffect(() => {
    let stopTracking = null;
    let activeUid = null;

    const stopCurrentTracking = () => {
      const stop = stopTracking;

      stopTracking = null;
      activeUid = null;

      return stop ? stop() : Promise.resolve();
    };

    const handlePresenceStop = (event) => {
      if (event.detail?.uid !== activeUid) {
        return;
      }

      const task = stopCurrentTracking();

      event.detail?.pending?.push(task);
    };

    window.addEventListener(
      "rboard:presence-stop",
      handlePresenceStop
    );

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user?.uid === activeUid) return;

        void stopCurrentTracking();

        if (user?.uid) {
          activeUid = user.uid;
          stopTracking = startUserPresence(user.uid);
        }
      }
    );

    return () => {
      unsubscribe();

      void stopCurrentTracking();

      window.removeEventListener(
        "rboard:presence-stop",
        handlePresenceStop
      );
    };
  }, []);

  return null;
}
