import { createFileRoute, Link } from "@tanstack/react-router";

import story from "@/assets/story.jpg";
import { useScrollReveal } from "@/hooks/use-reveal";
import { Marquee } from "@/components/marquee";

const VALUES = [
  {
    title: "Natural fibres only",
    body: "Linen, merino, cotton and silk. Nothing blended with plastic, nothing that won't age well.",
  },
  {
    title: "Small runs",
    body: "Each piece is cut in batches of fifty or fewer, so nothing is made that isn't wanted.",
  },
  {
    title: "Made to be repaired",
    body: "Generous seam allowances and spare buttons, so a favourite can be mended, not replaced.",
  },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our story — MD Attire" },
      {
        name: "description",
        content:
          "MD Attire is a small studio making slow, repairable clothing in natural fibres, cut in runs of fifty or fewer.",
      },
      { property: "og:title", content: "Our story — MD Attire" },
      {
        property: "og:description",
        content: "A small studio making slow, repairable clothing in natural fibres.",
      },
    ],
  }),
  component: About,
});

function About() {
  useScrollReveal([]);

  return (
    <div className="pb-24">
      <header className="mx-auto max-w-7xl px-6 pt-16">
        <p className="rise-in text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
          The studio
        </p>
        <h1 className="rise-in mt-4 max-w-4xl font-display text-5xl leading-[1.05] font-light sm:text-7xl">
          Clothes that are made once, and kept
        </h1>
      </header>

      <section className="mx-auto mt-16 grid max-w-7xl gap-14 px-6 md:grid-cols-2 md:items-center">
        <div data-reveal className="reveal-mask overflow-hidden bg-secondary">
          <img
            src={story}
            alt="Inside the MD Attire studio"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
          />
        </div>
        <div data-reveal className="reveal space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            MD Attire began in a two-room studio with a single roll of Belgian linen and a stubborn
            belief that a wardrobe should get better with age, not worse.
          </p>
          <p>
            We work with three mills we've visited in person, dye in small lots, and finish every
            garment by hand. It takes longer. That's the point.
          </p>
          <p>
            Nothing is designed for a single season. Each piece is drafted to sit alongside what
            came before it, so the collection grows rather than resets.
          </p>
        </div>
      </section>

      <div className="mt-24">
        <Marquee
          items={["Since 2019", "Cut by hand", "Fifty pieces or fewer", "Repair, not replace"]}
        />
      </div>

      <section className="mx-auto mt-24 max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-3">
          {VALUES.map((value, i) => (
            <article
              key={value.title}
              data-reveal
              className="reveal lift-card border border-border p-8"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="font-display text-3xl font-light text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-5 font-display text-xl">{value.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-28 max-w-3xl px-6 text-center">
        <h2 data-reveal className="reveal font-display text-4xl font-light">
          Start with one good piece
        </h2>
        <Link
          to="/shop"
          className="press mt-8 inline-flex bg-foreground px-9 py-4 text-xs tracking-[0.24em] text-background uppercase"
        >
          Browse the collection
        </Link>
      </section>
    </div>
  );
}
