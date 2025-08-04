import { defineEventHandler } from "h3";
import { Cookie, Jwt, Response, Userdata, OAuth } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    // @ts-ignore
    const { platform } = event.context.params;
    const platformName = platformNameWrapper[platform];

    const JobId = logger.createJob(`Api.OAuth.${platformName}.Login`);
    try {
        logger.info(`开始处理 ${platformName} 登录请求`, JobId);

        logger.trace("读取请求体中的授权码", JobId);
        const { code } = await readBody(event);
        logger.debug(`授权码读取完成: ${code ? "存在" : "不存在"}`, JobId);
        if (!code) {
            logger.warning("缺少授权码", JobId);
            throw createError({ statusCode: 400, message: "缺少授权码" });
        }

        // 交换 Code 得到 AccessToken
        let access_token;
        switch (platform) {
            case "github":
                access_token = await OAuth.GitHub.getAccessToken(JobId, code);
                break;
            case "discord":
                access_token = await OAuth.Discord.getAccessToken(JobId, code);
                break;
            case "mcjpg":
                access_token = await OAuth.MCJPG.getAccessToken(JobId, code);
                break;
            default:
                throw createError({ statusCode: 400, message: "不支持的平台" });
        }

        // 获取用户信息
        let user_oauth;
        switch (platform) {
            case "github":
                user_oauth = await OAuth.GitHub.getUserRecord(JobId, access_token);
                break;
            case "discord":
                user_oauth = await OAuth.Discord.getUserRecord(JobId, access_token);
                break;
            case "mcjpg":
                user_oauth = await OAuth.MCJPG.getUserRecord(JobId, access_token);
                break;
            default:
                throw createError({ statusCode: 400, message: "不支持的平台" });
        }

        const user_users = await Userdata.getUserRecordUsersOnly(JobId, "id", user_oauth.id);
        if (!user_users) {
            logger.error("未找到关联账户", JobId);
            throw createError({
                statusCode: 401,
                message: "未找到关联账户",
                data: { errorCode: "NO_ASSOCIATED_ACCOUNT" },
            });
        }

        const accessToken = await Jwt.signAccessToken(JobId, user_users);
        const refreshToken = await Jwt.signRefreshTokenAndSave(JobId, user_users);

        Cookie.setEventCookie(JobId, event, accessToken, refreshToken);

        logger.info(`${platformName} 登录请求处理完成`, JobId);
        return {
            message: "登录成功",
            user: Response.wrapUserResponse(user_users, user_oauth),
        };
    } catch (error: any) {
        // 如果是我们自己抛出的错误，则不再打印 fatal
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
