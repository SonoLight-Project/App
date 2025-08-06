export const desensitization = (c: string) => {
    if (c.length <= 2) return c;
    return c[0] + "*".repeat(c.length - 2) + c[c.length - 1];
};
