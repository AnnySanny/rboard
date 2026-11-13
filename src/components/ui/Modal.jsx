import { useEffect } from "react";

export default function Modal({
    isOpen,
    onClose,
    children,
    panelClassName = "max-w-md",
}) {
    useEffect(() => {
        if (!isOpen) return undefined;

        document.body.style.overflow = "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm"
            onMouseDown={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                onMouseDown={(event) => event.stopPropagation()}
                className={`relative max-h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8 ${panelClassName}`}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрити"
                    className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-2xl leading-none text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                >
                    ×
                </button>

                {children}
            </div>
        </div>
    );
}