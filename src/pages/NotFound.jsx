
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
        <main className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#f5f8ff] px-4 py-12 sm:px-6">
            <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center text-center">

                <div className="grid w-full grid-cols-[1fr_1.05fr_1fr] items-center gap-2 sm:gap-5 lg:gap-10">

                    <div className="flex min-w-0 items-center justify-center">
                        <span
                            aria-hidden="true"
                            className="select-none font-black leading-none tracking-[-0.09em] text-blue-600"
                            style={{
                                fontFamily: "Arial, sans-serif",
                                fontSize: "clamp(115px, 27vw, 360px)",
                            }}
                        >
                            4
                        </span>
                    </div>

                    <div className="flex min-w-0 items-center justify-center">
                        <div className="w-[85%] max-w-[280px] rotate-[-7deg] rounded-[14px] border border-slate-200 bg-white p-3 text-left shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)] sm:rounded-[22px] sm:p-4 lg:p-5">
                            <div className="flex items-center justify-between">
                                <span className="h-3 w-12 rounded-full bg-blue-100 sm:h-5 sm:w-20" />
                                <span className="h-2 w-8 rounded-full bg-slate-100 sm:w-14" />
                            </div>

                            <div className="my-3 flex aspect-[1.5/1] items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/70 text-blue-600 sm:my-6">
                                <SearchX
                                    className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16"
                                    strokeWidth={1.5}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="h-2 w-4/5 rounded-full bg-slate-200 sm:h-3" />
                                <div className="h-2 w-full rounded-full bg-slate-100 sm:h-2.5" />
                                <div className="h-2 w-3/5 rounded-full bg-slate-100 sm:h-2.5" />
                            </div>

                            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-slate-400 sm:mt-6">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                <div className="h-2 w-12 rounded-full bg-slate-100 sm:w-20" />
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 items-center justify-center">
                        <span
                            aria-hidden="true"
                            className="select-none font-black leading-none tracking-[-0.09em] text-blue-600"
                            style={{
                                fontFamily: "Arial, sans-serif",
                                fontSize: "clamp(115px, 27vw, 360px)",
                            }}
                        >
                            4
                        </span>
                    </div>
                </div>

                <h1 className="mt-14 max-w-[650px] text-3xl font-black leading-tight tracking-tight text-slate-900 sm:mt-16 sm:text-4xl lg:text-5xl">
                  Йой,  це оголошення десь
                    <br />
                    <span className="text-blue-600">загубилося...</span>
                </h1>

                <p className="mt-5 max-w-[440px] text-sm leading-7 text-slate-500 sm:text-base">
                    Схоже, такої сторінки більше немає. Але на RBoard
                    точно знайдеться щось інше цікаве!
                </p>

                <Link
                    to="/"
                    className="group mt-9 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 active:scale-[0.98]"
                >
                    <Home size={19} />
                    На головну
                    <ArrowUpRight
                        size={19}
                        className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                </Link>
            </div>
        </main>
    );
}
