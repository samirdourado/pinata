import { Navbar } from "@/components/Navbar";
import { PinataPoolCard } from "@/components/PinataPoolCard";
import { PostCard } from "@/components/PostCard";
import { INITIAL_POSTS } from "@/data/mockData";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Alinhado com a mesma largura do header (max-w-6xl) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 xl:px-0 py-6 space-y-6">
        {/* Card do Piñata Pool (Sorteio) */}
        <PinataPoolCard />

        {/* Layout do Feed de Posts (Coluna Dupla em telas grandes) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Feed Principal de Posts */}
          <section className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center justify-between">
              <span>🔥 Trending Posts</span>
              <span className="text-xs font-normal text-muted">
                Filtrado por engajamento e votos
              </span>
            </h3>

            {INITIAL_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>

          {/* Sidebar Lateral (Informações do Protocolo / Regras) */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-card border border-card-border p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-foreground">
                💡 Como funciona o Pinata?
              </h4>

              <ul className="text-xs text-muted space-y-2 leading-relaxed">
                <li className="flex gap-2">
                  <span>1.</span>
                  <span>
                    <strong>Sem Spam:</strong> Pague uma micro-taxa simbólica
                    para publicar cada comentário.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>2.</span>
                  <span>
                    <strong>Divisão Justa:</strong> A taxa é dividida entre o
                    criador da publicação, a Piñata Pool e para a plataforma.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>3.</span>
                  <span>
                    <strong>Premiação:</strong> No final da semana, o acumulado
                    é sorteado entre os comentaristas!
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-card border border-card-border p-5 shadow-sm space-y-2">
              <h4 className="font-bold text-sm text-foreground">
                📊 Estatísticas do Protocolo
              </h4>
              <div className="text-xs text-muted space-y-1">
                <p>
                  Comentários Filtrados:{" "}
                  <strong className="text-foreground">1,420</strong>
                </p>
                <p>
                  Total Distribuído a Criadores:{" "}
                  <strong className="text-primary">12.85 SOL</strong>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
