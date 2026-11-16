import { COPY } from "../config/copy";

// FR-026: simulated features are visibly labeled.
export function MockBanner() {
  return (
    <div className="mock-banner" data-testid="mock-banner" role="note">
      {COPY.mockBanner}
    </div>
  );
}
