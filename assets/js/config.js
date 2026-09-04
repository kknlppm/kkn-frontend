// Konfigurasi publik frontend, bentuknya mengikuti jscroot `skeleton`:
// satu peta `backend` berisi titik-ujung, satu peta `id` berisi id DOM.
//
// Aman terlihat, dan tidak boleh pernah memuat rahasia — berkas ini terkirim
// apa adanya ke setiap peramban yang membuka situs.

// Nama header yang membawa token. GoCroot menerima "Authorization: Bearer",
// "Token", dan "Login" (lihat helper/at.go:GetTokenFromHeader); "login" adalah
// yang dipakai jscroot `skeleton`, jadi itu yang dipakai di sini.
export const tokenKey = "login";

const asal = (function () {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
        // 8080 dipakai lingkungan uji aplikasi lama, jadi API baru di 8090.
        return "http://localhost:8090";
    }
    // Cloud Functions gen2, asia-southeast2. Alamat ini lahir dari deploy
    // 4 September 2026 dan melekat pada layanannya — ia berubah kalau
    // fungsinya dihapus lalu dibuat ulang, bukan saat di-deploy ulang biasa.
    return "https://kkn-gocroot-av3bgpgrxa-et.a.run.app";
})();

export const backend = {
    asal: asal,

    auth: {
        login: asal + "/auth/login",
        logout: asal + "/auth/logout",
        me: asal + "/auth/me",
    },

    // Data induk — hanya admin.
    master: {
        users: asal + "/api/users",
        user: (idnya) => asal + "/api/users/" + idnya,
        lecturers: asal + "/api/lecturers",
        lecturer: (idnya) => asal + "/api/lecturers/" + idnya,
        courses: asal + "/api/courses",
        course: (idnya) => asal + "/api/courses/" + idnya,
        programs: asal + "/api/programs",
        program: (idnya) => asal + "/api/programs/" + idnya,
        academicYears: asal + "/api/academic-years",
        settings: asal + "/api/settings",
    },

    // Data KKN.
    kkn: {
        groups: asal + "/api/groups",
        group: (idnya) => asal + "/api/groups/" + idnya,
        participations: asal + "/api/participations",
        participation: (idnya) => asal + "/api/participations/" + idnya,
        gradesKkn: asal + "/api/grades/kkn",
        gradesCourse: asal + "/api/grades/course",
        gradesCourseList: asal + "/api/grades/course/list",
    },

    // Berita. `daftar` dan `satuPublik` sengaja TANPA autentikasi — halaman
    // depan publik membacanya, dan tidak ada pengunjung yang punya token.
    // Rute kelola ada di jalur berbeda (`/api/news`), bukan jalur yang sama
    // dengan perilaku berbeda: jalur yang berbeda lebih sulit tertukar.
    news: {
        daftar: asal + "/news",
        satuPublik: (slug) => asal + "/news/" + slug,
        kelola: asal + "/api/news",
        satu: (idnya) => asal + "/api/news/" + idnya,
        unggahFoto: asal + "/api/news/image",
    },

    // Sertifikat. `verify` sengaja tanpa autentikasi — siapa pun yang
    // memegang sertifikat harus bisa memeriksanya, itu gunanya QR di sana.
    certificate: {
        issue: (idnya) => asal + "/api/certificates/" + idnya + "/issue",
        pdf: (idnya) => asal + "/api/certificates/" + idnya + "/pdf",
        verify: (token) => asal + "/verifikasi/" + token,
    },
};

// Id DOM yang dipakai lebih dari satu berkas.
export const id = {
    kepala: "kepala",
    laci: "laci",
    tirai: "tirai",
    pesan: "pesan",
    isi: "isi",
};

// Peran, disamakan dengan kolom `ulevel` aplikasi lama.
export const PERAN = {
    ADMIN: 1,
    PEMBAYARAN: 2,
    MAHASISWA: 3,
    DOSEN: 4,
    VALIDASI_LPPM: 5,
    ADMIN_FAKULTAS: 6,
};
