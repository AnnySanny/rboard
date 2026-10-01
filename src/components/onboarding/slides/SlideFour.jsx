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
                    src="/images/mobile/slide-4.png"
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
        <div className="hidden h-full md:block">
            <div className="pointer-events-none absolute -left-[15%] bottom-[-38%] h-[68%] w-[50%] rounded-[50%] bg-blue-50/80" />

            <div className="relative z-10 flex h-full">
                <div className="relative z-20 flex h-full w-[45%] flex-col px-[5%]">
                    <div className="flex h-full flex-col justify-center pt-[70px]">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-400 sm:text-[12px] lg:text-[14px]">
                            З обліковим записом
                        </p>

                        <h2 className="mt-3 max-w-[560px] text-[30px] font-black leading-[1.03] tracking-[-0.035em] text-slate-950 lg:text-[36px] xl:text-[42px]">
                            Значно більше
                            <br />
                            можливостей
                        </h2>

                        <p className="mt-4 max-w-[520px] text-[11px] font-medium leading-[1.5] text-slate-500 lg:text-[12px] xl:text-[13px]">
                            Створіть обліковий запис і керуйте
                            <br className="hidden xl:block" />
                            своїми оголошеннями зручно в одному місці.
                        </p>

                        <div className="mt-5 flex max-w-[590px] flex-col gap-3">
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
                                            className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                                        >
                                            <Icon
                                                size={25}
                                                strokeWidth={2.4}
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-[14px] font-black leading-tight text-slate-950 lg:text-[15px] xl:text-[17px]">
                                                {title}
                                            </h3>

                                            <p className="mt-1 text-[12px] font-medium leading-[1.3] text-slate-500 lg:text-[13px] xl:text-[15px]">
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
                    <div className="absolute inset-y-0 -left-[18%] right-0 overflow-hidden rounded-[32%_0_0_32%/50%_0_0_50%]">
                        <img
                            src="/images/slide-4.png"
                            alt="Можливості облікового запису RBoard"
                            className="h-full w-full object-cover object-[100%_center]"
                        />
                    </div>
                </div>
            </div>
        </div>
    </section>
);
};

export default SlideFour;