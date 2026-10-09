import { Navbar } from "@/components/Navbar";
import { PinataPoolCard } from "@/components/PinataPoolCard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      {/* Alinhado com a mesma largura do header (max-w-6xl) */}
      <main className="flex-1 max-w-6xl w-full mx-auto py-6 space-y-6">
        <PinataPoolCard />

        {/* Em breve: Feed de Posts com Comentários Pagos */}
      </main>
    </div>
  );
}
