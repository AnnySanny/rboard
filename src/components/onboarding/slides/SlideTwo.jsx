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
                    src="/images/mobile/slide-2.webp"
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

            lg:pt-[55px]
            xl:pt-[70px]

            md:[@media(max-height:720px)]:pt-0
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
                Зручний пошук
            </p>

            <h2 className="
                mt-3
                max-w-[610px]
                text-[32px]
                font-black
                leading-[0.98]
                tracking-[-0.045em]
                text-slate-950

                lg:mt-4
                lg:text-[42px]

                xl:text-[52px]

                2xl:text-[60px]

                md:[@media(max-height:720px)]:text-[30px]
                lg:[@media(max-height:720px)]:text-[38px]
                xl:[@media(max-height:720px)]:text-[44px]
            ">
                Знайди потрібне
                <br />
                за кілька секунд
            </h2>

            <p className="
                mt-4
                max-w-[570px]
                text-[13px]
                font-medium
                leading-[1.5]
                text-slate-500

                lg:mt-5
                lg:text-[15px]
                lg:leading-[1.55]

                xl:text-[17px]

                2xl:text-[18px]

                md:[@media(max-height:720px)]:mt-3
                md:[@media(max-height:720px)]:text-[12px]
                lg:[@media(max-height:720px)]:text-[13px]
                xl:[@media(max-height:720px)]:text-[14px]
            ">
                Шукайте оголошення, обирайте категорії,
                використовуйте фільтри та переглядайте детальну
                інформацію — навіть без реєстрації.
            </p>

            <div className="
                mt-5
                flex
                max-w-[610px]
                flex-col
                gap-2.5

                lg:mt-6
                lg:gap-3

                2xl:gap-3.5

                md:[@media(max-height:720px)]:mt-4
                md:[@media(max-height:720px)]:gap-2
            ">
                {features.map(
                    ({
                        title,
                        description,
                        icon: Icon,
                        iconClass,
                    }) => (
                        <div
                            key={title}
                            className="
                                flex
                                items-center
                                gap-3

                                lg:gap-3.5
                                xl:gap-4

                                md:[@media(max-height:720px)]:gap-2.5
                            "
                        >
                            <div
                                className={`
                                    flex
                                    h-[44px]
                                    w-[44px]
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl

                                    lg:h-[48px]
                                    lg:w-[48px]

                                    xl:h-[52px]
                                    xl:w-[52px]
                                    xl:rounded-2xl

                                    2xl:h-[56px]
                                    2xl:w-[56px]

                                    md:[@media(max-height:720px)]:h-[40px]
                                    md:[@media(max-height:720px)]:w-[40px]

                                    ${iconClass}
                                `}
                            >
                                <Icon
                                    strokeWidth={2.4}
                                    className="
                                        h-[21px]
                                        w-[21px]

                                        lg:h-[23px]
                                        lg:w-[23px]

                                        xl:h-[25px]
                                        xl:w-[25px]

                                        2xl:h-[28px]
                                        2xl:w-[28px]

                                        md:[@media(max-height:720px)]:h-[19px]
                                        md:[@media(max-height:720px)]:w-[19px]
                                    "
                                />
                            </div>

                            <div className="min-w-0">
                                <h3 className="
                                    text-[13px]
                                    font-black
                                    leading-tight
                                    text-slate-950

                                    lg:text-[14px]
                                    xl:text-[16px]
                                    2xl:text-[17px]

                                    md:[@media(max-height:720px)]:text-[12px]
                                    lg:[@media(max-height:720px)]:text-[13px]
                                    xl:[@media(max-height:720px)]:text-[14px]
                                ">
                                    {title}
                                </h3>

                                <p className="
                                    mt-0.5
                                    text-[11px]
                                    font-medium
                                    leading-[1.3]
                                    text-slate-500

                                    lg:text-[12px]
                                    xl:mt-1
                                    xl:text-[13px]
                                    2xl:text-[14px]

                                    md:[@media(max-height:720px)]:text-[10px]
                                    lg:[@media(max-height:720px)]:text-[11px]
                                    xl:[@media(max-height:720px)]:text-[12px]
                                ">
                                    {description}
                                </p>
                            </div>
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
        xl:w-[55%]
    ">
        <div className="
            absolute
            inset-y-0
            -left-[6%]
            right-0
            overflow-hidden
            rounded-[28%_0_0_28%/50%_0_0_50%]

            lg:-left-[8%]
            lg:rounded-[30%_0_0_30%/50%_0_0_50%]

            xl:-left-[10%]
            xl:rounded-[32%_0_0_32%/50%_0_0_50%]
        ">
            <img
                src="/images/slide-2.webp"
                alt="Пошук та фільтрація оголошень RBoard"
                className="
                    h-full
                    w-full
                    object-cover
                    object-[93%_center]

                    lg:object-[94%_center]
                    xl:object-[95%_center]
                "
            />
        </div>
    </div>
</div>
        </section>
    );
};

export default SlideTwo;