import { createFileRoute } from "@tanstack/react-router";
import { langChapterRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/zh/$book/$chapter")(
  langChapterRoute("zh", "/zh/$book/$chapter/$verse"),
);
