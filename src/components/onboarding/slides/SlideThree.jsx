import {
    FileText,
    ImagePlus,
    PhoneCall,
    Send,
    Check,
} from "lucide-react";

const SlideThree = () => {
    const steps = [
        {
            title: "Заповніть основну інформацію",
            description: "Назва, категорія, опис, населений пункт",
            icon: FileText,
            iconClass: "bg-blue-50 text-blue-600",
        },
        {
            title: "Додайте фотографії",
            description: "Покажіть товар або послугу з різних ракурсів",
            icon: ImagePlus,
            iconClass: "bg-violet-50 text-violet-600",
        },
        {
            title: "Вкажіть контакти",
            description:
                "Номер телефону та за бажанням додаткові способи зв’язку",
            icon: PhoneCall,
            iconClass: "bg-emerald-50 text-emerald-600",
        },
        {
            title: "Надішліть на публікацію",
            description:
                "Після перевірки оголошення стане доступним на сайті",
            icon: Send,
            iconClass: "bg-amber-50 text-amber-600",
        },
    ];

    return (
        <section className="relative h-full w-full overflow-hidden bg-white">

            <div className="relative h-full w-full md:hidden">
                <div className="relative h-full w-full md:hidden">
    <div className="absolute inset-0 overflow-hidden">
        <img
            src="/images/mobile/slide-3.png"
            alt="Створення оголошення на RBoard"
            className="
                absolute
                left-1/2
                top-[7%]
                h-[100%]
                w-full
                -translate-x-1/2
                object-cover
                object-top
            "
        />
    </div>
</div>

                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[27%] bg-gradient-to-b from-white via-white/95 to-white/20" />

                <div className="absolute left-0 right-0 top-[88px] z-20 px-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-blue-500">
                        Створення оголошення
                    </p>

                    <h2 className="mt-2 max-w-[300px] text-[23px] font-black leading-[1.02] tracking-[-0.04em] text-slate-950 min-[390px]:text-[26px]">
                        Є що запропонувати?
                        <br />
                        Розкажи про це
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
                text-[9px]
                font-black
                uppercase
                tracking-[0.24em]
                text-blue-400

                lg:text-[10px]
                lg:tracking-[0.26em]

                xl:text-[11px]
                xl:tracking-[0.28em]

                2xl:text-[12px]
            ">
                Створення оголошення
            </p>

            <h2 className="
                mt-2.5
                max-w-[620px]
                text-[25px]
                font-black
                leading-[1.03]
                tracking-[-0.035em]
                text-slate-950

                lg:mt-3
                lg:text-[29px]

                xl:text-[33px]

                2xl:text-[36px]

                md:[@media(max-height:720px)]:mt-2
                md:[@media(max-height:720px)]:text-[23px]
                lg:[@media(max-height:720px)]:text-[26px]
                xl:[@media(max-height:720px)]:text-[29px]
            ">
                Є що запропонувати?
                <br />
                Розкажи про це
            </h2>

            <p className="
                mt-3
                max-w-[540px]
                text-[11px]
                font-medium
                leading-[1.45]
                text-slate-500

                lg:mt-3.5
                lg:text-[12px]

                xl:mt-4
                xl:text-[13px]
                xl:leading-[1.5]

                2xl:text-[14px]

                md:[@media(max-height:720px)]:mt-2.5
                md:[@media(max-height:720px)]:text-[10px]
                lg:[@media(max-height:720px)]:text-[11px]
                xl:[@media(max-height:720px)]:text-[12px]
            ">
                Створіть оголошення і покажіть свою
                пропозицію людям у Рахові та районі.
                <br />
                Це швидко, зручно та безкоштовно.
            </p>

            <div className="
                mt-4
                flex
                max-w-[570px]
                items-center
                gap-3
                rounded-xl
                bg-emerald-50
                px-4
                py-3

                lg:mt-4.5
                lg:gap-3.5
                lg:rounded-2xl
                lg:px-4
                lg:py-3

                xl:mt-5
                xl:gap-4
                xl:px-5
                xl:py-4

                md:[@media(max-height:720px)]:mt-3
                md:[@media(max-height:720px)]:gap-2.5
                md:[@media(max-height:720px)]:px-3
                md:[@media(max-height:720px)]:py-2
            ">
                <div className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-emerald-500
                    text-white

                    lg:h-9
                    lg:w-9

                    xl:h-10
                    xl:w-10

                    md:[@media(max-height:720px)]:h-7
                    md:[@media(max-height:720px)]:w-7
                ">
                    <Check
                        strokeWidth={3}
                        className="
                            h-[18px]
                            w-[18px]

                            lg:h-[20px]
                            lg:w-[20px]

                            xl:h-[24px]
                            xl:w-[24px]

                            md:[@media(max-height:720px)]:h-[16px]
                            md:[@media(max-height:720px)]:w-[16px]
                        "
                    />
                </div>

                <p className="
                    text-[12px]
                    font-bold
                    leading-[1.35]
                    text-slate-800

                    lg:text-[13px]
                    xl:text-[14px]
                    2xl:text-[16px]

                    md:[@media(max-height:720px)]:text-[11px]
                    xl:[@media(max-height:720px)]:text-[12px]
                ">
                    Створити оголошення можна навіть
                    <br />
                    без реєстрації.
                </p>
            </div>

            <div className="
                mt-4
                flex
                max-w-[610px]
                flex-col
                gap-2

                lg:mt-4.5
                lg:gap-2.5

                xl:mt-5
                xl:gap-3

                md:[@media(max-height:720px)]:mt-3
                md:[@media(max-height:720px)]:gap-1.5
            ">
                {steps.map(
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
                                    h-[42px]
                                    w-[42px]
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl

                                    lg:h-[46px]
                                    lg:w-[46px]

                                    xl:h-[52px]
                                    xl:w-[52px]
                                    xl:rounded-2xl

                                    2xl:h-[56px]
                                    2xl:w-[56px]

                                    md:[@media(max-height:720px)]:h-[36px]
                                    md:[@media(max-height:720px)]:w-[36px]

                                    ${iconClass}
                                `}
                            >
                                <Icon
                                    strokeWidth={2.4}
                                    className="
                                        h-[20px]
                                        w-[20px]

                                        lg:h-[22px]
                                        lg:w-[22px]

                                        xl:h-[25px]
                                        xl:w-[25px]

                                        2xl:h-[28px]
                                        2xl:w-[28px]

                                        md:[@media(max-height:720px)]:h-[18px]
                                        md:[@media(max-height:720px)]:w-[18px]
                                    "
                                />
                            </div>

                            <div className="min-w-0">
                                <h3 className="
                                    text-[12px]
                                    font-black
                                    leading-tight
                                    text-slate-950

                                    lg:text-[13px]
                                    xl:text-[14px]
                                    2xl:text-[15px]

                                    md:[@media(max-height:720px)]:text-[11px]
                                    xl:[@media(max-height:720px)]:text-[12px]
                                ">
                                    {title}
                                </h3>

                                <p className="
                                    mt-0.5
                                    text-[10px]
                                    font-medium
                                    leading-[1.3]
                                    text-slate-500

                                    lg:text-[11px]

                                    xl:mt-1
                                    xl:text-[12px]

                                    2xl:text-[14px]

                                    md:[@media(max-height:720px)]:mt-0
                                    md:[@media(max-height:720px)]:text-[9px]
                                    lg:[@media(max-height:720px)]:text-[10px]
                                    xl:[@media(max-height:720px)]:text-[11px]
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
                src="/images/slide-3.png"
                alt="Створення оголошення на RBoard"
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

export default SlideThree;