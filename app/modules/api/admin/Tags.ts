import type { IOperationCallback } from "~/types/Callback";

// 分类数据类型定义
export interface IApiTagData {
    id: string;
    name: string;
    description: string;
    slug: string;
    count: number;
}

export interface IApiTagPagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

// 创建分类
export const CreateTag = async (name: string, description: string, slug: string): IOperationCallback => {
    try {
        await $fetch<{ message: string; category: IApiTagData }>(`/api/admin/tags`, {
            method: "POST",
            body: {
                name,
                description,
                slug,
            },
        });
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};

// 获取分类列表
export const GetTagList = async (page: number = 1, pageSize: number = 10): IOperationCallback => {
    try {
        const response = await $fetch<{
            message: string;
            tags: IApiTagData[];
            pagination: IApiTagPagination;
        }>(`/api/admin/tags`, {
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

// 更新分类信息
export const UpdateTag = async (tagId: string, updates: [string, string][]): IOperationCallback => {
    try {
        await $fetch<{ message: string }>(`/api/admin/tags/${tagId}`, {
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

// 删除分类
export const DeleteTag = async (tagId: string): IOperationCallback => {
    try {
        await $fetch<{ message: string }>(`/api/admin/tags/${tagId}`, {
            method: "DELETE",
        });
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};