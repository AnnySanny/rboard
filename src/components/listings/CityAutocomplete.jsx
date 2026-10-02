import {
    useEffect,
    useRef,
    useState,
} from "react";

const RAKHIV_DISTRICT_PLACES = [
    {
        id: "rakhiv",
        name: "Рахів",
        type: "місто",
        community: "Рахівська",
    },
    {
        id: "bilyn",
        name: "Білин",
        type: "село",
        community: "Рахівська",
    },
    {
        id: "dilove",
        name: "Ділове",
        type: "село",
        community: "Рахівська",
    },
    {
        id: "kostylivka",
        name: "Костилівка",
        type: "село",
        community: "Рахівська",
    },

    {
        id: "bohdan",
        name: "Богдан",
        type: "село",
        community: "Богданська",
    },
    {
        id: "breboia",
        name: "Бребоя",
        type: "село",
        community: "Богданська",
    },
    {
        id: "vydrychka",
        name: "Видричка",
        type: "село",
        community: "Богданська",
    },
    {
        id: "hoverla",
        name: "Говерла",
        type: "село",
        community: "Богданська",
    },
    {
        id: "luhy",
        name: "Луги",
        type: "село",
        community: "Богданська",
    },
    {
        id: "roztoky",
        name: "Розтоки",
        type: "село",
        community: "Богданська",
    },

    {
        id: "velykyi-bychkiv",
        name: "Великий Бичків",
        type: "селище",
        community: "Великобичківська",
    },
    {
        id: "verkhnie-vodiane",
        name: "Верхнє Водяне",
        type: "село",
        community: "Великобичківська",
    },
    {
        id: "vodytsia",
        name: "Водиця",
        type: "село",
        community: "Великобичківська",
    },
    {
        id: "kobyletska-poliana",
        name: "Кобилецька Поляна",
        type: "селище",
        community: "Великобичківська",
    },
    {
        id: "kosivska-poliana",
        name: "Косівська Поляна",
        type: "село",
        community: "Великобичківська",
    },
    {
        id: "luh",
        name: "Луг",
        type: "село",
        community: "Великобичківська",
    },
    {
        id: "plaiuts",
        name: "Плаюць",
        type: "село",
        community: "Великобичківська",
    },
    {
        id: "rosishka",
        name: "Росішка",
        type: "село",
        community: "Великобичківська",
    },
    {
        id: "strymba",
        name: "Стримба",
        type: "село",
        community: "Великобичківська",
    },

    {
        id: "yasinia",
        name: "Ясіня",
        type: "селище",
        community: "Ясінянська",
    },
    {
        id: "kvasy",
        name: "Кваси",
        type: "село",
        community: "Ясінянська",
    },
    {
        id: "lazeshchyna",
        name: "Лазещина",
        type: "село",
        community: "Ясінянська",
    },
    {
        id: "stebnyi",
        name: "Стебний",
        type: "село",
        community: "Ясінянська",
    },
    {
        id: "sitnyi",
        name: "Сітний",
        type: "село",
        community: "Ясінянська",
    },
    {
        id: "trostianets",
        name: "Тростянець",
        type: "село",
        community: "Ясінянська",
    },
    {
        id: "chorna-tysa",
        name: "Чорна Тиса",
        type: "село",
        community: "Ясінянська",
    },
];

export default function CityAutocomplete({
    value,
    onChange,
    error,
}) {
    const [search, setSearch] = useState(
        value?.name || ""
    );

    const [cities, setCities] = useState([]);

    const [isOpen, setIsOpen] = useState(false);

    const wrapperRef = useRef(null);

    useEffect(() => {
        setSearch(value?.name || "");
    }, [value?.name]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(
                    event.target
                )
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    useEffect(() => {
        const normalizedSearch = search
            .trim()
            .toLocaleLowerCase("uk-UA");

        if (
            normalizedSearch.length < 2 ||
            search.trim() === value?.name
        ) {
            setCities([]);
            return;
        }

        const filteredCities =
            RAKHIV_DISTRICT_PLACES.filter(
                (place) =>
                    place.name
                        .toLocaleLowerCase("uk-UA")
                        .includes(normalizedSearch)
            );

        setCities(filteredCities);
        setIsOpen(true);
    }, [search, value?.name]);

    const handleInputChange = (event) => {
        const newValue = event.target.value;

        setSearch(newValue);
        setIsOpen(true);

        if (value) {
            onChange(null);
        }
    };

    const handleSelectCity = (city) => {
        const selectedCity = {
            id: city.id,
            name: city.name,
            type: city.type,
            community: city.community,
            district: "Рахівський район",
            region: "Закарпатська область",
        };

        setSearch(city.name);
        setCities([]);
        setIsOpen(false);

        onChange(selectedCity);
    };

    return (
        <div
            ref={wrapperRef}
            className="relative"
        >
            <label
                htmlFor="listing-city"
                className="mb-2 block text-sm font-semibold text-slate-700"
            >
                Населений пункт{" "}
                <span className="text-red-500">
                    *
                </span>
            </label>

            <div className="relative">
                <input
                    id="listing-city"
                    type="text"
                    value={search}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (cities.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder="Наприклад: Рахів, Білин, Ясіня"
                    autoComplete="off"
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        error
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                />
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}

            <p className="mt-1.5 text-xs text-slate-400">
                Доступні населені пункти Рахівського
                району.
            </p>

            {search.trim().length > 0 &&
                search.trim().length < 2 && (
                    <p className="mt-1 text-xs text-slate-500">
                        Введіть ще щонайменше{" "}
                        {2 - search.trim().length}{" "}
                        символ.
                    </p>
                )}

            {isOpen &&
                search.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                        {cities.length > 0 ? (
                            cities.map((city) => (
                                <button
                                    key={city.id}
                                    type="button"
                                    onClick={() =>
                                        handleSelectCity(
                                            city
                                        )
                                    }
                                    className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <span className="block text-sm font-semibold text-slate-900">
                                                {
                                                    city.name
                                                }
                                            </span>

                                            <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                                                <span>
                                                    {
                                                        city.community
                                                    }{" "}
                                                    громада
                                                </span>

                                                <span className="font-bold text-blue-600">
                                                    ·
                                                </span>

                                                <span>
                                                    Рахівський
                                                    район
                                                </span>
                                            </span>
                                        </div>

                                        <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">
                                            {city.type}
                                        </span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-5 text-center">
                                <p className="text-sm font-medium text-slate-600">
                                    Населений пункт не
                                    знайдено
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Пошук доступний лише
                                    серед населених пунктів
                                    Рахівського району
                                </p>
                            </div>
                        )}
                    </div>
                )}
        </div>
    );
}