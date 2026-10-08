import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

export const getLocalDayKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export const getSocialStats = async (platform) => {
    const snapshot = await getDoc(
        doc(db, "socialStats", platform)
    );

    if (!snapshot.exists()) {
        return {
            count: 0,
            todayChange: 0,
        };
    }

    const data = snapshot.data();
    const count = data.count ?? 0;

    const todayChange =
        data.dayKey === getLocalDayKey()
            ? count - (data.dayStartCount ?? count)
            : 0;

    return { count, todayChange };
};

export const saveSocialStats = async (platform, newCount) => {
    if (!["instagram", "facebook"].includes(platform)) {
        throw new Error("Невідома соціальна мережа");
    }

    if (
        !Number.isSafeInteger(newCount) ||
        newCount < 0
    ) {
        throw new Error("Введи коректну кількість підписників");
    }

    const reference = doc(db, "socialStats", platform);
    const today = getLocalDayKey();

    await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(reference);

        const previous = snapshot.exists()
            ? snapshot.data()
            : null;

        const previousCount = previous?.count ?? 0;

        const dayStartCount =
            previous?.dayKey === today
                ? (previous.dayStartCount ?? previousCount)
                : previousCount;

        transaction.set(reference, {
            count: newCount,
            dayStartCount,
            dayKey: today,
            updatedAt: serverTimestamp(),
        });
    });
};