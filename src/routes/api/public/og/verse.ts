/**
 * Share card endpoint for a verse.
 *
 * A previous version compiled its WASM rasteriser at module scope, which blew
 * the worker's startup budget and took the published site down. Everything
 * heavy here is therefore loaded lazily *inside* the handler and memoised, so
 * a cold start costs nothing until a crawler actually asks for an image.
 *
 * The endpoint never redirects and never 404s: any failure still returns a
 * branded PNG, so a shared link can never unfurl with a blank or missing
 * image.
 */

import { createFileRoute } from "@tanstack/react-router";

import { getBook } from "@/lib/bible";
import { defaultCardSvg, verseCardSvg } from "@/lib/og/verse-card";
import { normalizeVerseText } from "@/lib/share-meta";
import { DEFAULT_TRANSLATION, getTranslation, type TranslationId } from "@/lib/translations";

const CACHE = "public, max-age=86400, s-maxage=604800, immutable";

type Renderer = (svg: string) => Uint8Array;

let rendererPromise: Promise<Renderer> | null = null;

/**
 * The rasteriser and its fonts are served as ordinary static files and pulled
 * in on first use, so neither the worker bundle nor its startup pays for them.
 */
async function fetchBytes(origin: string, path: string) {
  const res = await fetch(new URL(path, origin).toString());
  if (!res.ok) throw new Error(`${path} responded ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * Compile the rasteriser without ever materialising 2.4 MB in memory.
 *
 * Streaming compilation is what the worker runtime is optimised for; buffering
 * the module first was enough to blow the request budget in production, which
 * is why every live card fell back to the static parchment image.
 */
async function compileWasm(origin: string): Promise<WebAssembly.Module> {
  const url = new URL("/render/resvg.wasm", origin).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`resvg.wasm responded ${res.status}`);
  try {
    return await WebAssembly.compileStreaming(res.clone());
  } catch {
    return WebAssembly.compile(await res.arrayBuffer());
  }
}

/** Initialise the rasteriser once per isolate; concurrent calls share it. */
function getRenderer(origin: string): Promise<Renderer> {
  rendererPromise ??= (async () => {
    const { Resvg, initWasm } = await import("@resvg/resvg-wasm");
    const [wasm, regular, semibold] = await Promise.all([
      compileWasm(origin),
      fetchBytes(origin, "/render/Spectral-Regular.ttf"),
      fetchBytes(origin, "/render/Spectral-SemiBold.ttf"),
    ]);
    try {
      await initWasm(wasm);
    } catch (error) {
      // The module is initialised per isolate; a hot reload can re-enter this
      // path with the WASM already live, which is harmless.
      if (!/already initialized/i.test(String(error))) throw error;
    }

    const fontBuffers = [regular, semibold];
    return (svg: string) => {
      const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: 1200 },
        font: { fontBuffers, defaultFontFamily: "Spectral", loadSystemFonts: false },
      });
      return resvg.render().asPng();
    };
  })().catch((error) => {
    rendererPromise = null;
    throw error;
  });
  return rendererPromise;
}


/**
 * `x-card-render` says which path produced the image — `verse`, `default` or
 * `static`. The admin diagnostics page reads it, so a silent regression back
 * to the generic parchment card is visible instead of invisible.
 */
function png(bytes: Uint8Array, kind: "verse" | "default") {
  return new Response(bytes as unknown as BodyInit, {
    headers: { "content-type": "image/png", "cache-control": CACHE, "x-card-render": kind },
  });
}

/** Last-resort image: the static branded parchment card shipped in /public. */
async function staticFallback(origin: string) {
  try {
    const res = await fetch(new URL("/og/default-card.jpg", origin).toString());
    if (res.ok) {
      return new Response(res.body, {
        headers: {
          "content-type": "image/jpeg",
          "cache-control": CACHE,
          "x-card-render": "static",
        },
      });
    }
  } catch {
    /* ignore */
  }
  return new Response(null, {
    status: 302,
    headers: { location: "/og/default-card.jpg", "x-card-render": "static" },
  });
}

/** Pull the verse text when the caller only gave us a location. */
async function resolveText(params: URLSearchParams): Promise<string | null> {
  const given = params.get("text");
  if (given) return normalizeVerseText(given);

  const bookId = params.get("book");
  const chapter = Number(params.get("chapter"));
  const verse = Number(params.get("verse"));
  if (!bookId || !getBook(bookId) || !chapter || !verse) return null;
  try {
    const { loadChapter } = await import("@/lib/chapter.server");
    const translation = (params.get("t") as TranslationId | null) ?? DEFAULT_TRANSLATION;
    const data = await loadChapter(bookId, chapter, translation);
    const match = data.verses.find((v) => v.number === verse);
    return match ? normalizeVerseText(match.text) : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/og/verse")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const rawRef = url.searchParams.get("ref")?.slice(0, 80).trim() ?? "";
        const version = getTranslation(url.searchParams.get("t") ?? undefined);
        const reference = rawRef ? `${rawRef}, ${version.label}` : "";

        const debug = url.searchParams.get("debug") === "1";

        try {
          const render = await getRenderer(url.origin);
          const text = reference ? await resolveText(url.searchParams) : null;
          const svg = reference ? verseCardSvg({ reference, text }) : defaultCardSvg();
          const bytes = render(svg);
          if (debug) {
            return Response.json({ render: reference ? "verse" : "default", bytes: bytes.length });
          }
          return png(bytes, reference ? "verse" : "default");
        } catch (error) {
          // Rendering failed — still hand back a branded image, never a blank.
          if (debug) {
            return Response.json({ render: "failed", error: String(error) }, { status: 200 });
          }
          try {
            const render = await getRenderer(url.origin);

            return png(render(defaultCardSvg()), "default");
          } catch {
            return staticFallback(url.origin);
          }
        }
      },
    },
  },
});
