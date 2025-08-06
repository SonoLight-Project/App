import type { IApiUserDataResponse } from "~/types/api/Auth";
import type { IOperationCallback } from "~/types/Callback";

export const Login = async (email: string, password: string): IOperationCallback => {
    const accountStore = useAccountStore();
    try {
        const { user } = await $fetch<IApiUserDataResponse>("/api/auth/login", {
            method: "POST",
            body: {
                email: email,
                password: password,
            },
        });
        accountStore.setUser(user["userId"], user["userName"], user["userRole"], user["discordUsername"], user["githubUsername"], user["mcjpgUsername"]);
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};

export const Register = async (username: string, email: string, password: string): IOperationCallback => {
    try {
        await $fetch("/api/auth/register", {
            method: "POST",
            body: {
                username: username,
                email: email,
                password: password,
            },
        });
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};

export const Logout = async (): IOperationCallback => {
    try {
        await $fetch("/api/auth/logout", {
            method: "POST",
        });
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};
