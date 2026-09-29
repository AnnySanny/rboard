import { Link } from "react-router-dom";

const particles = [
    { x: "-18px", y: "-20px", delay: "0s", size: "5px" },
    { x: "8px", y: "-25px", delay: "0.15s", size: "4px" },
    { x: "35px", y: "-18px", delay: "0.3s", size: "6px" },
    { x: "60px", y: "-22px", delay: "0.45s", size: "4px" },
    { x: "85px", y: "-18px", delay: "0.6s", size: "5px" },
    { x: "110px", y: "-24px", delay: "0.75s", size: "4px" },
    { x: "140px", y: "-19px", delay: "0.9s", size: "6px" },
    { x: "170px", y: "-23px", delay: "1.05s", size: "4px" },
    { x: "200px", y: "-17px", delay: "1.2s", size: "5px" },

    { x: "225px", y: "-5px", delay: "0.1s", size: "4px" },
    { x: "230px", y: "14px", delay: "0.35s", size: "6px" },
    { x: "226px", y: "34px", delay: "0.7s", size: "4px" },

    { x: "200px", y: "55px", delay: "0.2s", size: "5px" },
    { x: "170px", y: "60px", delay: "0.5s", size: "4px" },
    { x: "140px", y: "57px", delay: "0.8s", size: "6px" },
    { x: "110px", y: "62px", delay: "1.1s", size: "4px" },
    { x: "80px", y: "58px", delay: "0.4s", size: "5px" },
    { x: "50px", y: "61px", delay: "0.7s", size: "4px" },
    { x: "20px", y: "56px", delay: "1s", size: "6px" },

    { x: "-18px", y: "38px", delay: "0.25s", size: "4px" },
    { x: "-23px", y: "18px", delay: "0.55s", size: "5px" },
    { x: "-20px", y: "0px", delay: "0.85s", size: "4px" },
];

export default function AddListingButton() {
    return (
        <div className="mb-10 flex justify-center">
            <div className="add-listing-wrapper relative">
                <div
                    className="add-listing-particles"
                    aria-hidden="true"
                >
                    {particles.map((particle, index) => (
                        <span
                            key={index}
                            className={`add-listing-particle particle-${
                                (index % 4) + 1
                            }`}
                            style={{
                                "--particle-x": particle.x,
                                "--particle-y": particle.y,
                                "--particle-delay": particle.delay,
                                "--particle-size": particle.size,
                            }}
                        />
                    ))}
                </div>

                <Link
                    to="/create-listing"
                    className="add-listing-button relative z-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                >
                    <span className="add-listing-plus text-xl leading-none">
                        +
                    </span>

                    <span>
                        Додати своє оголошення
                    </span>
                </Link>
            </div>
        </div>
    );
}