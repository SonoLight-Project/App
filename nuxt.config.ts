import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },

    app: {
        pageTransition: { name: "page", mode: "out-in" },
        layoutTransition: { name: "layout", mode: "out-in" },

        head: {
            title: "声致发光 · SonoLight",
            htmlAttrs: {
                lang: "zh-CN",
            },
            meta: [
                { name: "viewport", content: "width=device-width, initial-scale=1.0" },
                // SEO 优化
                { name: "og:title", content: "声致发光 · SonoLight" },
                {
                    name: "og:description",
                    content:
                        "声致发光，一项用于 收集 、分类、描述 、储存 、维护 各服务器（目前仍在或未在运营的服务器）和个人的相关 存档 、机器 或 建筑投影 以及 Minecraft 相关的衍生赛博资产 的项目",
                },
                { name: "og:type", content: "website" },
                { name: "og:url", content: "https://app.sonolight.wiki/" },
                { name: "og:site_name", content: "声致发光" },
                { name: "og:locale", content: "zh_CN" },
            ],
            link: [
                { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
                { rel: "preload", as: "image", href: "https://mcjpg.org/logo.png" },
            ],
        },
    },

    // experimental: {
    //     viewTransition: true
    // },

    modules: ["@nuxt/icon", "@pinia/nuxt", "pinia-plugin-persistedstate/nuxt", "@nuxt/content"],
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
    },
});
