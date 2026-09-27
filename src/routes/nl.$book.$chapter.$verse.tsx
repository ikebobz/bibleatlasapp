import { createFileRoute } from "@tanstack/react-router";
import { langVerseRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/nl/$book/$chapter/$verse")(langVerseRoute("nl"));
