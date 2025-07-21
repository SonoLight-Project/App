<script lang="ts" setup>
    defineProps<{ logged_in?: boolean }>()
</script>

<template>
    <header class="w-full h-2/24 px-16 flex justify-between items-center">
        <section>
            <a class="text-secondary text-lg" @click="$router.push(`/`)"> 声致发光 </a>
        </section>
        <section class="flex justify-center items-center gap-12">
            <a @click="$router.push(`/`)">
                <span class="text-secondary text-lg">主页</span>
            </a>
            <a @click="$router.push(`/account/login`)">
                <span class="text-secondary text-lg">面板</span>
            </a>
            <a @click="$router.push(`/blog`)">
                <span class="text-secondary text-lg">博客</span>
            </a>
            <a @click="$router.push(`/more/contact-us`)">
                <span class="text-secondary text-lg">联系我们</span>
            </a>
        </section>
        <section>
            <a v-if="!$props.logged_in" @click="$router.push(`/account/login`)">
                <span class="text-secondary text-lg">
                    登录面板
                    <span aria-hidden="true">&rarr;</span>
                </span>
            </a>
            
        </section>
    </header>
</template>

<style lang="scss" scoped>
    a {
        cursor: pointer;
    }
</style>
