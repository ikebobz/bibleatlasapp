import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/connections")({
  head: () => ({
    meta: [
      { title: "Bible Connections — Trace Links Across Scripture | Bible Atlas" },
      { name: "description", content: "Explore how people, places, events and themes connect across the Bible, with passages explaining each link." },
      { property: "og:title", content: "Bible Connections — Trace Links Across Scripture | Bible Atlas" },
      { property: "og:description", content: "Explore how people, places, events and themes connect across the Bible, with passages explaining each link." },
    ],
  }),
  component: () => <Outlet />,
});
