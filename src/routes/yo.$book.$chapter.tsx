import { createFileRoute } from "@tanstack/react-router";
import { langChapterRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/yo/$book/$chapter")(
  langChapterRoute("yo", "/yo/$book/$chapter/$verse"),
);
