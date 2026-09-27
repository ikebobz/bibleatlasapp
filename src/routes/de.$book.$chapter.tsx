import { createFileRoute } from "@tanstack/react-router";
import { langChapterRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/de/$book/$chapter")(
  langChapterRoute("de", "/de/$book/$chapter/$verse"),
);
