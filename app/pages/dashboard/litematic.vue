<template>
    <main class="p-4 text-white">
        <h1 class="text-2xl font-bold mb-4">Litematica 文件解析</h1>
        <input type="file" accept=".litematic" @change="onFileChange" class="mb-4" />

        <div v-if="parsed" class="mt-6 text-white">
            <h2 class="text-xl font-semibold">解析结果</h2>
            <p><strong>版本：</strong>{{ parsed.version }}</p>
            <p><strong>Minecraft 数据版本：</strong>{{ parsed.minecraftDataVersion }}</p>
            <h3 class="mt-4 font-semibold">Metadata</h3>
            <ul class="list-disc list-inside">
                <li><strong>名称：</strong>{{ parsed.metadata.name }}</li>
                <li><strong>作者：</strong>{{ parsed.metadata.author }}</li>
                <li><strong>描述：</strong>{{ parsed.metadata.description }}</li>
                <li><strong>尺寸：</strong>
                    X: {{ parsed.metadata.size.x }},
                    Y: {{ parsed.metadata.size.y }},
                    Z: {{ parsed.metadata.size.z }}
                </li>
                <li><strong>方块总数：</strong>{{ parsed.metadata.totalBlocks }}</li>
            </ul>

            <h3 class="mt-4 font-semibold">Regions</h3>
            <ul class="list-disc list-inside">
                <li v-for="(region, name) in parsed.regions" :key="name">
                    <strong>{{ name }}</strong> —
                    pos({{ region.position.x }}, {{ region.position.y }}, {{ region.position.z }}),
                    size({{ region.size.x }}, {{ region.size.y }}, {{ region.size.z }}),
                    方块类别数 {{ region.palette.length }},
                    
                </li>
            </ul>
        </div>
    </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { parseLitematica } from '~/stores/useLitematicaParser'
import type { ParsedLitematica } from '~/stores/useLitematicaParser'

const parsed = ref<ParsedLitematica | null>(null)

async function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
        parsed.value = await parseLitematica(file)
    } catch (err) {
        console.error('解析失败', err)
    }
}
</script>