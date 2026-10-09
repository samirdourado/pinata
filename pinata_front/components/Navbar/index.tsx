"use client";

import { useState } from "react";

export const Navbar = () => {
  // Estado simulado da carteira para teste e apresentação no Hackathon
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress] = useState("7Xw3...42a1");
  const [solBalance] = useState(2.45);

  const toggleWallet = () => {
    setIsConnected(!isConnected);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-(--card)/80 backdrop-blur-md px-4 sm:px-8 xl:px-0 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo & Nome */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-primary to-accent flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">
            🪅
          </div>
          <div>
            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-accent">
              Pinata
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-primary font-medium border border-purple-500/20">
              Devnet
            </span>
          </div>
        </div>

        {/* Menu & Carteira Simulada */}
        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-3">
              {/* Badge de Saldo em SOL */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-card-border text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>{solBalance.toFixed(2)} SOL</span>
              </div>

              {/* Botão com Endereço / Desconectar */}
              <button
                onClick={toggleWallet}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-card-border hover:border-primary text-sm font-medium transition-all cursor-pointer"
                title="Clique para Simular Desconexão"
              >
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>{walletAddress}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={toggleWallet}
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-primary to-primary-hover text-(--text-primary) text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition-all cursor-pointer active:scale-95"
            >
              Conectar Carteira
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
