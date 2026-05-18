// Tiny static server for widget embedding tests. Serves test.html (and any
// sibling files) over real HTTP so the widget iframe sees a proper origin —
// no LiveServer-style script injection, no spurious reloads, no hydration
// mismatches.
//
//   bun run widget:test
//
// Then open http://localhost:8080/test.html
import { file } from "bun";
import { join, normalize } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PORT = Number(process.env.PORT ?? 8080);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname === "/" ? "/test.html" : url.pathname;
    const resolved = normalize(join(ROOT, path));
    if (!resolved.startsWith(ROOT)) return new Response("forbidden", { status: 403 });
    const f = file(resolved);
    if (!(await f.exists())) return new Response("not found", { status: 404 });
    return new Response(f);
  },
});

console.log(`widget test page: http://localhost:${PORT}/test.html`);
