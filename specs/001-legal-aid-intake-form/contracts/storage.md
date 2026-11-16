# Contract: In-Browser Storage

All persistence uses `localStorage` in the applicant's browser (Principle IV, R4). Nothing is
sent over the network.

| Key | Value | Written when | Read by |
|---|---|---|---|
| `lai.v1.requests` | JSON array of HelpRequest records with status `waitingForStaffReview` | On submit | Staff list (FR-023), account status (FR-020) |
| `lai.v1.accounts` | JSON object mapping nickname to MockAccount | Account created, draft saved, or request submitted while logged in | Account screens (FR-018 to FR-020) |

## Rules

- **Version prefix**: the `v1` in each key is the schema version. A change that breaks the
  schema uses a new prefix and ignores old data.
- **Anonymous drafts**: never written to storage (R4).
- **Uploaded files**: only metadata is stored, never file contents (R4).
- **Private answers in staff records**:
  - Private (danger) answers are stored on the request, because staff need them.
  - Applicant screens never render them (FR-011).
  - The staff list shows only the urgency reason "danger".
- **Quick exit**: clears in-memory state only. It does not erase other requests or accounts
  already submitted or saved.
- **Prototype reset**: the staff list page offers a "Clear prototype data" button, labeled as a
  mock, that removes both keys. This supports repeatable test runs.
- **Bad stored data**: if stored JSON cannot be parsed, the app treats the key as empty and does
  not crash.
