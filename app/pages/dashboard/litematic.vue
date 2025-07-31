<template>
    <main class="p-4 text-white pt-22">
        <h1 class="text-2xl font-bold mb-4">文件解析</h1>
        <input type="file" accept=".litematic, .unis" @change="onFileChange" class="mb-4" />

        <div v-if="parsed" class="mt-6 text-white">
            <h2 class="text-xl font-semibold">解析结果</h2>
            <p><strong>Minecraft 数据版本：</strong>{{ parsed.minecraftDataVersion }}</p>
            <h3 class="mt-4 font-semibold">Metadata</h3>
            <ul class="list-disc list-inside">
                <li><strong>名称：</strong>{{ parsed.meta.name }}</li>
                <li><strong>作者：</strong>{{ parsed.meta.author }}</li>
                <li><strong>描述：</strong>{{ parsed.meta.description }}</li>
                <li><strong>创建时间：</strong>{{ new Date(Number(parsed.meta.createdTime)).toLocaleString() }}</li>
                <li><strong>修改时间：</strong>{{ new Date(Number(parsed.meta.modifiedTime)).toLocaleString() }}</li>
                <li><strong>尺寸：</strong>
                    X: {{ parsed.meta.size.x }},
                    Y: {{ parsed.meta.size.y }},
                    Z: {{ parsed.meta.size.z }}
                </li>
                <li><strong>方块总数：</strong>{{ parsed.meta.totalBlocks }}</li>
            </ul>

            <h3 class="mt-4 font-semibold">Regions</h3>
            <ul class="list-disc list-inside">
                <li v-for="(region, name) in parsed.regions" :key="name">
                    <strong>{{ name }}</strong> —
                    pos({{ region.position.x }}, {{ region.position.y }}, {{ region.position.z }}),
                    size({{ region.size.x }}, {{ region.size.y }}, {{ region.size.z }}),
                </li>
            </ul>
            <button @click="getFile" class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">下载unistruct文件</button>
            
            <button @click="getlitematicFile" class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">下载litematic文件</button>
        </div>
    </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { parseLitematica } from '~/stores/litematic-parser'
import type { ParsedLitematica } from '~/stores/litematic-parser'
import { Unistruct } from '~/modules/unistruct'
import type { IUniStruct } from '~/types/unistruct/unistruct'

const parsed = ref<IUniStruct | null>(null)

async function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
        if(file.name.endsWith('.unis')){
            const uni = (await Unistruct.fromUnistructFile(file));
            console.log('解析成功(unistruct)', uni.data);
            parsed.value = uni.data;
        }else if(file.name.endsWith('.litematic')){
            parsed.value = (await Unistruct.fromLitematicaFile(file)).data;
            console.log('解析成功(litematic)', parsed.value)
        }
        
    } catch (err) {
        console.error('解析失败', err)
    }
}

async function getFile() {
    if(!parsed.value) {
        return;
    }

    const unistruct = new Unistruct(parsed.value)
    //const unistruct = new Unistruct(testStruct);
    const file = unistruct.generateFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
}

function getlitematicFile() {
    if(!parsed.value) {
        return;
    }

    const file = new Unistruct(parsed.value).toLitematicaFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
}

</script>