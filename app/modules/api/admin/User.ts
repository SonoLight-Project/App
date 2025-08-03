import type { IApiResponseBase } from "~/types/api/Base";
import type { IApiUserDataResponse } from "~/types/api/Auth";
import type { IOperationCallback } from "~/types/Callback";

// 创建用户
export const CreateUser = async (email: string, password: string, nickname: string): IOperationCallback => {
    try {
        await $fetch<IApiResponseBase>(`/api/admin/user`, {
            method: "POST",
            body: {
                email,
                password,
                nickname,
            },
        });
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};

// 获取用户列表
export const GetUserList = async (page: number = 1, pageSize: number = 10): IOperationCallback => {
    try {
        const response = await $fetch<{
            message: string;
            users: IApiUserDataResponse[];
            pagination: { page: number; pageSize: number; total: number; totalPages: number };
        }>(`/api/admin/user`, {
            method: "GET",
            query: {
                page,
                pageSize,
            },
        });
        return [true, response];
    } catch (error: any) {
        return [false, error];
    }
};

// 获取单个用户信息
export const GetUser = async (userId: string): IOperationCallback => {
    try {
        const response = await $fetch<{ message: string; user: IApiUserDataResponse }>(`/api/admin/user/${userId}`, {
            method: "GET",
        });
        return [true, response.user];
    } catch (error: any) {
        return [false, error];
    }
};

// 更新用户信息
export const UpdateUser = async (userId: string, updates: [string, string][]): IOperationCallback => {
    try {
        await $fetch<{ message: string }>(`/api/admin/user/${userId}`, {
            method: "PUT",
            body: {
                updates,
            },
        });
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};

// 删除用户
export const DeleteUser = async (userId: string): IOperationCallback => {
    try {
        await $fetch<{ message: string }>(`/api/admin/user/${userId}`, {
            method: "DELETE",
        });
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};
