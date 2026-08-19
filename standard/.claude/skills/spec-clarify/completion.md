# Completion report

Sibling file of `spec-clarify`. Load it when the clarify loop is finished and you are
reporting back, not before - it describes an output, not a step.

Report completion (after questioning loop ends or early termination):
- Number of questions asked and answered, and the number of markers written for what was not.
- Path to updated spec.
- Sections touched (list names).
- Spec quality checklist status (if `FEATURE_DIR/checklists/requirements.md` was re-validated): show before/after pass counts (e.g., "Spec Quality Checklist: 12/16 → 15/16 items passing") and list any items that changed state - both newly checked (unchecked → checked) and any regressions (checked → unchecked). If any items remain unchecked, list them as areas needing attention.
- Coverage summary table listing each taxonomy category with Status: Resolved (was Partial/Missing and addressed), Marked (unresolved and now carrying a typed marker - with the marker's type and owner), Clear (already sufficient).
- If any Outstanding or Deferred remain, recommend whether to proceed to `/spec-plan` or run `/spec-clarify` again later post-plan.
- Suggested next command.

