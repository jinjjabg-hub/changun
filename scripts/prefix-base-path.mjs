// Next.js does not rewrite absolute url(/...) references inside CSS when basePath is set.
// After a sub-path static export, prefix the site's asset URLs in the generated CSS.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = process.env.NEXT_PUBLIC_BASE_PATH;
const dir = join("out", "_next", "static");
if (!base) {
  console.log("NEXT_PUBLIC_BASE_PATH not set; nothing to do");
  process.exit(0);
}

let patched = 0;
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".css")) {
      const src = readFileSync(p, "utf8");
      const out = src.replaceAll("url(/sites/", `url(${base}/sites/`);
      if (out !== src) {
        writeFileSync(p, out);
        patched++;
      }
    }
  }
};
walk(dir);
console.log(`Prefixed ${base} in ${patched} CSS file(s)`);
