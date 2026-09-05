// Kepala halaman dan navigasi, dibagi seluruh halaman terlindungi.
//
// Tautan yang ditampilkan mengikuti peran. Ini KENYAMANAN, bukan keamanan —
// yang menegakkan izin adalah backend. Menyembunyikan tautan hanya supaya
// orang tidak menekan sesuatu yang pasti ditolak.

import { getUser, logout } from "./auth.js";
import { PERAN as P } from "./config.js";
import { el } from "./ui.js";

// Urutannya mengikuti alur kerja: daftar orang dulu, lalu menilai, lalu
// menerbitkan. Data induk paling belakang karena paling jarang disentuh.
const TAUTAN = [
    { url: "/data-kkn/",   label: "Register",   peran: [P.ADMIN, P.PEMBAYARAN, P.MAHASISWA, P.DOSEN, P.VALIDASI_LPPM, P.ADMIN_FAKULTAS] },
    { url: "/kelompok/",   label: "Kelompok",   peran: [P.ADMIN, P.ADMIN_FAKULTAS] },
    { url: "/penilaian/",  label: "Penilaian",  peran: [P.ADMIN, P.DOSEN] },
    { url: "/sertifikat/", label: "Sertifikat", peran: [P.ADMIN, P.VALIDASI_LPPM] },
    { url: "/data-induk/", label: "Data induk", peran: [P.ADMIN, P.ADMIN_FAKULTAS] },
    { url: "/kelola-berita/", label: "Berita",     peran: [P.ADMIN] },
    { url: "/pengaturan/", label: "Pengaturan", peran: [P.ADMIN] },
];

export function pasang(judul, keterangan) {
    const u = getUser() || {};

    const bar = document.createElement("div");
    bar.className = "pita-atas";
    bar.setAttribute("aria-hidden", "true");
    document.body.prepend(bar);

    const head = document.createElement("header");
    // pt-[3px] menyediakan tempat bagi pita biru yang `fixed` di atasnya.
    // Tanpa itu judul halaman duduk PERSIS di bawah pita — di ponsel, saat
    // keterangannya membungkus jadi dua baris, ia menyentuh pitanya.
    head.className = "bg-kertas border-b border-garis pt-[3px]";

    const wrap = document.createElement("div");
    wrap.className = "max-w-[1400px] mx-auto px-5";

    // Baris identitas
    const atas = document.createElement("div");
    // min-h, bukan h: keterangan yang membungkus harus menambah tinggi
    // barisnya, bukan meluber keluar dari tinggi yang dipatok.
    atas.className = "min-h-14 py-2 flex items-center justify-between gap-4";

    const kiri = document.createElement("div");
    kiri.className = "min-w-0";
    // 18px/500/-0.02em — persis .nav__brand di halaman depan. Pada berat 500
    // judul tidak lagi bisa menonjol lewat ketebalan, jadi ia menonjol lewat
    // ukuran, sama seperti di sana.
    kiri.appendChild(el("div", "judul-halaman text-lg leading-tight", judul));
    kiri.appendChild(el("div", "eyebrow text-tinta-redup",
        keterangan || "LPPM · Universitas Al-Ghifari"));
    atas.appendChild(kiri);

    const kanan = document.createElement("div");
    kanan.className = "flex items-center gap-4 shrink-0";
    const ident = document.createElement("div");
    ident.className = "text-right hidden sm:block";
    ident.appendChild(el("div", "text-sm font-medium leading-tight", u.name || ""));
    ident.appendChild(el("div", "eyebrow text-tinta-redup", u.role_name || ""));
    kanan.appendChild(ident);

    const keluar = el("button", "tombol-halus", "Keluar");
    keluar.type = "button";
    keluar.addEventListener("click", function () { logout(); });
    kanan.appendChild(keluar);
    atas.appendChild(kanan);
    wrap.appendChild(atas);

    // Baris navigasi. Kalau perannya cuma punya satu tujuan, barisnya tidak
    // digambar sama sekali — menu satu butir bukan menu.
    // Diukur SESUDAH kepala masuk dokumen. Selama masih lepas, scrollWidth
    // dan clientWidth sama-sama nol — penanda gesernya tidak akan pernah
    // menyala, dan bug itu tidak kelihatan dari membaca kodenya saja.
    let sesudahDipasang = null;

    const boleh = TAUTAN.filter(function (t) { return t.peran.includes(u.role); });
    if (boleh.length > 1) {
        const bungkus = document.createElement("div");
        bungkus.className = "nav-gulung";

        const nav = document.createElement("nav");
        nav.className = "flex gap-1 -mb-px overflow-x-auto";
        nav.setAttribute("aria-label", "Bagian");
        const sekarang = window.location.pathname.replace(/\/+$/, "/");
        let aktif = null;
        boleh.forEach(function (t) {
            const a = el("a", "tab-nav", t.label);
            a.href = t.url;
            if (sekarang === t.url) { a.setAttribute("aria-current", "page"); aktif = a; }
            nav.appendChild(a);
        });
        bungkus.appendChild(nav);
        wrap.appendChild(bungkus);

        // Tujuh tab butuh 596px; ponsel 390px hanya memuat empat. Tanpa
        // penanda, tiga sisanya tidak terlihat ADA. Gradiennya muncul hanya
        // selama masih ada yang tersembunyi di kanan, dan hilang di ujung —
        // penanda yang menyala terus berhenti berarti apa-apa.
        function periksaGeser() {
            const kanan = nav.scrollWidth - nav.scrollLeft - nav.clientWidth;
            bungkus.classList.toggle("geser-kanan", kanan > 1);
            bungkus.classList.toggle("geser-kiri", nav.scrollLeft > 1);
        }
        nav.addEventListener("scroll", periksaGeser, { passive: true });
        window.addEventListener("resize", periksaGeser);

        sesudahDipasang = function () {
            // Tab yang sedang dibuka harus terlihat walau ia di luar layar.
            if (aktif && nav.scrollWidth > nav.clientWidth) {
                aktif.scrollIntoView({ block: "nearest", inline: "center" });
            }
            periksaGeser();
        };
    }

    head.appendChild(wrap);
    bar.after(head);

    if (sesudahDipasang) sesudahDipasang();
}

export { PERAN } from "./config.js";
