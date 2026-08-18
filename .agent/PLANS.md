# Execution Plan Standard

Substantial work must use and maintain an execution plan.

## Required Sections

Each plan must contain:

### Objective
Concrete outcome.

### Context
Relevant source documents and constraints.

### Non-Goals
Explicitly out of scope.

### Decisions
Material choices already made.

### Risks
Known risks and mitigations.

### Milestones
Each milestone must include:

- status,
- tasks,
- acceptance criteria,
- validation steps,
- dependencies.

### Progress

Use:

```text
[ ] Not started
[~] In progress
[x] Complete
[!] Blocked
```

### Validation Record

Record:

- commands run,
- automated tests,
- manual checks,
- environment used,
- notable failures and fixes.

## Rules

- Update `.agent/DECISIONS.md` for material architectural/product decisions.
- Update `.agent/RISKS.md` when risk severity, likelihood or mitigation changes.
- Do not enable privacy/security-sensitive public flows before their security dependencies are complete.
- Internationalization belongs in foundational architecture, not late-stage polish.
- Do not mark a milestone complete only because code exists.
- If a missing business fact does not block architecture, use `TBD`.
- Production launch is blocked by unresolved security/legal/operations gates.

- Do not require a milestone to validate UI/features that are explicitly delivered in a later milestone; split persistence/security validation from management-UI validation.
