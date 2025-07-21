<script lang="ts" setup>
</script>

<template>
    <main
            class="w-full h-21/24 pb-12 flex flex-col justify-center items-center">
        <h1 class="text-secondary text-6xl">
            多元化 Minecraft 赛博遗产存储库
        </h1>
        <br/>
        <p class="text-secondary text-2xl">
            声致发光，一项用于收集、储存、维护、描述、分类各服务器和个人的相关存档、
        </p>
        <p class="text-secondary text-2xl">
            机器或建筑投影以及 MC 相关的衍生赛博遗产的项目
        </p>
        <br/>
        <section class="flex justify-center items-center gap-8">
            <button
                    class="btn btn-secondary btn-lg"
                    @click="$router.push(`/account/login`)">
                开始使用
            </button>
            <a>
                    <span
                            class="text-secondary text-lg cursor-pointer"
                            @click="$router.push(`/more/about-us`)">
                        了解更多 &rarr;
                    </span>
            </a>
        </section>
    </main>
</template>

<style lang="scss" scoped>
</style>
