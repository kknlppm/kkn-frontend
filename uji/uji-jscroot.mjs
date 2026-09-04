// Uji adopsi jscroot.
//
// Menjaga hal-hal yang bisa rusak diam-diam setelah lapisan JS berpindah ke
// jscroot, dan yang tidak akan terlihat sebagai galat di konsol:
//
//   1. Setiap halaman benar-benar memuat rantai modulnya (satu impor salah
//      tulis membuat seluruh skrip halaman tidak berjalan, tanpa suara).
//   2. Halaman terlindungi mengirim header "login" berisi token — nama header
//      ini konvensi GoCroot/jscroot, dan salah nama berarti 401 di semuanya.
//   3. Halaman verifikasi publik TIDAK mengirim token sama sekali.
//   4. Data dari basis data tidak pernah ditafsirkan sebagai HTML.
//   5. Alur masuk menyimpan sesi dan mengalihkan sesuai peran.
//   6. 401 membuang sesi dan kembali ke /login/ — jscroot `api.js` tidak
//      menangani ini sendiri, jadi kalau ui.js:sehat() dilewati di satu
//      halaman, sesi habis akan tampak sebagai halaman kosong tanpa sebab.
//
// Backend TIDAK perlu hidup: jawabannya dipalsukan lewat page.route, jadi uji
// ini bisa dijalankan sendirian.
//
// Menjalankan:  python3 -m http.server 5173  (dari akar kkn-frontend)
//               node uji-jscroot.mjs

import { chromium } from "playwright";

const B = "http://localhost:5173";
const browser = await chromium.launch();
let gagal = 0;
const lapor = (ok, teks) => { if (!ok) gagal++; console.log((ok ? "✓ " : "✗ ") + teks); };

// Amplop GoCroot palsu, supaya halaman punya sesuatu untuk digambar.
const amplop = (data, meta) => ({ status: "ok", data, meta });

async function halamanBaru(sesi) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const galat = [];
    page.on("console", (m) => { if (m.type() === "error") galat.push("console: " + m.text()); });
    page.on("pageerror", (e) => galat.push("pageerror: " + e.message));
    page.on("requestfailed", (r) => {
        if (!/app\.css|favicon/.test(r.url())) galat.push("gagal muat: " + r.url());
    });
    if (sesi) {
        // Dipasang SEKALI lewat evaluate, bukan addInitScript: addInitScript
        // berjalan ulang di setiap navigasi, jadi ia akan menanam kembali
        // token yang baru saja dibuang halaman — dan uji 401 berubah jadi
        // gelung pengalihan yang menuduh kode padahal ujinya yang salah.
        await page.goto(B + "/404.html", { waitUntil: "domcontentloaded" });
        await page.evaluate(() => {
            localStorage.setItem("kkn_token", "token-uji-123");
            localStorage.setItem("kkn_user", JSON.stringify({ name: "Uji", role: 1, role_name: "Admin" }));
        });
    }
    return { ctx, page, galat };
}

// ---------- 1. Semua halaman memuat tanpa galat ----------
const HALAMAN = ["/", "/login/", "/data-kkn/", "/data-induk/", "/kelompok/",
                 "/penilaian/", "/sertifikat/", "/pengaturan/", "/verifikasi/"];

const header = {};   // jalur -> header yang terkirim
for (const jalur of HALAMAN) {
    const { ctx, page, galat } = await halamanBaru(jalur !== "/login/" && jalur !== "/");
    await page.route("**/localhost:8090/**", async (route) => {
        const h = route.request().headers();
        header[jalur] = header[jalur] || h;
        await route.fulfill({ status: 200, contentType: "application/json",
            body: JSON.stringify(amplop([], { total: 0, page: 1, total_pages: 1 })) });
    });
    await page.goto(B + jalur, { waitUntil: "networkidle" });
    lapor(galat.length === 0, `memuat ${jalur}` + (galat.length ? "\n    " + galat.join("\n    ") : ""));
    await ctx.close();
}

// ---------- 2. Header token jscroot benar-benar terkirim ----------
const terlindungi = ["/data-kkn/", "/kelompok/", "/penilaian/", "/sertifikat/", "/pengaturan/", "/data-induk/"];
for (const jalur of terlindungi) {
    const h = header[jalur];
    lapor(h && h["login"] === "token-uji-123",
        `${jalur} mengirim header "login"` + (h ? ` = ${JSON.stringify(h["login"])}` : " (tidak ada permintaan)"));
}

// ---------- 3. Halaman verifikasi TIDAK boleh mengirim token ----------
{
    const { ctx, page } = await halamanBaru(true);
    let dikirim = null;
    await page.route("**/localhost:8090/**", async (route) => {
        dikirim = route.request().headers();
        await route.fulfill({ status: 200, contentType: "application/json",
            body: JSON.stringify(amplop({ sah: true, nama: "Budi", nim: "1234" })) });
    });
    await page.goto(B + "/verifikasi/?token=" + "a".repeat(32), { waitUntil: "networkidle" });
    lapor(dikirim && !dikirim["login"], "verifikasi publik tidak mengirim token" +
        (dikirim && dikirim["login"] ? ` (TERKIRIM: ${dikirim["login"]})` : ""));
    const teks = await page.textContent("#hasil");
    lapor(/Budi/.test(teks || ""), "verifikasi menggambar hasilnya");
    await ctx.close();
}

// ---------- 4. Disiplin XSS: data tidak boleh jadi HTML ----------
{
    const { ctx, page } = await halamanBaru(true);
    await page.route("**/localhost:8090/**", async (route) => {
        const u = route.request().url();
        if (u.includes("/api/participations")) {
            await route.fulfill({ status: 200, contentType: "application/json",
                body: JSON.stringify(amplop(
                    [{ id: "x", nim: "999", name: '<img src=x onerror="window.__XSS=1">',
                       prodi: "TI", kelompok: "1", tahun_ajaran: "2024/2025",
                       judul_kkn: "<script>window.__XSS=1</script>", nilai: 0, has_cert: false }],
                    { total: 1, page: 1, total_pages: 1 })) });
        } else {
            await route.fulfill({ status: 200, contentType: "application/json",
                body: JSON.stringify(amplop([], {})) });
        }
    });
    await page.goto(B + "/data-kkn/", { waitUntil: "networkidle" });
    const img = await page.locator("#isiTabel img").count();
    const xss = await page.evaluate(() => window.__XSS === 1);
    const tampak = await page.textContent("#isiTabel");
    lapor(img === 0 && !xss, `nama berisi HTML tidak ditafsirkan (img=${img}, xss=${xss})`);
    lapor(/<img/.test(tampak || ""), "…dan tetap tampil sebagai teks apa adanya");
    await ctx.close();
}

// ---------- 5. Alur masuk lengkap ----------
{
    const { ctx, page, galat } = await halamanBaru(false);
    await page.route("**/localhost:8090/**", (r) => r.fulfill({ status: 200,
        contentType: "application/json", body: JSON.stringify(amplop([], { total: 0 })) }));
    await page.route("**/localhost:8090/auth/login", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json",
            body: JSON.stringify(amplop({ token: "token-baru", user: { name: "Admin", role: 1 } })) });
    });
    await page.goto(B + "/login/", { waitUntil: "networkidle" });
    await page.fill("#uname", "admin");
    await page.fill("#password", "rahasia");
    await page.click("#tombolMasuk");
    await page.waitForURL("**/data-kkn/**", { timeout: 5000 }).catch(() => {});
    const tersimpan = await page.evaluate(() => localStorage.getItem("kkn_token"));
    lapor(tersimpan === "token-baru", `masuk menyimpan token (${tersimpan})`);
    lapor(page.url().includes("/data-kkn/"), `masuk mengalihkan ke halaman peran (${page.url()})`);
    lapor(galat.length === 0, "alur masuk tanpa galat" + (galat.length ? "\n    " + galat.join("\n    ") : ""));
    await ctx.close();
}

// ---------- 6. 401 membuang sesi dan kembali ke /login/ ----------
{
    const { ctx, page } = await halamanBaru(true);
    await page.route("**/localhost:8090/**", (r) => r.fulfill({ status: 401,
        contentType: "application/json",
        body: JSON.stringify({ status: "error", message: "token kedaluwarsa" }) }));
    await page.goto(B + "/data-kkn/", { waitUntil: "commit" }).catch(() => {});
    await page.waitForURL("**/login/**", { timeout: 8000 }).catch(() => {});
    const sisa = await page.evaluate(() => localStorage.getItem("kkn_token"));
    lapor(page.url().includes("/login/"), `401 mengalihkan ke /login/ (${page.url()})`);
    lapor(sisa === null, `401 membuang token (sisa: ${sisa})`);
    await ctx.close();
}

await browser.close();
console.log(gagal ? `\n${gagal} GAGAL` : "\nsemua lulus");
process.exit(gagal ? 1 : 0);
