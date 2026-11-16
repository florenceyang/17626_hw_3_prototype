import { useEffect, useState } from "react";

// Hash routes (contracts/ui-screens.md). Form steps are app state, never routes (R3).
export type Route = "welcome" | "form" | "confirmation" | "account" | "staff";

const ROUTES: Record<string, Route> = {
  "#/": "welcome",
  "": "welcome",
  "#": "welcome",
  "#/form": "form",
  "#/confirmation": "confirmation",
  "#/account": "account",
  "#/staff": "staff",
};

const HASHES: Record<Route, string> = {
  welcome: "#/",
  form: "#/form",
  confirmation: "#/confirmation",
  account: "#/account",
  staff: "#/staff",
};

export function parseRoute(hash: string): Route {
  return ROUTES[hash] ?? "welcome";
}

/** `replace` swaps the current history entry instead of adding one. */
export function navigate(route: Route, replace = false): void {
  if (replace) window.location.replace(HASHES[route]);
  else window.location.hash = HASHES[route];
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
