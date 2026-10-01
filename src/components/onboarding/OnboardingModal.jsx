import {
    useEffect,
    useState,
    useRef,
} from "react";

import {
    X,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";

import SlideOne from "./slides/SlideOne";
import SlideTwo from "./slides/SlideTwo";
import SlideThree from "./slides/SlideThree";
import SlideFour from "./slides/SlideFour";
import SlideFive from "./slides/SlideFive";

const slides = [
    SlideOne,
    SlideTwo,
    SlideThree,
    SlideFour,
    SlideFive,
];

const OnboardingModal = ({
    isOpen,
    onClose,
    onRegister,
}) => {
    const touchStartX = useRef(null);
    const [currentSlide, setCurrentSlide] =
        useState(0);

    const isFirst = currentSlide === 0;

    const isLast =
        currentSlide ===
        slides.length - 1;

    const CurrentSlide =
        slides[currentSlide];

    // При кожному відкритті починаємо
    // з першого слайда
    useEffect(() => {
        if (isOpen) {
            setCurrentSlide(0);
        }
    }, [isOpen]);

    // ESC + стрілки клавіатури +
    // блокування скролу сторінки
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }

            if (
                event.key === "ArrowRight" &&
                currentSlide <
                slides.length - 1
            ) {
                setCurrentSlide(
                    (current) =>
                        current + 1
                );
            }

            if (
                event.key === "ArrowLeft" &&
                currentSlide > 0
            ) {
                setCurrentSlide(
                    (current) =>
                        current - 1
                );
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [
        isOpen,
        onClose,
        currentSlide,
    ]);

    if (!isOpen) {
        return null;
    }

    const handleNext = () => {
        if (isLast) {
            onClose();
            return;
        }

        setCurrentSlide(
            (current) => current + 1
        );
    };

    const handlePrevious = () => {
        if (isFirst) {
            return;
        }

        setCurrentSlide(
            (current) => current - 1
        );
    };
    const handleTouchStart = (event) => {
        touchStartX.current =
            event.touches[0].clientX;
    };

    const handleTouchEnd = (event) => {
        if (touchStartX.current === null) {
            return;
        }

        const touchEndX =
            event.changedTouches[0].clientX;

        const distance =
            touchStartX.current - touchEndX;

        touchStartX.current = null;

        if (Math.abs(distance) < 50) {
            return;
        }

        if (
            distance > 0 &&
            currentSlide < slides.length - 1
        ) {
            setCurrentSlide(
                (current) => current + 1
            );
        }

        if (
            distance < 0 &&
            currentSlide > 0
        ) {
            setCurrentSlide(
                (current) => current - 1
            );
        }
    };
    return (
        <div
            className="
        fixed inset-0 z-[1000]
        flex items-center justify-center
        bg-slate-950/60
        p-0
        backdrop-blur-sm
        md:p-5
    "
            role="dialog"
            aria-modal="true"
            aria-label="Знайомство з RBoard"
        >
            <div
                className="
    relative flex
    h-[100dvh]
    w-full
    flex-col
    overflow-hidden
    bg-white

    md:h-[min(92dvh,900px)]
    md:max-w-[1500px]
    md:rounded-[32px]
    md:border
    md:border-white/30
    md:shadow-2xl
"
            >
                {/* ЗАКРИТИ */}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрити"
                    className="
                        absolute right-3 top-3
                        z-50
                        flex h-10 w-10
                        items-center justify-center
                        rounded-full
                        border border-slate-200
                        bg-white/95
                        text-slate-600
                        shadow-md
                        backdrop-blur
                        transition
                        hover:bg-slate-50
                        hover:text-slate-950
                        sm:right-5 sm:top-5
                        sm:h-12 sm:w-12
                    "
                >
                    <X
                        size={22}
                        strokeWidth={2}
                    />
                </button>

                <div
                    className="relative min-h-0 flex-1 overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <img
                        src="/logo.png"
                        alt="RBoard"
                        className="
        absolute left-5 top-4 z-50
        h-[52px] w-auto object-contain

        md:left-[5%]
        md:top-[4%]
        md:h-[72px]
        xl:h-[80px]
    "
                    />

                    <CurrentSlide
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onClose={onClose}
                        onRegister={onRegister}
                    />
                </div>

                {/* НИЖНЯ НАВІГАЦІЯ */}
                <div
                    className="
    relative z-40
    flex h-[64px] shrink-0
    items-center
    justify-between
    gap-2
    border-t
    border-slate-200
    bg-white
    px-4

    md:h-auto
    md:px-7
    md:py-4
"
                >
                    {/* ПРОПУСТИТИ */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="
    rounded-xl
    px-1 py-2
    text-[12px]
    font-bold
    text-slate-500
    transition
    hover:bg-slate-100
    hover:text-slate-900

    md:px-5
    md:text-sm
"
                    >
                        Пропустити
                    </button>

                    {/* ІНДИКАТОР СЛАЙДІВ */}
                    <div
                        className="
                            absolute left-1/2
                            flex -translate-x-1/2
                            items-center gap-2
                        "
                    >
                        {slides.map(
                            (_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() =>
                                        setCurrentSlide(
                                            index
                                        )
                                    }
                                    aria-label={`Перейти до слайда ${index +
                                        1
                                        }`}
                                    className={`
                                        rounded-full
                                        transition-all
                                        ${index ===
                                            currentSlide
                                            ? "h-2.5 w-7 bg-blue-600"
                                            : "h-2.5 w-2.5 bg-slate-200 hover:bg-slate-300"
                                        }
                                    `}
                                />
                            )
                        )}
                    </div>

                    {/* МОБІЛЬНА ПІДКАЗКА */}
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 md:hidden">
                        <ArrowLeft
                            size={14}
                            strokeWidth={2}
                        />

                        <span>Проведіть</span>

                        <ArrowRight
                            size={14}
                            strokeWidth={2}
                        />
                    </div>

                    {/* DESKTOP НАВІГАЦІЯ */}
                    <div className="hidden items-center gap-2 md:flex">
                        {!isFirst && (
                            <button
                                type="button"
                                onClick={handlePrevious}
                                className="
                flex items-center
                gap-2
                rounded-xl
                border border-slate-200
                bg-white
                px-4 py-2.5
                text-sm
                font-bold
                text-slate-600
                transition
                hover:bg-slate-50
            "
                            >
                                <ArrowLeft size={17} />
                                Назад
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleNext}
                            className="
            flex items-center
            gap-2
            rounded-xl
            bg-blue-600
            px-6 py-2.5
            text-sm
            font-black
            text-white
            shadow-sm
            transition
            hover:bg-blue-700
        "
                        >
                            {isLast ? "Готово" : "Далі"}

                            <ArrowRight size={17} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;