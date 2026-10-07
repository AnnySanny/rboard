import {
    BarChart3,
    Heart,
    ImagePlus,
    MessageCircle,
    Pencil,
    User,
} from "lucide-react";

const SlideFour = () => {
    const features = [
        {
            title: "Редагуйте оголошення",
            description: "Змінюйте інформацію в будь-який час",
            icon: Pencil,
            iconClass: "bg-violet-50 text-violet-600",
        },
        {
            title: "Додавайте фотографії",
            description: "Показуйте більше деталей",
            icon: ImagePlus,
            iconClass: "bg-blue-50 text-blue-600",
        },
        {
            title: "Зберігайте улюблені",
            description: "Додавайте цікаві оголошення в обране",
            icon: Heart,
            iconClass: "bg-rose-50 text-rose-500",
        },
        {
            title: "Додавайте контакти",
            description: "Telegram, Viber, WhatsApp, Instagram та інші",
            icon: MessageCircle,
            iconClass: "bg-cyan-50 text-cyan-600",
        },
        {
            title: "Переглядайте статистику",
            description: "Відстежуйте перегляди та активність оголошень",
            icon: BarChart3,
            iconClass: "bg-amber-50 text-amber-500",
        },
        {
            title: "Керуйте в особистому кабінеті",
            description: "Усі ваші оголошення, улюблені та налаштування",
            icon: User,
            iconClass: "bg-blue-50 text-blue-600",
        },
    ];

    return (
    <section className="relative h-full w-full overflow-hidden bg-white">

        {/* MOBILE */}
        <div className="relative h-full w-full md:hidden">
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src="/images/mobile/slide-4.webp"
                    alt="Можливості облікового запису RBoard"
                    className="
                        absolute
                        left-1/2
                        top-[5%]
                        h-[100%]
                        w-full
                        -translate-x-1/2
                        object-cover
                        object-top
                    "
                />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[29%] bg-gradient-to-b from-white via-white/95 to-transparent" />

            <div className="absolute inset-x-0 top-[88px] z-20 px-5">
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-blue-500">
                    З обліковим записом
                </p>

                <h2 className="mt-2 max-w-[290px] text-[24px] font-black leading-[1.02] tracking-[-0.04em] text-slate-950 min-[390px]:text-[27px]">
                    Значно більше
                    <br />
                    можливостей
                </h2>

                <p className="mt-3 max-w-[270px] text-[11px] font-semibold leading-[1.4] text-slate-500">
                    Керуйте оголошеннями, обраним,
                    контактами та статистикою.
                </p>
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

                    lg:text-[11px]
                    lg:tracking-[0.26em]

                    xl:text-[12px]
                    xl:tracking-[0.28em]

                    2xl:text-[14px]

                    md:[@media(max-height:720px)]:text-[8px]
                ">
                    З обліковим записом
                </p>

                <h2 className="
                    mt-2.5
                    max-w-[560px]
                    text-[26px]
                    font-black
                    leading-[1.03]
                    tracking-[-0.035em]
                    text-slate-950

                    lg:mt-3
                    lg:text-[32px]

                    xl:text-[37px]

                    2xl:text-[42px]

                    md:[@media(max-height:720px)]:mt-2
                    md:[@media(max-height:720px)]:text-[23px]

                    lg:[@media(max-height:720px)]:text-[27px]
                    xl:[@media(max-height:720px)]:text-[31px]
                ">
                    Значно більше
                    <br />
                    можливостей
                </h2>

                <p className="
                    mt-3
                    max-w-[520px]
                    text-[10px]
                    font-medium
                    leading-[1.45]
                    text-slate-500

                    lg:mt-3.5
                    lg:text-[11px]

                    xl:mt-4
                    xl:text-[12px]

                    2xl:text-[13px]

                    md:[@media(max-height:720px)]:mt-2
                    md:[@media(max-height:720px)]:text-[9px]

                    lg:[@media(max-height:720px)]:text-[10px]
                    xl:[@media(max-height:720px)]:text-[11px]
                ">
                    Створіть обліковий запис і керуйте
                    <br className="hidden xl:block" />
                    своїми оголошеннями зручно в одному місці.
                </p>

                <div className="
                    mt-4
                    flex
                    max-w-[590px]
                    flex-col
                    gap-2

                    lg:mt-4.5
                    lg:gap-2.5

                    xl:mt-5
                    xl:gap-3

                    md:[@media(max-height:720px)]:mt-3
                    md:[@media(max-height:720px)]:gap-1
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
                                        h-[40px]
                                        w-[40px]
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl

                                        lg:h-[44px]
                                        lg:w-[44px]

                                        xl:h-[48px]
                                        xl:w-[48px]
                                        xl:rounded-2xl

                                        2xl:h-[50px]
                                        2xl:w-[50px]

                                        md:[@media(max-height:720px)]:h-[34px]
                                        md:[@media(max-height:720px)]:w-[34px]

                                        lg:[@media(max-height:720px)]:h-[36px]
                                        lg:[@media(max-height:720px)]:w-[36px]

                                        ${iconClass}
                                    `}
                                >
                                    <Icon
                                        strokeWidth={2.4}
                                        className="
                                            h-[19px]
                                            w-[19px]

                                            lg:h-[21px]
                                            lg:w-[21px]

                                            xl:h-[23px]
                                            xl:w-[23px]

                                            2xl:h-[25px]
                                            2xl:w-[25px]

                                            md:[@media(max-height:720px)]:h-[16px]
                                            md:[@media(max-height:720px)]:w-[16px]

                                            lg:[@media(max-height:720px)]:h-[18px]
                                            lg:[@media(max-height:720px)]:w-[18px]
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
                                        xl:text-[15px]
                                        2xl:text-[17px]

                                        md:[@media(max-height:720px)]:text-[10px]
                                        lg:[@media(max-height:720px)]:text-[11px]
                                        xl:[@media(max-height:720px)]:text-[12px]
                                    ">
                                        {title}
                                    </h3>

                                    <p className="
                                        mt-0.5
                                        text-[10px]
                                        font-medium
                                        leading-[1.25]
                                        text-slate-500

                                        lg:text-[11px]

                                        xl:mt-1
                                        xl:text-[13px]

                                        2xl:text-[15px]

                                        md:[@media(max-height:720px)]:mt-0
                                        md:[@media(max-height:720px)]:text-[8px]
                                        lg:[@media(max-height:720px)]:text-[9px]
                                        xl:[@media(max-height:720px)]:text-[10px]
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
                    src="/images/slide-4.webp"
                    alt="Можливості облікового запису RBoard"
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

export default SlideFour;