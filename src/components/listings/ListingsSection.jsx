import { useState } from "react";

import ListingCard from "./ListingCard";
import ListingDetailsModal from "./ListingDetailsModal";

const ListingsSection = ({ listings, viewMode }) => {
  const [selectedListing, setSelectedListing] =
    useState(null);

  if (!listings.length) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
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
    <>
      <section
        id="listings"
        className={`mt-7 grid gap-5 ${
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            viewMode={viewMode}
            onClick={() =>
              setSelectedListing(listing)
            }
          />
        ))}
      </section>

      <ListingDetailsModal
        listing={selectedListing}
        onClose={() =>
          setSelectedListing(null)
        }
      />
    </>
  );
};

export default ListingsSection;