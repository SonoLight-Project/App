<script lang="ts" setup>
    import { EventBus } from "~/modules/Eventbus";
    import { Logout } from "~/modules/api/PlatformAccountAuth";

    const $$account = useAccountStore();
    const $route = useRoute();
    const is_logging_out = ref(false);

    const navSectionMenu_buttonList = [
        { name: "探索", href: "/explore" },
        { name: "仓库", href: "/repo" },
        { name: "文档", href: "/docs" },
    ];

    const cp_userId = computed(() => $$account.userId);
    const cp_userRole = computed(() => $$account.userRole ?? 0);
    const cp_userName = computed(() => $$account.userName ?? "");

    const handleLogout = async () => {
        is_logging_out.value = true;
        const [success, err] = await Logout();
        if (success || err?.data?.data?.errorCode === "USER_NOT_LOGGED_IN") {
            await navigateTo("/");
            $$account.clearUser();
            EventBus.emit("toast:create", {
                alertType: "success",
                content: "注销成功",
            });
        } else if (err) {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: wrapRequestErrorMessage(err, "注销失败，请重试"),
            });
        }
        is_logging_out.value = false;
    };
</script>

<template>
    <nav class="fixed top-0 navbar p-0 px-4 bg-transparent border-b border-base-100/25 backdrop-blur-lg z-10 gap-2">
        <section id="nav-global-section-navigating">
            <button class="btn btn-neutral btn-ghost btn-sm btn-square bg-transparent group/left" @click="$router.back()">
                <Icon name="mynaui:chevron-left" size="24" class="text-secondary opacity-75 group-hover/left:opacity-100 ui-transition" />
            </button>
            <button class="btn btn-neutral btn-ghost btn-sm btn-square bg-transparent group/right" @click="$router.forward()">
                <Icon name="mynaui:chevron-right" size="24" class="text-secondary opacity-75 group-hover/right:opacity-100 ui-transition" />
            </button>
        </section>
        <section id="nav-global-section-brand" class="gap-2">
            <img alt="SonoLight Border Iocn" class="size-5.25" src="/assets/images/sonolight-border-icon.png" />
            <span class="text-sm">声致发光</span>
            <span class="text-sm" v-if="$route.path.startsWith('/admin')">·&nbsp;&nbsp;管理员面板</span>
        </section>
        <section id="nav-global-section-menu" class="gap-4 ml-4">
            <button
                class="btn px-8 py-1 h-fit bg-transparent shadow-none text-secondary/75 hover:text-secondary"
                :class="{ 'text-primary!': $route.fullPath.startsWith(item.href) }"
                v-for="item in navSectionMenu_buttonList"
                :key="item.name"
                @click="$router.push(item.href)">
                {{ item.name }}
            </button>
        </section>
        <section id="nav-global-section-user" class="ml-auto">
            <div class="dropdown" v-if="cp_userId">
                <div tabindex="0" role="button" class="px-4 py-1 bg-info/25 flex items-center gap-2 cursor-pointer">
                    <!-- <div class="flex justify-center items-center w-6 h-6 bg-base-300 border border-secondary/25 rounded-xs avatar-online">?</div> -->
                    <SonoIconAdmin class="size-6" v-if="cp_userRole >= 8" />
                    <SonoIconCreator class="size-6" v-else-if="cp_userRole >= 2" />
                    <SonoIconUser class="size-6" v-else />
                    {{ cp_userName }}
                    <Icon name="mynaui:chevron-down" size="16" />
                </div>
                <ul tabindex="0" class="dropdown-content menu w-full p-2 bg-base-300 shadow-sm z-1 rounded-xs">
                    <li><a>查看我的个人资料</a></li>
                    <li><a>搜索偏好</a></li>
                    <li><a>账户设置</a></li>
                    <div class="divider my-0" v-if="cp_userRole >= 8"></div>
                    <li v-if="cp_userRole >= 8"><NuxtLink href="/admin">管理员面板</NuxtLink></li>
                    <div class="divider my-0"></div>
                    <li>
                        <a
                            :class="{ 'cursor-not-allowed! opacity-50': is_logging_out }"
                            @click="is_logging_out ? null : handleDaisyUIDropdownClick(handleLogout)">
                            <Icon v-if="is_logging_out" name="line-md:loading-loop" size="20" />
                            {{ is_logging_out ? "登出中..." : "登出" }}
                        </a>
                    </li>
                </ul>
            </div>
            <div v-else role="button" class="px-4 py-1 bg-success/50 flex items-center gap-2 cursor-pointer" @click="$router.push('/account/login')">
                <Icon name="ic:round-log-in" size="16" />
                <span class="translate-y-0.25">登录账户</span>
            </div>
        </section>
        <section id="nav-global-section-extra" class="gap-2 ml-8">
            <button class="btn btn-sm px-2">
                <Icon name="mynaui:question-circle" size="18" />
            </button>
            <button class="btn btn-sm px-2">
                <Icon name="ic:round-report-gmailerrorred" size="18" />
            </button>
        </section>
    </nav>
</template>

<style lang="scss" scoped>
    nav section {
        display: flex;
        align-items: center;
    }

    .avatar-online {
        position: relative;

        &:before {
            content: "";
            position: absolute;
            z-index: 1;
            display: block;
            border-radius: calc(infinity * 1px);
            background-color: var(--color-success);
            width: 15%;
            height: 15%;
            top: -1px;
            right: -1px;
        }
    }
</style>
