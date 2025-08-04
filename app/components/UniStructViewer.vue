<!-- components/UniStructViewer.vue -->
<!-- Three 包装组件 -->
<template>
    <div style="position: relative; width: 100%; height: 600px; border: 1px solid #ccc;">
        <TresCanvas v-if="struct" clear-color="#82DBC5" shadows alpha>
            <Scene :struct="struct" />
        </TresCanvas>
        <div v-else class="placeholder">
            加载中或没有结构数据...
        </div>
    </div>
</template>

<script setup lang="ts">
import Scene from '~/components/UniStructScene.vue'
import type { IUniStruct, IUniBlock, IUniEntity } from '~/types/unistruct/unistruct'; // 替换为你的类型文件路径

// 定义组件接收的 props
defineProps<{
    struct: IUniStruct | null
}>();
</script>

<style scoped>
.placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}
</style>