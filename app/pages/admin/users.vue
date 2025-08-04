<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import { GetUserList, UpdateUser, DeleteUser } from "~/modules/api/admin/User";
    import { EventBus } from "~/modules/Eventbus";

    interface User {
        userId: string;
        userName: string;
        userRole: number;
        discordId: string;
        discordUsername: string;
        githubId: string;
        githubUsername: string;
        mcjpgId: string;
        mcjpgUsername: string;
    }

    const accountStore = useAccountStore();
    const users = ref<User[]>([]);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const total = ref(0);
    const totalPages = ref(0);
    // 编辑用户模态框相关
    const showEditModal = ref(false);
    const isEditMode = ref(false);
    const editingUser = ref<User | null>(null);
    const editForm = ref({
        userName: "",
        userRole: 0,
        discordId: "",
        discordUsername: "",
        githubId: "",
        githubUsername: "",
        mcjpgId: "",
        mcjpgUsername: "",
    });
    // 删除用户确认模态框相关
    const showDeleteModal = ref(false);
    const deletingUser = ref<User | null>(null);

    const fetchUsers = async (isRefresh?: boolean) => {
        users.value = [];
        const [status, response] = await GetUserList(currentPage.value, pageSize.value);
        if (status && response) {
            users.value = response.users;
            total.value = response.pagination.total;
            totalPages.value = response.pagination.totalPages;
            EventBus.emit("toast:create", {
                alertType: "success",
                content: (isRefresh ? "刷新" : "获取") + "用户列表成功",
            });
        } else if (!status) {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(response, "获取用户列表失败"),
            });
        }
    };

    // 打开编辑模态框
    const openEditModal = (user: User, isEdit?: boolean) => {
        editingUser.value = user;
        // 初始化表单数据
        editForm.value = {
            userName: user.userName,
            userRole: user.userRole,
            discordId: user.discordId || "",
            discordUsername: user.discordUsername || "",
            githubId: user.githubId || "",
            githubUsername: user.githubUsername || "",
            mcjpgId: user.mcjpgId || "",
            mcjpgUsername: user.mcjpgUsername || "",
        };
        showEditModal.value = true;
        isEditMode.value = isEdit || false;
    };

    // 关闭编辑模态框
    const closeEditModal = () => {
        showEditModal.value = false;
        editingUser.value = null;
    };

    // 确认编辑用户
    const confirmEditUser = async () => {
        if (!editingUser.value) return;

        // 构造更新数据
        const updates = [];

        // 工具函数：Warp 空为 Null
        const wrapEmptyToNull = (value: string) => {
            return value === "" ? null : value;
        };

        // 检查并添加变更的字段
        if (editForm.value.userName !== editingUser.value.userName) {
            updates.push(["userName", editForm.value.userName]);
        }
        if (editForm.value.userRole !== editingUser.value.userRole) {
            updates.push(["userRole", editForm.value.userRole.toString()]);
        }
        if (wrapEmptyToNull(editForm.value.discordId) !== wrapEmptyToNull(editingUser.value.discordId)) {
            updates.push(["discordId", editForm.value.discordId]);
        }
        if (wrapEmptyToNull(editForm.value.discordUsername) !== wrapEmptyToNull(editingUser.value.discordUsername)) {
            updates.push(["discordUsername", editForm.value.discordUsername]);
        }
        if (wrapEmptyToNull(editForm.value.githubId) !== wrapEmptyToNull(editingUser.value.githubId)) {
            updates.push(["githubId", editForm.value.githubId]);
        }
        if (wrapEmptyToNull(editForm.value.githubUsername) !== wrapEmptyToNull(editingUser.value.githubUsername)) {
            updates.push(["githubUsername", editForm.value.githubUsername]);
        }
        if (wrapEmptyToNull(editForm.value.mcjpgId) !== wrapEmptyToNull(editingUser.value.mcjpgId)) {
            updates.push(["mcjpgId", editForm.value.mcjpgId]);
        }
        if (wrapEmptyToNull(editForm.value.mcjpgUsername) !== wrapEmptyToNull(editingUser.value.mcjpgUsername)) {
            updates.push(["mcjpgUsername", editForm.value.mcjpgUsername]);
        }

        // 如果没有变更，则直接关闭模态框
        if (updates.length === 0) {
            closeEditModal();
            return;
        }

        console.debug("debug", updates);
        const [success, error] = await UpdateUser(
            editingUser.value.userId,
            // @ts-ignore
            updates
        );
        if (success) {
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "用户更新成功",
            });
            closeEditModal();
            fetchUsers(true);
        } else {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(error, "用户更新失败"),
            });
            closeEditModal();
        }
    };

    // 打开删除确认模态框
    const openDeleteModal = (user: User) => {
        deletingUser.value = user;
        showDeleteModal.value = true;
    };

    // 关闭删除确认模态框
    const closeDeleteModal = () => {
        showDeleteModal.value = false;
        deletingUser.value = null;
    };

    // 确认删除用户
    const confirmDeleteUser = async () => {
        if (!deletingUser.value) return;
        // 检查是否是管理员自己
        if (deletingUser.value.userId === accountStore.userId) {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "error",
                content: "不能删除自己",
            });
            return;
        }
        // 检查是否越权
        if ((accountStore.userRole ?? 0) <= deletingUser.value.userRole) {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "error",
                content: "权限不足",
            });
            return;
        }
        const [success, error] = await DeleteUser(deletingUser.value.userId);
        if (success) {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "用户删除成功",
            });
            fetchUsers(true);
        } else {
            closeDeleteModal();
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(error, "用户删除失败"),
            });
        }
    };

    const prevPage = () => {
        if (currentPage.value > 1) {
            currentPage.value--;
            fetchUsers();
        }
    };

    const nextPage = () => {
        if (currentPage.value < totalPages.value) {
            currentPage.value++;
            fetchUsers();
        }
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages.value || currentPage.value === page) return;
        currentPage.value = page;
        fetchUsers();
    };

    onMounted(() => {
        fetchUsers();
    });
</script>

<template>
    <main class="w-full h-full px-16 pb-8 pt-24">
        <h1 class="ui-font-hl">管理员面板 · 用户管理</h1>
        <div class="overflow-x-auto mt-8">
            <table class="table table-zebra">
                <thead>
                    <tr>
                        <th>UUID</th>
                        <th>用户名</th>
                        <th>角色</th>
                        <th>Discord 用户名</th>
                        <th>GitHub 用户名</th>
                        <th>MCJPG 用户名</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="users.length > 0" v-for="user in users" :key="user.userId">
                        <td>{{ user.userId }}</td>
                        <td>{{ user.userName }}</td>
                        <td>{{ identityMapper[user.userRole] ?? "未知" }}</td>
                        <td>{{ user.discordUsername }}</td>
                        <td>{{ user.githubUsername }}</td>
                        <td>{{ user.mcjpgUsername }}</td>
                        <td>
                            <button class="btn btn-sm btn-warning mr-2" @click="openEditModal(user)">查看全部</button>
                            <button class="btn btn-sm btn-info mr-2" @click="openEditModal(user, true)">编辑</button>
                            <button class="btn btn-sm btn-error" @click="openDeleteModal(user)">删除</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <section class="w-full mt-4 flex justify-center items-center" v-if="users.length > 0">
            <div class="join">
                <button class="join-item btn" @click="prevPage" :disabled="currentPage === 1">«</button>
                <button class="join-item btn" v-for="page in totalPages" :key="page" @click="goToPage(page)" :class="{ 'btn-active': page === currentPage }">
                    {{ page }}
                </button>
                <button class="join-item btn" @click="nextPage" :disabled="currentPage === totalPages">»</button>
            </div>
        </section>
        <section class="w-full mt-8 flex justify-center items-center gap-2" v-else>
            <span class="loading loading-spinner text-primary"></span>
            <p>正在加载数据</p>
        </section>
        <!-- 编辑用户模态框 -->
        <section v-if="showEditModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">{{ isEditMode ? "编辑用户" : "查看用户信息" }}</h3>
                <p class="py-4">ID: {{ editingUser?.userId }}</p>
                <div class="w-full grid grid-cols-2 gap-2">
                    <fieldset class="fieldset w-full">
                        <legend class="fieldset-legend">用户名</legend>
                        <input type="text" class="input" :disabled="!isEditMode" v-model="editForm.userName" />
                    </fieldset>
                    <fieldset class="fieldset w-full">
                        <legend class="fieldset-legend">角色</legend>
                        <input type="number" min="0" max="9" class="input" :disabled="!isEditMode" v-model="editForm.userRole" />
                    </fieldset>
                </div>
                <div class="w-full grid grid-cols-2 gap-2">
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">[OAuth] Discord ID</legend>
                        <input type="text" class="input" :disabled="!isEditMode" v-model="editForm.discordId" />
                    </fieldset>
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">[OAuth] Discord 用户名</legend>
                        <input type="text" class="input" :disabled="!isEditMode" v-model="editForm.discordUsername" />
                    </fieldset>
                </div>
                <div class="w-full grid grid-cols-2 gap-2">
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">[OAuth] GitHub ID</legend>
                        <input type="text" class="input" :disabled="!isEditMode" v-model="editForm.githubId" />
                    </fieldset>
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">[OAuth] GitHub 用户名</legend>
                        <input type="text" class="input" :disabled="!isEditMode" v-model="editForm.githubUsername" />
                    </fieldset>
                </div>
                <div class="w-full grid grid-cols-2 gap-2">
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">[OAuth] MCJPG ID</legend>
                        <input type="text" class="input" :disabled="!isEditMode" v-model="editForm.mcjpgId" />
                    </fieldset>
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">[OAuth] MCJPG 用户名</legend>
                        <input type="text" class="input" :disabled="!isEditMode" v-model="editForm.mcjpgUsername" />
                    </fieldset>
                </div>
                <div class="modal-action">
                    <button class="btn btn-primary btn-outline" @click="closeEditModal">{{ isEditMode ? "取消" : "关闭" }}</button>
                    <button class="btn btn-error" @click="confirmEditUser" v-if="isEditMode">确认</button>
                </div>
            </div>
        </section>
        <!-- 删除用户确认模态框 -->
        <section v-if="showDeleteModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">确认删除用户</h3>
                <p class="py-4">您确定要删除用户 "{{ deletingUser?.userName }}" 吗？此操作不可撤销。</p>
                <div class="modal-action">
                    <button class="btn btn-primary btn-outline" @click="closeDeleteModal">取消</button>
                    <button class="btn btn-primary btn-outline" @click="confirmDeleteUser">确认</button>
                    <button class="btn btn-primary" @click="closeDeleteModal">取消</button>
                </div>
            </div>
        </section>
    </main>
</template>
