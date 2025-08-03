import { defineEventHandler } from "h3";
import { OAuth, Userdata, Response } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    // @ts-ignore
    const { platform } = event.context.params;
    const platformName = platformNameWrapper[platform];
    const JobId = logger.createJob(`Api.OAuth.Bind.${platformName}`);

    try {
        logger.info(`开始处理 ${platformName} 绑定请求`, JobId);

        logger.trace("读取请求体中的授权码", JobId);
        const { code } = await readBody(event);
        logger.debug(`授权码读取完成: ${code ? "存在" : "不存在"}`, JobId);
        if (!code) {
            logger.warning("缺少授权码", JobId);
            throw createError({
                statusCode: 400,
                message: "缺少授权码",
                data: { errorCode: "MISSING_AUTH_CODE" },
            });
        }

        logger.trace("获取用户ID", JobId);
        const userId = event.context.auth?.user?.id;
        logger.debug(`用户ID获取完成: ${userId ? "存在" : "不存在"}`, JobId);
        if (!userId) {
            logger.error("需要先登录", JobId);
            throw createError({
                statusCode: 401,
                message: "需要先登录",
                data: { errorCode: "NOT_LOGGED_IN" },
            });
        }

        // 交换 Code 得到 AccessToken
        let access_token;
        switch (platform) {
            case "discord":
                access_token = await OAuth.Discord.getAccessToken(JobId, code);
                break;
            case "github":
                access_token = await OAuth.GitHub.getAccessToken(JobId, code);
                break;
            case "mcjpg":
                access_token = await OAuth.MCJPG.getAccessToken(JobId, code);
                break;
            default:
                throw createError({
                    statusCode: 500,
                    message: "不支持的平台",
                    data: { errorCode: "UNSUPPORTED_PLATFORM" },
                });
        }

        // 获取用户信息
        let user_record;
        switch (platform) {
            case "github":
                user_record = await OAuth.GitHub.getUserRecord(JobId, access_token);
                break;
            case "discord":
                user_record = await OAuth.Discord.getUserRecord(JobId, access_token);
                break;
            case "mcjpg":
                user_record = await OAuth.MCJPG.getUserRecord(JobId, access_token);
                break;
            default:
                throw createError({ statusCode: 400, message: "不支持的平台" });
        }
        const { id, username } = user_record;

        // 检查是否已被绑定
        logger.trace(`检查 ${platformName} 账户是否已被绑定`, JobId);
        const { data: existing } = await supabase.from("oauth").select("*").eq(`${platformName}Id`, id).neq("id", userId).single();
        logger.debug(`检查完成: ${existing ? "已绑定" : "未绑定"}`, JobId);
        if (existing) {
            logger.warning(`该 ${platformName} 账户已被其他用户绑定`, JobId);
            throw createError({
                statusCode: 409,
                message: `该 ${platformName} 账户已被其他用户绑定`,
                data: { errorCode: "ACCOUNT_ALREADY_BOUND" },
            });
        }

        // 绑定Discord账户
        logger.trace(`绑定 ${platformName} 账户`, JobId);
        await supabase
            .from("oauth")
            .update({ [`${platformName}Id`]: id, [`${platformName}Username`]: username })
            .eq("id", userId);
        logger.debug(`${platformName} 账户绑定成功`, JobId);

        logger.trace("获取更新后的用户信息", JobId);
        const [user_users, user_oauth] = await Userdata.getUserRecord(JobId, "id", userId);
        logger.debug("用户信息获取完成", JobId);

        logger.info(`${platformName} 绑定请求处理完成`, JobId);
        return { message: "绑定成功", user: Response.wrapUserResponse(user_users, user_oauth) };
    } catch (error: any) {
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
