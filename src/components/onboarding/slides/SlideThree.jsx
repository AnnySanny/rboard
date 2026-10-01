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
                <div className="pointer-events-none absolute -left-[15%] bottom-[-38%] h-[68%] w-[50%] rounded-[50%] bg-blue-50/80" />

                <div className="relative z-20 flex h-full w-[45%] flex-col px-[5%]">
                    <div className="flex h-full flex-col justify-center pt-[70px]">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-400 sm:text-[11px] lg:text-[12px]">
                            Створення оголошення
                        </p>

                        <h2 className="mt-3 max-w-[620px] text-[26px] font-black leading-[1.05] tracking-[-0.035em] text-slate-950 lg:text-[32px] xl:text-[36px]">
                            Є що запропонувати?
                            <br />
                            Розкажи про це
                        </h2>

                        <p className="mt-4 max-w-[540px] text-[11px] font-medium leading-[1.5] text-slate-500 lg:text-[12px] xl:text-[13px]">
                            Створіть оголошення і покажіть свою
                            пропозицію людям у Рахові та районі.
                            <br />
                            Це швидко, зручно та безкоштовно.
                        </p>

                        <div className="mt-5 flex max-w-[570px] items-center gap-4 rounded-2xl bg-emerald-50 px-5 py-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <Check
                                    size={24}
                                    strokeWidth={3}
                                />
                            </div>

                            <p className="text-[14px] font-bold leading-[1.4] text-slate-800 lg:text-[16px]">
                                Створити оголошення можна навіть
                                <br />
                                без реєстрації.
                            </p>
                        </div>

                        <div className="mt-5 flex max-w-[610px] flex-col gap-3">
                            {steps.map(
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
                                            <h3 className="text-[14px] font-black leading-tight text-slate-950 lg:text-[15px]">
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
                            src="/images/slide-3.png"
                            alt="Створення оголошення на RBoard"
                            className="h-full w-full object-cover object-[95%_center]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SlideThree;