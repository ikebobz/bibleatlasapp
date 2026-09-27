import { createFileRoute } from "@tanstack/react-router";
import { langVerseRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/ru/$book/$chapter/$verse")(langVerseRoute("ru"));
