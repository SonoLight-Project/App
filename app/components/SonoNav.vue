<script lang="ts" setup>
    import { EventBus } from "~/modules/Eventbus";
    import { useAccountStore } from "~/stores/account";
    
    const accountStore = useAccountStore();
    
    const avatarName = computed(() => {
        const name = accountStore.userName?.trim();
        if (!name) return;
        
        const stringWrapper = (t: string) => t.charAt(0).toUpperCase();
        
        const parts = name.split(/\s+/); // 支持多个空格间隔
        if (parts.length >= 2) {
            return stringWrapper(parts[0]!) + stringWrapper(parts[1]!);
        }
        return stringWrapper(parts[0]!);
    });
    
    const router = useRouter();
    const logged_in = computed(() => accountStore.userName !== null);
    
    const handleLogout = async () => {
        try {
            await $fetch("/api/auth/logout", { method: "POST" });
            accountStore.clearUser();
            await router.push("/");
        } catch (error: any) {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: error.data?.message || "登出失败：未知错误",
            });
        }
    };
</script>

<template>
    <div class="fixed top-0 bg-transparent border-b border-base-100 backdrop-blur-lg z-10 navbar p-0 px-4 w-full">
        <section class="navbar-start">
            <div class="flex-none lg:hidden">
                <label aria-label="open sidebar" class="btn btn-square btn-ghost" for="drawer">
                    <Icon name="ic:round-format-list-bulleted" size="24"/>
                </label>
            </div>
            <div class="mx-2 flex-1 px-2 text-lg">声致发光</div>
        </section>
        <section class="hidden lg:inline-flex navbar-center">
            <ul class="menu menu-horizontal gap-2">
                <li><a @click="$router.push(`/`)">
                    <Icon class="-translate-y-0.25" name="ic:round-home" size="18"/>
                    主页
                </a></li>
                <li><a @click="$router.push(`/dashboard`)">
                    <Icon class="-translate-y-0.25" name="ic:round-dashboard" size="18"/>
                    面板
                </a></li>
                <li><a @click="$router.push(`/blog`)">
                    <Icon class="-translate-y-0.25" name="ic:round-event-note" size="18"/>
                    博客
                </a></li>
                <li><a @click="$router.push(`/more/contact-us`)">
                    <Icon class="-translate-y-0.25" name="ic:round-contact-support" size="18"/>
                    联系我们
                </a></li>
            </ul>
        </section>
        <section class="navbar-end">
            <ul v-if="!logged_in" class="menu menu-horizontal">
                <li><a @click="$router.push(`/account/login`)">
                    <Icon class="-translate-y-0.25" name="ic:round-login" size="18"/>
                    登录
                </a></li>
            </ul>
            <div v-else class="dropdown dropdown-end">
                <div class="m-1 avatar avatar-online avatar-placeholder cursor-pointer" role="button" tabindex="0">
                    <div class="bg-neutral text-neutral-content w-10 rounded-full">
                        <span class="-translate-x-[0.5px]">{{ avatarName }}</span>
                    </div>
                </div>
                <ul class="dropdown-content menu bg-base-100 rounded-sm z-1 w-32 p-2 shadow-sm" tabindex="0">
                    <li><a @click="$router.push('/settings/account')">
                        <Icon name="ic:round-admin-panel-settings" size="20"/>
                        账户设置
                    </a></li>
                    <li><a @click="handleLogout">
                        <Icon name="ic:round-logout" size="20"/>
                        登出
                    </a></li>
                </ul>
            </div>
        </section>
    </div>
    <div class="drawer-side">
        <label aria-label="close sidebar" class="drawer-overlay" for="drawer"></label>
        <ul class="menu bg-base-200 min-h-full w-80 p-4">
            <!-- Sidebar content here -->
            <li><a @click="$router.push(`/`)">
                <Icon class="-translate-y-0.25" name="ic:round-home" size="18"/>
                主页
            </a></li>
            <li><a @click="$router.push(`/dashboard`)">
                <Icon class="-translate-y-0.25" name="ic:round-dashboard" size="18"/>
                面板
            </a></li>
            <li><a @click="$router.push(`/blog`)">
                <Icon class="-translate-y-0.25" name="ic:round-event-note" size="18"/>
                博客
            </a></li>
            <li><a @click="$router.push(`/more/contact-us`)">
                <Icon class="-translate-y-0.25" name="ic:round-contact-support" size="18"/>
                联系我们
            </a></li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
    a {
        cursor: pointer;
    }
</style>
