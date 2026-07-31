import { useEffect, useRef, useState } from "react";

export default function CityAutocomplete({
    value,
    onChange,
    error,
}) {
    const [search, setSearch] = useState(value?.name || "");
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    useEffect(() => {
        const normalizedSearch = search.trim();

        if (
            normalizedSearch.length < 3 ||
            normalizedSearch === value?.name
        ) {
            setCities([]);
            setLoading(false);
            return undefined;
        }

        const controller = new AbortController();

        const timer = window.setTimeout(async () => {
            setLoading(true);

            try {
                const params = new URLSearchParams({
                    name: normalizedSearch,
                    count: "10",
                    language: "uk",
                    format: "json",
                    countryCode: "UA",
                });

                const response = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
                    {
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error("Не вдалося знайти міста");
                }

                const data = await response.json();

                setCities(data.results || []);
                setIsOpen(true);
            } catch (requestError) {
                if (requestError.name !== "AbortError") {
                    console.error(requestError);
                    setCities([]);
                }
            } finally {
                setLoading(false);
            }
        }, 450);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [search, value?.name]);

    const handleInputChange = (event) => {
        const newValue = event.target.value;

        setSearch(newValue);
        setIsOpen(true);

        // Якщо користувач змінив текст після вибору міста,
        // скидаємо раніше вибране місто.
        if (value) {
            onChange(null);
        }
    };

    const handleSelectCity = (city) => {
        const selectedCity = {
            id: city.id,
            name: city.name,
            region: city.admin1 || "",
            district: city.admin2 || "",
            latitude: city.latitude,
            longitude: city.longitude,
        };

        setSearch(city.name);
        setCities([]);
        setIsOpen(false);
        onChange(selectedCity);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <label
                htmlFor="listing-city"
                className="mb-2 block text-sm font-semibold text-slate-700"
            >
                Місто <span className="text-red-500">*</span>
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
                    placeholder="Введіть щонайменше 3 символи"
                    autoComplete="off"
                    className={`w-full rounded-xl border bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        error
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                />

                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}

            {search.trim().length > 0 &&
                search.trim().length < 3 && (
                    <p className="mt-1 text-xs text-slate-500">
                        Введіть ще щонайменше{" "}
                        {3 - search.trim().length} символи.
                    </p>
                )}

            {isOpen &&
                !loading &&
                search.trim().length >= 3 && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                        {cities.length > 0 ? (
                            cities.map((city) => (
                                <button
                                    key={city.id}
                                    type="button"
                                    onClick={() =>
                                        handleSelectCity(city)
                                    }
                                    className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
                                >
                                    <span className="block text-sm font-semibold text-slate-900">
                                        {city.name}
                                    </span>

                                    <span className="mt-1 block text-xs text-slate-500">
                                        {[
                                            city.admin2,
                                            city.admin1,
                                        ]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-slate-500">
                                Населений пункт не знайдено
                            </div>
                        )}
                    </div>
                )}
        </div>
    );
}