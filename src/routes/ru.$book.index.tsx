import { createFileRoute } from "@tanstack/react-router";
import { langBookRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/ru/$book/")(langBookRoute("ru"));
