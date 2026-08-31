/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.html", "./assets/js/**/*.js"],

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
            garis: { DEFAULT: "#CFDAE4", tipis: "#E3EAF1" },

            sah: { DEFAULT: "#14804A", muda: "#DFF3E8" },
            belum: { DEFAULT: "#A8621C", muda: "#FBECDC" },
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

    plugins: [],
};
