# Uji frontend

Dijalankan di peramban sungguhan. curl tidak bisa membuktikan apa yang diuji
di sini — apakah JavaScript-nya benar-benar memanggil API, menampilkan
datanya, dan tidak menafsirkan data sebagai HTML.

## Menjalankan

Backend dan MongoDB harus hidup lebih dulu:

    cd ../../kkn-gocroot && ./uji/semua.sh
    cd ../kkn-frontend && npm run build && python3 -m http.server 5173

Lalu:

    cd uji && npm install && npm run semua

## Isi

| Berkas | Yang dibuktikan |
|---|---|
| `uji-frontend.mjs` | Masuk, daftar peserta, paginasi, saringan, **cakupan per peran**, dan bahwa `UI.sel` tidak menafsirkan HTML |
| `uji-verifikasi.mjs` | Halaman verifikasi publik bekerja **tanpa sesi sama sekali**, token palsu ditolak, dan nilai tidak pernah ikut terkirim |
| `uji-jscroot.mjs` | Adopsi jscroot: tiap halaman memuat rantai modulnya, header `login` terkirim di halaman terlindungi dan TIDAK di verifikasi publik, 401 membuang sesi, data tidak jadi HTML. **Tidak butuh backend hidup** — jawabannya dipalsukan lewat `page.route`, jadi `node uji-jscroot.mjs` bisa dijalankan sendirian dengan hanya server statis |

Uji XSS-nya menyuntik `<img src=x onerror=...>` lewat jalur yang sama dengan
data asli, lalu memastikan tidak ada elemen `<img>` yang lahir. Token ada di
localStorage; satu celah XSS berarti sesi tercuri.
