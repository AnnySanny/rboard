
import { useMemo, useState } from "react";
import { MapPin, X } from "lucide-react";

import {
  RAKHIV_DISTRICT_PLACES,
} from "../listings/CityAutocomplete";
// Якщо твій CityAutocomplete лежить в іншій
// папці — зміни тільки цей шлях.

export default function ProfileCityInput({
  value = "",
  onChange,
  disabled = false,
}) {
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const search = value.trim().toLocaleLowerCase("uk-UA");

    if (search.length < 2) return [];

    return RAKHIV_DISTRICT_PLACES
      .filter((place) =>
        place.name
          .toLocaleLowerCase("uk-UA")
          .includes(search)
      )
      .slice(0, 6);
  }, [value]);

  return (
    <div className="relative">
      <label
        htmlFor="profile-city"
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        Населений пункт
      </label>

      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"
        />

        <input
          id="profile-city"
          type="text"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 150);
          }}
          disabled={disabled}
          placeholder="Наприклад: Рахів"
          autoComplete="off"
          maxLength={100}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Очистити місто"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {focused && suggestions.length > 0 && !disabled && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {suggestions.map((city) => (
            <button
              key={city.id}
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() => {
                onChange(city.name);
                setFocused(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
            >
              <span className="text-sm font-semibold text-slate-900">
                {city.name}
              </span>

              <span className="text-xs text-slate-400">
                {city.type}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs leading-5 text-slate-400">
        Можна обрати населений пункт із підказок
        або ввести власний.
      </p>
    </div>
  );
}
