import {
    CheckCircle2,
    LoaderCircle,
    AlertCircle,
} from "lucide-react";

import { useContest } from "../../context/ContestContext";

const ELEMENT_ID = "r4m8k2p7x5";

const ContestFirstBoot = () => {
    const {
        isContestEnabled,
        authLoading,
        progressLoading,
        progressError,
        isDisqualified,
        claimingBootId,
        hasFound,
        claimItem,
    } = useContest();

    const found = hasFound(ELEMENT_ID);

    const claiming =
        claimingBootId === ELEMENT_ID;

    if (!isContestEnabled) return null;

    if (authLoading || progressLoading) {
        return (
            <div className="flex justify-center py-8">
                <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        );
    }

    if (progressError) {
        return (
            <div className="flex flex-col items-center py-5 text-center">

                <AlertCircle className="h-7 w-7 text-red-400" />

                <p className="mt-2 text-xs font-medium text-slate-500 sm:text-sm">
                    {progressError}
                    {" "}Спробуйте перезавантажити сторінку.
                </p>

            </div>
        );
    }

    if (isDisqualified) {
        return (
            <div className="flex flex-col items-center py-5 text-center">

                <AlertCircle className="h-7 w-7 text-red-500" />

                <p className="mt-2 text-sm font-bold text-red-600">
                    Участь у конкурсі недоступна
                </p>

            </div>
        );
    }

    if (found) {
        return (
            <div className="flex flex-col items-center py-4 text-center sm:py-5">

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 sm:h-20 sm:w-20">
                    <CheckCircle2 className="h-9 w-9 text-emerald-500 sm:h-12 sm:w-12" />
                </div>

                <p className="mt-3 text-sm font-bold text-emerald-600 sm:text-base">
                    Чобіток зараховано!
                </p>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Продовжуйте шукати інші чобітки.
                </p>

            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-4 text-center sm:py-5">

            <button
                type="button"
                onClick={() => claimItem(ELEMENT_ID)}
                disabled={Boolean(claimingBootId)}
                aria-label="Забрати святковий чобіток"
                className="group relative flex h-24 w-24 items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95 disabled:cursor-wait disabled:opacity-50 sm:h-36 sm:w-36"
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

            <p className="mt-3 text-xs font-bold text-blue-600 sm:text-base">
                {claiming
                    ? "Зараховуємо знахідку..."
                    : "Натисніть, щоб забрати чобіток"}
            </p>

        </div>
    );
};

export default ContestFirstBoot;