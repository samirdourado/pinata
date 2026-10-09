import { Navbar } from "@/components/header";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div className="p-8 rounded-2xl bg-card border border-card-border text-center my-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-2">
            Feed Social & Piñata Pools
          </h2>
          <p className="text-muted text-sm">
            Próximo passo: Card do Piñata Pool (Sorteio) e Feed de Posts com
            comentários pagos!
          </p>
        </div>
      </main>
    </div>
  );
}
