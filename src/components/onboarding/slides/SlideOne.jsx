import {
    BriefcaseBusiness,
    CalendarDays,
    House,
    RefreshCw,
    ShoppingCart,
    Wrench,
} from "lucide-react";

const SlideOne = () => {
    const categories = [
        {
            label: "Продаж",
            icon: ShoppingCart,
            className:
                "border-emerald-100 bg-emerald-50/95 text-emerald-600",
        },
        {
            label: "Оренда",
            icon: House,
            className:
                "border-blue-100 bg-blue-50/95 text-blue-600",
        },
        {
            label: "Робота",
            icon: BriefcaseBusiness,
            className:
                "border-amber-100 bg-amber-50/95 text-amber-600",
        },
        {
            label: "Послуги",
            icon: Wrench,
            className:
                "border-violet-100 bg-violet-50/95 text-violet-600",
        },
        {
            label: "Обмін",
            icon: RefreshCw,
            className:
                "border-rose-100 bg-rose-50/95 text-rose-500",
        },
        {
            label: "Події",
            icon: CalendarDays,
            className:
                "border-blue-100 bg-blue-50/95 text-blue-600",
        },
    ];

    return (
        <section className="relative h-full w-full overflow-hidden bg-white">
            <div className="relative h-full w-full md:hidden">
                <img
                    src="/images/mobile/slide-1.png"
                    alt="RBoard — оголошення Рахівщини"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />

                <div className="absolute inset-x-0 top-0 z-0 h-[46%] bg-gradient-to-b from-white via-white/95 to-white/0" />

                <div className="absolute inset-x-0 top-[82px] z-20 px-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.24em] text-blue-500">
                        Локальна дошка оголошень
                    </p>

                    <h2 className="mt-2 text-[25px] font-black leading-[0.95] tracking-[-0.04em] text-slate-950 min-[390px]:text-[27px]">
                        Все потрібне поруч
                    </h2>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                        {categories.map(
                            ({
                                label,
                                icon: Icon,
                                className,
                            }) => (
                                <div
                                    key={label}
                                    className={`flex h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 shadow-sm backdrop-blur-md ${className}`}
                                >
                                    <Icon
                                        size={16}
                                        strokeWidth={2.3}
                                        className="shrink-0"
                                    />

                                    <span className="text-[10px] font-black text-slate-900">
                                        {label}
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            <div className="relative hidden h-full w-full md:block">
                <div className="
        pointer-events-none
        absolute
        -left-[12%]
        bottom-[-38%]
        z-0
        h-[65%]
        w-[45%]
        rounded-[50%]
        bg-blue-50/80
    " />

                <div className="relative z-10 flex h-full">
                    <div className="
            relative z-20
            flex h-full
            w-[50%]
            flex-col
            justify-center

            px-[4%]
            py-5

            lg:w-[48%]
            lg:px-[4.5%]
            lg:py-7

            xl:px-[5%]
            xl:py-10
        ">
                        <div className="
                mt-8
                lg:mt-10
                xl:mt-12
            ">
                            <p className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.24em]
                    text-blue-400

                    lg:text-[12px]
                    lg:tracking-[0.26em]

                    xl:text-[14px]
                    xl:tracking-[0.28em]

                    2xl:text-[15px]
                ">
                                Локальна дошка оголошень
                            </p>

                            <h2 className="
                    mt-3
                    max-w-[560px]
                    text-[34px]
                    font-black
                    leading-[0.98]
                    tracking-[-0.045em]
                    text-slate-950

                    lg:mt-4
                    lg:text-[44px]

                    xl:mt-5
                    xl:text-[56px]

                    2xl:text-[68px]
                ">
                                Все потрібне
                                <br />
                                поруч
                            </h2>

                            <p className="
                    mt-4
                    max-w-[590px]
                    text-[13px]
                    font-medium
                    leading-[1.5]
                    text-slate-500

                    lg:mt-5
                    lg:text-[15px]
                    lg:leading-[1.55]

                    xl:mt-6
                    xl:text-[17px]

                    2xl:mt-7
                    2xl:text-[20px]
                ">
                                Оголошення Рахівщини в одному місці.
                                <br className="hidden xl:block" />
                                Купуйте, продавайте, знаходьте послуги,
                                <br className="hidden xl:block" />
                                роботу, оренду та події поруч із вами.
                            </p>

                            <div className="
                    mt-5
                    grid
                    max-w-[600px]
                    grid-cols-2
                    gap-2

                    lg:mt-6
                    lg:grid-cols-3
                    lg:gap-2.5

                    xl:mt-7
                    xl:gap-3

                    2xl:mt-8
                ">
                                {categories.map(
                                    ({
                                        label,
                                        icon: Icon,
                                        className,
                                    }) => (
                                        <div
                                            key={label}
                                            className={`
                                    flex
                                    min-h-[48px]
                                    items-center
                                    gap-2
                                    rounded-xl
                                    border
                                    px-3
                                    shadow-sm

                                    lg:min-h-[54px]
                                    lg:gap-2.5
                                    lg:rounded-xl
                                    lg:px-3

                                    xl:min-h-[60px]
                                    xl:gap-3
                                    xl:rounded-2xl
                                    xl:px-4

                                    2xl:min-h-[64px]

                                    ${className}
                                `}
                                        >
                                            <Icon
                                                size={22}
                                                strokeWidth={2.2}
                                                className="
                                        shrink-0
                                        lg:h-[23px]
                                        lg:w-[23px]
                                        xl:h-[25px]
                                        xl:w-[25px]
                                    "
                                            />

                                            <span className="
                                    text-[12px]
                                    font-black
                                    text-slate-900

                                    lg:text-[13px]
                                    xl:text-[14px]
                                    2xl:text-[16px]
                                ">
                                                {label}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="
            relative
            h-full
            w-[52%]

            lg:w-[54%]
        ">
                        <div className="
                absolute
                inset-y-0
                right-0
                w-full
                overflow-hidden
                rounded-[38%_0_0_38%/50%_0_0_50%]

                lg:rounded-[40%_0_0_40%/50%_0_0_50%]
                xl:rounded-[42%_0_0_42%/50%_0_0_50%]
            ">
                            <img
                                src="/images/slide-1.png"
                                alt="RBoard — оголошення Рахівщини"
                                className="
                        h-full
                        w-full
                        object-cover
                        object-[94%_center]

                        lg:object-[95%_center]
                        xl:object-[96%_center]
                    "
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SlideOne;