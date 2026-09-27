import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Map as MapIcon,
  Search,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import readerShot from "@/assets/reader-context.jpg";
import journeyShot from "@/assets/journey-map.jpg";
import connectionsShot from "@/assets/connections-graph.jpg";

import { SITE_URL as SITE } from "@/lib/site";
import { TRANSLATIONS } from "@/lib/translations";
import { CARD_VERSION } from "@/lib/share";



const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Bible Atlas?",
    a: "Bible Atlas is a free online Bible reader that keeps the context beside the text. As you read, names, places, journeys and themes are highlighted — tap one and a panel opens with an interactive map, a short profile, a family line, a timeline and the passages where it appears. The Scripture itself never leaves the screen.",
  },
  {
    q: "Which Bible translations can I read?",
    a: "The default is the King James Version. You can also switch to the World English Bible, American Standard Version, Young's Literal Translation, Darby, Bible in Basic English, Douay-Rheims and several non-English public-domain texts including Luther 1912, Segond 1910, Almeida, Statenvertaling, the Russian Synodal Bible, the Chinese Union Version the Latin Vulgate, and the Biblica Open Yoruba and Igbo Bibles.",
  },
  {
    q: "Does Bible Atlas work offline?",
    a: "Yes. You can download the complete King James Version to your device in a few megabytes and keep reading, searching and using highlights with no connection. Chapters you have already opened are also cached automatically.",
  },
  {
    q: "Is Bible Atlas free?",
    a: "Yes. Reading, maps, journeys, the concordance, offline download and verse sharing are all free, and there is no account required to start reading.",
  },
  {
    q: "Where do the maps and place information come from?",
    a: "Routes and places are drawn from the biblical text itself, with each stop tied to the passage that records it, plus widely accepted historical geography for locations and approximate distances. Every journey stop links straight back to the Scripture it comes from so you can check it as you go.",
  },
  {
    q: "How does the concordance work?",
    a: "The concordance indexes the full King James text, so searching a word returns every occurrence grouped by how it is used and where it appears — for example 'faith' in the Torah compared with Paul's letters — with a chart of occurrences by book and links back into the chapter you are reading.",
  },
  {
    q: "Can I share a verse?",
    a: "Yes. Any verse can be shared as a link that opens directly on that verse, with a branded preview card showing the reference and the verse text on WhatsApp, iMessage, X, Telegram, Facebook, LinkedIn and Discord.",
  },
];

export const Route = createFileRoute("/about")({
  head: () => {
    const title = "Bible Atlas — Bible Journeys, People & Places";
    const description =
      "Bible Atlas is a free Bible reader that puts interactive maps, people, places, journeys and connections beside the text. Read the KJV online or offline.";
    const url = `${SITE}/about`;
    const image = `${SITE}/api/public/og/about?v=${CARD_VERSION}`;
    const imageAlt =
      "Bible Atlas — read the Bible with maps, people and places in view";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: imageAlt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        { name: "twitter:image:alt", content: imageAlt },
      ],

      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        },
      ],
    };
  },
  component: AboutPage,
});

function StartReading({ variant = "primary" }: { variant?: "primary" | "muted" }) {
  return (
    <Link
      to="/$book/$chapter"
      params={{ book: "genesis", chapter: "1" }}
      search={{ tour: 1 }}
      className={
        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors " +
        (variant === "primary"
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "border text-foreground hover:bg-muted")
      }
    >
      <BookOpen className="h-4 w-4" />
      Start reading Genesis 1
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

type Slide = {
  src: string;
  alt: string;
  step: string;
  title: string;
  caption: string;
  next: string;
};

const SLIDES: Slide[] = [
  {
    src: readerShot,
    alt: "Genesis 12 in Bible Atlas with the Abraham context panel open beside the text, showing a map of his journey",
    step: "Step 1",
    title: "Read the chapter — Scripture stays in view",
    caption:
      "Genesis 12 with Abraham's context panel open. The chapter keeps reading while the map, facts and family line sit alongside it.",
    next: "Next: tap a highlighted name",
  },
  {
    src: journeyShot,
    alt: "Animated map of Abraham's journey from Ur of the Chaldeans through Haran to Canaan and Egypt",
    step: "Step 2",
    title: "Tap a name — the map opens beside the text",
    caption:
      "Abraham's journey animated stop by stop, with cumulative distance and the Genesis passage for each place.",
    next: "Next: follow the thread further",
  },
  {
    src: connectionsShot,
    alt: "The Bible Atlas connections graph linking Old Testament and New Testament moments by theme",
    step: "Step 3",
    title: "Follow it further — timelines and connections",
    caption:
      "The connections graph — 80 moments and 111 links between the Old and New Testaments, filtered by theme.",
    next: "Then: back to the verse you were reading",
  },
];

function ShotCarousel() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.children[index] as HTMLElement | undefined;
    if (item) track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const children = Array.from(track.children) as HTMLElement[];
        const left = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;
        children.forEach((child, i) => {
          const center = child.offsetLeft - track.offsetLeft + child.clientWidth / 2;
          const distance = Math.abs(center - left);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        });
        setActive(best);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  const move = (delta: number) => {
    const next = Math.min(SLIDES.length - 1, Math.max(0, active + delta));
    setActive(next);
    scrollTo(next);
  };

  return (
    <div
      className="mt-6"
      role="group"
      aria-roledescription="carousel"
      aria-label="Bible Atlas screenshots"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      <ul
        ref={trackRef}
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
      >
        {SLIDES.map((slide, index) => (
          <li
            key={slide.title}
            className="w-[85%] shrink-0 snap-center sm:w-[70%] lg:w-[60%]"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${SLIDES.length}: ${slide.title}`}
          >
            <figure className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
              <img
                src={slide.src}
                alt={slide.alt}
                width={1600}
                height={1075}
                loading="lazy"
                decoding="async"
                className="w-full"
              />
              <figcaption className="flex flex-1 flex-col border-t px-4 py-4">
                <span className="text-[0.7rem] uppercase tracking-[0.16em] text-primary">
                  {slide.step}
                </span>
                <span className="mt-1.5 text-sm font-medium text-foreground">{slide.title}</span>
                <span className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {slide.caption}
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary">
                  {slide.next}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Show screenshot ${index + 1}: ${slide.title}`}
              aria-current={index === active}
              onClick={() => {
                setActive(index);
                scrollTo(index);
              }}
              className={
                "h-2 rounded-full transition-all " +
                (index === active ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30")
              }
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous screenshot"
            disabled={active === 0}
            onClick={() => move(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next screenshot"
            disabled={active === SLIDES.length - 1}
            onClick={() => move(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}


function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Bible Atlas
        </Link>
        <span className="px-1.5 opacity-50">/</span>
        <span className="text-foreground">About</span>
      </nav>

      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          A Bible reader with the world behind it
        </p>
        <h1 className="scripture mt-3 text-4xl leading-tight text-foreground sm:text-5xl">
          Bible Atlas — Read Scripture with Interactive Maps and Context
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Read Scripture with its maps, people, places and connections one tap away. Every
          highlighted name opens an interactive panel — a route drawn across the ancient world, a
          family line, a timeline, the other passages it touches — while the text you were reading
          stays right where it is.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <StartReading />
          <Link
            to="/journeys"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <MapIcon className="h-4 w-4" />
            Explore interactive maps
          </Link>
          <a
            href="https://www.instagram.com/mybibleatlas"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Follow Bible Atlas on Instagram"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Instagram className="h-4 w-4" />
            @mybibleatlas
          </a>
        </div>
      </header>

      <section className="mt-14" aria-labelledby="what-you-get">
        <h2 id="what-you-get" className="scripture text-2xl text-foreground">
          What you get while you read
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: MapIcon,
              title: "Journeys and journeys",
              body: "Abraham's road out of Ur, Paul's missionary voyages, the Exodus — animated routes with distances, dates and the passage for every stop.",
              to: "/journeys" as const,
              cta: "Open the maps",
            },
            {
              icon: BookOpen,
              title: "People and place profiles",
              body: "Tap a name in the text for a short profile, family line and the places tied to it, without losing your spot in the chapter.",
              to: "/connections" as const,
              cta: "See the connections graph",
            },
            {
              icon: Search,
              title: "A full KJV concordance",
              body: "Search any word and see every occurrence grouped by usage, with a breakdown of where it appears across the books.",
              to: "/concordance" as const,
              cta: "Search the concordance",
            },
            {
              icon: CalendarClock,
              title: "A timeline of Scripture",
              body: "Place people and events beside one another and follow the story from the patriarchs to the early church.",
              to: "/timeline" as const,
              cta: "Open the timeline",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5">
              <f.icon className="h-4.5 w-4.5 text-primary" />
              <h3 className="mt-3 text-base font-medium text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              <Link
                to={f.to}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                {f.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <WifiOff className="h-4 w-4" />
          Download the whole King James Version to your device and keep reading, searching and
          highlighting with no connection.
        </p>
      </section>

      <section className="mt-16" aria-labelledby="see-it">
        <h2 id="see-it" className="scripture text-2xl text-foreground">
          See it in action
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Bible text first, context second — swipe through the three steps of a single reading
          session.
        </p>
        <ShotCarousel />
      </section>


      <section className="mt-16 rounded-2xl border bg-card px-6 py-8 text-center" aria-labelledby="start">
        <h2 id="start" className="scripture text-2xl text-foreground">
          Start in Genesis
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          No account, no setup. Open chapter one and tap the first highlighted name you meet.
        </p>
        <div className="mt-6 flex justify-center">
          <StartReading />
        </div>
      </section>

      <section className="mt-16" aria-labelledby="faq">
        <h2 id="faq" className="scripture text-2xl text-foreground">
          Frequently asked questions
        </h2>
        <div className="mt-6 divide-y rounded-2xl border bg-card">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <h3 className="text-base font-medium text-foreground">{item.q}</h3>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16" aria-labelledby="attribution">
        <h2 id="attribution" className="scripture text-2xl text-foreground">
          Scripture text and licences
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Most translations in Bible Atlas are public domain. The versions below are used with
          permission under their publishers' terms.
        </p>
        <ul className="mt-5 space-y-4">
          {TRANSLATIONS.filter((t) => t.copyright).map((t) => (
            <li key={t.id} className="rounded-2xl border bg-card px-5 py-4">
              <h3 className="text-sm font-medium text-foreground">
                {t.name} <span className="text-muted-foreground">({t.language})</span>
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {t.copyright}
                {t.licence && (
                  <>
                    {" "}
                    Licensed under{" "}
                    <a
                      href={t.licence.url}
                      target="_blank"
                      rel="noreferrer noopener license"
                      className="underline underline-offset-2"
                    >
                      {t.licence.name}
                    </a>
                    . The original work by Biblica, Inc. is available for free at{" "}
                    <a
                      href="https://open.bible"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline underline-offset-2"
                    >
                      open.bible
                    </a>
                    .
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>


      <footer className="mt-14 flex flex-wrap gap-x-5 gap-y-2 border-t pt-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Read the Bible
        </Link>
        <Link to="/journeys" className="hover:text-foreground">
          Journeys
        </Link>
        <Link to="/timeline" className="hover:text-foreground">
          Timeline
        </Link>
        <Link to="/concordance" className="hover:text-foreground">
          Concordance
        </Link>
        <Link to="/connections" className="hover:text-foreground">
          Connections
        </Link>
        <Link to="/whats-new" className="hover:text-foreground">
          What's new
        </Link>
        <a
          href="https://www.instagram.com/mybibleatlas"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Follow Bible Atlas on Instagram"
          className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <Instagram className="h-4 w-4" />
          @mybibleatlas
        </a>
      </footer>
    </main>
  );
}
