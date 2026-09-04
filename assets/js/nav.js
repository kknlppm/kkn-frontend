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
    { url: "/pengaturan/", label: "Pengaturan", peran: [P.ADMIN] },
];

export function pasang(judul, keterangan) {
    const u = getUser() || {};

    const bar = document.createElement("div");
    bar.className = "pita-atas";
    bar.setAttribute("aria-hidden", "true");
    document.body.prepend(bar);

    const head = document.createElement("header");
    head.className = "bg-kertas border-b border-garis";

    const wrap = document.createElement("div");
    wrap.className = "max-w-[1400px] mx-auto px-5";

    // Baris identitas
    const atas = document.createElement("div");
    atas.className = "h-14 flex items-center justify-between gap-4";

    const kiri = document.createElement("div");
    kiri.className = "min-w-0";
    kiri.appendChild(el("div", "judul-halaman text-base leading-tight", judul));
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
    const boleh = TAUTAN.filter(function (t) { return t.peran.includes(u.role); });
    if (boleh.length > 1) {
        const nav = document.createElement("nav");
        nav.className = "flex gap-1 -mb-px overflow-x-auto";
        nav.setAttribute("aria-label", "Bagian");
        const sekarang = window.location.pathname.replace(/\/+$/, "/");
        boleh.forEach(function (t) {
            const a = el("a", "tab-nav", t.label);
            a.href = t.url;
            if (sekarang === t.url) a.setAttribute("aria-current", "page");
            nav.appendChild(a);
        });
        wrap.appendChild(nav);
    }

    head.appendChild(wrap);
    bar.after(head);
}

export { PERAN } from "./config.js";
