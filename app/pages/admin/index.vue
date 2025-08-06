<script setup lang="ts">
    const moduleList = [
        {
            title: "用户管理",
            description: "浏览、创建、修改与删除用户数据",
            link: "/admin/users",
        },
        {
            title: "分类管理",
            description: "浏览、创建、修改与删除分类配置",
            link: "/admin/categories",
        },
        {
            title: "标签管理",
            description: "浏览、创建、修改与删除标签配置",
            link: "/admin/tags",
        },
    ];
</script>

<template>
    <main class="w-full h-full px-16 pb-8 pt-24">
        <h1 class="ui-font-hl">管理员面板</h1>
        <div class="mt-12 w-full grid">
            <div
                class="card px-4 bg-base-100 card-md shadow-sm transition-all duration-250 ease-in-out hover:-translate-y-0.5 cursor-pointer"
                v-for="module in moduleList"
                :key="module.link"
                @click="$router.push(module.link)">
                <div class="card-body">
                    <h2 class="card-title">{{ module.title }}</h2>
                    <p>{{ module.description }}</p>
                </div>
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped>
    .grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        grid-gap: 16px;
    }
</style>
