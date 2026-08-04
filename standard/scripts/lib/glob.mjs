// glob -> RegExp, in one place because two guards need the same answer.
//
// spec-guard (capability -> code globs) and facts-check (a fact whose home is a
// count of files) each carried their own translator, and both carried the same
// defect: `**` was replaced by `.*` without consuming the slash next to it, so
// `**/payment/**` compiled to `^.*\/payment\/.*$` and did not match
// `payment/index.ts` - only a path with an extra directory in front of it. The
// first two entries of the shipped capability-map example are that shape, so an
// adopter whose capability sits at the top level got `spec-guard: OK` on a money
// path that never touched its spec. One implementation, one behaviour, one test.
//
// The supported syntax is deliberately small - it is matched against repository
// paths, not a shell:
//   *          any run of characters inside one path segment (never crosses `/`)
//   **         any number of segments, INCLUDING NONE
//   everything else is literal
//
// "Including none" is the whole fix, and it is what a reader expects:
//   **/payment/**      payment/index.ts, payment/x/y.ts, app/payment/index.ts
//   shared/**/payment* shared/payment.ts, shared/a/b/payment-intent.ts
//   src/**             src/index.ts, src/a/b.ts   (but not srcx/index.ts)
//
// A trailing `**` means "something below this directory", so it wants at least one
// segment: `src/**` is about the contents of src, and a file *named* `src` is not
// one of them. Every other position matches zero segments as well as many.
//
// No dependencies (Node built-ins only, and none used). Place at scripts/lib/glob.mjs.

// Regexp metacharacters that must survive as literals. `*` is absent on purpose -
// it is the only wildcard - and `/` needs no escape inside a RegExp body.
const escapeSegment = (segment) => segment.replace(/[.+^${}()|[\]\\?]/g, "\\$&").replace(/\*/g, "[^/]*");

/** The regexp source for a glob, anchored by the caller. */
export const globToRegExpSource = (glob) => {
  const segments = String(glob).split("/");
  let source = "";
  // Whether a `/` still has to be emitted before the next literal segment. A `**`
  // that can match zero segments has to swallow one of the slashes around it,
  // otherwise `a/**/b` demands the directory between a and b that `**` was
  // written to make optional.
  let separatorPending = false;
  segments.forEach((segment, i) => {
    const first = i === 0;
    const last = i === segments.length - 1;
    if (segment === "**") {
      if (first && last) source += ".*"; // the whole tree
      else if (first) source += "(?:[^/]+/)*"; // leading: swallows the slash after it
      else if (last) source += "/.+"; // trailing: the contents, not the directory itself
      else source += "(?:/[^/]+)*"; // middle: swallows the slash before it
      separatorPending = !first && !last; // only the middle form leaves one to emit
      return;
    }
    source += (separatorPending ? "/" : "") + escapeSegment(segment);
    separatorPending = true;
  });
  return source;
};

/** An anchored matcher for one glob. */
export const globToRegExp = (glob) => new RegExp(`^${globToRegExpSource(glob)}$`);
