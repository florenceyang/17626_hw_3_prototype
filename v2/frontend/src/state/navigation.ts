// Leaving the app for the quick-exit page (FR-003, R3). Kept in its own module so tests can mock it.
export function leaveTo(url: string): void {
  try {
    document.title = "Local weather";
    document.body.innerHTML = "";
  } catch {
    // ignore: leaving matters more than blanking
  }
  // replace() swaps the current history entry, so Back does not return to the form.
  window.location.replace(url);
}
