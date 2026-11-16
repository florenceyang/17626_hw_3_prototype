import { useRef, useState } from "react";
import type { ApplicableDocument } from "../rules/documents";
import type { DocumentType, Readability, UploadedDocument } from "../types";

// T045: FR-015 (upload with photo instructions first), FR-016 (unreadable / wrong page flagged at once),
// R6 (readability is simulated), R4 (metadata only; file contents are never stored).

interface Props {
  items: ApplicableDocument[];
  documents: UploadedDocument[];
  onChange: (documents: UploadedDocument[]) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveLater: () => void;
  savedMessage: string | null;
}

const ACCEPTED = (mime: string) => mime.startsWith("image/") || mime === "application/pdf";

export function UploadStep({
  items,
  documents,
  onChange,
  onBack,
  onContinue,
  onSaveLater,
  savedMessage,
}: Props) {
  const [simulate, setSimulate] = useState<Partial<Record<DocumentType, Readability>>>({});
  const [typeErrors, setTypeErrors] = useState<Partial<Record<DocumentType, string>>>({});
  const inputs = useRef<Partial<Record<DocumentType, HTMLInputElement | null>>>({});
  const pendingRetakes = useRef<Partial<Record<DocumentType, UploadedDocument>>>({});
  const retakeClicks = useRef<Partial<Record<DocumentType, boolean>>>({});

  const docsFor = (type: DocumentType) => documents.filter((d) => d.type === type);

  const onFiles = (type: DocumentType, files: File[]) => {
    if (files.length === 0) return;
    if (files.some((file) => !ACCEPTED(file.type))) {
      setTypeErrors((e) => ({ ...e, [type]: "We can't use this type of file. Please choose a photo or a PDF." }));
      return;
    }
    setTypeErrors((e) => ({ ...e, [type]: undefined }));
    const retaking = pendingRetakes.current[type];
    const retained = docsFor(type).filter((doc) => doc !== retaking);
    const added = files.map(
      (file): UploadedDocument => ({
        type,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        readability: simulate[type] ?? "readable",
      }),
    );
    onChange([...documents.filter((d) => d.type !== type), ...retained, ...added]);
    delete pendingRetakes.current[type];
  };

  const onSimulate = (type: DocumentType, value: Readability) => {
    setSimulate((s) => ({ ...s, [type]: value }));
    onChange(documents.map((doc) => (doc.type === type ? { ...doc, readability: value } : doc)));
  };

  const retake = (type: DocumentType, doc: UploadedDocument) => {
    pendingRetakes.current[type] = doc;
    retakeClicks.current[type] = true;
    inputs.current[type]?.click();
  };

  return (
    <section className="upload" data-testid="upload-step">
      <h1>Add photos of your papers</h1>

      <div className="notice" data-testid="photo-instructions">
        <h2>How to take a good photo</h2>
        <ul>
          <li>Put the page on a flat, dark surface.</li>
          <li>Use good light. Turn off the flash.</li>
          <li>Make sure all four corners of the page are in the photo.</li>
          <li>Take one photo for each page.</li>
        </ul>
        <p>You can send your request without documents. Staff may ask for them later.</p>
      </div>

      {items.map(({ rule, required }) => {
        const typeDocuments = docsFor(rule.type);
        const unreadable = typeDocuments.filter((doc) => doc.readability !== "readable");
        const inputId = `file-${rule.type}`;
        return (
          <div key={rule.type} className="doc-slot" data-testid={`doc-slot-${rule.type}`} data-required={String(required)}>
            <h3>
              {rule.label} <span className={required ? "tag required" : "tag"}>{required ? "Needed" : "Optional"}</span>
            </h3>
            <p className="explanation">{rule.explanation}</p>

            <label className="simulate">
              Prototype: simulate result{" "}
              <select
                data-testid={`simulate-${rule.type}`}
                value={simulate[rule.type] ?? typeDocuments[0]?.readability ?? "readable"}
                onChange={(e) => onSimulate(rule.type, e.target.value as Readability)}
              >
                <option value="readable">Readable</option>
                <option value="unreadable">Unreadable</option>
                <option value="wrongPage">Wrong page</option>
              </select>
            </label>

            <label htmlFor={inputId} className="file-label">
              Choose photos or files for: {rule.label}
            </label>
            <input
              ref={(input) => {
                inputs.current[rule.type] = input;
              }}
              id={inputId}
              data-testid={`file-${rule.type}`}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onClick={() => {
                if (!retakeClicks.current[rule.type]) delete pendingRetakes.current[rule.type];
                retakeClicks.current[rule.type] = false;
              }}
              onChange={(e) => {
                onFiles(rule.type, Array.from(e.target.files ?? []));
                e.currentTarget.value = "";
              }}
            />

            {typeErrors[rule.type] && (
              <p className="notice warn" role="alert" data-testid={`doc-type-error-${rule.type}`}>
                {typeErrors[rule.type]}
              </p>
            )}

            {typeDocuments.some((doc) => doc.readability === "readable") && (
              <ul className="uploaded-files" aria-label={`Received files for ${rule.label}`}>
                {typeDocuments
                  .filter((doc) => doc.readability === "readable")
                  .map((doc, index) => (
                    <li key={`${doc.fileName}-${index}`} className="notice ok" role="status">
                      Received: {doc.fileName}
                    </li>
                  ))}
              </ul>
            )}
            {unreadable.length > 0 && (
              <div className="notice warn" role="alert" data-testid={`doc-problem-${rule.type}`}>
                {unreadable.map((doc, index) => (
                  <div key={`${doc.fileName}-${index}`}>
                    <p>
                      {doc.fileName}:{" "}
                      {doc.readability === "unreadable"
                        ? "We can't read this photo. It may be blurry or too dark."
                        : `This looks like the wrong page. Please check that it is your ${rule.label.toLowerCase()}.`}
                    </p>
                    <button type="button" className="secondary" onClick={() => retake(rule.type, doc)}>
                      Retake or replace
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <p className="next-step" data-testid="next-step">
        Next: review your answers
      </p>
      <div className="actions">
        <button type="button" className="secondary" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary" onClick={onContinue}>
          Continue to review
        </button>
      </div>
      <div className="save-later">
        <button type="button" className="link" data-testid="save-later" onClick={onSaveLater}>
          Save and finish later
        </button>
        {savedMessage && (
          <span role="status" className="saved">
            {savedMessage}
          </span>
        )}
      </div>
    </section>
  );
}
