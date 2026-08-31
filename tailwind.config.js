/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.html", "./assets/js/**/*.js"],

    // Kelas yang dirakit dinamis di JavaScript tidak terlihat oleh pemindai
    // Tailwind. Tanpa disebut di sini, kelasnya hilang dari app.css dan
    // lencananya tampil tanpa warna sama sekali.
    safelist: [
        "badge-success", "badge-warning", "badge-error", "badge-ghost",
        "alert-success", "alert-warning", "alert-error",
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
            },
        },
    },

    plugins: [require("daisyui")],

    daisyui: {
        themes: [
            {
                unfari: {
                    // Biru diambil dari batang bawah sertifikat yang sekarang
                    // (#1074ba) supaya aplikasi dan sertifikat tampak sekeluarga.
                    primary: "#1074ba",
                    secondary: "#0d5c94",
                    accent: "#0ea5e9",
                    neutral: "#1e2733",
                    "base-100": "#ffffff",
                    "base-200": "#f4f6f9",
                    "base-300": "#e3e8ef",
                    info: "#0ea5e9",
                    success: "#16a34a",
                    warning: "#d97706",
                    error: "#dc2626",
                },
            },
            "dark",
        ],
    },
};
