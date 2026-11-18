import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// T037 (FR-003, R3): if the browser restores this page from its back/forward cache after quick exit,
// blank it and reload so no answers are ever shown again.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    document.body.innerHTML = "";
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
