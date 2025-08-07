<!-- pages/index.vue (已修复) -->
<template>
    <div class="p-4 pt-22">
        <h1>Unistruct 3D 渲染器</h1>

        <!-- 1. 添加一个加载状态的UI提示 -->
        <div class="controls">
            <input type="file" accept=".litematic, .unis" @change="onFileChange" :disabled="isLoading" />
            <span v-if="isLoading" class="loading-text">正在解析文件，请稍候...</span>
        </div>
        
        <!-- 2. 直接使用 unistructData 进行判断 -->
        <div v-if="unistructData" class="viewer-container" >
            <h2>{{ unistructData.meta.name }}</h2>
            <p>作者: {{ unistructData.meta.author }}</p>
            <p>总方块数: {{ unistructData.meta.totalBlocks }}</p>

            <!-- 关键：客户端渲染 -->
            <ClientOnly fallback-tag="div" class="fallback">
                <template #default>
                    <UniStructViewer :struct="unistructData" />
                </template>
            </ClientOnly>
        </div>

        <!-- 3. 如果没有数据，显示提示信息 -->
        <div v-else-if="!isLoading" class="placeholder">
            请选择一个 .unis 或 .litematic 文件开始预览
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'; // 确保导入 ref
import UniStructViewer from '~/components/UniStructViewer.vue';
import type { IUniStruct } from '~/types/unistruct/unistruct';
import { Unistruct } from '~/modules/unistruct';

// 1. 直接使用 ref 管理结构数据，不再使用 useAsyncData
//    可以初始为默认数据，或者 null
const unistructData = ref<IUniStruct | null>(null);

// onMounted(() => {
//   // 如果希望页面加载时就显示一个默认结构，可以在这里设置
//   unistructData.value = Unistruct.DEFAULT_DATA; 
// });

// 2. 添加一个加载状态，用于提供更好的用户反馈
const isLoading = ref(false);

async function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    isLoading.value = true;
    // 先清空旧数据，以便显示加载状态
    unistructData.value = null; 

    try {
        let parsed: IUniStruct | null = null;
        if (file.name.endsWith('.unis')) {
            const uni = await Unistruct.fromUnistructFile(file);
            parsed = uni.data;
            console.log('解析成功(unistruct)', parsed);
        } else if (file.name.endsWith('.litematic')) {
            const uni = await Unistruct.fromLitematicaFile(file);
            parsed = uni.data;
            console.log('解析成功(litematic)', parsed);
        }
        
        // 3. 直接更新 ref 的值，Vue 会自动响应并更新 UniStructViewer
        unistructData.value = parsed;

    } catch (err) {
        console.error('解析失败', err);
        alert(`文件解析失败: ${err instanceof Error ? err.message : err}`);
        unistructData.value = null; // 解析失败，确保清空
    } finally {
        // 4. 无论成功与否，都要结束加载状态
        isLoading.value = false;
    }
}
</script>

<style scoped>
.controls {
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}
.loading-text {
    font-style: italic;
    color: #666;
}
.viewer-container {
    margin-top: 1rem;
}
.placeholder, .fallback {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
    border: 2px dashed #ccc;
    border-radius: 8px;
    color: #888;
    background-color: #f9f9f9;
}
</style>