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

    modules: [
        "@nuxt/icon",
        "@pinia/nuxt",
        "pinia-plugin-persistedstate/nuxt",
        "@nuxt/content",
        '@tresjs/nuxt',
    ],
    css: ["~/assets/main.css"],

    // icon: {
    //     customCollections: [
    //         {
    //             prefix: "sonoicon-id",
    //             dir: "./app/icons/identity/*"
    //         },
    //     ]
    // },

    vite: {
        plugins: [tailwindcss()],
        define: {
            'global': 'globalThis',
        },
        resolve: {
            alias: {
                buffer: 'buffer/',
            },
        },
        build: {
            rollupOptions: {
                external: ['three'],
            },
        },
    },

    tres: {
        
        glsl: false,     
    },
});
