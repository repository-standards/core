# Twenty rules (R1-R21)

**Decided:** the whole normative core is one page - numbered MUST/SHOULD rules in
[SPEC.md](../../standard/SPEC.md); the manifest is its machine-readable
projection, each entry citing the rule it enforces. Started at twenty; R21
(supply-chain pinning, ADR-017) joined when a real normative gap surfaced in the
field.

**Why:** every standard that won stays this small - semver has 11 rules,
Conventional Commits 16, Keep a Changelog 7 principles. The cautionary tale is
RUP, which grew until nobody could apply it.

**Doubt:** twenty-one sits past the top of the winners' range and the count only
grew; several rules bundle more than one MUST (R11 carries the map, the same-PR
rule and the guard; R16 three gates); judgment-tier rules cannot be
script-checked, which blurs what "drift 0" certifies.

**A better answer would:** the first adoptions showing which rules never bite -
those are candidates to merge, or to demote to guidance. The rule numbers are
stable by contract, so merging means retiring a number, never renumbering.
