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
                <div className="pointer-events-none absolute -left-[12%] bottom-[-38%] z-0 h-[65%] w-[45%] rounded-[50%] bg-blue-50/80" />

                <div className="relative z-10 flex h-full">
                    <div className="relative z-20 flex h-full w-[48%] flex-col justify-center px-[5%] py-10">
                        <div className="mt-10">
                            <p className="text-[12px] font-black uppercase tracking-[0.28em] text-blue-400 lg:text-[15px]">
                                Локальна дошка оголошень
                            </p>

                            <h2 className="mt-5 max-w-[560px] text-[42px] font-black leading-[0.98] tracking-[-0.045em] text-slate-950 lg:text-[54px] xl:text-[68px]">
                                Все потрібне
                                <br />
                                поруч
                            </h2>

                            <p className="mt-7 max-w-[590px] text-[16px] font-medium leading-[1.55] text-slate-500 lg:text-[18px] xl:text-[21px]">
                                Оголошення Рахівщини в одному місці.
                                <br className="hidden xl:block" />
                                Купуйте, продавайте, знаходьте послуги,
                                <br className="hidden xl:block" />
                                роботу, оренду та події поруч із вами.
                            </p>

                            <div className="mt-8 grid max-w-[600px] grid-cols-3 gap-3">
                                {categories.map(
                                    ({
                                        label,
                                        icon: Icon,
                                        className,
                                    }) => (
                                        <div
                                            key={label}
                                            className={`flex min-h-[64px] items-center gap-3 rounded-2xl border px-4 shadow-sm ${className}`}
                                        >
                                            <Icon
                                                size={25}
                                                strokeWidth={2.2}
                                                className="shrink-0"
                                            />

                                            <span className="text-[14px] font-black text-slate-900 lg:text-[16px]">
                                                {label}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative h-full w-[54%]">
                        <div className="absolute inset-y-0 right-0 w-full overflow-hidden rounded-[42%_0_0_42%/50%_0_0_50%]">
                            <img
                                src="/images/slide-1.png"
                                alt="RBoard — оголошення Рахівщини"
                                className="h-full w-full object-cover object-[96%_center]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SlideOne;