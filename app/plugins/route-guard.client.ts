import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin((nuxtApp) => {
    if (process.client) {
        const router = useRouter();
        const accountStore = useAccountStore();

        const whitelist: ((p: string) => boolean)[] = [
            (p) => p === "/", // 根目录
            (p) => p.startsWith("/docs/"), // 文档
            (p) => p.startsWith("/account/"), // 账户相关
            (p) => p.startsWith("http://"), // 外部链接 HTTP
            (p) => p.startsWith("https://"), // 外部链接 HTTPS
        ];

        router.beforeEach((to, from) => {
            if (whitelist.some((rule) => rule(to.path))) return true;
            if (!accountStore.userId) return "/account/login";
            return true;
        });
    }
});
