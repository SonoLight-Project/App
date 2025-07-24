export function handleDaisyUIDropdownClick<T extends (...args: any[]) => any>(fn: T): ReturnType<T> {
    const callback = fn();

    // Close Dropdown Menu
    // @reference: https://daisyui.com/components/dropdown/
    // @ts-ignore
    document.activeElement.blur();

    return callback;
}