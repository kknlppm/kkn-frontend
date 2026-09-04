import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto("http://localhost:5173/#berita", { waitUntil: "networkidle" });
await p.evaluate(() => document.querySelectorAll("[data-reveal]").forEach(e => e.classList.add("is-in")));
await p.waitForTimeout(900);
await p.locator("#berita").screenshot({ path: "/private/tmp/claude-501/-Users-sugengrifqimubaroq-Not-Sync-icloud-Github-Plan-migrasi-kkn-unfari/32fdbbdf-77bf-4b0f-bd17-42908b8409b1/scratchpad/berita-depan.png" });

const p2 = await ctx.newPage();
await p2.goto("http://localhost:5173/404.html", { waitUntil: "domcontentloaded" });
const tok = await (await fetch("http://localhost:8090/auth/login", { method:"POST",
  headers:{"Content-Type":"application/json"},
  body: JSON.stringify({uname:"uji.admin",password:"ujilokal123"})})).json();
await p2.evaluate((t) => { localStorage.setItem("kkn_token", t);
  localStorage.setItem("kkn_user", JSON.stringify({name:"Uji Admin",role:1,role_name:"admin"})); }, tok.data.token);
await p2.goto("http://localhost:5173/kelola-berita/", { waitUntil: "networkidle" });
await p2.waitForTimeout(700);
await p2.screenshot({ path: "/private/tmp/claude-501/-Users-sugengrifqimubaroq-Not-Sync-icloud-Github-Plan-migrasi-kkn-unfari/32fdbbdf-77bf-4b0f-bd17-42908b8409b1/scratchpad/kelola-berita.png" });
await p2.click("#tombolTambah");
await p2.waitForTimeout(500);
await p2.screenshot({ path: "/private/tmp/claude-501/-Users-sugengrifqimubaroq-Not-Sync-icloud-Github-Plan-migrasi-kkn-unfari/32fdbbdf-77bf-4b0f-bd17-42908b8409b1/scratchpad/kelola-laci.png" });
console.log("potret siap");
await b.close();
