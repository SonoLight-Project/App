export async function handleDaisyUIDropdownClick<T extends (...args: any[]) => any>(fn: T): Promise<Awaited<ReturnType<T>>> {
    const callback = await fn();

    // Close Dropdown Menu
    // @reference: https://daisyui.com/components/dropdown/
    // @ts-ignore
    document.activeElement.blur();

    return callback;
}

export function wrapRequestErrorMessage(error: any, fallback: string) {
    return error.statusCode !== 500 ? (error?.data?.message || fallback) : "发生服务器内部错误，请联系管理员"
}