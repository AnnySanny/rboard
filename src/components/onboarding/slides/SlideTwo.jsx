import {
    FileText,
    Search,
    SlidersHorizontal,
    Tags,
} from "lucide-react";

const SlideTwo = () => {
    const features = [
        {
            title: "Пошук",
            description: "Швидко знаходьте потрібні оголошення",
            icon: Search,
            iconClass: "bg-blue-50 text-blue-600",
        },
        {
            title: "Фільтри",
            description:
                "Звужуйте результати за категорією та іншими параметрами",
            icon: SlidersHorizontal,
            iconClass: "bg-emerald-50 text-emerald-600",
        },
        {
            title: "Категорії",
            description: "Обирайте потрібний тип оголошень",
            icon: Tags,
            iconClass: "bg-violet-50 text-violet-600",
        },
        {
            title: "Детальна інформація",
            description:
                "Переглядайте фото, опис, місцезнаходження та контакти",
            icon: FileText,
            iconClass: "bg-amber-50 text-amber-600",
        },
    ];

    return (
        <section className="relative h-full w-full overflow-hidden bg-white">

            <div className="relative h-full w-full md:hidden">
                <img
                    src="/images/mobile/slide-2.png"
                    alt="Пошук та фільтрація оголошень RBoard"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />

                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[31%] bg-gradient-to-b from-white via-white/95 to-transparent" />

                <div className="absolute inset-x-0 top-[82px] z-20 px-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.24em] text-blue-500">
                        Зручний пошук
                    </p>

                    <h2 className="mt-2 max-w-[290px] text-[24px] font-black leading-[0.98] tracking-[-0.04em] text-slate-950 min-[390px]:text-[27px]">
                        Знайди потрібне
                        <br />
                        за кілька секунд
                    </h2>
                </div>
            </div>

            <div className="relative z-10 hidden h-full md:flex">
                <div className="pointer-events-none absolute -left-[15%] bottom-[-38%] h-[68%] w-[50%] rounded-[50%] bg-blue-50/80" />

                <div className="relative z-20 flex h-full w-[45%] flex-col px-[5%]">
                    <div className="flex h-full flex-col justify-center pt-[70px]">
                        <p className="text-[12px] font-black uppercase tracking-[0.28em] text-blue-400 sm:text-sm lg:text-[15px]">
                            Зручний пошук
                        </p>

                        <h2 className="mt-4 max-w-[610px] text-[40px] font-black leading-[0.98] tracking-[-0.045em] text-slate-950 lg:text-[50px] xl:text-[60px]">
                            Знайди потрібне
                            <br />
                            за кілька секунд
                        </h2>

                        <p className="mt-5 max-w-[570px] text-[15px] font-medium leading-[1.55] text-slate-500 lg:text-[17px] xl:text-[18px]">
                            Шукайте оголошення, обирайте категорії,
                            використовуйте фільтри та переглядайте детальну
                            інформацію — навіть без реєстрації.
                        </p>

                        <div className="mt-6 flex max-w-[610px] flex-col gap-3">
                            {features.map(
                                ({
                                    title,
                                    description,
                                    icon: Icon,
                                    iconClass,
                                }) => (
                                    <div
                                        key={title}
                                        className="flex items-center gap-4"
                                    >
                                        <div
                                            className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                                        >
                                            <Icon
                                                size={28}
                                                strokeWidth={2.4}
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-[16px] font-black leading-tight text-slate-950 lg:text-[17px]">
                                                {title}
                                            </h3>

                                            <p className="mt-1 text-[13px] font-medium leading-[1.35] text-slate-500 lg:text-[14px]">
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative h-full w-[55%]">
                    <div className="absolute inset-y-0 -left-[10%] right-0 overflow-hidden rounded-[32%_0_0_32%/50%_0_0_50%]">
                        <img
                            src="/images/slide-2.png"
                            alt="Пошук та фільтрація оголошень RBoard"
                            className="h-full w-full object-cover object-[95%_center]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SlideTwo;