<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import { GetCategoryList, CreateCategory, UpdateCategory, DeleteCategory } from "~/modules/api/admin/Categories";
    import { EventBus } from "~/modules/Eventbus";

    interface Category {
        id: string;
        name: string;
        description: string;
        slug: string;
        count: number;
    }

    const categories = ref<Category[]>([]);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const total = ref(0);
    const totalPages = ref(0);
    const isLoading = ref(true);
    // 创建分类模态框相关
    const showCreateModal = ref(false);
    const createForm = ref({
        name: "",
        description: "",
        slug: "",
    });
    // 编辑分类模态框相关
    const showEditModal = ref(false);
    const isEditMode = ref(false);
    const editingCategory = ref<Category | null>(null);
    const editForm = ref({
        name: "",
        description: "",
        slug: "",
    });
    // 删除分类确认模态框相关
    const showDeleteModal = ref(false);
    const deletingCategory = ref<Category | null>(null);

    const fetchCategories = async (isRefresh?: boolean) => {
        isLoading.value = true;
        categories.value = [];
        const [status, response] = await GetCategoryList(currentPage.value, pageSize.value);
        if (status && response) {
            categories.value = response.categories;
            total.value = response.pagination.total;
            totalPages.value = response.pagination.totalPages;
            EventBus.emit("toast:create", {
                alertType: "success",
                content: (isRefresh ? "刷新" : "获取") + "分类列表成功",
            });
        } else if (!status) {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(response, "获取分类列表失败"),
            });
        }
        isLoading.value = false;
    };

    const openCreateModal = () => {
        // 初始化表单数据
        createForm.value = {
            name: "",
            description: "",
            slug: "",
        };
        showCreateModal.value = true;
    };

    const closeCreateModal = () => {
        showCreateModal.value = false;
    };

    const confirmCreateCategory = async () => {
        isLoading.value = true;
        const [success, error] = await CreateCategory(createForm.value.name, createForm.value.description, createForm.value.slug);
        if (success) {
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "分类创建成功",
            });
            closeCreateModal();
            fetchCategories(true);
        } else {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(error, "分类创建失败"),
            });
            closeCreateModal();
            isLoading.value = false;
        }
    };

    const openEditModal = (category: Category, isEdit?: boolean) => {
        editingCategory.value = category;
        // 初始化表单数据
        editForm.value = {
            name: category.name,
            description: category.description,
            slug: category.slug,
        };
        showEditModal.value = true;
        isEditMode.value = isEdit || false;
    };

    const closeEditModal = () => {
        showEditModal.value = false;
        editingCategory.value = null;
    };

    const confirmEditCategory = async () => {
        if (!editingCategory.value) return;

        isLoading.value = true;

        // 构造更新数据
        const updates = [];

        // 检查并添加变更的字段
        if (editForm.value.name !== editingCategory.value.name) {
            updates.push(["name", editForm.value.name]);
        }
        if (editForm.value.description !== editingCategory.value.description) {
            updates.push(["description", editForm.value.description]);
        }
        if (editForm.value.slug !== editingCategory.value.slug) {
            updates.push(["slug", editForm.value.slug]);
        }

        // 如果没有变更，则直接关闭模态框
        if (updates.length === 0) {
            closeEditModal();
            return;
        }

        console.debug("debug", updates);
        const [success, error] = await UpdateCategory(
            editingCategory.value.id,
            // @ts-ignore
            updates
        );
        if (success) {
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "分类更新成功",
            });
            closeEditModal();
            fetchCategories(true);
        } else {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(error, "分类更新失败"),
            });
            closeEditModal();
            isLoading.value = false;
        }
    };

    const openDeleteModal = (category: Category) => {
        deletingCategory.value = category;
        showDeleteModal.value = true;
    };

    const closeDeleteModal = () => {
        showDeleteModal.value = false;
        deletingCategory.value = null;
    };

    const confirmDeleteCategory = async () => {
        if (!deletingCategory.value) return;
        isLoading.value = true;
        // 检查是否还有内容
        if (deletingCategory.value.count > 0) {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "error",
                content: "分类下有内容，无法删除",
            });
            isLoading.value = false;
            return;
        }
        const [success, error] = await DeleteCategory(deletingCategory.value.id);
        if (success) {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "分类删除成功",
            });
            fetchCategories(true);
        } else {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(error, "分类删除失败"),
            });
            isLoading.value = false;
        }
    };

    const prevPage = () => {
        if (currentPage.value > 1) {
            currentPage.value--;
            fetchCategories();
        }
    };

    const nextPage = () => {
        if (currentPage.value < totalPages.value) {
            currentPage.value++;
            fetchCategories();
        }
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages.value || currentPage.value === page) return;
        currentPage.value = page;
        fetchCategories();
    };

    onMounted(() => {
        fetchCategories();
    });
</script>

<template>
    <main class="w-full h-full px-16 pb-8 pt-24">
        <div class="w-full mt-4 flex justify-between">
            <h1 class="ui-font-hl">管理员面板 · 分类管理</h1>
            <button class="btn btn-success" :disabled="isLoading" @click="openCreateModal">创建分类</button>
        </div>
        <div class="overflow-x-auto mt-8">
            <table class="table table-zebra">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>名称</th>
                        <th>描述</th>
                        <th>Slug</th>
                        <th>内容数</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="categories.length > 0" v-for="category in categories" :key="category.id">
                        <td>{{ category.id }}</td>
                        <td>{{ category.name }}</td>
                        <td>{{ category.description }}</td>
                        <td>{{ category.slug }}</td>
                        <td>{{ category.count }}</td>
                        <td>
                            <button class="btn btn-sm btn-warning mr-2" @click="openEditModal(category)">查看全部</button>
                            <button class="btn btn-sm btn-info mr-2" @click="openEditModal(category, true)">编辑</button>
                            <button class="btn btn-sm btn-error" @click="openDeleteModal(category)">删除</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <section class="w-full mt-4 flex justify-center items-center" v-if="categories.length > 0">
            <div class="join">
                <button class="join-item btn" @click="prevPage" :disabled="currentPage === 1">«</button>
                <button class="join-item btn" v-for="page in totalPages" :key="page" @click="goToPage(page)" :class="{ 'btn-active': page === currentPage }">
                    {{ page }}
                </button>
                <button class="join-item btn" @click="nextPage" :disabled="currentPage === totalPages">»</button>
            </div>
        </section>
        <section class="w-full mt-8 flex justify-center items-center gap-2" v-else-if="isLoading">
            <span class="loading loading-spinner text-primary"></span>
            <p>正在加载数据</p>
        </section>
        <section class="w-full mt-8 flex justify-center items-center" v-else>
            <p>暂无分类数据</p>
        </section>
        <!-- 编辑分类模态框 -->
        <section v-if="showEditModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">{{ isEditMode ? "编辑分类" : "查看分类信息" }}</h3>
                <p class="py-4">ID: {{ editingCategory?.id }}</p>
                <div class="w-full grid grid-cols-2 gap-2">
                    <fieldset class="fieldset w-full">
                        <legend class="fieldset-legend">名称</legend>
                        <input type="text" class="input" :disabled="!isEditMode" v-model="editForm.name" />
                    </fieldset>
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Slug</legend>
                        <input type="text" class="input" disabled v-model="editForm.slug" />
                    </fieldset>
                </div>
                <fieldset class="fieldset w-full">
                    <legend class="fieldset-legend">描述</legend>
                    <input type="text" class="input w-full" :disabled="!isEditMode" v-model="editForm.description" />
                </fieldset>
                <div class="modal-action">
                    <button class="btn btn-primary btn-outline" @click="closeEditModal" :disabled="isLoading">{{ isEditMode ? "取消" : "关闭" }}</button>
                    <button class="btn btn-error" @click="confirmEditCategory" v-if="isEditMode" :disabled="isLoading">确认</button>
                </div>
            </div>
        </section>
        <!-- 删除分类确认模态框 -->
        <section v-if="showDeleteModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">确认删除分类</h3>
                <p class="py-4">您确定要删除分类 "{{ deletingCategory?.name }}" 吗？此操作不可撤销。</p>
                <div class="modal-action">
                    <button class="btn btn-primary btn-outline" @click="closeDeleteModal" :disabled="isLoading">取消</button>
                    <button class="btn btn-primary btn-outline" @click="confirmDeleteCategory" :disabled="isLoading">确认</button>
                    <button class="btn btn-primary" @click="closeDeleteModal" :disabled="isLoading">取消</button>
                </div>
            </div>
        </section>
        <!-- 创建分类模态框 -->
        <section v-if="showCreateModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">创建分类</h3>
                <div class="w-full grid grid-cols-2 gap-2">
                    <fieldset class="fieldset w-full">
                        <legend class="fieldset-legend">名称</legend>
                        <input type="text" class="input" v-model="createForm.name" />
                    </fieldset>
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Slug</legend>
                        <input type="text" class="input" v-model="createForm.slug" />
                    </fieldset>
                </div>
                <fieldset class="fieldset w-full">
                    <legend class="fieldset-legend">描述</legend>
                    <input type="text" class="input w-full" v-model="createForm.description" />
                </fieldset>
                <div class="modal-action">
                    <button class="btn btn-primary btn-outline" @click="closeCreateModal" :disabled="isLoading">取消</button>
                    <button class="btn btn-error" @click="confirmCreateCategory" :disabled="isLoading">确认</button>
                </div>
            </div>
        </section>
    </main>
</template>
