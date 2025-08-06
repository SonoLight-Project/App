export const verify = (message: string, errorCode: string, ...params: any[]) => {
    if (params.some((param) => param === null || param === undefined)) {
        throw createError({
            statusCode: 400,
            message,
            data: { errorCode },
        });
    }
};
