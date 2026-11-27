import { useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import {
    CheckCircle2,
    LoaderCircle,
} from "lucide-react";

import Swal from "sweetalert2";

import { auth, db } from "../../firebase";

import {
    CONTEST_ID,
    useContest,
} from "../../context/ContestContext";

const ELEMENT_ID = "r4m8k2p7x5";

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCancelButton: false,
    showCloseButton: false,
    timer: 2000,
    timerProgressBar: true,
});

const ContestFirstBoot = () => {
    const { isContestEnabled } = useContest();

    const [currentUser, setCurrentUser] = useState(undefined);
    const [progress, setProgress] = useState(null);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        return onAuthStateChanged(auth, setCurrentUser);
    }, []);

    const uid = currentUser?.uid;

    useEffect(() => {
        setProgress(null);

        if (!uid || !isContestEnabled) return;

        const participantRef = doc(
            db,
            "contests",
            CONTEST_ID,
            "participants",
            uid
        );

        return onSnapshot(
            participantRef,
            { includeMetadataChanges: true },
            (snapshot) => {
                if (snapshot.metadata.fromCache) return;

                setProgress({
                    uid,
                    found: snapshot
                        .data()
                        ?.foundBootIds
                        ?.includes(ELEMENT_ID) === true,
                });
            },
            (error) => {
                console.error(
                    "Помилка завантаження прогресу:",
                    error
                );

                setProgress({
                    uid,
                    found: false,
                });
            }
        );
    }, [uid, isContestEnabled]);

    const loading =
        currentUser === undefined ||
        (Boolean(uid) && progress?.uid !== uid);

    const found =
        Boolean(uid) &&
        progress?.uid === uid &&
        progress.found;

    const handleClaim = async () => {
        if (
            !isContestEnabled ||
            claiming ||
            found ||
            loading
        ) {
            return;
        }

        if (!currentUser) {
            Toast.fire({
                icon: "info",
                title: "Увійдіть, щоб забрати чобіток",
            });

            return;
        }

        setClaiming(true);

        try {
            const token = await currentUser.getIdToken();

            const response = await fetch(
                "/.netlify/functions/contest-claim",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        bootId: ELEMENT_ID,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Не вдалося зарахувати чобіток."
                );
            }

            if (auth.currentUser?.uid !== currentUser.uid) {
                return;
            }

            setProgress({
                uid: currentUser.uid,
                found: true,
            });

            if (data.alreadyFound) {
                Toast.fire({
                    icon: "info",
                    title: "Чобіток уже зараховано",
                });

                return;
            }

            Toast.fire({
                icon: "success",

                title: "Вітаємо!",

                text: data.foundCount === data.totalBoots
                    ? "Ви знайшли всі святкові чобітки!"
                    : `Ви знайшли ${data.foundCount} із ${data.totalBoots} чобітків. Продовжуйте пошуки!`,
            });

        } catch (error) {
            Toast.fire({
                icon: "warning",
                title: "Не вдалося забрати чобіток",
                text: error.message,
            });
        } finally {
            setClaiming(false);
        }
    };

    if (!isContestEnabled) return null;

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        );
    }

    if (found) {
        return (
            <div className="flex flex-col items-center py-5 text-center">

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>

                <p className="mt-3 text-base font-bold text-emerald-600">
                    Чобіток зараховано!
                </p>

                <p className="mt-1 text-sm text-slate-500">
                    Продовжуйте шукати інші чобітки.
                </p>

            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-5 text-center">

            <button
                type="button"
                onClick={handleClaim}
                disabled={claiming}
                aria-label="Забрати святковий чобіток"
                className="group relative flex h-28 w-28 items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95 disabled:cursor-wait disabled:opacity-50 sm:h-36 sm:w-36"
            >
                <img
                    src="/images/contest-boot.png"
                    alt="Святковий чобіток RBoard"
                    className="h-full w-full object-contain drop-shadow-lg"
                    draggable={false}
                />

                {claiming && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                )}
            </button>

            <p className="mt-3 text-sm font-bold text-blue-600 sm:text-base">
                {claiming
                    ? "Зараховуємо знахідку..."
                    : "Натисніть, щоб забрати чобіток"}
            </p>

        </div>
    );
};

export default ContestFirstBoot;