<script lang="ts" setup>
    import { EventBus } from "~/modules/Eventbus";
    import { useAccountStore } from "~/stores/account";
    import { handleDaisyUIDropdownClick } from "~/modules/publicFunction";
    
    const $route = useRoute();
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
    const logging_out = ref(false);
    
    const handleLogout = async () => {
        try {
            logging_out.value = true;
            try {
                await $fetch("/api/auth/logout", { method: "POST" });
            } catch (error: any) {
                const _edat = error.data;
                if (_edat.data && _edat.data.errorCode === "LOGOUT:USER_NOT_LOGGED_IN") {
                    // 可能会产生 Token 过期，这时候可以忽略
                    console.log(`登出可忽略地失败：Code ${ _edat.statusCode } | Message ${ _edat.message } | PlatformError ${ _edat.data.errorCode }`);
                } else {
                    // 否则重投 Error
                    throw error;
                }
            }
            accountStore.clearUser();
            await router.push("/");
        } catch (error: any) {
            EventBus.emit("toast:create", {
                alertType: "error",
                content: error.data?.message || "登出失败：未知错误",
            });
        } finally {
            logging_out.value = false;
        }
    };
</script>

<template>
    <div class="fixed top-0 bg-transparent border-b border-base-100 backdrop-blur-lg z-10 navbar p-0 px-4 text-secondary">
        <section class="navbar-start">
            <div class="flex-none lg:hidden">
                <div class="dropdown">
                    <button class="btn btn-square">
                        <Icon name="ic:round-format-list-bulleted" size="24"/>
                    </button>
                    <ul class="dropdown-content menu bg-base-100 rounded-sm z-1 w-32 p-2 shadow-sm" tabindex="0">
                        <li>
                            <a :class="{ 'bg-secondary/25 shadow-sm': $route.path === '/' }"
                               @click="handleDaisyUIDropdownClick(() => $router.push(`/`))">
                                <Icon class="-translate-y-0.25" name="ic:round-home" size="18"/>
                                主页
                            </a>
                        </li>
                        <li>
                            <a
                                    :class="{ 'bg-secondary/25 shadow-sm': $route.path.startsWith('/dashboard') }"
                                    @click="handleDaisyUIDropdownClick(() => $router.push(`/dashboard`))">
                                <Icon class="-translate-y-0.25" name="ic:round-dashboard" size="18"/>
                                面板
                            </a>
                        </li>
                        <li>
                            <a
                                    :class="{ 'bg-secondary/25 shadow-sm': $route.path.startsWith('/blog') }"
                                    @click="handleDaisyUIDropdownClick(() => $router.push(`/blog`))">
                                <Icon class="-translate-y-0.25" name="ic:round-event-note" size="18"/>
                                博客
                            </a>
                        </li>
                        <li>
                            <a
                                    :class="{ 'bg-secondary/25 shadow-sm': $route.path === '/company/contact' }"
                                    @click="handleDaisyUIDropdownClick(() => $router.push(`/company/contact`))">
                                <Icon class="-translate-y-0.25" name="ic:round-contact-support" size="18"/>
                                联系我们
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="mx-2 flex-1 px-2 text-lg">声致发光</div>
        </section>
        <section class="hidden lg:inline-flex navbar-center">
            <ul class="menu menu-horizontal gap-2">
                <li>
                    <a :class="{ 'bg-secondary/25 shadow-sm': $route.path === '/' }" @click="$router.push(`/`)">
                        <Icon class="-translate-y-0.25" name="ic:round-home" size="18"/>
                        主页
                    </a>
                </li>
                <li>
                    <a :class="{ 'bg-secondary/25 shadow-sm': $route.path.startsWith('/dashboard') }"
                       @click="$router.push(`/dashboard`)">
                        <Icon class="-translate-y-0.25" name="ic:round-dashboard" size="18"/>
                        面板
                    </a>
                </li>
                <li>
                    <a :class="{ 'bg-secondary/25 shadow-sm': $route.path.startsWith('/blog') }"
                       @click="$router.push(`/blog`)">
                        <Icon class="-translate-y-0.25" name="ic:round-event-note" size="18"/>
                        博客
                    </a>
                </li>
                <li>
                    <a :class="{ 'bg-secondary/25 shadow-sm': $route.path === '/company/contact' }"
                       @click="$router.push(`/company/contact`)">
                        <Icon class="-translate-y-0.25" name="ic:round-contact-support" size="18"/>
                        联系我们
                    </a>
                </li>
            </ul>
        </section>
        <section class="navbar-end">
            <ul v-if="!logged_in" class="menu menu-horizontal">
                <li>
                    <a @click="$router.push(`/account/login`)">
                        <Icon class="-translate-y-0.25" name="ic:round-login" size="18"/>
                        登录
                    </a>
                </li>
            </ul>
            <div v-else class="dropdown dropdown-end">
                <div class="m-1 avatar avatar-online avatar-placeholder cursor-pointer" role="button" tabindex="0">
                    <div class="bg-neutral text-neutral-content w-10 rounded-full">
                        <span class="-translate-x-[0.5px]">{{ avatarName }}</span>
                    </div>
                </div>
                <ul class="dropdown-content menu bg-base-100 rounded-sm z-1 w-32 p-2 shadow-sm text-base-content" tabindex="0">
                    <li>
                        <a @click="handleDaisyUIDropdownClick(() => $router.push('/settings/account'))">
                            <Icon name="ic:round-admin-panel-settings" size="20"/>
                            账户设置
                        </a>
                    </li>
                    <li>
                        <a :class="{ 'cursor-not-allowed! opacity-50': logging_out }"
                           @click="logging_out ? null : handleDaisyUIDropdownClick(handleLogout)">
                            <Icon v-if="logging_out" name="line-md:loading-loop" size="20"/>
                            <Icon v-else name="ic:round-logout" size="20"/>
                            {{ logging_out ? "登出中..." : "登出" }}
                        </a>
                    </li>
                </ul>
            </div>
        </section>
    </div>
</template>

<style lang="scss" scoped>
    a {
        cursor: pointer;
    }
</style>
