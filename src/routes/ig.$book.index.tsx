import { createFileRoute } from "@tanstack/react-router";
import { langBookRoute } from "@/components/reader/lang-route-options";

export const Route = createFileRoute("/ig/$book/")(langBookRoute("ig"));
