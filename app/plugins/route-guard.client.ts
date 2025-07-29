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

        router.beforeEach((to, from, next) => {
            const isWhitelisted = whitelist.some((rule) => rule(to.path));
            const isAuthenticated = !!accountStore.userId;

            if (isWhitelisted || isAuthenticated) next();
            else next("/account/login");
        });
    }
});
