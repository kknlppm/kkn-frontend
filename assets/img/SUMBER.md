# Gambar latar halaman depan

`beranda-bukit.webp` (hero) dan `beranda-punggung.webp` (ajakan penutup)
disalin dari `Frontend 3d/fora/assets/` — masing-masing `hills-hero.webp` dan
`dunes-cta.webp`.

**Ini pilihan yang disengaja, bukan tempat kosong yang menunggu diganti.**
Diputuskan 4 September 2026: bentang bukit dan gurun generik milik Fora dipakai
apa adanya.

## Kenapa aman dipakai

Keduanya **dihasilkan program**, bukan difoto. `Frontend 3d/fora/tools/gen_assets.py`
membuatnya dari lapisan derau sinus yang dikomposit jadi gradien senja
(NumPy + Pillow, benih tetap `default_rng(7)`). Tidak ada foto, tidak ada stok
pihak ketiga, dan tidak ada orang yang terpotret — jadi tidak ada izin yang
perlu diurus, dan hasilnya bisa dibuat ulang persis kapan saja.

## Sifatnya di halaman

Keduanya **hiasan murni**: dipasang lewat `background-image` di
`assets/css/beranda.css` dan ditandai `aria-hidden`. Tidak ada teks yang
merujuknya, dan halaman tidak pernah mengaku itu foto lokasi KKN mana pun.
Kalau suatu saat diganti foto kegiatan sungguhan, keterangan itu yang harus
ikut lahir — gambar hiasan tidak butuh takarir, foto kegiatan butuh.

## Kalau nanti diganti

Pertahankan nama berkasnya supaya `beranda.css` tidak perlu ikut diubah:

    cp foto-lapangan.webp  beranda-bukit.webp
    cp foto-penutupan.webp beranda-punggung.webp

Yang dicari: bentang lebar dan gelap di sepertiga atasnya — teks putih berdiri
di atas gambar hero, dan kepala halaman menutupi bagian atasnya.
