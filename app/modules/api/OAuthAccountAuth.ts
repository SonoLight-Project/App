import type { IApiUserDataResponse } from "~/types/api/Auth";
import type { IOperationCallback } from "~/types/Callback";

export const Login = async (platform: string, code: string, state: string): IOperationCallback => {
    const accountStore = useAccountStore();
    try {
        const { user } = await $fetch<IApiUserDataResponse>(`/api/oauth/${platform}/login`, {
            method: "POST",
            body: {
                code,
                state,
            },
        });
        accountStore.setUser(user["userId"], user["userName"], user["userRole"], user["discordUsername"], user["githubUsername"], user["mcjpgUsername"]);
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};

export const Bind = async (platform: string, code: string, state: string): IOperationCallback => {
    const accountStore = useAccountStore();
    try {
        const { user } = await $fetch<IApiUserDataResponse>(`/api/oauth/${platform}/bind`, {
            method: "POST",
            body: {
                code,
                state,
            },
        });
        accountStore.setUser(user["userId"], user["userName"], user["userRole"], user["discordUsername"], user["githubUsername"], user["mcjpgUsername"]);
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};

export const Unbind = async (platform: string): IOperationCallback => {
    const accountStore = useAccountStore();
    try {
        const { user } = await $fetch<IApiUserDataResponse>(`/api/oauth/${platform}/unbind`, {
            method: "POST",
        });
        accountStore.setUser(user["userId"], user["userName"], user["userRole"], user["discordUsername"], user["githubUsername"], user["mcjpgUsername"]);
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};
