# Deliverables

### 1. GitHub Version 1

- **v1 branch:** https://github.com/florenceyang/17626_hw_3_prototype/tree/v1
- **v1 commit:** [`b72a03e`](https://github.com/florenceyang/17626_hw_3_prototype/commit/b72a03eccde872b0b9ead58632518ec76b84a5ea)

What the v1 branch contains:

| Artifact              | Link                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial goal model    | [`goal-models/v1_prototype_goal_model.py`](https://github.com/florenceyang/17626_hw_3_prototype/blob/v1/goal-models/v1_prototype_goal_model.py), [diagram](https://github.com/florenceyang/17626_hw_3_prototype/blob/v1/docs/v1_goal_model.svg), [decisions](https://github.com/florenceyang/17626_hw_3_prototype/blob/v1/docs/v1_goal_model_decisions.md) |
| Initial specification | [`docs/initial-specs-v1.md`](https://github.com/florenceyang/17626_hw_3_prototype/blob/v1/docs/initial-specs-v1.md), [`spec.md`](https://github.com/florenceyang/17626_hw_3_prototype/blob/v1/specs/001-legal-aid-intake-form/spec.md)                                                                                                                     |
| Spec Kit artifacts    | [constitution](https://github.com/florenceyang/17626_hw_3_prototype/blob/v1/.specify/memory/constitution.md), [`specs/001-legal-aid-intake-form/`](https://github.com/florenceyang/17626_hw_3_prototype/tree/v1/specs/001-legal-aid-intake-form) (spec, plan, research, data model, contracts, tasks)                                                      |
| Prototype source code | [`frontend/`](https://github.com/florenceyang/17626_hw_3_prototype/tree/v1/frontend)                                                                                                                                                                                                                                                                       |
| Traceability matrix   | [`docs/requirements-traceability-matrix.md`](https://github.com/florenceyang/17626_hw_3_prototype/blob/v1/docs/requirements-traceability-matrix.md)                                                                                                                                                                                                        |

### 2. GitHub Version 2

- **v2 directory:** [`v2/`](v2/)
- **v2 commit:** [`5294eed`](https://github.com/florenceyang/17626_hw_3_prototype/commit/5294eedac55087c0e4617cd0e02f42cc4d29600d)
- Revised goal model, specification, Spec Kit artifacts and prototype source code: [`v2/`](v2/)

### 3. Prototype V1 URL

To run v1 locally instead, install [Node.js](https://nodejs.org/) 22 or later and git, then:

```bash
git clone --branch v1 https://github.com/florenceyang/17626_hw_3_prototype.git prototype-v1
cd prototype-v1/frontend
npm install
npm run dev
```

| Page                                | Address                         |
| ----------------------------------- | ------------------------------- |
| Applicant form                      | http://localhost:5173/#/        |
| Mock account (save, resume, status) | http://localhost:5173/#/account |
| Mock staff list                     | http://localhost:5173/#/staff   |

### 4. Prototype V2 URL

To run v2 locally from the repository root, install [Node.js](https://nodejs.org/) 22 or later, then:

```bash
cd v2/frontend
npm install
npm run dev
```

The applicant form will be available at http://localhost:5173/#/.

### 5. Requirements Analysis and Learning Log

[`docs/learning-log.md`](https://github.com/florenceyang/17626_hw_3_prototype/blob/main/docs/learning-log.md)
covers requirements selection, goal relationships, traceability, evaluation findings, revisions and
reflection. Supporting documents:

- Goal model decisions: [`docs/goal-model-decisions.md`](https://github.com/florenceyang/17626_hw_3_prototype/blob/main/docs/goal-model-decisions.md)
- Traceability matrix: [`docs/requirements-traceability-matrix.md`](https://github.com/florenceyang/17626_hw_3_prototype/blob/main/docs/requirements-traceability-matrix.md)

## Repository layout

| Path                               | Contents                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `frontend/`                        | The app and its tests ([frontend/README.md](frontend/README.md))              |
| `v2/`                              | Version 2 project snapshot                                                    |
| `specs/001-legal-aid-intake-form/` | Spec, plan, research, data model, contracts, tasks                            |
| `goal-models/`                     | Goal models                                                                   |
| `docs/`                            | Initial requirements, goal model decisions, traceability matrix, learning log |
| `.specify/memory/constitution.md`  | Project constitution                                                          |

# Roles and Responsbilities

1. Florence (steps 3-4, 6)

- v1 prototype + reflection
- requirements traceability matrix + observations
- sections 1 and 2 in learning-log.md

2. Malak (steps 5,6)

- v2 prototype + reflection
- sections 3 and 4 in learning-log.md

3. Together (steps 1 and 2)

- combine goal model
- discuss tradeoffs / decisions for resolving requirements
