// Laci formulir yang muncul dari kanan.
//
// Dipakai untuk menambah dan mengubah, supaya daftar di belakangnya tetap
// terlihat — orang biasanya menambah data sambil melihat yang sudah ada.
//
// Yang harus benar dan sering terlewat: fokus dipindahkan ke dalam laci saat
// dibuka, dikembalikan ke tombol pemanggil saat ditutup, Escape menutup, dan
// Tab tidak bisa keluar dari laci selama ia terbuka.
export function buat(idLaci, idTirai, idBatal) {
    const laci = document.getElementById(idLaci);
    const tirai = document.getElementById(idTirai);
    const batal = idBatal ? document.getElementById(idBatal) : null;
    let pemanggil = null;

    function bisaFokus() {
        return laci.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        );
    }

    function buka() {
        pemanggil = document.activeElement;
        tirai.hidden = false;
        laci.hidden = false;
        // Dipaksa satu bingkai supaya transisinya benar-benar berjalan.
        requestAnimationFrame(function () { laci.classList.add("terbuka"); tirai.classList.add("terbuka"); });
        const f = bisaFokus();
        if (f.length) f[0].focus();
        document.addEventListener("keydown", padaTombol, true);
    }

    function tutup() {
        laci.classList.remove("terbuka");
        tirai.classList.remove("terbuka");
        document.removeEventListener("keydown", padaTombol, true);
        setTimeout(function () { laci.hidden = true; tirai.hidden = true; }, 180);
        if (pemanggil && pemanggil.focus) pemanggil.focus();
    }

    function padaTombol(e) {
        if (e.key === "Escape") { e.preventDefault(); tutup(); return; }
        if (e.key !== "Tab") return;
        // Jebak fokus: Tab dari elemen terakhir kembali ke yang pertama.
        const f = bisaFokus();
        if (!f.length) return;
        const awal = f[0], akhir = f[f.length - 1];
        if (e.shiftKey && document.activeElement === awal) { e.preventDefault(); akhir.focus(); }
        else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); awal.focus(); }
    }

    tirai.addEventListener("click", tutup);
    if (batal) batal.addEventListener("click", tutup);

    return { buka: buka, tutup: tutup };
}
