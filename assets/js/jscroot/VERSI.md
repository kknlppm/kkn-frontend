# jscroot lib — salinan vendored

Sumber : https://github.com/jscroot/lib
Versi  : v0.2.8 (tag terbaru; `main` menunjuk ke commit yang sama)
Commit : d71f5fc760f79803204fa594124bce9c59cc5ab3
Diambil: 4 September 2026
Lisensi: MIT (lihat LICENSE)

**Jangan sunting berkas .js di folder ini.** Ia salinan apa adanya dari hulu,
supaya bisa dibandingkan byte-per-byte saat menyegarkan. Yang khas KKN ditulis
di luar folder ini.

Menyegarkan:

    cp ../../../../rujukan-jscroot/lib/*.js .

Verifikasi salinan ini masih sama dengan hulu:

    for f in *.js; do
      diff -q "$f" "../../../../rujukan-jscroot/lib/$f" || echo "BEDA: $f"
    done
