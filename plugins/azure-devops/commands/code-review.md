---
allowed-tools: Bash(az boards work-item:*)
description: Set Azure DevOps work item to Code Review
argument-hint: <ticket_number>
---

## Task

Update the specified work item state to "Code Review" in Azure DevOps.

**Arguments (`$ARGUMENTS`):**

- Ticket number (required) → the work item ID to update

**Workflow:**

1. Update work item state:
   ```bash
   az boards work-item update --id <ticket_number> --state "Code Review"
   ```
2. Confirm the update with work item title and new state
