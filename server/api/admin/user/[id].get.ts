import { Userdata, Response, Params } from "~~/server/modules";
import { verifyAdminPermission } from "~~/server/modules/admin";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.User.Get");
    logger.info("管理员获取用户信息接口开始处理请求", JobId);

    try {
        const verifyError = await verifyAdminPermission(JobId, event);
        if (verifyError) {
            throw verifyError;
        }

        // 获取用户ID参数
        const userId = getRouterParam(event, "id");
        logger.trace("验证用户 ID 是否存在", JobId);
        Params.verify("缺少用户 ID", "MISSING_USER_ID", userId);

        // 查询用户信息
        logger.trace("执行数据库查询操作", JobId);
        const [user_users, user_oauth] = await Userdata.getUserRecord(JobId, "id", userId!);

        if (!user_users || !user_oauth) {
            logger.warning("用户不存在", JobId);
            throw createError({
                statusCode: 404,
                message: "用户不存在",
                data: { errorCode: "USER_NOT_FOUND" },
            });
        }

        logger.info("用户信息获取成功", JobId);
        return {
            message: "用户信息获取成功",
            user: Response.wrapUserResponse(user_users, user_oauth),
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
