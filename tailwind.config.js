/** @type {import('tailwindcss').Config} */
module.exports = {
    // Halaman depan (`index.html` + `beranda.js`) SENGAJA di luar Tailwind —
    // ia gelap dan memakai `assets/css/beranda.css` sendiri. Tanpa dikecualikan,
    // kelas-kelasnya ikut menumpuk di app.css yang tidak pernah memakainya.
    // `node_modules` dan `uji` dikecualikan supaya pemindaian tidak menyapu
    // ribuan berkas yang bukan milik situs ini.
    content: [
        "./**/*.html",
        "!./index.html",
        "!./node_modules/**",
        "!./uji/**",
        "./assets/js/**/*.js",
        "!./assets/js/beranda.js",
        "!./assets/js/jscroot/**",
        // Flowbite 2.5.2 — jalur Tailwind 3. Versi 4.x menuntut Tailwind v4,
        // yang membuang tailwind.config.js ini beserta palet yang kontrasnya
        // sudah diukur. Dipakai POLANYA (sidebar, dropdown), bukan JS-nya:
        // laci.js sudah menjebak fokus dan mengembalikannya ke pemanggil,
        // dan itu lebih baik daripada laci generik seharga 133 KB.
        "./node_modules/flowbite/**/*.js",
    ],

    // Kelas yang dirakit dinamis di JavaScript tidak terlihat oleh pemindai
    // Tailwind. Tanpa disebut di sini, kelasnya hilang dari app.css.
    safelist: ["is-sah", "is-belum", "is-kosong"],

    theme: {
        // Palet DIGANTI, bukan diperluas. Skala bawaan Tailwind memuat 22
        // rona yang tidak satu pun berasal dari dokumen ini; membiarkannya
        // ada berarti mengundang warna asing masuk diam-diam.
        colors: {
            transparent: "transparent",
            current: "currentColor",

            // Diambil dari sertifikat yang sudah tercetak, bukan dikarang.
            biru: { DEFAULT: "#1074BA", dalam: "#073B61", muda: "#DCEAF6" },

            // Kontras diukur, bukan dikira-kira. Nilai sebelumnya (#64798C
            // dan #9AAAB9) menghasilkan 4,51 dan 2,38 terhadap putih —
            // yang kedua jauh di bawah ambang 4,5 untuk teks kecil, dan
            // eyebrow di sini berukuran 11px.
            //   redup #4A5D70  6,79 di kartu · 5,86 di latar
            //   samar #5D7186  5,03 di kartu · 4,34 di latar
            // Karena itu `samar` hanya dipakai di atas kartu putih.
            tinta: { DEFAULT: "#0B1B2B", redup: "#4A5D70", samar: "#5D7186" },

            // Kertas dingin bersemu biru — sengaja bukan krem.
            kertas: "#FFFFFF",
            latar: "#E9EFF4",
            // `garis` dan `tipis` memisahkan — itu hiasan, dan WCAG tidak
            // menuntut apa-apa darinya. `kendali` MEMBENTUK: ia satu-satunya
            // penanda di mana kotak isian berakhir, dan kotaknya duduk di
            // atas kartu putih. WCAG 1.4.11 minta 3:1 untuk itu; #CFDAE4
            // hanya 1,42. #8195AB = 3,08 di kertas, masih sekeluarga sejuk.
            garis: { DEFAULT: "#CFDAE4", tipis: "#E3EAF1", kendali: "#8195AB" },

            // Penanda status dipakai sebagai teks 11px huruf besar DI ATAS
            // latar mudanya sendiri, jadi ambangnya 4,5 — bukan 3. Nilai
            // sebelumnya (#14804A dan #A8621C) menghasilkan 4,30 dan 4,09
            // terhadap muda-nya: keduanya di bawah ambang, di kolom yang
            // justru paling sering dibaca sekilas.
            //   sah   #137C48  4,53 di sah-muda   · 5,24 di kertas
            //   belum #9E5C1A  4,53 di belum-muda · 5,25 di kertas
            //   galat #B4232A  5,39 di galat-muda · 6,53 di kertas
            sah: { DEFAULT: "#137C48", muda: "#DFF3E8" },
            belum: { DEFAULT: "#9E5C1A", muda: "#FBECDC" },
            galat: { DEFAULT: "#B4232A", muda: "#FBE4E5" },
        },

        fontFamily: {
            // Archivo dipakai untuk dua peran lewat sumbu LEBARNYA: melebar
            // untuk judul, normal untuk teks. Satu keluarga, dua watak.
            judul: ['"Archivo"', "system-ui", "sans-serif"],
            teks: ['"Archivo"', "system-ui", "sans-serif"],
            // NIM, nomor sertifikat, tahun ajaran, dan nilai semuanya kode
            // berformat tetap. Mono di sini fungsional, bukan gaya-gayaan.
            data: ['"Azeret Mono"', "ui-monospace", "monospace"],
        },

        extend: {
            fontSize: {
                mikro: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.06em" }],
            },
            boxShadow: {
                kartu: "0 1px 2px rgba(11,27,43,.06), 0 8px 24px -12px rgba(11,27,43,.18)",
            },
        },
    },

    plugins: [require("flowbite/plugin")],
};
