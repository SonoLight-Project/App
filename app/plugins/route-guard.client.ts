import { defineNuxtPlugin } from "#app";

type IRule = (p: string) => boolean;

export default defineNuxtPlugin((_nuxtApp) => {
    if (process.client) {
        const router = useRouter();
        const accountStore = useAccountStore();

        const whitelist: IRule[] = [
            (p) => p === "/", // 根目录
            (p) => p.startsWith("/docs/"), // 文档
            (p) => p.startsWith("/account/"), // 账户相关
            (p) => p.startsWith("http://"), // 外部链接 HTTP
            (p) => p.startsWith("https://"), // 外部链接 HTTPS
        ];

        router.beforeEach((to, from, next) => {
            const isWhitelisted = whitelist.some((rule) => rule(to.path));
            const isAuthenticated = !!accountStore.userId;
            const isAdmin = (accountStore.userRole ?? 0) > 7;

            // Rule 1: 重定向 / => /explore
            if (to.path === "/") next("/explore");
            // Rule 2: 如果访问的是管理员面板则鉴权
            else if (to.path.startsWith("/admin")) {
                if (isAdmin) next();
                else next(from); // 否则不让跳转管理员面板
            }
            // Rule 3: 白名单路径不校验
            else if (isWhitelisted) next();
            // Rule 4: 已认证则放行
            else if (isAuthenticated) next();
            // Rule 5: 其他路径且未登录 => 重定向到登录页
            else next("/account/login");
        });
    }
});
