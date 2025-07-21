import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },

    app: {
        pageTransition: { name: "page", mode: "out-in" },
        layoutTransition: { name: "layout", mode: "out-in" },
    },

    modules: ["@nuxt/icon", "@pinia/nuxt"],
    css: ["~/assets/main.css"],

    // icon: {
    //     customCollections: [
    //         {
    //             prefix: "sonoicon",
    //             dir: "./app/icons"
    //         }
    //     ]
    // },

    vite: {
        plugins: [tailwindcss()],
    },
});
