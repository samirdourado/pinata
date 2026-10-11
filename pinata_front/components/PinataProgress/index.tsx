interface PinataProgressProps {
  valueSol: number;
  targetSol: number;
  className?: string;
}

export const PinataProgress = ({
  valueSol,
  targetSol,
  className = "",
}: PinataProgressProps) => {
  const percent = Math.min(Math.max((valueSol / targetSol) * 100, 0), 100);

  return (
    <div
      className={`relative h-2.5 overflow-hidden rounded-full border border-card-border bg-background ${className}`}
      role="progressbar"
      aria-label="Progresso da Piñata"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
      <span
        className="absolute inset-y-0 z-10 w-0.5 bg-foreground/80"
        style={{ left: "60%" }}
        aria-hidden="true"
      />
    </div>
  );
};
