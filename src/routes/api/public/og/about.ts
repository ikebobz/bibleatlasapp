/**
 * Share card endpoint for the /about landing page.
 *
 * Mirrors the verse card endpoint: the WASM rasteriser and its fonts are
 * loaded lazily inside the handler and memoised per isolate, and any failure
 * still returns a branded image so a shared link never unfurls blank.
 */

import { createFileRoute } from "@tanstack/react-router";

import { aboutCardSvg } from "@/lib/og/about-card";
import { defaultCardSvg } from "@/lib/og/verse-card";

const CACHE = "public, max-age=86400, s-maxage=604800, immutable";
const ASSET_ORIGIN = "https://www.mybibleatlas.com";

type Renderer = (svg: string) => Uint8Array;

let rendererPromise: Promise<Renderer> | null = null;

async function fetchBytes(path: string) {
  const res = await fetch(new URL(path, ASSET_ORIGIN).toString());
  if (!res.ok) throw new Error(`${path} responded ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Streaming compilation keeps a cold render inside the worker's budget. */
async function compileWasm(): Promise<WebAssembly.Module> {
  const res = await fetch(new URL("/render/resvg.wasm", ASSET_ORIGIN).toString());
  if (!res.ok) throw new Error(`resvg.wasm responded ${res.status}`);
  try {
    return await WebAssembly.compileStreaming(res.clone());
  } catch {
    return WebAssembly.compile(await res.arrayBuffer());
  }
}

function getRenderer(): Promise<Renderer> {
  rendererPromise ??= (async () => {
    const { Resvg, initWasm } = await import("@resvg/resvg-wasm");
    const [wasm, regular, semibold] = await Promise.all([
      compileWasm(),
      fetchBytes("/render/Spectral-Regular.ttf"),
      fetchBytes("/render/Spectral-SemiBold.ttf"),
    ]);
    try {
      await initWasm(wasm);
    } catch (error) {
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

function png(bytes: Uint8Array) {
  return new Response(bytes as unknown as BodyInit, {
    headers: { "content-type": "image/png", "cache-control": CACHE },
  });
}

async function staticFallback() {
  try {
    const res = await fetch(new URL("/og/default-card.jpg", ASSET_ORIGIN).toString());
    if (res.ok) {
      return new Response(res.body, {
        headers: { "content-type": "image/jpeg", "cache-control": CACHE },
      });
    }
  } catch {
    /* ignore */
  }
  return new Response(null, { status: 302, headers: { location: "/og/default-card.jpg" } });
}

export const Route = createFileRoute("/api/public/og/about")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        void request;
        try {
          const render = await getRenderer();
          return png(render(aboutCardSvg()));
        } catch {
          try {
            const render = await getRenderer();
            return png(render(defaultCardSvg()));
          } catch {
            return staticFallback();
          }
        }
      },
    },
  },
});
