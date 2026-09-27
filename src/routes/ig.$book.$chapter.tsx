import { createFileRoute } from "@tanstack/react-router";
import { langChapterRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/ig/$book/$chapter")(
  langChapterRoute("ig", "/ig/$book/$chapter/$verse"),
);
