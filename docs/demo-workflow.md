# Demo Workflow

This walkthrough uses only the seeded Demo Project and local SQLite data.

## Start

```bash
cp .env.example .env
pnpm db:setup
pnpm dev
```

Open `http://localhost:3000` and select **Workflow**.

## Complete the loop

### 1. Create Requirement

Enter a short title and description. The UI creates a `Requirement` in `DRAFT` and writes `REQUIREMENT_CREATED`.

### 2. Generate Task Draft

Select the Requirement and click **Generate task draft**. The deterministic Mock Planner creates:

- a `Task` in `DRAFT`;
- an `ApprovalRequest` in `PENDING`;
- `TASK_DRAFT_GENERATED` and `APPROVAL_REQUEST_CREATED` audit events.

No model call happens here.

### 3. Approve

Click **Approve task**. The human gate moves the Task to `APPROVED` and the Approval Request to `APPROVED`.

The API will reject Developer receipt while the task is still `DRAFT`.

### 4. Developer receives and records output

Click **Developer receives task**, then fill the WorkProduct title and content. The Task becomes `WORK_PRODUCT_READY`; the WorkProduct stores `READY_FOR_HANDOFF` and local evidence.

### 5. Handoff and QA acceptance

Enter a handoff message and click **Create handoff**. The Task becomes `HANDED_OFF`. Click **QA accepts** to move it to `IN_QA`.

### 6. QA Review

Enter a review summary and evidence, then click **Submit approved review**. The Review is stored as `APPROVED`, the WorkProduct becomes `QA_APPROVED`, and the Task becomes `DONE`.

### 7. Inspect evidence

Open **Audit Trail**. The table shows the event, actor, object, previous state, new state, evidence, and timestamp for each transition.

## Resetting local demo data

To reset the local demo database, stop the dev server, remove the explicitly named local file, and run setup again:

```bash
rm -f dev.db
pnpm db:setup
```

Only remove the local `dev.db` file created by this repository. Do not point `DATABASE_URL` at a shared or private database.

## Expected final state

- Task: `DONE`
- ApprovalRequest: `APPROVED`
- Handoff: `ACCEPTED`
- Review: `APPROVED`
- WorkProduct: `QA_APPROVED`
- Audit Trail: at least one event for each action and state transition.
