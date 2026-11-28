import ListingCard from "./ListingCard";
import RealEstateCard from "../partners/realEstate/RealEstateCard";
import { useContest } from "../../context/ContestContext";
const ListingsSection = ({
  listings,
  viewMode,
  onListingClick,
  compact = false,
  canSeeFavorites = false,
  showFavoriteItem = false,
}) => {
  const {
    canCollectBoots,
    hasFound,
    claimItem,
    claimingBootId,
  } = useContest();

  if (!listings.length) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-6 w-6 text-slate-400"
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
          </div>

          {canCollectBoots && !hasFound("u5m7c1q8n4") && (
            <button
              type="button"
              disabled={Boolean(claimingBootId)}
              onClick={() => claimItem("u5m7c1q8n4")}
              aria-label="Забрати чобіток"
              className="h-12 w-12 shrink-0 cursor-pointer transition-transform hover:scale-110 active:scale-90 disabled:opacity-50 sm:h-14 sm:w-14"
            >
              <img
                src="/images/contest-boot.png"
                alt=""
                draggable={false}
                className="h-full w-full object-contain"
              />
            </button>
          )}
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Оголошень не знайдено
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Спробуйте змінити пошуковий запит або вибрати іншу категорію.
        </p>
      </div>
    );
  }

  return (
    <section
      id={compact ? "profile-listings" : "listings"}
      className={
        compact
          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
          : `mt-7 grid gap-5 ${viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1"
          }`
      }
    >
      {listings.map((listing, index) => {
        const isRealEstatePartner =
          listing.listingKind === "partner" &&
          listing.partnerType === "real_estate";

        const card = isRealEstatePartner ? (
          <div
            key={listing.id}
            className="min-w-0"
          >
            <RealEstateCard
              listing={listing}
              onClick={() => onListingClick(listing)}
            />
          </div>
        ) : (
          <ListingCard
            key={listing.id}
            listing={listing}
            viewMode={viewMode}
            compact={compact}
            onClick={() => onListingClick(listing)}
            canSeeFavorites={canSeeFavorites}
          />
        );

        if (!showFavoriteItem || index !== 0) {
          return card;
        }

        return (
          <div
            key={listing.id}
            className="relative grid min-w-0"
          >
            {card}

            {canCollectBoots && !hasFound("g4n7p2v8k6") && (
              <button
                type="button"
                disabled={Boolean(claimingBootId)}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  claimItem("g4n7p2v8k6");
                }}
                aria-label="Забрати чобіток"
                className="absolute right-2 top-2 z-30 h-14 w-14 cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-90 disabled:opacity-50 sm:h-20 sm:w-20"
              >
                <img
                  src="/images/contest-boot.png"
                  alt=""
                  draggable={false}
                  className="h-full w-full object-contain drop-shadow-lg"
                />
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
};


export default ListingsSection;