import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import Swal from "sweetalert2";

import { auth, db } from "../firebase";

export const CONTEST_ID = "christmas-2026";

const ContestContext = createContext(null);

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCancelButton: false,
    showCloseButton: false,
    timer: 4000,
    timerProgressBar: true,
});

export const ContestProvider = ({ children }) => {
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSynced, setIsSynced] = useState(false);

    const [currentUser, setCurrentUser] = useState(undefined);
    const [progress, setProgress] = useState(null);
    const [claimingBootId, setClaimingBootId] = useState(null);

    const [, setClock] = useState(0);

    const claimRequest = useRef(null);

    useEffect(() => {
        const contestRef = doc(
            db,
            "contests",
            CONTEST_ID
        );

        const unsubscribe = onSnapshot(
            contestRef,
            {
                includeMetadataChanges: true,
            },
            (snapshot) => {
                const synced =
                    !snapshot.metadata.fromCache &&
                    !snapshot.metadata.hasPendingWrites;

                setIsSynced(synced);

                if (!snapshot.exists()) {
                    setContest(null);

                    setError(
                        synced
                            ? "Конкурс не знайдено."
                            : null
                    );

                    setLoading(false);
                    return;
                }

                setContest({
                    id: snapshot.id,
                    ...snapshot.data(),
                });

                setError(null);
                setLoading(false);
            },
            (error) => {
                console.error(
                    "Помилка завантаження конкурсу:",
                    error
                );

                setContest(null);
                setIsSynced(false);

                setError(
                    "Не вдалося завантажити конкурс."
                );

                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    const isContestEnabled =
        !loading &&
        !error &&
        isSynced &&
        contest?.enabled === true;

    const startsAt = contest?.startsAt?.toMillis?.();
    const endsAt = contest?.endsAt?.toMillis?.();

    const validDates =
        Number.isFinite(startsAt) &&
        Number.isFinite(endsAt) &&
        endsAt > startsAt;

    const now = Date.now();

    const isContestActive =
        isContestEnabled &&
        validDates &&
        now >= startsAt &&
        now < endsAt;

    useEffect(() => {
        if (!isContestEnabled || !validDates) return;

        let timeout;

        const updateClock = () => {
            clearTimeout(timeout);

            setClock((previous) => previous + 1);

            const now = Date.now();

            const nextBoundary =
                now < startsAt
                    ? startsAt
                    : now < endsAt
                        ? endsAt
                        : null;

            if (nextBoundary !== null) {
                timeout = setTimeout(
                    updateClock,
                    Math.min(
                        nextBoundary - now + 50,
                        2147483647
                    )
                );
            }
        };

        updateClock();

        window.addEventListener("focus", updateClock);

        document.addEventListener(
            "visibilitychange",
            updateClock
        );

        return () => {
            clearTimeout(timeout);

            window.removeEventListener(
                "focus",
                updateClock
            );

            document.removeEventListener(
                "visibilitychange",
                updateClock
            );
        };

    }, [
        isContestEnabled,
        validDates,
        startsAt,
        endsAt,
    ]);

    useEffect(() => {
        return onAuthStateChanged(
            auth,
            setCurrentUser
        );
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

        const unsubscribe = onSnapshot(
            participantRef,
            {
                includeMetadataChanges: true,
            },
            (snapshot) => {
                if (
                    snapshot.metadata.fromCache ||
                    snapshot.metadata.hasPendingWrites
                ) {
                    setProgress(null);
                    return;
                }

                const data = snapshot.data();

                setProgress({
                    uid,

                    foundBootIds: Array.isArray(
                        data?.foundBootIds
                    )
                        ? data.foundBootIds
                        : [],

                    disqualified:
                        data?.disqualified === true,

                    error: null,
                });
            },
            (error) => {
                console.error(
                    "Помилка завантаження прогресу:",
                    error
                );

                setProgress({
                    uid,
                    foundBootIds: [],
                    disqualified: false,
                    error: "Не вдалося завантажити прогрес конкурсу.",
                });
            }
        );

        return unsubscribe;

    }, [uid, isContestEnabled]);

    const authLoading =
        currentUser === undefined;

    const progressLoading =
        Boolean(uid) &&
        isContestEnabled &&
        progress?.uid !== uid;

    const progressError =
        progress?.uid === uid
            ? progress?.error || null
            : null;

    const progressReady =
        Boolean(uid) &&
        isContestEnabled &&
        progress?.uid === uid &&
        !progressError;

    const foundBootIds =
        progressReady
            ? progress.foundBootIds
            : [];

    const foundCount = foundBootIds.length;

    const totalBoots = contest?.totalBoots || 0;

    const isDisqualified =
        progressReady &&
        progress.disqualified === true;

    const canCollectBoots =
        isContestActive &&
        Boolean(uid) &&
        progressReady &&
        !isDisqualified;

    const leaderboardRevision =
        contest?.leaderboardRevision ?? 0;

    const hasFound = (bootId) => {
        return foundBootIds.includes(bootId);
    };

    const claimItem = async (bootId) => {
        if (
            !isContestEnabled ||
            authLoading ||
            claimRequest.current ||
            typeof bootId !== "string" ||
            !bootId
        ) {
            return false;
        }

        if (!currentUser) {
            Toast.fire({
                icon: "info",
                title: "Увійдіть у свій обліковий запис",
            });

            return false;
        }

        if (auth.currentUser?.uid !== uid) {
            return false;
        }

        if (!validDates) {
            Toast.fire({
                icon: "warning",
                title: "Конкурс наразі недоступний",
            });

            return false;
        }

        const now = Date.now();

        if (now < startsAt) {
            Toast.fire({
                icon: "info",
                title: "Конкурс ще не розпочався",
            });

            return false;
        }

        if (now >= endsAt) {
            Toast.fire({
                icon: "info",
                title: "Конкурс вже завершено",
            });

            return false;
        }

        if (!progressReady) {
            Toast.fire({
                icon: "warning",
                title: progressError ||
                    "Зачекайте, завантажуємо ваш прогрес",
            });

            return false;
        }

        if (isDisqualified) {
            Toast.fire({
                icon: "warning",
                title: "Ви дискваліфіковані з конкурсу",
            });

            return false;
        }

        if (hasFound(bootId)) {
            return false;
        }

        const request = {
            uid,
            bootId,
        };

        claimRequest.current = request;

        setClaimingBootId(bootId);

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
                        bootId,
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

            if (auth.currentUser?.uid !== uid) {
                return false;
            }

            if (data.alreadyFound) {
                Toast.fire({
                    icon: "info",
                    title: "Чобіток уже зараховано",
                });

                return false;
            }

            Toast.fire({
                icon: "success",

                title: "Вітаємо!",

                text: data.foundCount === data.totalBoots
                    ? "Ви знайшли всі святкові чобітки!"
                    : `Ви знайшли ${data.foundCount} із ${data.totalBoots} чобітків. Продовжуйте пошуки!`,
            });

            return true;

        } catch (error) {
            if (auth.currentUser?.uid === uid) {
                Toast.fire({
                    icon: "warning",
                    title: "Не вдалося забрати чобіток",
                    text: error.message,
                });
            }

            return false;

        } finally {
            if (claimRequest.current === request) {
                claimRequest.current = null;
                setClaimingBootId(null);
            }
        }
    };

    return (
        <ContestContext.Provider
            value={{
                contest,
                loading,
                error,
                isSynced,
                isContestEnabled,
                isContestActive,

                currentUser,
                authLoading,

                progressLoading,
                progressError,
                progressReady,

                foundBootIds,
                foundCount,
                totalBoots,

                isDisqualified,
                canCollectBoots,

                claimingBootId,

                leaderboardRevision,

                hasFound,
                claimItem,
            }}
        >
            {children}
        </ContestContext.Provider>
    );
};

export const useContest = () => {
    const context = useContext(ContestContext);

    if (!context) {
        throw new Error(
            "useContest must be used within ContestProvider"
        );
    }

    return context;
};