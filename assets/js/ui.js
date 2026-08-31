// Perkakas antarmuka kecil.
//
// Semuanya menulis lewat textContent, tidak pernah innerHTML — token ada di
// localStorage, jadi satu celah XSS berarti sesi tercuri. Nama mahasiswa dan
// judul KKN adalah masukan pengguna dan harus diperlakukan begitu.
(function () {
    "use strict";

    const UI = {
        // sel membuat satu sel tabel berisi teks apa adanya.
        sel(teks, kelas) {
            const td = document.createElement("td");
            td.textContent = teks == null || teks === "" ? "—" : String(teks);
            if (kelas) td.className = kelas;
            return td;
        },

        // lencana membuat elemen badge DaisyUI. Warnanya dipilih dari daftar
        // tertutup, bukan dirangkai dari data.
        lencana(teks, jenis) {
            const sah = ["success", "warning", "error", "ghost"];
            const span = document.createElement("span");
            span.className = "badge badge-sm badge-" + (sah.includes(jenis) ? jenis : "ghost");
            span.textContent = teks;
            return span;
        },

        selLencana(teks, jenis) {
            const td = document.createElement("td");
            td.appendChild(this.lencana(teks, jenis));
            return td;
        },

        pesan(el, teks, jenis) {
            if (!el) return;
            const sah = ["success", "warning", "error"];
            el.className = "alert alert-" + (sah.includes(jenis) ? jenis : "warning") + " mb-4";
            el.textContent = teks;
            el.classList.remove("hidden");
        },

        sembunyikan(el) { if (el) el.classList.add("hidden"); },

        // kosongkan menghapus isi elemen tanpa innerHTML = "".
        kosongkan(el) {
            while (el && el.firstChild) el.removeChild(el.firstChild);
        },
    };

    window.UI = UI;
})();
