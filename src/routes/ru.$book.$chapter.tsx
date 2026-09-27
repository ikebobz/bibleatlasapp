import { createFileRoute } from "@tanstack/react-router";
import { langChapterRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/ru/$book/$chapter")(
  langChapterRoute("ru", "/ru/$book/$chapter/$verse"),
);
