// 查询 OAuth 相关信息
export default defineEventHandler(async (event) => {
    const userId = event.context.auth?.user?.id;

    if (!userId) {
        throw createError({
            statusCode: 400,
            message: "用户未登录",
            data: { errorCode: "OAUTH_QUERY:USER_NOT_LOGGED_IN" },
        });
    }

    // 读参数，platform = 平台标识
    const platform = getQuery(event).platform;
    if (!platform) {
        throw createError({
            statusCode: 400,
            message: "缺少平台标识",
            data: { errorCode: "OAUTH_QUERY:MISSING_PLATFORM" },
        });
    }

    switch (platform) {
        case "github":
            return (
                process.env.GITHUB_OAUTH_URI ||
                "https://github.com/login/oauth/authorize?client_id=Ov23liGnvXbFkUAOcQ3l&redirect_uri=https://sonolight.vercel.app/account/oauth-redirect/github&scope=user"
            );
        case "discord":
            return (
                process.env.DISCORD_OAUTH_URI ||
                "https://discord.com/oauth2/authorize?client_id=1396193252138549248&response_type=code&redirect_uri=https%3A%2F%2Fsonolight.vercel.app%2Faccount%2Foauth-redirect%2Fdiscord&scope=identify"
            );
        default:
            throw createError({
                statusCode: 400,
                message: "不支持的平台",
                data: { errorCode: "OAUTH_QUERY:UNSUPPORTED_PLATFORM" },
            });
    }
});
