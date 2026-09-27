import { createFileRoute } from "@tanstack/react-router";
import { langChapterRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/es/$book/$chapter")(
  langChapterRoute("es", "/es/$book/$chapter/$verse"),
);
