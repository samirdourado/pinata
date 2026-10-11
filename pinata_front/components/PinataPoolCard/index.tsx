"use client";

import Image from "next/image";
import { MonthlyCountdown } from "@/components/MonthlyCountdown";
import { PinataProgress } from "@/components/PinataProgress";

export const PinataPoolCard = () => {
  return (
    <section className="w-full rounded-2xl bg-card border border-card-border p-6 shadow-sm relative overflow-hidden transition-all">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 max-w-6xl">
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-accent text-xs font-bold border border-pink-500/20">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            Monthly draw active
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
            Every paid comment feeds the Piñata Pool. Once the pinata is full, 3
            users with valid comments are selected as winners.
          </p>

          <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
            <div>
              <span className="text-xs text-muted uppercase font-semibold block">
                Prize pool
              </span>
              <span className="text-2xl font-black text-primary">
                0.575 SOL
              </span>
            </div>

            <div className="h-8 w-px bg-card-border" />

            <div>
              <span className="text-xs text-muted uppercase font-semibold block">
                Eligible commenters
              </span>
              <span className="text-xl font-bold text-foreground">
                14 people
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-card-border bg-background p-5 text-center md:w-72">
          <div className="w-full">
            <span className="text-xs font-medium text-muted block mb-1">
              Draw on the first day of the month
            </span>
            <MonthlyCountdown />
          </div>

          <div className="flex w-full items-center gap-3 rounded-xl border border-card-border bg-card p-3">
            <Image
              alt="Pinata image"
              src="/pinataB.png"
              width={24}
              height={24}
              className="shrink-0"
            />

            <div className="flex-1 min-w-40 space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-(--text-muted)">Pool target</span>
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
