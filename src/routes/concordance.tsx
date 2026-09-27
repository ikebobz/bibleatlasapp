import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/concordance")({
  head: () => ({
    meta: [
      { title: "Bible Concordance — Search Words in Scripture | Bible Atlas" },
      { name: "description", content: "Search every occurrence of a word across the Bible, with verse context and links to the full chapter." },
      { property: "og:title", content: "Bible Concordance — Search Words in Scripture | Bible Atlas" },
      { property: "og:description", content: "Search every occurrence of a word across the Bible, with verse context and links to the full chapter." },
    ],
  }),
  component: () => <Outlet />,
});
