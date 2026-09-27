/**
 * @vitest-environment jsdom
 *
 * The reader-facing panels must render the cached record straight from the
 * device after a refresh, without a server call, and must degrade to a
 * friendly message when the AI path fails.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const serverCall = vi.fn();

vi.mock("@tanstack/react-start", () => ({
  useServerFn: () => serverCall,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/lib/lexicon/lexicon.functions", () => ({
  getLexeme: vi.fn(),
  getPronunciationAudio: vi.fn(),
}));

vi.mock("@/lib/threads/ai.functions", () => ({ getThreadInsight: vi.fn() }));

vi.mock("@/lib/threads/graph", () => ({
  neighbours: () => [],
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const LEXEME = {
  word: "heaven",
  language: "Hebrew" as const,
  original: "שָׁמַיִם",
  transliteration: "shamayim",
  pronunciation: "shah-MAH-yim",
  strongs: "H8064",
  gloss: "the heavens, the sky",
  senses: ["visible sky"],
  root: null,
  occurrences: [],
  related: [],
  note: "",
};

const INSIGHT = {
  paragraphs: ["Eden's garden echoes forward into the city of God."],
  links: [{ ref: "Revelation 22:2", note: "Tree of life" }],
  generated: true as const,
};

afterEach(cleanup);

beforeEach(() => {
  window.localStorage.clear();
  serverCall.mockReset();
  vi.resetModules();
});

describe("LexiconCard", () => {
  const props = {
    word: "heaven",
    reference: "Genesis 1:1",
    verseText: "In the beginning God created the heaven and the earth.",
  };

  it("renders from the device cache after a refresh with no server call", async () => {
    const { lexemeKey, writeCachedLexeme } = await import("@/lib/lexicon/cache");
    writeCachedLexeme(lexemeKey({ reference: props.reference, word: props.word }), LEXEME);

    const { LexiconCard } = await import("./LexiconCard");
    render(<LexiconCard {...props} />, { wrapper });

    expect(await screen.findByText("the heavens, the sky")).toBeTruthy();
    expect(screen.getByText("shah-MAH-yim")).toBeTruthy();
    expect(serverCall).not.toHaveBeenCalled();
  });

  it("shows the same text on a second mount, still without a server call", async () => {
    const { lexemeKey, writeCachedLexeme } = await import("@/lib/lexicon/cache");
    writeCachedLexeme(lexemeKey({ reference: props.reference, word: props.word }), LEXEME);
    const { LexiconCard } = await import("./LexiconCard");

    const first = render(<LexiconCard {...props} />, { wrapper });
    const text = (await screen.findByText("the heavens, the sky")).textContent;
    first.unmount();

    render(<LexiconCard {...props} />, { wrapper });
    expect((await screen.findByText("the heavens, the sky")).textContent).toBe(text);
    expect(serverCall).not.toHaveBeenCalled();
  });

  it("falls back to a friendly message when the lookup fails", async () => {
    serverCall.mockRejectedValue(new Error("gateway down"));
    const { LexiconCard } = await import("./LexiconCard");
    render(<LexiconCard {...props} />, { wrapper });

    await waitFor(() => expect(screen.getByText(/could not be loaded right now/i)).toBeTruthy(), {
      timeout: 5000,
    });
  });
});

describe("NodeDetail connections panel", () => {
  const node = {
    id: "eden",
    label: "Eden",
    ref: "Genesis 2:8",
    summary: "The garden God planted.",
    kind: "place",
    testament: "old",
    themes: [],
  };

  it("renders the cached insight without calling the server", async () => {
    const { insightKey, writeCachedInsight } = await import("@/lib/threads/insight-cache");
    writeCachedInsight(insightKey(node.id), INSIGHT);

    const { NodeDetail } = await import("@/components/threads/NodeDetail");
    render(<NodeDetail node={node as never} />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /find further connections/i }));

    expect(await screen.findByText(INSIGHT.paragraphs[0])).toBeTruthy();
    expect(serverCall).not.toHaveBeenCalled();
  });

  it("shows the fallback message when generation fails", async () => {
    serverCall.mockRejectedValue(new Error("gateway down"));
    const { NodeDetail } = await import("@/components/threads/NodeDetail");
    render(<NodeDetail node={node as never} />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /find further connections/i }));

    await waitFor(
      () => expect(screen.getByText(/could not be generated right now/i)).toBeTruthy(),
      { timeout: 5000 },
    );
  });
});
