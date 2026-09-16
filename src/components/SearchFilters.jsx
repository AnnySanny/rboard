const categories = [
  "Усі",
  "Продаж",
  "Купівля",
  "Оренда",
  "Послуга",
  "Робота",
  "Питання",
  "Обмін",
  "Віддам безкоштовно",
  "Загублено / знайдено",
  "Подія",
  "Оголошення громади",
  "Інше",
];

const SearchFilters = ({
  search,
    setSearch,
    searchPlaceholder,
    activeCategory,
    setActiveCategory,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
}) => {
  const hasActiveFilters =
    search.trim() !== "" ||
    activeCategory !== "Усі" ||
    sortOrder !== "newest";

  const handleResetFilters = () => {
    setSearch("");
    setActiveCategory("Усі");
    setSortOrder("newest");
  };

  return (
    <section className="mt-9">
      {/* Пошук */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
  {/* Пошук */}
  <div className="relative flex-1">
    <svg
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>

    <input
      type="search"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder={searchPlaceholder}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />

    {search.trim() !== "" && (
      <button
        type="button"
        onClick={() => setSearch("")}
        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
      >
        ×
      </button>
    )}
  </div>

  {/* Сортування */}
 <div className="relative w-full lg:w-44">
    <select
      value={sortOrder}
      onChange={(event) => setSortOrder(event.target.value)}
      className="h-11 w-full lg:w-44 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    >
      <option value="newest">Спочатку нові</option>
      <option value="oldest">Спочатку старі</option>
      <option value="alphabetical-asc">Від А до Я</option>
      <option value="alphabetical-desc">Від Я до А</option>
    </select>

    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </div>

  {/* Скинути */}
  <button
    type="button"
    onClick={handleResetFilters}
    disabled={!hasActiveFilters}
    className="h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
  >
    Скинути все
  </button>

  {/* Список / Сітка */}
  <div className="flex h-11 shrink-0 rounded-xl bg-white p-1 shadow-sm">
    <button
      type="button"
      onClick={() => setViewMode("list")}
      className={`flex items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
        viewMode === "list"
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      Список
    </button>

    <button
      type="button"
      onClick={() => setViewMode("grid")}
      className={`flex items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
        viewMode === "grid"
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      Сітка
    </button>
  </div>
</div>

      {/* Категорії */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {categories.map((category) => {
          const isActive =
            activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() =>
                setActiveCategory(category)
              }
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-700 shadow-sm hover:bg-slate-100"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SearchFilters;