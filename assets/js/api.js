// Pembungkus pemanggilan API. Vanilla fetch, tanpa pustaka — pola GoCroot.
(function () {
    "use strict";

    const BASE = (function () {
        if (window.KKN_API_BASE) return window.KKN_API_BASE;
        const host = window.location.hostname;
        if (host === "localhost" || host === "127.0.0.1") {
            // 8080 dipakai lingkungan uji aplikasi lama, jadi API baru di 8090.
            return "http://localhost:8090";
        }
        // Cloud Functions gen2, asia-southeast2. Diisi setelah deploy pertama.
        return "https://kkn-gocroot-BELUM-DIDEPLOY.a.run.app";
    })();

    const Api = {
        base: BASE,

        async request(method, path, body) {
            const headers = { "Content-Type": "application/json" };
            const token = window.Auth && window.Auth.getToken();
            if (token) headers["Authorization"] = "Bearer " + token;

            const opts = { method: method, headers: headers };
            if (body !== undefined) opts.body = JSON.stringify(body);

            const res = await fetch(this.base + path, opts);

            // 401 = token kedaluwarsa atau tidak sah. Buang sesinya dan
            // kembalikan ke halaman masuk, kecuali memang sedang di sana.
            if (res.status === 401 && window.Auth) {
                window.Auth.clear();
                if (!path.startsWith("/auth/login")) {
                    window.location.href = "/login/";
                    return null;
                }
            }

            const tipe = res.headers.get("Content-Type") || "";
            const data = tipe.includes("application/json")
                ? await res.json()
                : { status: "error", message: await res.text() };

            if (!res.ok || data.status === "error") {
                const err = new Error(data.message || ("HTTP " + res.status));
                err.status = res.status;
                err.data = data;
                throw err;
            }
            return data;
        },

        get(path) { return this.request("GET", path); },
        post(path, body) { return this.request("POST", path, body); },
        put(path, body) { return this.request("PUT", path, body); },
        del(path) { return this.request("DELETE", path); },
    };

    window.Api = Api;
})();
