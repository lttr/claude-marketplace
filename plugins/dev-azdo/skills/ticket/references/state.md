# Transition a work item's state

Every state change in this plugin goes through here: asked for directly, offered by
`feature-branch` after branching, by `pr create` after opening a PR, and by `pr complete` after
merging. Nothing transitions without the user saying yes.

## Known target

Map the requested state through the synonyms, or pass an exact state name as given:

| Synonym                          | Azure DevOps state |
| -------------------------------- | ------------------ |
| `active`, `start`, `in-progress` | `Active`           |
| `cr`, `code-review`, `review`    | `Code Review`      |
| `ready`, `done-dev`              | `Ready`            |
| `closed`, `done`, `complete`     | `Closed`           |

```bash
az boards work-item update --id <ID> --state "<State>" --query '{id:id, title:fields."System.Title", state:fields."System.State"}' -o json
```

Confirm by printing id, title and the new state.

The synonyms match common process templates, not every project. When the request matches no
synonym, or Azure DevOps rejects the state, fall through to the lookup below and let the user
pick from the states that exist.

## Lookup: states the item can actually move to

Used when no target is given (for example after a merge), or when the target doesn't exist.

1. **Current state and type:**

   ```bash
   az boards work-item show --id <ID> --query '{title:fields."System.Title", type:fields."System.WorkItemType", state:fields."System.State"}' -o json
   ```

2. **The type's states and transitions.** Resolve org and project per the conventions
   (`${CLAUDE_PLUGIN_ROOT}/references/conventions.md`). Encode spaces in the project and type
   as `%20`.

   ```bash
   az rest --resource 499b84ac-1321-427f-aa17-267ca6975798 --uri "<ORG_URL>/<PROJECT>/_apis/wit/workitemtypes/<TYPE>?api-version=7.1" --query "{states:states[].{name:name, category:category}, transitions:transitions}" -o json
   ```

   `states` gives each state's category: `Proposed`, `InProgress`, `Resolved`, `Completed` or
   `Removed`. The response doesn't promise any order. `transitions` maps each state to the
   states it may move to (`[{to: …}]`).

3. **Candidates.** From the current state's transitions, drop the self-transition, `Removed`,
   and anything in an earlier category than the current state. Rank the rest by category in
   the order above.

4. **Ask.**
   - One candidate: propose it. "Move #<ID> <title> from <current> to <candidate>?"
   - Several (for example `Resolved` vs `Closed`, or a custom Testing state): list them ranked
     and let the user pick.
   - None, or the transitions are missing: list all states of the type with their categories
     and let the user pick.

5. **Update** with the chosen state as in "Known target".
