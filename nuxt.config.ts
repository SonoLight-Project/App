import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },

    app: {
        pageTransition: { name: "page", mode: "out-in" },
        layoutTransition: { name: "layout", mode: "out-in" },
    },

    // experimental: {
    //     viewTransition: true
    // },

    modules: ["@nuxt/icon", "@pinia/nuxt", "pinia-plugin-persistedstate/nuxt"],
    css: ["~/assets/main.css"],

    vite: {
        plugins: [tailwindcss()],
    },
});
