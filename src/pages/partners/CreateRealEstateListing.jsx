
import { HousePlus } from "lucide-react";

import Navbar from "../../components/pageComponent/Navbar";
import Footer from "../../components/pageComponent/Footer";

import RealEstateCreateForm from "../../components/partners/realEstate/RealEstateCreateForm";

export default function CreateRealEstateListing() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f8ff]">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">

          {/* Заголовок */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/15">
              <HousePlus
                size={27}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                Додати нерухомість
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Створення партнерського оголошення RBoard
              </p>
            </div>
          </div>

          {/* Форма */}
          <RealEstateCreateForm />

        </div>
      </main>

      <Footer />
    </div>
  );
}
