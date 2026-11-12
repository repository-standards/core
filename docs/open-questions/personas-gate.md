# The role gate stays hard even solo

**Decided:** in the profiles split, the gate is core, the full roster is scale;
a capability spec that serves no role on the roster fails the structure guard
(R10). ADR-064 replaced personas with roles, optional modes and job stories in
every spec, and kept the gate (it was ADR-006's).

**Doubt:** for a one-person tool the ceremony may still exceed the value. The
move to roles narrows this for repos with no product surface (an internal
service, a library): a role is an actor with permissions, so "the calling
service" or "the integrating developer" is a legitimate roster row where a
persona with a biography never was. What remains open is whether 1-3 job
stories per spec pay for themselves in a repo whose only role is its author.

**A better answer would:** a solo case study showing the one-role gate and its
job stories caught (or never caught) a real mistake.
