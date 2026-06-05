import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/investor")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
