import bcrypt from "bcryptjs";
import { Response, Params, Userdata, Jwt, Cookie } from "~~/server/modules";

export default defineEventHandler(async (event) => {
    const JobId = logger.createJob("Api.Auth.Login");
    logger.info("登录接口开始处理请求", JobId);

    logger.trace("读取请求体数据", JobId);
    const body = await readBody(event);
    const { email, password } = body;
    logger.debug(
        `请求体数据: ${JSON.stringify({ email: email ? desensitization(email) : "[空]", password: password ? desensitization(password) : "[空]" })}`,
        JobId
    );

    logger.trace("验证邮箱和密码是否存在", JobId);
    Params.verify("缺少邮箱或密码", "MISSING_EMAIL_OR_PASSWORD", email, password);

    try {
        const user_users = await Userdata.getUserRecordUsersOnly(JobId, "email", email);
        if (!user_users) {
            logger.warning("用户不存在，邮箱: " + desensitization(email), JobId);
            throw createError({ statusCode: 404, message: "用户不存在", data: { errorCode: "USER_NOT_FOUND" } });
        }
        const user_oauth = await Userdata.getUserRecordOAuthOnly(JobId, "id", user_users.id);
        if (!user_oauth) {
            logger.warning("用户 OAuth 记录不存在，用户 ID: " + user_users.id, JobId);
            throw createError({ statusCode: 404, message: "用户不存在", data: { errorCode: "USER_NOT_FOUND" } });
        }

        logger.trace("验证密码正确性", JobId);
        const isValid = await bcrypt.compare(password, user_users.passwordHash);

        logger.debug(`密码验证结果: ${isValid ? "正确" : "错误"}`, JobId);
        if (!isValid) {
            logger.error("密码错误，邮箱: " + email, JobId);
            throw createError({ statusCode: 401, message: "密码错误", data: { errorCode: "WRONG_PASSWORD" } });
        }

        const accessToken = await Jwt.signAccessToken(JobId, user_users);
        const refreshToken = await Jwt.signRefreshTokenAndSave(JobId, user_users);

        Cookie.setEventCookie(JobId, event, accessToken, refreshToken);

        logger.info("登录成功，准备返回用户信息", JobId);
        return {
            message: "登录成功",
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
