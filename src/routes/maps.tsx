import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Legacy route family retained so published /maps links redirect safely. */
export const Route = createFileRoute("/maps")({
  head: () => ({
    meta: [
      { title: "Bible Maps — Explore Places of Scripture | Bible Atlas" },
      { name: "description", content: "Explore biblical places on an interactive terrain map with passages, related people and journeys." },
      { property: "og:title", content: "Bible Maps — Explore Places of Scripture | Bible Atlas" },
      { property: "og:description", content: "Explore biblical places on an interactive terrain map with passages, related people and journeys." },
    ],
  }),
  component: () => <Outlet />,
});
