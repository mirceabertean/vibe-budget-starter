import Link from "next/link";

const features = [
  {
    icon: "📊",
    title: "Dashboard în timp real",
    desc: "Sold curent, venituri și cheltuieli lunare dintr-o privire.",
  },
  {
    icon: "🏦",
    title: "Mai multe bănci",
    desc: "Adaugă ING, BCR, Revolut și orice alt cont într-un singur loc.",
  },
  {
    icon: "📂",
    title: "Import CSV / Excel",
    desc: "Încarcă extrasul de la bancă și tranzacțiile apar automat, deja categorizate.",
  },
  {
    icon: "🤖",
    title: "AI Financial Coach",
    desc: "Analiză personalizată a cheltuielilor și recomandări generate cu Claude AI.",
  },
  {
    icon: "📈",
    title: "Rapoarte și grafice",
    desc: "Vizualizează unde se duc banii — pe categorii, pe luni, pe bancă.",
  },
  {
    icon: "🔒",
    title: "Cont privat și securizat",
    desc: "Datele tale sunt protejate. Nimeni altcineva nu le poate vedea.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50">
      {/* Hero */}
      <div className="container mx-auto px-4 pt-20 pb-16 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          💰 Vibe Budget
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
          Controlează-ți finanțele.<br />
          <span className="text-teal-600">Fără surprize la final de lună.</span>
        </h1>

        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
          Importă extrasele bancare, urmărește cheltuielile pe categorii și primește recomandări personalizate de la un AI coach financiar.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-7 py-3 rounded-lg transition-colors shadow-sm"
          >
            Începe gratuit →
          </Link>
          <Link
            href="/login"
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-7 py-3 rounded-lg border border-gray-200 transition-colors"
          >
            Intră în cont
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 pb-20 max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-semibold text-gray-900 mt-3 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
