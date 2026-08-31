// Perkakas antarmuka.
//
// Semuanya menulis lewat textContent, tidak pernah innerHTML — token ada di
// localStorage, jadi satu celah XSS berarti sesi tercuri. Nama mahasiswa dan
// judul KKN adalah masukan pengguna dan harus diperlakukan begitu.
(function () {
    "use strict";

    const UI = {
        el(tag, kelas, teks) {
            const e = document.createElement(tag);
            if (kelas) e.className = kelas;
            if (teks != null) e.textContent = String(teks);
            return e;
        },

        sel(teks, kelas) {
            const td = document.createElement("td");
            td.className = kelas || "";
            td.textContent = teks == null || teks === "" ? "—" : String(teks);
            if (teks == null || teks === "") td.classList.add("text-tinta-samar");
            return td;
        },

        // deretNilai menggambar kelima komponen nilai KKN sebagai lima batang
        // yang tingginya sebanding dengan skornya.
        //
        // Inilah satu-satunya tempat halaman ini bersuara. Ia menjawab
        // pertanyaan yang benar-benar dihadapi dosen di akhir semester —
        // siapa yang belum lengkap dinilai — tanpa perlu membuka satu per satu.
        deretNilai(r) {
            const komponen = [
                ["H", r.nilai_h], ["S", r.nilai_s], ["L", r.nilai_l],
                ["QP", r.nilai_qp], ["QL", r.nilai_ql],
            ];
            const wadah = this.el("div", "deret-nilai");
            // Judul dibaca pembaca layar dan muncul saat disinggahi kursor;
            // batangnya sendiri tidak menyampaikan angkanya.
            wadah.title = komponen.map(function (k) { return k[0] + " " + (k[1] || 0); }).join("  ");

            komponen.forEach(function (k, i) {
                const nilai = Number(k[1]) || 0;
                const i_ = document.createElement("i");
                if (nilai <= 0) {
                    i_.dataset.kosong = "1";
                } else {
                    // Dipetakan dari 45, bukan dari 0.
                    //
                    // Hampir seluruh nilai KKN jatuh di rentang 75-95. Pada
                    // skala 0-100 kelima batangnya tampak sama tinggi dan
                    // deretnya berubah jadi hiasan. Pita yang benar-benar
                    // informatif adalah 45 ke atas — di bawah itu semuanya
                    // gagal dan selisihnya tidak menolong siapa pun.
                    const b = Math.min(100, Math.max(45, nilai));
                    i_.style.height = Math.round(5 + ((b - 45) / 55) * 15) + "px";
                }
                i_.style.animationDelay = (i * 28) + "ms";
                wadah.appendChild(i_);
            });

            const td = document.createElement("td");
            td.appendChild(wadah);
            return td;
        },

        tanda(teks, jenis) {
            const sah = ["is-sah", "is-belum", "is-kosong"];
            const kelas = "is-" + jenis;
            const s = this.el("span", "tanda " + (sah.includes(kelas) ? kelas : "is-kosong"), teks);
            const td = document.createElement("td");
            td.appendChild(s);
            return td;
        },

        pesan(el, teks, jenis) {
            if (!el) return;
            const warna = jenis === "galat"
                ? "bg-galat-muda text-galat"
                : "bg-belum-muda text-belum";
            el.className = "rounded-md px-3 py-2 text-sm mb-4 " + warna;
            el.textContent = teks;
            el.hidden = false;
        },

        sembunyikan(el) { if (el) el.hidden = true; },

        kosongkan(el) { while (el && el.firstChild) el.removeChild(el.firstChild); },
    };

    window.UI = UI;
})();
