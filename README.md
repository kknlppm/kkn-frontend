# KKN LPPM UNFARI — frontend

Situs statis untuk GitHub Pages. Memanggil backend
[`kkn-gocroot`](../kkn-gocroot) lewat JSON.

**Belum di-deploy.** Seluruh pekerjaan berlangsung di lokal; aplikasi live
di `kknlppm.unfari.ac.id` tidak disentuh.

## Menjalankan di lokal

    npm install
    npm run build          # kompilasi Tailwind ke assets/css/app.css
    npm run watch:css      # atau: bangun ulang otomatis saat menyunting

    python3 -m http.server 5173     # sajikan dari folder ini

Backend harus hidup lebih dulu di `http://localhost:8090` — lihat
`../kkn-gocroot/uji/README.md`.

## Aturan yang tidak boleh dilanggar

Token PASETO disimpan di `localStorage`, bukan cookie HttpOnly — cookie tidak
bisa lintas-origin antara Pages dan Cloud Functions. **Konsekuensinya satu
celah XSS berarti sesi tercuri.** Karena itu:

1. **Jangan pernah `innerHTML` untuk data dari basis data.** Pakai
   `textContent`. Nama mahasiswa dan judul KKN adalah masukan pengguna.
   Perkakas di `assets/js/ui.js` sudah menegakkan ini; pakai itu.
2. Tidak ada `eval`, `new Function`, atau URL `javascript:`.
3. Pustaka pihak ketiga di-*vendor* dari `node_modules`, bukan dari CDN.
4. Kelas Tailwind yang dirakit dinamis di JS harus di-*safelist* di
   `tailwind.config.js`, atau warnanya hilang dari `app.css`.

## Susunan

| | |
|---|---|
| `index.html` | Pintu masuk; melempar ke `/login/` atau halaman sesuai peran |
| `login/` | Halaman masuk |
| `data-kkn/` | Daftar peserta KKN — paginasi, saringan tahun ajaran, pencarian |
| `assets/js/config.js` | Alamat backend. Tidak boleh memuat rahasia apa pun |
| `assets/js/auth.js` | Penyimpanan token dan penjaga halaman |
| `assets/js/api.js` | Pembungkus `fetch`, menyuntik header, menangani 401 |
| `assets/js/ui.js` | Pembuat elemen yang selalu memakai `textContent` |

Penjaga di frontend adalah **kenyamanan, bukan keamanan** — yang menegakkan
izin adalah backend. Ia hanya supaya pengguna tidak melihat kerangka halaman
lebih dulu lalu ditolak API beberapa saat kemudian.

## Hasil build tidak di-commit

`assets/css/app.css` ada di `.gitignore`; GitHub Actions membangunnya ulang
setiap deploy.
