<script setup lang="ts">
    const navSectionMenu_buttonList = [
        {
            name: "主页",
            href: "/explore",
        },
        {
            name: "浏览",
            href: "/explore/browse",
        },
    ];
</script>

<template>
    <nav class="bg-base-300 px-4 py-2 flex">
        <section id="nav-explore-section-menu" class="flex gap-4">
            <button
                class="btn px-8 h-7.25 -translate-y-0.25 text-secondary/75 hover:text-secondary"
                style="background-color: color-mix(in oklch, var(--color-base-100) 85%, var(--color-base-content))"
                :class="{ 'bg-primary/50! text-secondary!': $route.fullPath == item.href }"
                v-for="item in navSectionMenu_buttonList"
                :key="item.name"
                @click="$router.push(item.href)">
                {{ item.name }}
            </button>
        </section>
        <section id="nav-explore-section-search" class="ml-auto w-1/8 lg:w-1/4">
            <label class="input w-full h-7">
                <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                    </g>
                </svg>
                <input type="search" required placeholder="搜索" />
            </label>
        </section>
        <section id="nav-explore-section-extra" class="ml-8">
            <button
                class="btn aspect-square p-0 h-7.25 -translate-y-0.25 text-secondary/75 hover:text-secondary"
                style="background-color: color-mix(in oklch, var(--color-base-100) 85%, var(--color-base-content))">
                <Icon name="ic:round-settings" size="16" />
            </button>
        </section>
    </nav>
</template>

<style lang="scss" scoped>
    .input {
        &:focus,
        &:focus-within {
            outline: 2px solid transparent;
            outline-offset: 2px;
            isolation: isolate;
            z-index: 1;
        }
    }
</style>
