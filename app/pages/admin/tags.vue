<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import { GetTagList, CreateTag, UpdateTag, DeleteTag } from "~/modules/api/admin/Tags";
    import { EventBus } from "~/modules/Eventbus";

    interface Tag {
        id: string;
        name: string;
        description: string;
        slug: string;
        count: number;
    }

    const tags = ref<Tag[]>([]);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const total = ref(0);
    const totalPages = ref(0);
    const isLoading = ref(true);
    // 创建标签模态框相关
    const showCreateModal = ref(false);
    const createForm = ref({
        name: "",
        description: "",
        slug: "",
    });
    // 编辑标签模态框相关
    const showEditModal = ref(false);
    const isEditMode = ref(false);
    const editingTag = ref<Tag | null>(null);
    const editForm = ref({
        name: "",
        description: "",
        slug: "",
    });
    // 删除标签确认模态框相关
    const showDeleteModal = ref(false);
    const deletingTag = ref<Tag | null>(null);

    const fetchTags = async (isRefresh?: boolean) => {
        isLoading.value = true;
        tags.value = [];
        const [status, response] = await GetTagList(currentPage.value, pageSize.value);
        if (status && response) {
            tags.value = response.tags;
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

    const confirmCreateTag = async () => {
        const [success, error] = await CreateTag(createForm.value.name, createForm.value.description, createForm.value.slug);
        if (success) {
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "标签创建成功",
            });
            closeCreateModal();
            fetchTags(true);
        } else {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(error, "标签创建失败"),
            });
            closeCreateModal();
        }
    };

    const openEditModal = (tag: Tag, isEdit?: boolean) => {
        editingTag.value = tag;
        // 初始化表单数据
        editForm.value = {
            name: tag.name,
            description: tag.description,
            slug: tag.slug,
        };
        showEditModal.value = true;
        isEditMode.value = isEdit || false;
    };

    const closeEditModal = () => {
        showEditModal.value = false;
        editingTag.value = null;
    };

    const confirmEditTag = async () => {
        if (!editingTag.value) return;

        // 构造更新数据
        const updates = [];

        // 检查并添加变更的字段
        if (editForm.value.name !== editingTag.value.name) {
            updates.push(["name", editForm.value.name]);
        }
        if (editForm.value.description !== editingTag.value.description) {
            updates.push(["description", editForm.value.description]);
        }
        if (editForm.value.slug !== editingTag.value.slug) {
            updates.push(["slug", editForm.value.slug]);
        }

        // 如果没有变更，则直接关闭模态框
        if (updates.length === 0) {
            closeEditModal();
            return;
        }

        console.debug("debug", updates);
        const [success, error] = await UpdateTag(
            editingTag.value.id,
            // @ts-ignore
            updates
        );
        if (success) {
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "标签更新成功",
            });
            closeEditModal();
            fetchTags(true);
        } else {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(error, "标签更新失败"),
            });
            closeEditModal();
        }
    };

    const openDeleteModal = (tag: Tag) => {
        deletingTag.value = tag;
        showDeleteModal.value = true;
    };

    const closeDeleteModal = () => {
        showDeleteModal.value = false;
        deletingTag.value = null;
    };

    const confirmDeleteTag = async () => {
        if (!deletingTag.value) return;
        // 检查是否还有内容
        if (deletingTag.value.count > 0) {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "error",
                content: "标签下有内容，无法删除",
            });
            return;
        }
        const [success, error] = await DeleteTag(deletingTag.value.id);
        if (success) {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "标签删除成功",
            });
            fetchTags(true);
        } else {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(error, "标签删除失败"),
            });
        }
    };

    const prevPage = () => {
        if (currentPage.value > 1) {
            currentPage.value--;
            fetchTags();
        }
    };

    const nextPage = () => {
        if (currentPage.value < totalPages.value) {
            currentPage.value++;
            fetchTags();
        }
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages.value || currentPage.value === page) return;
        currentPage.value = page;
        fetchTags();
    };

    onMounted(() => {
        fetchTags();
    });
</script>

<template>
    <main class="w-full h-full px-16 pb-8 pt-24">
        <div class="w-full mt-4 flex justify-between">
            <h1 class="ui-font-hl">管理员面板 · 标签管理</h1>
            <button class="btn btn-success" :disabled="isLoading" @click="openCreateModal">创建标签</button>
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
                    <tr v-if="tags.length > 0" v-for="tag in tags" :key="tag.id">
                        <td>{{ tag.id }}</td>
                        <td>{{ tag.name }}</td>
                        <td>{{ tag.description }}</td>
                        <td>{{ tag.slug }}</td>
                        <td>{{ tag.count }}</td>
                        <td>
                            <button class="btn btn-sm btn-warning mr-2" @click="openEditModal(tag)">查看全部</button>
                            <button class="btn btn-sm btn-info mr-2" @click="openEditModal(tag, true)">编辑</button>
                            <button class="btn btn-sm btn-error" @click="openDeleteModal(tag)">删除</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <section class="w-full mt-4 flex justify-center items-center" v-if="tags.length > 0">
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
            <p>暂无标签数据</p>
        </section>
        <!-- 编辑分类模态框 -->
        <section v-if="showEditModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">{{ isEditMode ? "编辑标签" : "查看标签信息" }}</h3>
                <p class="py-4">ID: {{ editingTag?.id }}</p>
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
                    <button class="btn btn-error" @click="confirmEditTag" v-if="isEditMode" :disabled="isLoading">确认</button>
                </div>
            </div>
        </section>
        <!-- 删除分类确认模态框 -->
        <section v-if="showDeleteModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">确认删除标签</h3>
                <p class="py-4">您确定要删除标签 "{{ deletingTag?.name }}" 吗？此操作不可撤销。</p>
                <div class="modal-action">
                    <button class="btn btn-primary btn-outline" @click="closeDeleteModal" :disabled="isLoading">取消</button>
                    <button class="btn btn-primary btn-outline" @click="confirmDeleteTag" :disabled="isLoading">确认</button>
                    <button class="btn btn-primary" @click="closeDeleteModal" :disabled="isLoading">取消</button>
                </div>
            </div>
        </section>
        <!-- 创建分类模态框 -->
        <section v-if="showCreateModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">创建标签</h3>
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
                    <button class="btn btn-error" @click="confirmCreateTag" :disabled="isLoading">确认</button>
                </div>
            </div>
        </section>
    </main>
</template>
