import bcrypt from "bcryptjs";
import { Userdata, Response, Params } from "~~/server/modules";
import { verifyAdminPermission } from "~~/server/modules/admin";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Admin.User.Create");
    logger.info("管理员创建用户接口开始处理请求", JobId);

    try {
        const verifyError = await verifyAdminPermission(JobId, event);
        if (verifyError) {
            throw verifyError;
        }

        logger.trace("读取请求体数据", JobId);
        const body = await readBody(event);
        const { email, password, nickname } = body;

        logger.trace("验证必需字段是否存在", JobId);
        Params.verify("缺少必需字段", "MISSING_REQUIRED_FIELDS", email, password, nickname);

        // 检查用户是否已存在
        const existingUser = await Userdata.getUserRecordUsersOnly(JobId, "email", email);
        if (existingUser) {
            logger.warning("用户已存在", JobId);
            throw createError({
                statusCode: 409,
                message: "用户已存在",
                data: { errorCode: "USER_ALREADY_EXISTS" },
            });
        }

        // 创建新用户
        logger.trace("加密密码", JobId);
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        logger.trace("执行数据库插入操作", JobId);
        const { data: userData, error: userError } = await supabase
            .from("users")
            .insert({
                email,
                passwordHash,
                nickname,
                role: 0,
            })
            .select()
            .single();

        if (userError) {
            logger.error(`创建用户失败: ${userError.message}`, JobId);
            throw createError({
                statusCode: 500,
                message: "创建用户失败",
                data: { errorCode: "CREATE_USER_FAILED" },
            });
        }

        // 同时在 oauth 表中创建记录
        const { data: oauthData, error: oauthError } = await supabase
            .from("oauth")
            .insert({
                id: userData.id,
            })
            .select()
            .single();

        if (oauthError) {
            logger.error(`创建 OAuth 记录失败: ${oauthError.message}`, JobId);
            // 回滚 users 表的插入操作
            await supabase.from("users").delete().eq("id", userData.id);
            throw createError({
                statusCode: 500,
                message: "创建 OAuth 记录失败",
                data: { errorCode: "CREATE_OAUTH_FAILED" },
            });
        }

        logger.info("用户创建成功", JobId);
        return {
            message: "用户创建成功",
            user: Response.wrapUserResponse(userData, oauthData),
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
