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
<div className="relative hidden h-full md:block">
    <div className="
        pointer-events-none
        absolute
        -left-[15%]
        bottom-[-38%]
        h-[68%]
        w-[50%]
        rounded-[50%]
        bg-blue-50/80
    " />

    <div className="relative z-10 flex h-full">
        <div className="
            relative z-20
            flex h-full
            w-[48%]
            flex-col
            px-[4%]

            lg:w-[46%]
            lg:px-[4.5%]

            xl:w-[45%]
            xl:px-[5%]
        ">
            <div className="
                flex h-full
                flex-col
                justify-center
                pt-[40px]

                lg:pt-[48px]
                xl:pt-[55px]

                md:[@media(max-height:720px)]:pt-0
            ">
                <p className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.24em]
                    text-blue-400

                    lg:text-[11px]
                    lg:tracking-[0.26em]

                    xl:text-[12px]
                    xl:tracking-[0.28em]

                    2xl:text-[13px]

                    md:[@media(max-height:720px)]:text-[8px]
                ">
                    Приєднуйтесь до RBoard
                </p>

                <h2 className="
                    mt-3
                    max-w-[560px]
                    text-[28px]
                    font-black
                    leading-[1.02]
                    tracking-[-0.04em]
                    text-slate-950

                    lg:mt-4
                    lg:text-[35px]

                    xl:text-[41px]

                    2xl:text-[46px]

                    md:[@media(max-height:720px)]:mt-2
                    md:[@media(max-height:720px)]:text-[25px]

                    lg:[@media(max-height:720px)]:text-[30px]
                    xl:[@media(max-height:720px)]:text-[34px]
                ">
                    Готові
                    <br />
                    приєднатися?
                </h2>

                <p className="
                    mt-4
                    max-w-[500px]
                    text-[12px]
                    font-medium
                    leading-[1.5]
                    text-slate-500

                    lg:mt-5
                    lg:text-[14px]

                    xl:text-[15px]

                    2xl:text-[16px]

                    md:[@media(max-height:720px)]:mt-3
                    md:[@media(max-height:720px)]:text-[11px]

                    lg:[@media(max-height:720px)]:text-[12px]
                    xl:[@media(max-height:720px)]:text-[13px]
                ">
                    Створіть обліковий запис RBoard
                    та користуйтеся всіма можливостями
                    сервісу.
                </p>

                <div className="
                    mt-5
                    flex
                    max-w-[500px]
                    items-center
                    gap-2.5
                    rounded-xl
                    bg-emerald-50
                    px-3.5
                    py-3

                    lg:mt-5
                    lg:gap-3
                    lg:rounded-2xl
                    lg:px-4
                    lg:py-3.5

                    xl:mt-6

                    md:[@media(max-height:720px)]:mt-4
                    md:[@media(max-height:720px)]:px-3
                    md:[@media(max-height:720px)]:py-2.5
                ">
                    <CheckCircle2
                        strokeWidth={2.5}
                        className="
                            h-[19px]
                            w-[19px]
                            shrink-0
                            text-emerald-500

                            lg:h-[21px]
                            lg:w-[21px]

                            xl:h-[24px]
                            xl:w-[24px]

                            md:[@media(max-height:720px)]:h-[18px]
                            md:[@media(max-height:720px)]:w-[18px]
                        "
                    />

                    <p className="
                        text-[11px]
                        font-bold
                        leading-[1.35]
                        text-slate-700

                        lg:text-[12px]
                        xl:text-[13px]
                        2xl:text-[14px]

                        md:[@media(max-height:720px)]:text-[10px]
                        lg:[@media(max-height:720px)]:text-[11px]
                        xl:[@media(max-height:720px)]:text-[12px]
                    ">
                        Реєстрація безкоштовна та займає
                        лише кілька хвилин
                    </p>
                </div>

                <div className="
                    mt-5
                    max-w-[500px]

                    lg:mt-6
                    xl:mt-7

                    md:[@media(max-height:720px)]:mt-4
                ">
                    <button
                        type="button"
                        onClick={onRegister}
                        className="
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-blue-600
                            px-5
                            py-3
                            text-[12px]
                            font-black
                            text-white
                            shadow-lg
                            shadow-blue-600/20
                            transition
                            hover:bg-blue-700
                            active:scale-[0.98]

                            lg:gap-2.5
                            lg:rounded-2xl
                            lg:px-6
                            lg:py-3.5
                            lg:text-[14px]

                            xl:gap-3
                            xl:py-4
                            xl:text-[15px]

                            md:[@media(max-height:720px)]:py-2.5
                            md:[@media(max-height:720px)]:text-[11px]

                            lg:[@media(max-height:720px)]:py-3
                            lg:[@media(max-height:720px)]:text-[12px]
                        "
                    >
                        <UserPlus
                            strokeWidth={2.4}
                            className="
                                h-[18px]
                                w-[18px]

                                lg:h-[20px]
                                lg:w-[20px]

                                xl:h-[21px]
                                xl:w-[21px]

                                md:[@media(max-height:720px)]:h-[17px]
                                md:[@media(max-height:720px)]:w-[17px]
                            "
                        />

                        Зареєструватися

                        <ArrowRight
                            strokeWidth={2.4}
                            className="
                                h-[17px]
                                w-[17px]

                                lg:h-[19px]
                                lg:w-[19px]

                                xl:h-[20px]
                                xl:w-[20px]

                                md:[@media(max-height:720px)]:h-[16px]
                                md:[@media(max-height:720px)]:w-[16px]
                            "
                        />
                    </button>
                </div>
            </div>
        </div>

        <div className="
            relative
            h-full
            w-[52%]

            lg:w-[54%]
            xl:w-[55%]
        ">
            <div className="
                absolute
                inset-y-0
                -left-[10%]
                right-0
                overflow-hidden
                rounded-[28%_0_0_28%/50%_0_0_50%]

                lg:-left-[14%]
                lg:rounded-[30%_0_0_30%/50%_0_0_50%]

                xl:-left-[18%]
                xl:rounded-[32%_0_0_32%/50%_0_0_50%]
            ">
                <img
                    src="/images/slide-5.png"
                    alt="Приєднуйтесь до RBoard"
                    className="
                        h-full
                        w-full
                        object-cover
                        object-[97%_center]

                        lg:object-[98%_center]
                        xl:object-[100%_center]
                    "
                />
            </div>
        </div>
    </div>
</div>
        </section>
    );
};

export default SlideFive;