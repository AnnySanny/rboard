
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
    onAuthStateChanged,
    signOut,
} from "firebase/auth";

import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import Swal from "sweetalert2";

import { auth, db } from "../../firebase";
import { stopAndRemoveUserPresence } from "../../utils/userPresence";

export default function UserAccessWatcher() {
    const navigate = useNavigate();
    const processingRef = useRef(false);

    useEffect(() => {
        let unsubscribeUser = null;
        let generation = 0;

        const unsubscribeAuth = onAuthStateChanged(
            auth,
            (user) => {
                const currentGeneration = ++generation;

                if (unsubscribeUser) {
                    unsubscribeUser();
                    unsubscribeUser = null;
                }

                processingRef.current = false;

                if (!user) return;

                const uid = user.uid;

                const handleAccessLost = async (reason) => {

                    if (
                        sessionStorage.getItem("rboard_login_pending") === "true"
                    ) {
                        return;
                    }
                    if (
                        processingRef.current ||
                        currentGeneration !== generation ||
                        auth.currentUser?.uid !== uid
                    ) {
                        return;
                    }

                    processingRef.current = true;

                    // Зупиняємо нові оновлення онлайн-статусу
                    window.dispatchEvent(
                        new CustomEvent("rboard:presence-stop", {
                            detail: { uid },
                        })
                    );

                    stopAndRemoveUserPresence(uid).catch((error) => {
                        console.warn(
                            "Не вдалося очистити онлайн-статус:",
                            error
                        );
                    });

                    try {
                        if (auth.currentUser?.uid === uid) {
                            await signOut(auth);
                        }
                    } catch (error) {
                        console.error("Помилка виходу:", error);
                        processingRef.current = false;
                        return;
                    }

                    navigate("/", { replace: true });

                    await Swal.fire({
                        icon: reason === "deleted" ? "info" : "error",
                        title:
                            reason === "deleted"
                                ? "Ваш акаунт видалено"
                                : "Ваш акаунт заблоковано",
                        text:
                            reason === "deleted"
                                ? "Ваш обліковий запис було видалено адміністрацією RBoard."
                                : "Адміністрація RBoard обмежила доступ до вашого облікового запису. Для з'ясування причини зверніться до адміністрації.",
                        confirmButtonText: "Зрозуміло",
                        confirmButtonColor: "#2563eb",
                    });
                };

                unsubscribeUser = onSnapshot(
                    doc(db, "users", uid),
                    (snapshot) => {
                        if (currentGeneration !== generation) return;

                        // Документ видалено
                        if (!snapshot.exists()) {
                            handleAccessLost("deleted");
                            return;
                        }

                        // Користувача заблоковано
                        if (snapshot.data().blocked === true) {
                            handleAccessLost("blocked");
                        }
                    },
                    (error) => {
                        console.error(
                            "Помилка перевірки доступу:",
                            error
                        );
                    }
                );
            }
        );

        return () => {
            generation++;
            unsubscribeAuth();

            if (unsubscribeUser) {
                unsubscribeUser();
            }
        };
    }, [navigate]);

    return null;
}
