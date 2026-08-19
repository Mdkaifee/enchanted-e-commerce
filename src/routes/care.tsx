import { createFileRoute, Link } from "@tanstack/react-router";
import { Scissors, Sparkles, WashingMachine } from "lucide-react";

const CARE_STEPS = [
  {
    icon: <WashingMachine className="size-5" />,
    title: "Wash cool",
    body: "Use a gentle cycle and mild detergent. Linen and cotton soften best without harsh heat.",
  },
  {
    icon: <Sparkles className="size-5" />,
    title: "Dry naturally",
    body: "Reshape while damp, then line dry in shade. Steam or press only when you want a crisper finish.",
  },
  {
    icon: <Scissors className="size-5" />,
    title: "Repair early",
    body: "Loose buttons, small pulls and worn hems are easiest to mend before they become larger repairs.",
  },
];

export const Route = createFileRoute("/care")({
  head: () => ({
    meta: [{ title: "Care & repairs — MD Attire" }],
  }),
  component: Care,
});

function Care() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-14 pb-24">
      <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        Care & repairs
      </p>
      <h1 className="rise-in mt-4 max-w-3xl font-display text-5xl font-light sm:text-6xl">
        Keep natural fibres in rotation for years
      </h1>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {CARE_STEPS.map((step) => (
          <article key={step.title} className="border border-border p-6">
            <div className="text-primary">{step.icon}</div>
            <h2 className="mt-5 font-display text-xl">{step.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </article>
        ))}
      </div>

      <section className="mt-16 border-y border-border py-10">
        <h2 className="font-display text-3xl font-light">Repair promise</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          We keep spare buttons, thread matches and pattern notes for every run. Send us a message
          with your order number and a photo, and we will confirm the best repair route.
        </p>
        <Link
          to="/contact"
          className="press mt-8 inline-flex bg-foreground px-7 py-3 text-xs tracking-[0.22em] text-background uppercase"
        >
          Request repair help
        </Link>
      </section>
    </div>
  );
}
