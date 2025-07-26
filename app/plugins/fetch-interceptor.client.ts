export default defineNuxtPlugin((nuxtApp) => {
    const nx$fetch = $fetch;

    // @ts-ignore
    $fetch = async function <T>(request, options = {}) {
        try {
            return await nx$fetch<T>(request, options);
        } catch (err: any) {
            const statusCode = err?.statusCode || err?.response?.status;
            const errorCode = err?.data?.errorCode || "";

            if (
                request.toString().startsWith("/api/") &&
                statusCode === 400 &&
                typeof errorCode === "string" &&
                errorCode.includes("USER_NOT_LOGGED_IN")
            ) {
                // 1. 尝试刷新 accessToken
                try {
                    await nx$fetch("/api/auth/refresh-token", {
                        method: "POST",
                        credentials: "include", // 确保 HttpOnly cookie 被发送
                    });

                    // 2. 重新尝试原请求
                    return await nx$fetch<T>(request, options);
                } catch (refreshError) {
                    console.error("刷新 token 失败:", refreshError);
                    throw refreshError;
                }
            }

            // 不是特定错误，直接抛出
            throw err;
        }
    };
});
