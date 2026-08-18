export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-border bg-foreground py-4 text-background">
      <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="text-[11px] tracking-[0.32em] uppercase">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
