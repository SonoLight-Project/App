<template>
    <main class="p-4 text-white pt-22">
        <h1 class="text-2xl font-bold mb-4">Litematica 文件解析</h1>
        <input type="file" accept=".litematic, .unis" @change="onFileChange" class="mb-4" />

        <div v-if="parsed" class="mt-6 text-white">
            <h2 class="text-xl font-semibold">解析结果</h2>
            <p><strong>版本：</strong>{{ parsed.version }}</p>
            <p><strong>Minecraft 数据版本：</strong>{{ parsed.minecraftDataVersion }}</p>
            <h3 class="mt-4 font-semibold">Metadata</h3>
            <ul class="list-disc list-inside">
                <li><strong>名称：</strong>{{ parsed.metadata.name }}</li>
                <li><strong>作者：</strong>{{ parsed.metadata.author }}</li>
                <li><strong>描述：</strong>{{ parsed.metadata.description }}</li>
                <li><strong>创建时间：</strong>{{ new Date(Number(parsed.metadata.createdTime)).toLocaleString() }}</li>
                <li><strong>修改时间：</strong>{{ new Date(Number(parsed.metadata.modifiedTime)).toLocaleString() }}</li>
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
            <button @click="getFile" class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">下载</button>
        </div>
    </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { parseLitematica } from '~/stores/litematic-parser'
import type { ParsedLitematica } from '~/stores/litematic-parser'
import { Unistruct } from '~/modules/unistruct'
import type { IUniStruct } from '~/types/unistruct/unistruct'

const parsed = ref<ParsedLitematica | null>(null)

async function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
        if(file.name.endsWith('.unis')){
            parsed.value = (await Unistruct.fromUnistructFile(file)).toLitematicaData();
        }else if(file.name.endsWith('.litematic')){
            parsed.value = await parseLitematica(file)
        }
        console.log('解析成功', parsed.value)
    } catch (err) {
        console.error('解析失败', err)
    }
}

async function getFile() {
    if(!parsed.value) {
        return;
    }

    const testStruct: IUniStruct = {
    minecraftDataVersion: 2975,
    meta: {
        name: "Test",
        author: "Tester",
        description: "测试 structure",
        size: { x: 2, y: 2, z: 2 },
        totalBlocks: 8,
        createdTime: BigInt(Date.now()),
        modifiedTime: BigInt(Date.now())
    },
    regions: {
        "test_region": {
            position: { x: 0, y: 0, z: 0 },
            size: { x: 2, y: 2, z: 2 },
            entities: [
                {
                    name: "minecraft:sheep",
                    position: { x: 0, y: 0, z: 0 },
                    rotation: {a: 0.0, b:0.0}
                }
            ],
            blocks: [
                [
                    [
                        { name: "minecraft:stone" },
                        { name: "minecraft:dirt" }
                    ],
                    [
                        { name: "minecraft:grass" },
                        { name: "minecraft:wood" }
                    ]
                ],
                [
                    [
                        { name: "minecraft:glass" },
                        { name: "minecraft:wool" }
                    ],
                    [
                        { name: "minecraft:stone" },
                        { name: "minecraft:dirt" }
                    ]
                ]
            ]
        }
    }
};

    //const unistruct = Unistruct.fromLitematicaData(parsed.value)
    const unistruct = new Unistruct(testStruct);
    const file = unistruct.generateFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
}
</script>