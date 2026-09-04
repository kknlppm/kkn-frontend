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
//   7. Halaman depan publik berdiri sendiri: tidak mengalihkan, tidak
//      memanggil API sama sekali, dan modulnya benar-benar berjalan.
//   8. Halaman depan tetap tampil untuk yang sudah punya sesi — itu keputusan
//      pemilik, dan gampang tergerus kalau nanti ada yang memasang penjaga.
//   9. Rantai QR `/verifikasi/<token>` -> 404.html -> `?token=` masih utuh,
//      dan alamat berita `/berita/<slug>` ikut lewat jalur yang sama tanpa
//      merusaknya. Bentuk jalur QR tercetak di 140+ sertifikat.
//  10. Berita: kartunya digambar dari /news, judul ber-HTML tetap teks, dan
//      tautan `javascript:` tidak pernah jadi href.
//  11. API berita mati TIDAK merusak sisa halaman depan — jscroot menelan
//      galat jaringan tanpa memanggil callback, jadi ini gampang lolos dari
//      perhatian sampai ada yang membuka situs saat backend sedang mati.
//
// Backend TIDAK perlu hidup: jawabannya dipalsukan lewat page.route, jadi uji
// ini bisa dijalankan sendirian.
//
// Menjalankan:  python3 -m http.server 5173  (dari akar kkn-frontend)
//               node uji-jscroot.mjs

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

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

// ---------- 7. Halaman depan publik ----------
{
    const { ctx, page, galat } = await halamanBaru(false);
    const dipanggil = [];
    await page.route("**/localhost:8090/**", (r) => {
        dipanggil.push(new URL(r.request().url()).pathname);
        return r.fulfill({ status: 200, contentType: "application/json",
            body: JSON.stringify(amplop([], { total: 0, page: 1, total_pages: 1 })) });
    });
    await page.goto(B + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    lapor(new URL(page.url()).pathname === "/", `halaman depan tidak mengalihkan (${page.url()})`);
    // Galat CORS/jaringan dari /news tidak dihitung: ia diuji tersendiri di
    // bagian 11, dan di sini yang dijaga adalah halamannya sendiri.
    const galatNyata = galat.filter((g) => !/\/news/.test(g));
    lapor(galatNyata.length === 0, "halaman depan memuat tanpa galat" +
        (galatNyata.length ? "\n    " + galatNyata.join("\n    ") : ""));

    // Dulu di sini tertulis "tidak memanggil API sama sekali" — benar untuk
    // Tahap A, dan salah begitu berita lahir. Yang sebenarnya dijaga: halaman
    // PUBLIK tidak boleh menyentuh satu pun rute yang butuh token.
    const berkewenangan = dipanggil.filter((j) => j.startsWith("/api/"));
    lapor(berkewenangan.length === 0,
        `halaman depan tidak memanggil rute ber-token (${JSON.stringify(dipanggil)})`);

    // Modulnya benar-benar berjalan, bukan sekadar tidak melempar galat.
    const faq = await page.locator("#daftarFaq .acc").count();
    lapor(faq >= 5, `tanya jawab tergambar (${faq} butir)`);

    const ket = await page.textContent("#ketTahap");
    lapor(!!(ket || "").trim(), `tahapan aktif punya keterangan ("${(ket || "").slice(0, 40)}…")`);

    // Berpindah tahap benar-benar mengganti panel.
    await page.locator("#tabTahap button").nth(3).click();
    await page.waitForTimeout(300);
    const judulTahap = await page.textContent(".panggung__slide.is-active .panggung__judul");
    lapor(/Penilaian/i.test(judulTahap || ""), `tab keempat membuka panel yang benar ("${judulTahap}")`);

    // Kedua pintu keluar halaman depan harus benar.
    const masuk = await page.locator('a[href="/login/"]').count();
    const verif = await page.locator('a[href="/verifikasi/"]').count();
    lapor(masuk > 0 && verif > 0, `tautan Masuk (${masuk}) dan Verifikasi (${verif}) ada`);

    await ctx.close();
}

// ---------- 8. Halaman depan tetap tampil walau sudah punya sesi ----------
{
    const { ctx, page } = await halamanBaru(true);
    await page.goto(B + "/", { waitUntil: "networkidle" });
    lapor(new URL(page.url()).pathname === "/",
        `yang sudah masuk pun melihat halaman depan (${page.url()})`);
    const hero = await page.locator(".hero__content .h1").count();
    lapor(hero === 1, "isi halaman depan tergambar untuk pengguna bersesi");
    await ctx.close();
}

// ---------- 9. Rantai QR: /verifikasi/<token> lewat 404.html ----------
//
// Bentuk jalur inilah yang tercetak di kode QR pada 140+ sertifikat yang sudah
// beredar, dan ia TIDAK BISA diubah. GitHub Pages menyajikan 404.html untuk
// jalur yang tidak punya berkas; server statis biasa tidak. Jadi di sini
// dijalankan server kecil yang meniru perilaku Pages — kalau tidak, uji ini
// lulus di laptop dan gagal di produksi.
{
    const AKAR = fileURLToPath(new URL("..", import.meta.url));
    const TIPE = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
                   ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png" };

    const pages = createServer(async (req, res) => {
        const jalur = decodeURIComponent(new URL(req.url, "http://x").pathname);
        let berkas = join(AKAR, normalize(jalur).replace(/^(\.\.[/\\])+/, ""));
        if (jalur.endsWith("/")) berkas = join(berkas, "index.html");
        try {
            const isi = await readFile(berkas);
            res.writeHead(200, { "Content-Type": TIPE[extname(berkas)] || "application/octet-stream" });
            res.end(isi);
        } catch {
            // Persis Pages: 404 dijawab dengan 404.html, bukan halaman bawaan.
            const isi = await readFile(join(AKAR, "404.html"));
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end(isi);
        }
    });
    await new Promise((r) => pages.listen(5174, r));

    const { ctx, page } = await halamanBaru(false);
    const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
    let diminta = null;
    await page.route("**/localhost:8090/**", (r) => {
        diminta = r.request().url();
        return r.fulfill({ status: 200, contentType: "application/json",
            body: JSON.stringify(amplop({ sah: true, nama: "Contoh Peserta", nim: "12345" })) });
    });

    await page.goto("http://localhost:5174/verifikasi/" + TOKEN, { waitUntil: "networkidle" });

    lapor(page.url().includes("/verifikasi/?token=" + TOKEN),
        `QR bentuk jalur dialihkan ke bentuk kueri (${page.url()})`);
    lapor(!!diminta && diminta.includes(TOKEN),
        `token diteruskan ke backend apa adanya (${diminta})`);
    const teks = await page.textContent("#hasil");
    lapor(/Contoh Peserta/.test(teks || ""), "hasil verifikasi tergambar dari rantai QR");

    // Alamat berita lewat jalur yang sama. Diuji BERSAMA rantai QR, bukan
    // terpisah: yang berbahaya bukan aturan barunya sendiri, melainkan
    // kemungkinan ia menyerobot jalur sertifikat.
    await page.route("**/localhost:8090/news/**", (r) => r.fulfill({ status: 200,
        contentType: "application/json", body: JSON.stringify(amplop(
            { slug: "penutupan-kkn", judul: "Penutupan KKN", paragraf: ["Isi."], foto_url: [] })) }));
    await page.goto("http://localhost:5174/berita/penutupan-kkn", { waitUntil: "networkidle" });
    lapor(page.url().includes("/berita/?slug=penutupan-kkn"),
        `alamat berita bentuk jalur dialihkan (${page.url()})`);
    lapor(/Penutupan KKN/.test(await page.textContent("#judul") || ""),
        "…dan artikelnya tergambar");

    await ctx.close();
    await new Promise((r) => pages.close(r));
}

// ---------- 10. Berita di halaman depan ----------
const BERITA = [
    { id: "n1", slug: "penutupan-kkn", judul: "Penutupan KKN Angkatan XII",
      ringkasan: "Ditutup di balai desa.", paragraf: ["Satu.", "Dua."],
      foto_url: [], penulis: "LPPM Unfari", terbit: true,
      tanggal_terbit: "2026-08-30T02:00:00Z" },
    { id: "n2", slug: "uji-xss", judul: '<img src=x onerror="window.__XSS=1">',
      ringkasan: "", paragraf: ['<script>window.__XSS=1</script> isi'],
      foto_url: [], terbit: true, tanggal_terbit: "2026-08-20T02:00:00Z",
      tautan_url: "javascript:window.__XSS=1", tautan_label: "Jangan diklik" },
];

{
    const { ctx, page, galat } = await halamanBaru(false);
    await page.route("**/localhost:8090/news**", (r) => r.fulfill({ status: 200,
        contentType: "application/json",
        body: JSON.stringify(amplop(BERITA, { total: 2, page: 1, total_pages: 1 })) }));
    await page.goto(B + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    const kartu = await page.locator("#daftarBerita .pos").count();
    lapor(kartu === 2, `halaman depan menggambar kartu berita (${kartu})`);
    lapor(await page.locator("#beritaKosong").isHidden(), "keadaan kosong disembunyikan");

    const img = await page.locator("#daftarBerita img").count();
    const xss = await page.evaluate(() => window.__XSS === 1);
    lapor(img === 0 && !xss, `judul berita ber-HTML tidak ditafsirkan (img=${img}, xss=${xss})`);
    lapor(/<img src=x/.test(await page.textContent("#daftarBerita") || ""),
        "…dan tampil sebagai teks apa adanya");
    lapor(galat.length === 0, "bagian berita tanpa galat" +
        (galat.length ? "\n    " + galat.join("\n    ") : ""));
    await ctx.close();
}

// ---------- 11. API berita mati: sisa halaman depan tetap utuh ----------
{
    const { ctx, page } = await halamanBaru(false);
    await page.route("**/localhost:8090/news**", (r) => r.abort());
    await page.goto(B + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    lapor(await page.locator("#daftarBerita").isHidden(), "berita gagal: kartunya tidak digambar");
    lapor(await page.locator("#daftarFaq .acc").count() >= 5, "…dan tanya jawab tetap ada");
    lapor(await page.locator(".hero__content .h1").count() === 1, "…dan hero tetap ada");
    await ctx.close();
}

// ---------- 12. Halaman baca satu berita ----------
{
    const { ctx, page, galat } = await halamanBaru(false);
    await page.route("**/localhost:8090/news/**", (r) => r.fulfill({ status: 200,
        contentType: "application/json", body: JSON.stringify(amplop(BERITA[1])) }));
    await page.goto(B + "/berita/?slug=uji-xss", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    const img = await page.locator("#artikel img").count();
    const scr = await page.locator("#isi script").count();
    const xss = await page.evaluate(() => window.__XSS === 1);
    lapor(img === 0 && scr === 0 && !xss,
        `halaman baca tidak menafsirkan HTML (img=${img}, script=${scr}, xss=${xss})`);

    // Skema tautan sudah ditolak server; ini penjaga kedua, untuk data yang
    // sempat tersimpan sebelum penjaga pertama ada.
    const tautan = await page.locator("#tautan").count();
    const terlihat = tautan ? await page.locator("#tautan").isVisible() : false;
    lapor(!terlihat, "tautan javascript: tidak dipasang sebagai href");
    lapor(galat.length === 0, "halaman baca tanpa galat" +
        (galat.length ? "\n    " + galat.join("\n    ") : ""));
    await ctx.close();
}

// ---------- 13. Slug tak dikenal diberi pesan, bukan halaman kosong ----------
{
    const { ctx, page } = await halamanBaru(false);
    await page.route("**/localhost:8090/news/**", (r) => r.fulfill({ status: 404,
        contentType: "application/json",
        body: JSON.stringify({ status: "error", message: "berita tidak ditemukan" }) }));
    await page.goto(B + "/berita/?slug=entah-apa", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    lapor(/tidak ditemukan/i.test(await page.textContent("#memuat") || ""),
        "slug tak dikenal diberi pesan");
    await ctx.close();
}

await browser.close();
console.log(gagal ? `\n${gagal} GAGAL` : "\nsemua lulus");
process.exit(gagal ? 1 : 0);
