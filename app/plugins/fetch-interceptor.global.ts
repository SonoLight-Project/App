export default defineNuxtPlugin(() => {
    const originalFetch = $fetch;
    const RETRY_HEADER = "x-fetched-retried";

    const customFetch = async function <T>(request: string | Request, options: any = {}) {
        try {
            return await originalFetch<T>(request, options);
        } catch (err: any) {
            const statusCode = err?.statusCode || err?.response?.status;
            const errorCode = err?.data?.errorCode || "";
            const alreadyRetried = options?.headers?.[RETRY_HEADER] === "1";

            if (!alreadyRetried && request.toString().startsWith("/api/") && statusCode === 401) {
                try {
                    console.log("[Fetch Interceptor] 尝试自动刷新 Token");
                    await originalFetch("/api/auth/refresh", {
                        method: "POST",
                        credentials: "include",
                    });
                    console.log("[Fetch Interceptor] Token 刷新成功");
                    return await originalFetch<T>(request, {
                        ...options,
                        headers: {
                            ...options.headers,
                            [RETRY_HEADER]: "1",
                        },
                    });
                } catch (refreshError) {
                    console.error("[Fetch Interceptor] 刷新 token 失败:", refreshError);
                    throw refreshError;
                }
            } else throw err;
        }
    };

    Object.assign(customFetch, originalFetch);

    globalThis.$fetch = customFetch as typeof $fetch;
});
