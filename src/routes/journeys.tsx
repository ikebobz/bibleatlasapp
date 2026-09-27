import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/journeys")({
  head: () => ({
    meta: [
      { title: "Bible Journeys — Follow Routes Through Scripture | Bible Atlas" },
      { name: "description", content: "Follow Abraham, Jacob, Israel, Jesus and Paul across interactive maps with stops, passages and context." },
      { property: "og:title", content: "Bible Journeys — Follow Routes Through Scripture | Bible Atlas" },
      { property: "og:description", content: "Follow Abraham, Jacob, Israel, Jesus and Paul across interactive maps with stops, passages and context." },
    ],
  }),
  component: () => <Outlet />,
});
