# Show an AzDO Work Item

`az boards work-item show` returns the whole item as JSON. Project it with `--query` so the answer fits in context and the reader sees only the fields that matter.

## Summary

Title, state, description and acceptance criteria. This is the shape to start with for triage or before branching off a ticket.

```bash
az boards work-item show --id <ID> \
  --query '{title:fields."System.Title", state:fields."System.State", type:fields."System.WorkItemType", desc:fields."System.Description", ac:fields."Microsoft.VSTS.Common.AcceptanceCriteria"}' \
  -o json
```

`desc` and `ac` come back as stored. An item created with the Markdown format op renders as Markdown. An item created through `az boards work-item create` comes back as HTML, so strip the tags before quoting it.

## Linked items (parent, children, PRs)

Relations are not part of the default response. Pass `--expand relations`:

```bash
az boards work-item show --id <ID> --expand relations \
  --query 'relations[].{rel:rel, url:url}' -o json
```

| `rel`                                | Meaning                                                                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `System.LinkTypes.Hierarchy-Reverse` | parent, `url` ends in the parent's id                                                                                                  |
| `System.LinkTypes.Hierarchy-Forward` | child                                                                                                                                  |
| `ArtifactLink`                       | a pull request, branch or commit. The `url` is a `vstfs:///Git/PullRequestId/…` locator, and the PR id is the last segment after `%2F` |

To read a linked PR, take its id from the locator and run `az repos pr show --id <PR_ID>`.

## Everything

`--expand all` returns fields, relations and links together. Use it when a field name is unknown, then narrow the query.

```bash
az boards work-item show --id <ID> --expand all -o json
```

## Notes

- Field names are the reference names (`System.Title`), not the display names. Quote them inside the JMESPath query as shown above.
- `System.Description` is a separate field from the discussion thread. The Comments API lists them. See `ticket comment`.
- Read-only. Nothing here changes the item, so no approval gate applies.
