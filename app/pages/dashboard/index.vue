<script lang="ts" setup>
    import { useAccountStore } from "~/stores/account";
    import { identityMapper } from "~/modules/publicData";
    import type { IApiUserResponse } from "~/types/api/LoginType";
    import { EventBus } from "~/modules/Eventbus";

    const accountStore = useAccountStore();
    const search = ref<HTMLInputElement | null>(null);

    const handleRefreshUserInfo = async () => {
        try {
            const res = await $fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
            });
            const user = res.user as IApiUserResponse;
            accountStore.setUser(user.id, user.username, user.role, user.discordUsername, user.githubUsername);
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "用户信息刷新成功",
            });
        } catch (error) {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: "用户信息刷新失败，请尝试重新登陆",
            });
        }
    };

    interface IQueryForm {
        name: string;
        item_type: number;
        item_category: number;
        item_sub_category: number;
    }

    const itemTypeMapper: { [key: number]: string } = {
        0: "",
        1: "结构文件",
        2: "存档",
    };

    const queryForm = reactive<IQueryForm>({
        name: "",
        item_type: 1,
        item_category: 1,
        item_sub_category: 1,
    });

    const lastQueriedForm = reactive<IQueryForm>({
        name: "",
        item_type: 1,
        item_category: 1,
        item_sub_category: 1,
    });

    const isFormUpdated = computed(
        () =>
            queryForm.name === lastQueriedForm.name &&
            queryForm.item_type === lastQueriedForm.item_type &&
            queryForm.item_category === lastQueriedForm.item_category &&
            queryForm.item_sub_category === lastQueriedForm.item_sub_category
    );

    const handleQuery = async () => {
        // Update Reactives
        lastQueriedForm.name = queryForm.name;
        lastQueriedForm.item_type = queryForm.item_type;
        lastQueriedForm.item_category = queryForm.item_category;
        lastQueriedForm.item_sub_category = queryForm.item_sub_category;
    };

    const keypressListenerHandler = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key.toLowerCase() === "k") {
            e.preventDefault();
            search.value?.focus();
        }
    };

    onMounted(() => {
        document.addEventListener("keydown", keypressListenerHandler);
    });
    onUnmounted(() => {
        document.removeEventListener("keydown", keypressListenerHandler);
    });
</script>

<template>
    <main class="w-full h-full pt-22 pb-12 px-6">
        <!-- 页面标题和面包屑 -->
        <div class="w-full mb-4">
            <div class="card bg-base-100 shadow-sm w-full">
                <div class="breadcrumbs text-base ml-4">
                    <ul>
                        <li><a>面板</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- 主内容区 -->
        <section id="grid-container" class="w-full grid gap-4">
            <div class="flex flex-col gap-4">
                <SonoCard class="overflow-hidden" title="用户信息">
                    <ul class="flex flex-col gap-2">
                        <li>
                            <p>•&nbsp;&nbsp;用户名：</p>
                            <span class="ml-6">{{ accountStore.userName }}</span>
                        </li>
                        <li>
                            <p>•&nbsp;&nbsp;身份：</p>
                            <span class="ml-6">
                                {{ identityMapper[accountStore.userRole as number] }}
                            </span>
                        </li>
                    </ul>
                    <template #extra>
                        <Icon
                            class="ml-auto -translate-y-0.5 text-[color-mix(in_oklch,_var(--color-primary)_45%,_var(--color-error))] cursor-pointer hover:opacity-90 active:-translate-y-0.25"
                            name="ic:round-refresh"
                            @click="handleRefreshUserInfo" />
                    </template>
                    <template #deco>
                        <SonoIconUser v-if="accountStore.userRole! < 2" class="absolute size-32 -right-8 -bottom-8 -rotate-25 opacity-25" />
                        <SonoIconCreator v-else-if="accountStore.userRole! < 8" class="absolute size-32 -right-8 -bottom-8 -rotate-25 opacity-25" />
                        <SonoIconAdmin v-else alt="admin" class="absolute size-32 -right-8 -bottom-8 -rotate-25 opacity-25" />
                    </template>
                </SonoCard>
                <SonoCard class="overflow-hidden" title="资源筛选">
                    <fieldset class="fieldset -mt-2">
                        <legend class="fieldset-legend">资源类型</legend>
                        <select v-model="queryForm.item_type" class="select select-sm">
                            <option value="1">结构文件</option>
                            <option value="2">存档</option>
                            <option disabled value="0">其他</option>
                        </select>
                    </fieldset>
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">分类</legend>
                        <select v-model="queryForm.item_category" class="select select-sm">
                            <option value="1">红石</option>
                            <option disabled value="0">其他</option>
                        </select>
                    </fieldset>
                    <template #extra>
                        <button
                            :class="{ 'pointer-event-none opacity-0 cursor-default': isFormUpdated }"
                            class="ml-auto btn btn-sm btn-success"
                            @click="handleQuery()">
                            应用
                        </button>
                    </template>
                    <template #deco>
                        <Icon class="absolute -right-8 -bottom-8 -rotate-25 opacity-25" name="mynaui:search-hexagon" size="128" />
                    </template>
                </SonoCard>
            </div>
            <div class="flex flex-col gap-4">
                <label class="input w-full border-none rounded-md">
                    <svg class="h-[1.5rem] -translate-y-0.25 opacity-50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M6 9H3c-.55 0-1-.45-1-1s.45-1 1-1h3c.55 0 1 .45 1 1s-.45 1-1 1m0 3H3c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1m13.88 6.29l-3.12-3.12c-.86.56-1.89.88-3 .82c-2.37-.11-4.4-1.96-4.72-4.31a5.013 5.013 0 0 1 5.83-5.61c1.95.33 3.57 1.85 4 3.78c.33 1.46.01 2.82-.7 3.9l3.13 3.13c.39.39.39 1.02 0 1.41s-1.03.39-1.42 0M17 11c0-1.65-1.35-3-3-3s-3 1.35-3 3s1.35 3 3 3s3-1.35 3-3M3 19h8c.55 0 1-.45 1-1s-.45-1-1-1H3c-.55 0-1 .45-1 1s.45 1 1 1"
                            fill="currentColor" />
                    </svg>
                    <input ref="search" :placeholder="`搜索${itemTypeMapper[queryForm.item_type]}`" class="grow" type="search" />
                    <kbd class="kbd kbd-sm">Ctrl</kbd>
                    <kbd class="kbd kbd-sm">K</kbd>
                </label>
                <SonoCard title="内容" />
            </div>
        </section>
    </main>
</template>

<style lang="scss" scoped>
    section#grid-container {
        grid-template-columns: 1fr;
        @media (width >= 64rem) {
            grid-template-columns: 256px 1fr;
        }
    }
</style>
