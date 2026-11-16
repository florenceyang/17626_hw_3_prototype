import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test } from "vitest";
import { UploadStep } from "../../src/components/UploadStep";
import { applicableDocuments } from "../../src/rules/documents";
import type { UploadedDocument } from "../../src/types";
import { answers } from "../unit/fixtures";

const ITEMS = applicableDocuments(
  "eviction",
  answers({ "Q-SUBSIDY": "none", "Q-HAS-INCOME": false }),
  { isUrgent: false, reasons: [] },
);

let latest: UploadedDocument[] = [];
function Harness() {
  const [docs, setDocs] = useState<UploadedDocument[]>([]);
  latest = docs;
  return <UploadStep items={ITEMS} documents={docs} onChange={setDocs} onBack={() => {}} onContinue={() => {}} />;
}

const file = (name: string, type: string) => new File(["fictional"], name, { type });

describe("UploadStep", () => {
  test("US3-AS1 / FR-015 photo instructions come before the first document slot; required flags are set", () => {
    render(<Harness />);
    const instructions = screen.getByTestId("photo-instructions");
    const firstSlot = screen.getAllByTestId(/^doc-slot-/)[0];
    expect(instructions.compareDocumentPosition(firstSlot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("doc-slot-evictionNotice")).toHaveAttribute("data-required", "true");
    expect(screen.getByTestId("doc-slot-lease")).toHaveAttribute("data-required", "true");
    expect(screen.getByTestId("doc-slot-courtPapers")).toHaveAttribute("data-required", "false");
  });

  test("US3-AS2 / FR-016 an upload simulated as unreadable is flagged immediately", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(screen.getByTestId("simulate-lease"), "unreadable");
    await user.upload(screen.getByTestId("file-lease"), file("lease.jpg", "image/jpeg"));
    expect(screen.getByTestId("doc-problem-lease")).toHaveTextContent(/can't read/i);
    expect(screen.getByRole("button", { name: "Retake or replace" })).toBeInTheDocument();
  });

  test("US3-AS2 / FR-016 changing the simulated result after upload flags a wrong page", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.upload(screen.getByTestId("file-evictionNotice"), file("notice.jpg", "image/jpeg"));
    expect(screen.queryByTestId("doc-problem-evictionNotice")).toBeNull();
    await user.selectOptions(screen.getByTestId("simulate-evictionNotice"), "wrongPage");
    expect(screen.getByTestId("doc-problem-evictionNotice")).toHaveTextContent(/wrong page/i);
  });

  test("edge: a file that is not an image or PDF is rejected with a message", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<Harness />);
    await user.upload(screen.getByTestId("file-lease"), file("notes.txt", "text/plain"));
    expect(screen.getByTestId("doc-type-error-lease")).toHaveTextContent(/photo or a PDF/);
    expect(latest).toEqual([]);
  });

  test("R4 only file metadata is kept, never contents", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.upload(screen.getByTestId("file-lease"), file("lease.pdf", "application/pdf"));
    expect(latest).toEqual([
      { type: "lease", fileName: "lease.pdf", mimeType: "application/pdf", sizeBytes: 9, readability: "readable" },
    ]);
  });
});
