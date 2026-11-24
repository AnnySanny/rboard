
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../firebase";

export default function ProtectedPartnerRoute({
    children,
    requiredType,
}) {
    const [access, setAccess] = useState("loading");

    useEffect(() => {
        let active = true;
        let requestVersion = 0;

        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                const version = ++requestVersion;

                if (active) {
                    setAccess("loading");
                }

                if (!user) {
                    if (active && version === requestVersion) {
                        setAccess("guest");
                    }
                    return;
                }

                try {
                    const snapshot = await getDoc(
                        doc(db, "users", user.uid)
                    );

                    if (!active || version !== requestVersion) {
                        return;
                    }

                    if (!snapshot.exists()) {
                        setAccess("denied");
                        return;
                    }

                    const userData = snapshot.data();

                    const isAllowed =
                        userData.role === "user" &&
                        userData.blocked !== true &&
                        userData.partner === true &&
                        typeof userData.partnerType === "string" &&
                        (
                            !requiredType ||
                            userData.partnerType === requiredType
                        );

                    setAccess(isAllowed ? "allowed" : "denied");

                } catch (error) {
                    console.error(
                        "Помилка перевірки партнерського доступу:",
                        error
                    );

                    if (active && version === requestVersion) {
                        setAccess("denied");
                    }
                }
            }
        );

        return () => {
            active = false;
            requestVersion++;
            unsubscribe();
        };
    }, [requiredType]);

    if (access === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f5f8ff]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                    <p className="text-sm font-medium text-slate-500">
                        Перевірка доступу...
                    </p>
                </div>
            </div>
        );
    }

    // Гість або користувач, який вийшов з акаунта
    if (access === "guest") {
        return <Navigate to="/" replace />;
    }

    // Авторизований користувач без необхідних прав
    if (access === "denied") {
        return <Navigate to="/403" replace />;
    }


    return children;
}
