import { createFileRoute } from "@tanstack/react-router";
import { langVerseRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/pt/$book/$chapter/$verse")(langVerseRoute("pt"));
