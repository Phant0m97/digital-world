import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";

function basepath(): string | undefined {
  const raw = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (!raw || raw === "." || raw === "/") return undefined;
  return raw;
}

export function getRouter() {
  return createRouter({
    routeTree,
    basepath: basepath(),
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
