import type { IOperationCallback } from "~/types/Callback";

// 分类数据类型定义
export interface IApiCategoryData {
    id: string;
    name: string;
    description: string;
    slug: string;
    count: number;
}

export interface IApiCategoryPagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

// 创建分类
export const CreateCategory = async (name: string, description: string, slug: string): IOperationCallback => {
    try {
        await $fetch<{ message: string; category: IApiCategoryData }>(`/api/admin/categories`, {
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
export const GetCategoryList = async (page: number = 1, pageSize: number = 10): IOperationCallback => {
    try {
        const response = await $fetch<{
            message: string;
            categories: IApiCategoryData[];
            pagination: IApiCategoryPagination;
        }>(`/api/admin/categories`, {
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
export const UpdateCategory = async (categoryId: string, updates: [string, string][]): IOperationCallback => {
    try {
        await $fetch<{ message: string }>(`/api/admin/categories/${categoryId}`, {
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
export const DeleteCategory = async (categoryId: string): IOperationCallback => {
    try {
        await $fetch<{ message: string }>(`/api/admin/categories/${categoryId}`, {
            method: "DELETE",
        });
        return [true, null];
    } catch (error: any) {
        return [false, error];
    }
};