import { createFileRoute } from "@tanstack/react-router";
import { langChapterRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/nl/$book/$chapter")(
  langChapterRoute("nl", "/nl/$book/$chapter/$verse"),
);
