export const desensitization = (c: string) => {
    return c[0] + "*".repeat(c.length - 2) + c[c.length - 1];
};
