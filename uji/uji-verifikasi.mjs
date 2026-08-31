import { chromium } from 'playwright';
const FE = 'http://localhost:5173';
const TOK = '013c6d342bd8958a1b2de367663619e8';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const hasil = [];
let gagal = 0;
const uji = (n, ok, k='') => { hasil.push([n, ok, k]); if (!ok) gagal++; };

await p.goto(FE + '/verifikasi/?token=' + TOK, { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
let teks = await p.textContent('body');
uji('token sah -> Sertifikat sah', /Sertifikat sah/i.test(teks));
uji('menampilkan nama', /Nama/.test(teks));
uji('menampilkan nomor sertifikat', /Nomor sertifikat/.test(teks));
// Diperiksa pada DAFTAR RINCIAN, bukan seluruh halaman — footer halaman ini
// memuat kalimat "Nilai tidak ditampilkan", dan mencocokkan seluruh badan
// membuat uji ini gagal karena teksnya sendiri.
const labelRincian = await p.evaluate(() =>
  [...document.querySelectorAll('#rincian dt')].map(e => e.textContent));
uji('daftar rincian tanpa label Nilai',
    !labelRincian.some(l => /nilai/i.test(l)), labelRincian.join(', '));

// Dan yang menentukan: jawaban API-nya sendiri tidak boleh memuat nilai.
const isiApi = await p.evaluate(async (t) => {
  const r = await fetch('http://localhost:8090/verifikasi/' + t);
  return JSON.stringify((await r.json()).data);
}, TOK);
uji('jawaban API tanpa field nilai', !/"nilai"/.test(isiApi));
await p.screenshot({ path: '/tmp/kkn-verifikasi.png' });

await p.goto(FE + '/verifikasi/?token=00000000000000000000000000000000', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
teks = await p.textContent('body');
uji('token palsu -> tidak ditemukan', /tidak ditemukan/i.test(teks));

await p.goto(FE + '/verifikasi/', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
teks = await p.textContent('body');
uji('tanpa token -> tidak ditemukan', /tidak ditemukan/i.test(teks));

// Halaman ini harus bekerja TANPA sesi sama sekali.
const ls = await p.evaluate(() => { try { return Object.keys(localStorage).length } catch(e){ return -1 } });
uji('tidak butuh sesi (localStorage kosong)', ls === 0, String(ls));

console.log('\n┌─ VERIFIKASI PUBLIK ──────────────────────────────');
for (const [n, ok, k] of hasil) console.log('│ ' + n.padEnd(34) + (ok ? 'OK' : 'GAGAL') + '  ' + k);
console.log('└──────────────────────────────────────────────────');
console.log(gagal ? '✗ ' + gagal + ' gagal' : '✓ semua lolos');
await b.close();
process.exit(gagal ? 1 : 0);
