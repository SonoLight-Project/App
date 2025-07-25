import supabase from "../../../utils/db";
import logger from "../../../utils/logging";
import { defineEventHandler } from "h3";
import { random } from "lodash-es";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`API OAuth/Discord/Unbind #${random(9999)}`);
    try {
        logger.info("开始处理 Discord 解绑请求", JobId);
        
        logger.trace("获取用户 ID", JobId);
        const userId = event.context.auth?.user?.id;
        logger.debug(`用户 ID 获取完成: ${userId ? '存在' : '不存在'}`, JobId);

        if (!userId) {
            logger.error("用户未登录", JobId);
            throw createError({
                statusCode: 401,
                message: "需要先登录",
                data: { errorCode: "DC_OAUTH_UNBIND:USER_NOT_LOGGED_IN" },
            });
        }

        // 解绑Discord账户
        logger.trace("执行 Discord 解绑操作", JobId);
        await supabase.from("oauth").update({ discordId: null, discordUsername: null }).eq("id", userId);
        logger.debug("解绑操作执行完成", JobId);

        logger.trace("获取更新后的用户信息", JobId);
        const { data: updatedUser_users } = await supabase.from("users").select("id, username, role").eq("id", userId).single();
        const { data: updatedUser_oauth } = await supabase.from("oauth").select("*").eq("id", userId).single();
        logger.debug("更新后的用户信息获取完成", JobId);

        logger.info("Discord 解绑请求处理完成", JobId);
        return { message: "解绑成功", user: { ...updatedUser_users, ...updatedUser_oauth } };
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
