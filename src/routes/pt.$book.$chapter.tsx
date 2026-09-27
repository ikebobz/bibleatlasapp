import { createFileRoute } from "@tanstack/react-router";
import { langChapterRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/pt/$book/$chapter")(
  langChapterRoute("pt", "/pt/$book/$chapter/$verse"),
);
