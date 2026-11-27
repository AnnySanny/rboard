import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase";

export const CONTEST_ID = "christmas-2026";

const ContestContext = createContext(null);

export const ContestProvider = ({ children }) => {
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSynced, setIsSynced] = useState(false);

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

    return (
        <ContestContext.Provider
            value={{
                contest,
                loading,
                error,
                isSynced,
                isContestEnabled,
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