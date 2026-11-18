import { useState } from "react";
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
}

const ACCEPTED = (mime: string) => mime.startsWith("image/") || mime === "application/pdf";

export function UploadStep({ items, documents, onChange, onBack, onContinue }: Props) {
  const [simulate, setSimulate] = useState<Partial<Record<DocumentType, Readability>>>({});
  const [typeErrors, setTypeErrors] = useState<Partial<Record<DocumentType, string>>>({});
  const [inputKeys, setInputKeys] = useState<Partial<Record<DocumentType, number>>>({});

  const docFor = (type: DocumentType) => documents.find((d) => d.type === type);
  const replace = (type: DocumentType, doc: UploadedDocument | null) =>
    onChange([...documents.filter((d) => d.type !== type), ...(doc ? [doc] : [])]);

  const onFile = (type: DocumentType, file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED(file.type)) {
      setTypeErrors((e) => ({ ...e, [type]: "We can't use this type of file. Please choose a photo or a PDF." }));
      return;
    }
    setTypeErrors((e) => ({ ...e, [type]: undefined }));
    replace(type, {
      type,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      readability: simulate[type] ?? "readable",
    });
  };

  const onSimulate = (type: DocumentType, value: Readability) => {
    setSimulate((s) => ({ ...s, [type]: value }));
    const existing = docFor(type);
    if (existing) replace(type, { ...existing, readability: value });
  };

  const retake = (type: DocumentType) => {
    replace(type, null);
    setInputKeys((k) => ({ ...k, [type]: (k[type] ?? 0) + 1 }));
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
        const doc = docFor(rule.type);
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
                value={simulate[rule.type] ?? doc?.readability ?? "readable"}
                onChange={(e) => onSimulate(rule.type, e.target.value as Readability)}
              >
                <option value="readable">Readable</option>
                <option value="unreadable">Unreadable</option>
                <option value="wrongPage">Wrong page</option>
              </select>
            </label>

            <label htmlFor={inputId} className="file-label">
              Choose a photo or file for: {rule.label}
            </label>
            <input
              key={inputKeys[rule.type] ?? 0}
              id={inputId}
              data-testid={`file-${rule.type}`}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => onFile(rule.type, e.target.files?.[0])}
            />

            {typeErrors[rule.type] && (
              <p className="notice warn" role="alert" data-testid={`doc-type-error-${rule.type}`}>
                {typeErrors[rule.type]}
              </p>
            )}

            {doc && doc.readability === "readable" && (
              <p className="notice ok" role="status">
                Received: {doc.fileName}
              </p>
            )}
            {doc && doc.readability !== "readable" && (
              <div className="notice warn" role="alert" data-testid={`doc-problem-${rule.type}`}>
                <p>
                  {doc.readability === "unreadable"
                    ? "We can't read this photo. It may be blurry or too dark."
                    : `This looks like the wrong page. Please check that it is your ${rule.label.toLowerCase()}.`}
                </p>
                <button type="button" className="secondary" onClick={() => retake(rule.type)}>
                  Retake or replace
                </button>
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
    </section>
  );
}
