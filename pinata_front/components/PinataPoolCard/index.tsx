"use client";

import { useState } from "react";

export const PinataPoolCard = () => {
  const [poolBalance] = useState(0.575);
  const [totalParticipants] = useState(14);
  const [isPopping, setIsPopping] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const handlePopPinata = () => {
    setIsPopping(true);
    setWinner(null);

    setTimeout(() => {
      const mockWinners = [
        "@CryptoDev",
        "@Web3Builder",
        "@solana_fan",
        "@satoshi_br",
      ];
      const randomWinner =
        mockWinners[Math.floor(Math.random() * mockWinners.length)];

      setWinner(randomWinner);
      setIsPopping(false);
    }, 2000);
  };

  return (
    <section className="w-full rounded-2xl bg-[var(--card)] border border-[var(--card-border)] p-6 shadow-sm relative overflow-hidden transition-all">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 max-w-6xl">
        {/* Lado Esquerdo: Informações do Pool */}
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-[var(--accent)] text-xs font-bold border border-pink-500/20">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
            Sorteio Semanal Ativo
          </div>

          <h2 className="text-3xl font-black tracking-tight text-[var(--foreground)] flex items-center justify-center md:justify-start gap-2">
            🪅 Piñata Pool
          </h2>

          <p className="text-sm text-[var(--muted)] max-w-lg">
            Cada comentário pago alimenta o acumulado. No final do ciclo, todo o
            valor em SOL é sorteado exclusivamente entre os comentaristas!
          </p>

          <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
            <div>
              <span className="text-xs text-[var(--muted)] uppercase font-semibold block">
                Prêmio Acumulado
              </span>
              <span className="text-2xl font-black text-[var(--primary)]">
                {poolBalance.toFixed(3)} SOL
              </span>
            </div>

            <div className="h-8 w-px bg-[var(--card-border)]" />

            <div>
              <span className="text-xs text-[var(--muted)] uppercase font-semibold block">
                Comentaristas Elegíveis
              </span>
              <span className="text-xl font-bold text-[var(--foreground)]">
                {totalParticipants} pessoas
              </span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Contagem Regressiva e Botão */}
        <div className="w-full md:w-auto flex flex-col items-center gap-3 bg-[var(--background)] p-5 rounded-xl border border-[var(--card-border)] text-center">
          <div>
            <span className="text-xs font-medium text-[var(--muted)] block mb-1">
              Encerra em
            </span>
            <div className="flex items-center gap-2 text-lg font-mono font-bold text-[var(--primary)]">
              <span className="px-2 py-1 rounded bg-[var(--card)] border border-[var(--card-border)]">
                02d
              </span>
              :
              <span className="px-2 py-1 rounded bg-[var(--card)] border border-[var(--card-border)]">
                14h
              </span>
              :
              <span className="px-2 py-1 rounded bg-[var(--card)] border border-[var(--card-border)]">
                38m
              </span>
            </div>
          </div>

          <button
            onClick={handlePopPinata}
            disabled={isPopping}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isPopping
              ? "🎲 Estourando Piñata..."
              : "🪅 Simular Sorteio (Estourar)"}
          </button>
        </div>
      </div>

      {/* Resultado do Sorteio */}
      {winner && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
          <p className="text-xs font-semibold text-[var(--success)] uppercase tracking-wider">
            🎉 Vencedor Escolhido via VRF On-Chain!
          </p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">
            Parabéns <span className="text-[var(--primary)]">{winner}</span>!
            Você recebeu{" "}
            <span className="text-[var(--accent)]">
              {poolBalance.toFixed(3)} SOL
            </span>{" "}
            direto na sua carteira!
          </p>
        </div>
      )}
    </section>
  );
};
