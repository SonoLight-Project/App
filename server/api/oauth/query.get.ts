export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`Api.OAuth.Query`);
    try {
        logger.info("开始处理 OAuth 查询请求", JobId);

        logger.trace("获取平台参数", JobId);
        const platform = getQuery(event).platform;
        logger.debug(`平台参数获取完成: ${platform}`, JobId);
        if (!platform) {
            logger.warning("缺少平台标识", JobId);
            throw createError({
                statusCode: 400,
                message: "缺少平台标识",
                data: { errorCode: "MISSING_PLATFORM" },
            });
        }

        logger.trace("处理平台切换逻辑", JobId);
        switch (platform) {
            case "github":
                logger.debug("返回 GitHub OAuth URI", JobId);
                return (
                    process.env.GITHUB_OAUTH_URI ||
                    "https://github.com/login/oauth/authorize?client_id=Ov23liGnvXbFkUAOcQ3l&redirect_uri=https://app.sonolight.wiki/account/oauth-redirect/github&scope=user"
                );
            case "discord":
                logger.debug("返回 Discord OAuth URI", JobId);
                return (
                    process.env.DISCORD_OAUTH_URI ||
                    "https://discord.com/oauth2/authorize?client_id=1396193252138549248&response_type=code&redirect_uri=https%3A%2F%2Fapp.sonolight.wiki%2Faccount%2Foauth-redirect%2Fdiscord&scope=identify"
                );
            case "mcjpg":
                logger.debug("返回 MCJPG OAuth URI", JobId);
                return (
                    process.env.MCJPG_OAUTH_URI ||
                    "https://sso.mcjpg.org/login/oauth/authorize?response_type=code&client_id=2e776d199dd05d8413e2&redirect_uri=https://app.sonolight.wiki/account/oauth-redirect/mcjpg&scope=openid+profile+email"
                );
            default:
                logger.warning(`不支持的平台: ${platform}`, JobId);
                throw createError({
                    statusCode: 400,
                    message: "不支持的平台",
                    data: { errorCode: "UNSUPPORTED_PLATFORM" },
                });
        }
    } catch (error: any) {
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
