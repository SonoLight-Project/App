import { defineEventHandler } from "h3";
import { Response, Userdata } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    // @ts-ignore
    const { platform } = event.context.params;
    const platformName = platformNameWrapper[platform];
    const JobId = logger.createJob(`Api.OAuth.Unbind.${platformName}`);
    try {
        logger.info(`开始处理 ${platformName} 解绑请求`, JobId);

        logger.trace("获取用户 ID", JobId);
        const userId = event.context.auth?.user?.id;
        logger.debug(`用户 ID 获取完成: ${userId ? "存在" : "不存在"}`, JobId);
        if (!userId) {
            logger.error("用户未登录", JobId);
            throw createError({
                statusCode: 401,
                message: "需要先登录",
                data: { errorCode: "NOT_LOGGED_IN" },
            });
        }

        logger.trace(`执行 ${platformName} 解绑操作`, JobId);
        await supabase
            .from("oauth")
            .update({ [`${platform}Id`]: null, [`${platform}Username`]: null })
            .eq("id", userId);
        logger.debug(`${platformName} 解绑操作执行完成`, JobId);

        logger.trace("获取更新后的用户信息", JobId);
        const [user_users, user_oauth] = await Userdata.getUserRecord(JobId, "id", userId);
        logger.debug("更新后的用户信息获取完成", JobId);

        logger.info(`${platformName} 解绑请求处理完成`, JobId);
        return { message: "解绑成功", user: Response.wrapUserResponse(user_users, user_oauth) };
    } catch (error: any) {
        // 如果是我们自己抛出的错误，则不再打印 fatal
        if (error.statusCode && error.message) {
            logger.info("Discord 解绑请求处理完成", JobId);
        } else {
            logger.fatal(`Discord 解绑请求处理失败: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
