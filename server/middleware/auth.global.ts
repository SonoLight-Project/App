import { defineEventHandler, getCookie } from "h3";
import { jwtVerify } from "jose/jwt/verify";
import logger from "../utils/logging";
import { desensitization } from "../utils/desensitization";
import { random } from "lodash-es";

export default defineEventHandler(async (event) => {
    const _url = event.node.req.url;
    if (_url?.startsWith("/api/_") || !_url?.startsWith("/api")) return;

    const JobId = logger.createJob(`Event OnReq/Auth #${random(9999)}`);
    logger.info("开始处理事件认证", JobId);

    try {
        logger.trace("正在获取访问令牌", JobId);
        const token = getCookie(event, "accessToken");
        logger.debug(`令牌获取结果: ${token ? "已获取" : "未找到"}`, JobId);

        if (!token) {
            logger.info("未找到访问令牌，跳过头部设置", JobId);
            logger.deleteGroup(JobId);
            return;
        }

        logger.trace("正在验证JWT令牌", JobId);
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
        const decoded = payload as { id: string; role: string };
        logger.debug(`JWT验证成功，用户ID: ${desensitization(decoded.id)}`, JobId);

        logger.trace("正在设置事件上下文", JobId);
        event.context.auth = {
            user: decoded,
        };

        logger.info("认证处理完成", JobId);
    } catch (err: any) {
        logger.warning(`认证过程中发生未处理的错误: ${err.message}`, JobId);
    } finally {
        logger.deleteGroup(JobId);
    }
});
