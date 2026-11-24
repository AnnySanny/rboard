
import ProfileListings from "./ProfileListings";
import RealEstateProfileListings from "./partnerListings/RealEstateProfileListings";

const partnerComponents = {
    real_estate: RealEstateProfileListings,
};

export default function ProfileListingsRouter({
    profileUid,
    isPartner,
    partnerType,
}) {
    if (!isPartner) {
        return (
            <ProfileListings
                profileUid={profileUid}
            />
        );
    }

    const Component = partnerComponents[partnerType];

    return (
        <div className="space-y-5">
            <ProfileListings
                profileUid={profileUid}
                excludePartnerListings
                hideWhenEmpty
            />

            {Component ? (
                <Component profileUid={profileUid} />
            ) : (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">
                        Партнерські оголошення
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Для цієї спеціалізації каталог
                        поки не налаштовано.
                    </p>
                </section>
            )}
        </div>
    );
}
