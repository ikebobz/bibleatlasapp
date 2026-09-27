import { createFileRoute } from "@tanstack/react-router";
import { langChapterRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/fr/$book/$chapter")(
  langChapterRoute("fr", "/fr/$book/$chapter/$verse"),
);
