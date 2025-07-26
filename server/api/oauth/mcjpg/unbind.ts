import { defineEventHandler } from "h3";
import supabase from "../../../utils/db";
import logger from "../../../utils/logging";
import { random } from "lodash-es";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob(`API OAuth/MCJPG/Unbind #${random(9999)}`);
    try {
        logger.info("开始处理 MCJPG 解绑请求", JobId);

        logger.trace("获取用户上下文", JobId);
        const user = event.context.auth?.user;
        logger.debug(`用户上下文获取完成: ${user ? "存在" : "不存在"}`, JobId);

        if (!user) {
            logger.error("用户未登录", JobId);
            throw createError({
                statusCode: 401,
                message: "未登录",
            });
        }

        logger.trace("执行 MCJPG 解绑操作", JobId);
        const { data, error } = await supabase.from("oauth").update({ mcjpgId: null, mcjpgUsername: null }).eq("id", user.id).select().single();
        logger.debug(`解绑操作完成: ${error ? "失败" : "成功"}`, JobId);

        if (error) {
            logger.fatal("解绑失败", JobId);
            throw createError({
                statusCode: 500,
                message: "解绑失败",
            });
        }

        logger.info("MCJPG 解绑请求处理完成", JobId);
        return {
            message: "解绑成功",
            user: data,
        };
    } catch (error: any) {
        if (!error.statusCode) {
            logger.fatal(`请求过程中发生未处理的错误: ${error.message}`, JobId);
        }
        throw error;
    } finally {
        logger.deleteGroup(JobId);
    }
});
