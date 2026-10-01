import {
    ArrowRight,
    CheckCircle2,
    UserPlus,
} from "lucide-react";

const SlideFive = ({
    onRegister,
}) => {
    return (
        <section className="relative h-full w-full overflow-hidden bg-white">

            {/* MOBILE */}
            <div className="relative h-full w-full md:hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src="/images/mobile/slide-5.png"
                        alt="Приєднуйтесь до RBoard"
                        className="
                            absolute
                            left-1/2
                            top-[4%]
                            h-[100%]
                            w-full
                            -translate-x-1/2
                            object-cover
                            object-top
                        "
                    />
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[36%] bg-gradient-to-b from-white via-white/95 to-transparent" />

                <div className="absolute inset-x-0 top-[88px] z-20 px-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-blue-500">
                        Приєднуйтесь до RBoard
                    </p>

                    <h2 className="mt-2 max-w-[300px] text-[25px] font-black leading-[1.02] tracking-[-0.04em] text-slate-950 min-[390px]:text-[28px]">
                        Готові
                        <br />
                        приєднатися?
                    </h2>

                    <div className="mt-3 flex items-center gap-2">
                        <CheckCircle2
                            size={17}
                            strokeWidth={2.6}
                            className="shrink-0 text-emerald-500"
                        />

                        <p className="text-[10px] font-bold text-slate-600">
                            Безкоштовна реєстрація за кілька хвилин
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onRegister}
                        className="
                            mt-4
                            flex
                            w-full
                            max-w-[300px]
                            items-center
                            justify-center
                            gap-2
                            rounded-2xl
                            bg-blue-600
                            px-5
                            py-3.5
                            text-[13px]
                            font-black
                            text-white
                            shadow-lg
                            shadow-blue-600/20
                            transition
                            active:scale-[0.98]
                        "
                    >
                        <UserPlus
                            size={18}
                            strokeWidth={2.5}
                        />

                        Зареєструватися

                        <ArrowRight
                            size={17}
                            strokeWidth={2.5}
                        />
                    </button>
                </div>
            </div>


            {/* DESKTOP */}
            <div className="hidden h-full md:block">
                <div className="pointer-events-none absolute -left-[15%] bottom-[-38%] h-[68%] w-[50%] rounded-[50%] bg-blue-50/80" />

                <div className="relative z-10 flex h-full">
                    <div className="relative z-20 flex h-full w-[45%] flex-col px-[5%]">
                        <div className="flex h-full flex-col justify-center pt-[55px]">
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-400 lg:text-[13px]">
                                Приєднуйтесь до RBoard
                            </p>

                            <h2 className="mt-4 max-w-[560px] text-[32px] font-black leading-[1.02] tracking-[-0.04em] text-slate-950 lg:text-[40px] xl:text-[46px]">
                                Готові
                                <br />
                                приєднатися?
                            </h2>

                            <p className="mt-5 max-w-[500px] text-[14px] font-medium leading-[1.55] text-slate-500 lg:text-[16px]">
                                Створіть обліковий запис RBoard
                                та користуйтеся всіма можливостями
                                сервісу.
                            </p>

                            <div className="mt-6 flex max-w-[500px] items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5">
                                <CheckCircle2
                                    size={24}
                                    strokeWidth={2.5}
                                    className="shrink-0 text-emerald-500"
                                />

                                <p className="text-[13px] font-bold leading-[1.4] text-slate-700 lg:text-[14px]">
                                    Реєстрація безкоштовна та займає
                                    лише кілька хвилин
                                </p>
                            </div>

                            <div className="mt-7 max-w-[500px]">
                                <button
                                    type="button"
                                    onClick={onRegister}
                                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-[15px] font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
                                >
                                    <UserPlus
                                        size={21}
                                        strokeWidth={2.4}
                                    />

                                    Зареєструватися

                                    <ArrowRight
                                        size={20}
                                        strokeWidth={2.4}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-full w-[55%]">
                        <div className="absolute inset-y-0 -left-[18%] right-0 overflow-hidden rounded-[32%_0_0_32%/50%_0_0_50%]">
                            <img
                                src="/images/slide-5.png"
                                alt="Приєднуйтесь до RBoard"
                                className="h-full w-full object-cover object-[100%_center]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SlideFive;