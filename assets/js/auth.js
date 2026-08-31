// Penyimpanan token PASETO dan penjaga halaman.
//
// Token disimpan di localStorage dan dikirim lewat Authorization: Bearer.
// Cookie HttpOnly tidak bisa lintas-origin antara GitHub Pages dan Cloud
// Functions, jadi tidak ada pilihan lain di topologi ini.
//
// KONSEKUENSINYA NYATA: satu celah XSS di halaman mana pun berarti token
// tercuri. Karena itu berlaku aturan keras di seluruh frontend ini:
//
//   - JANGAN pernah innerHTML untuk data yang berasal dari basis data.
//     Pakai textContent. Nama mahasiswa dan judul KKN adalah masukan pengguna.
//   - Tidak ada eval, tidak ada new Function, tidak ada URL javascript:.
//   - Pustaka pihak ketiga di-vendor dari node_modules, bukan dari CDN.
(function () {
    "use strict";

    const KUNCI_TOKEN = "kkn_token";
    const KUNCI_USER = "kkn_user";

    const Auth = {
        getToken() {
            try { return localStorage.getItem(KUNCI_TOKEN); } catch (e) { return null; }
        },

        setSession(token, user) {
            try {
                if (token) localStorage.setItem(KUNCI_TOKEN, token);
                if (user) localStorage.setItem(KUNCI_USER, JSON.stringify(user));
            } catch (e) { /* mode penyamaran: sesi hanya bertahan selama halaman terbuka */ }
        },

        getUser() {
            try {
                const mentah = localStorage.getItem(KUNCI_USER);
                return mentah ? JSON.parse(mentah) : null;
            } catch (e) { return null; }
        },

        clear() {
            try {
                localStorage.removeItem(KUNCI_TOKEN);
                localStorage.removeItem(KUNCI_USER);
            } catch (e) { /* diabaikan */ }
        },

        isLoggedIn() { return !!this.getToken(); },

        // Peran, disamakan dengan kolom ulevel aplikasi lama.
        PERAN: {
            ADMIN: 1, PEMBAYARAN: 2, MAHASISWA: 3,
            DOSEN: 4, VALIDASI_LPPM: 5, ADMIN_FAKULTAS: 6,
        },

        // requireLogin dipakai di awal halaman terlindungi.
        //
        // Ini KENYAMANAN, bukan keamanan. Yang menegakkan izin adalah backend;
        // penjaga di sini hanya supaya pengguna tidak melihat kerangka halaman
        // lebih dulu lalu ditolak API beberapa saat kemudian.
        requireLogin() {
            if (!this.isLoggedIn()) {
                window.location.href = "/login/";
                return false;
            }
            return true;
        },

        requireGuest() {
            if (this.isLoggedIn()) {
                window.location.href = this.landing();
                return false;
            }
            return true;
        },

        // landing menentukan halaman tujuan setelah masuk, sesuai peran.
        // Meniru switch di Auth.php aplikasi lama.
        landing() {
            const u = this.getUser() || {};
            switch (u.role) {
                case this.PERAN.PEMBAYARAN: return "/data-kkn/?bayar=1";
                case this.PERAN.MAHASISWA: return "/data-kkn/";
                case this.PERAN.DOSEN: return "/data-kkn/";
                case this.PERAN.VALIDASI_LPPM: return "/data-kkn/";
                default: return "/data-kkn/";
            }
        },

        async logout() {
            try { await window.Api.post("/auth/logout"); } catch (e) { /* sebisanya */ }
            this.clear();
            window.location.href = "/login/";
        },
    };

    window.Auth = Auth;
})();
