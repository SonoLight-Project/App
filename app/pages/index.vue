<script lang="ts" setup>
</script>

<template>
    <main class="w-full h-full flex flex-col justify-center items-center p-4 md:p-8 lg:p-12">
        <!-- 标题区域 -->
        <div class="text-center mt-16 mb-10 md:mb-16 animate-fade-in">
            <h1 class="text-secondary text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">多元化 Minecraft 赛博资产存储库</h1>
            <div class="w-24 h-1 bg-secondary mx-auto mb-6 rounded-full"></div>
            <p class="text-secondary text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                声致发光，一项用于收集、储存、维护、描述、分类各服务器和个人的相关存档、机器或建筑投影以及 MC 相关的衍生赛博资产的项目
            </p>
        </div>

        <!-- 特性卡片区域 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 w-3/4 md:w-1/2">
            <div class="backdrop-blur-lg bg-base-100/10 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-secondary/10">
                <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                    <Icon class="text-secondary" name="mdi:database" size="24" />
                </div>
                <h3 class="text-secondary text-xl font-semibold mb-2">安全存储</h3>
                <p class="text-secondary/70">多重备份机制，确保您的 Minecraft 资产永久保存</p>
            </div>
            <div class="backdrop-blur-lg bg-base-100/10 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-secondary/10">
                <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                    <Icon class="text-secondary" name="mdi:tag-multiple" size="24" />
                </div>
                <h3 class="text-secondary text-xl font-semibold mb-2">智能分类</h3>
                <p class="text-secondary/70">自动化标签系统，轻松管理各类建筑与存档资源</p>
            </div>
            <div class="backdrop-blur-lg bg-base-100/10 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-secondary/10">
                <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                    <Icon class="text-secondary" name="mdi:share-variant" size="24" />
                </div>
                <h3 class="text-secondary text-xl font-semibold mb-2">社区共享</h3>
                <p class="text-secondary/70">便捷分享功能，与全球 Minecraft 爱好者交流创意</p>
            </div>
        </div>

        <!-- 行动按钮区域 -->
        <div class="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button class="btn btn-secondary btn-lg py-6 text-base md:text-lg flex-1" @click="$router.push('/dashboard')">
                <span class="flex items-center justify-center gap-2 scale-125 md:scale-100">
                    <Icon class="transition-transform" name="ic:round-play-arrow" size="24" />
                    开始使用
                </span>
            </button>
            <button class="btn btn-secondary btn-outline btn-lg py-6 text-base md:text-lg flex-1" @click="$router.push('/company/about-us')">
                <span class="flex items-center justify-center gap-2 scale-125 md:scale-100">
                    了解更多
                    <Icon class="transition-transform" name="ic:round-more-horiz" size="24" />
                </span>
            </button>
        </div>
    </main>
</template>

<style lang="scss" scoped>
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fade-in {
        animation: fade-in 0.6s ease-out forwards;
    }
</style>
