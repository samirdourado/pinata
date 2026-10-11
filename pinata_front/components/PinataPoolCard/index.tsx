"use client";

import Image from "next/image";
import { MonthlyCountdown } from "@/components/MonthlyCountdown";
import { PinataProgress } from "@/components/PinataProgress";

export const PinataPoolCard = () => {
  return (
    <section className="w-full rounded-2xl bg-card border border-card-border p-6 shadow-sm relative overflow-hidden transition-all">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 max-w-6xl">
        {/* Lado Esquerdo: Informações do Pool */}
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-accent text-xs font-bold border border-pink-500/20">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            Sorteio Mensal Ativo
          </div>

          <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center justify-center md:justify-start gap-2">
            <Image
              alt="Pinata image."
              src="/pinataB.png"
              width={20}
              height={20}
            />{" "}
            Piñata Pool
          </h2>

          <p className="text-sm text-muted max-w-lg">
            Cada comentário pago alimenta o Pinata Pool. Com a pinata cheia, 3
            usuários com comentários válidos são sorteados entre os
            comentaristas!
          </p>

          <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
            <div>
              <span className="text-xs text-muted uppercase font-semibold block">
                Prêmio Acumulado
              </span>
              <span className="text-2xl font-black text-primary">
                0.575 SOL
              </span>
            </div>

            <div className="h-8 w-px bg-card-border" />

            <div>
              <span className="text-xs text-muted uppercase font-semibold block">
                Comentaristas Elegíveis
              </span>
              <span className="text-xl font-bold text-foreground">
                14 pessoas
              </span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Contagem Regressiva e Botão */}
        <div className="w-full md:w-auto flex flex-col items-center gap-3 bg-background p-5 rounded-xl border border-card-border text-center">
          <div>
            <span className="text-xs font-medium text-muted block mb-1">
              Sorteio no primeiro dia do mês
            </span>
            <MonthlyCountdown />
          </div>

          <div className="w-full md:w-auto flex items-center gap-3 bg-card p-3 rounded-xl border border-card-border">
            {/* Imagem da Piñata */}
            <Image
              alt="Pinata image"
              src="/pinataB.png"
              width={24}
              height={24}
              className="shrink-0"
            />

            {/* Barra de Progresso e Métricas */}
            <div className="flex-1 min-w-40 space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-(--text-muted)">Meta do Pool</span>
                <span className="text-primary font-bold">85%</span>
              </div>

              <PinataProgress valueSol={0.85} targetSol={1} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
