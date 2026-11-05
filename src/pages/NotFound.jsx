
import { useEffect } from "react";
import { Link } from "react-router-dom";

import {
    ArrowUpRight,
    Home,
    MapPin,
    SearchX,
} from "lucide-react";

export default function NotFound() {
    useEffect(() => {
        document.title = "404 — Сторінку не знайдено | RBoard";
    }, []);

    return (
        <main
            className="
                flex min-h-screen min-h-[100dvh]
                flex-col items-center justify-center
                overflow-hidden bg-[#f5f8ff]
                px-3 py-8
                sm:px-6 sm:py-12
                lg:px-8 lg:py-14
            "
        >
            <div
                className="
                    mx-auto flex w-full max-w-[1100px]
                    flex-col items-center text-center
                "
            >
                {/* Композиція 4 + картка + 4 */}
                <div
                    className="
                        grid w-full max-w-[380px]
                        grid-cols-[0.85fr_1.2fr_0.85fr]
                        items-center gap-1

                        sm:max-w-[650px]
                        sm:grid-cols-[1fr_1.1fr_1fr]
                        sm:gap-3

                        md:max-w-[820px]
                        md:gap-5

                        lg:max-w-[1050px]
                        lg:gap-8

                        xl:max-w-[1100px]
                    "
                >
                    {/* Перша цифра 4 */}
                    <div className="flex min-w-0 items-center justify-center">
                        <span
                            aria-hidden="true"
                            className="
                                select-none font-black leading-none
                                tracking-[-0.09em] text-blue-600
                            "
                            style={{
                                fontFamily: "Arial, sans-serif",
                                fontSize:
                                    "clamp(80px, 23vw, 340px)",
                            }}
                        >
                            4
                        </span>
                    </div>

                    {/* Картка загубленого оголошення */}
                    <div className="flex min-w-0 items-center justify-center">
                        <div
                            className="
                                w-[95%] max-w-[280px]
                                rotate-[-7deg]
                                rounded-[10px]
                                border border-slate-200
                                bg-white p-2 text-left

                                sm:w-[90%]
                                sm:rounded-[16px] sm:p-3

                                md:rounded-[20px] md:p-4

                                lg:w-[85%] lg:p-5
                            "
                        >
                            {/* Верхні декоративні елементи */}
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className="
                                        h-2 w-8 rounded-full bg-blue-100
                                        sm:h-3 sm:w-14
                                        lg:h-5 lg:w-20
                                    "
                                />

                                <span
                                    className="
                                        h-1.5 w-5 rounded-full bg-slate-100
                                        sm:h-2 sm:w-10
                                        lg:w-14
                                    "
                                />
                            </div>

                            {/* Фото оголошення */}
                            <div
                                className="
                                    my-2 flex aspect-[1.5/1]
                                    items-center justify-center
                                    rounded-md border-2 border-dashed
                                    border-blue-200 bg-blue-50/70
                                    text-blue-600

                                    sm:my-3 sm:rounded-lg
                                    md:my-5 md:rounded-xl
                                    lg:my-6
                                "
                            >
                                <SearchX
                                    className="
                                        h-6 w-6
                                        sm:h-9 sm:w-9
                                        md:h-12 md:w-12
                                        lg:h-16 lg:w-16
                                    "
                                    strokeWidth={1.5}
                                />
                            </div>

                            {/* Текст оголошення */}
                            <div className="space-y-1 sm:space-y-2">
                                <div
                                    className="
                                        h-1.5 w-4/5 rounded-full bg-slate-200
                                        sm:h-2 md:h-3
                                    "
                                />

                                <div
                                    className="
                                        h-1.5 w-full rounded-full bg-slate-100
                                        sm:h-2 md:h-2.5
                                    "
                                />

                                <div
                                    className="
                                        h-1.5 w-3/5 rounded-full bg-slate-100
                                        sm:h-2 md:h-2.5
                                    "
                                />
                            </div>

                            {/* Локація */}
                            <div
                                className="
                                    mt-2 flex items-center gap-1
                                    border-t border-slate-100 pt-2
                                    text-slate-400

                                    sm:mt-4 sm:gap-2 sm:pt-3
                                    lg:mt-6
                                "
                            >
                                <MapPin
                                    className="
                                        h-3 w-3 shrink-0
                                        sm:h-4 sm:w-4
                                    "
                                />

                                <div
                                    className="
                                        h-1.5 w-8 rounded-full bg-slate-100
                                        sm:h-2 sm:w-14
                                        lg:w-20
                                    "
                                />
                            </div>
                        </div>
                    </div>

                    {/* Друга цифра 4 */}
                    <div className="flex min-w-0 items-center justify-center">
                        <span
                            aria-hidden="true"
                            className="
                                select-none font-black leading-none
                                tracking-[-0.09em] text-blue-600
                            "
                            style={{
                                fontFamily: "Arial, sans-serif",
                                fontSize:
                                    "clamp(80px, 23vw, 340px)",
                            }}
                        >
                            4
                        </span>
                    </div>
                </div>

                {/* Заголовок */}
                <h1
                    className="
                        mt-8 max-w-[650px]
                        text-[25px] font-black leading-[1.18]
                        tracking-tight text-slate-900

                        sm:mt-12 sm:text-3xl
                        md:mt-14 md:text-4xl
                        lg:mt-16 lg:text-5xl
                    "
                >
                    Йой, це оголошення десь
                    <br />
                    <span className="text-blue-600">
                        загубилося...
                    </span>
                </h1>

                {/* Опис */}
                <p
                    className="
                        mt-4 max-w-[360px]
                        text-[13px] leading-6 text-slate-500

                        sm:mt-5 sm:max-w-[440px]
                        sm:text-sm sm:leading-7

                        md:text-base
                    "
                >
                    Схоже, такої сторінки більше немає.
                    Але на RBoard точно знайдеться
                    щось інше цікаве!
                </p>

                {/* Кнопка на головну */}
                <Link
                    to="/"
                    className="
                        group mt-7 inline-flex min-h-12
                        items-center justify-center gap-2
                        rounded-xl bg-blue-600
                        px-6 py-3 text-sm font-bold text-white
                        shadow-lg shadow-blue-600/20
                        transition-all duration-300

                        hover:-translate-y-1
                        hover:bg-blue-700
                        hover:shadow-xl
                        hover:shadow-blue-600/25
                        active:scale-[0.98]

                        sm:mt-9 sm:min-h-14
                        sm:gap-3 sm:rounded-2xl
                        sm:px-8 sm:py-4
                    "
                >
                    <Home size={18} />

                    На головну

                    <ArrowUpRight
                        size={18}
                        className="
                            transition-transform duration-300
                            group-hover:translate-x-1
                            group-hover:-translate-y-1
                        "
                    />
                </Link>
            </div>
        </main>
    );
}
