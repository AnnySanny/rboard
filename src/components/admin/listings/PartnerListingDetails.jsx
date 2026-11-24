
import RealEstateDetails from "./partnerTypes/RealEstateDetails";

const partnerComponents = {
    real_estate: RealEstateDetails,
};

export default function PartnerListingDetails({ listing }) {
    if (listing?.listingKind !== "partner") {
        return null;
    }

    const Component = partnerComponents[listing.partnerType];

    if (!Component) {
        return (
            <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-sm font-bold text-violet-700">
                    Партнерське оголошення
                </p>

                <p className="mt-1 text-xs text-violet-600">
                    Для типу «{listing.partnerType || "невідомий"}»
                    спеціальний компонент ще не налаштовано.
                </p>
            </div>
        );
    }

    return <Component listing={listing} />;
}
