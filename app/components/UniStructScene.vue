<!-- unistruct 渲染组件 -->
<template>
    <!-- 1. 动态设置相机 -->
    <TresPerspectiveCamera :position-x="cameraPosition[0]" :position-y="cameraPosition[1]"
        :position-z="cameraPosition[2]" :look-at="[0, 0, 0]" :near="0.1" :far="cameraFarPlane" :aspect="aspectRatio" />
    <OrbitControls />

    <!-- 2. 灯光 -->
    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight :position-x="totalSize.x" :position-y="totalSize.y" :position-z="totalSize.z"
        :intensity="1" />
    <!-- 3. 居中模型 -->
    <TresGroup :position-x="modelOffset.x" :position-y="modelOffset.y" :position-z="modelOffset.z"
        :rotation-z="rotationZ">
        <template v-for="(instances, blockName) in groupedBlocks" :key="blockName">
            <TresInstancedMesh :ref="(el) => setInstanceRef(el, blockName)"
                :args="[undefined, undefined, instances.length]">
                <TresBoxGeometry :args="[1, 1, 1]" />
                <TresMeshStandardMaterial :color="getBlockColor(blockName as string)" />
            </TresInstancedMesh>
        </template>

        <TresGroup v-for="(entity, index) in allEntities" :key="`entity-${index}`" :position-x="entity.position.x"
            :position-y="entity.position.y" :position-z="entity.position.z">
            <TresMesh>
                <TresBoxGeometry :args="[0.5, 1.8, 0.5]" />
                <TresMeshStandardMaterial color="red" />
            </TresMesh>
        </TresGroup>
    </TresGroup>

    <!-- 4. 辅助线 -->
    <TresGridHelper :args="[Math.max(totalSize.x, totalSize.z) * 1.2, 10]" />
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useTres } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import * as THREE from 'three';
import type { IUniStruct, IUniEntity } from '~/types/unistruct/unistruct';

// 定义组件接收的 props
const props = defineProps<{
    struct: IUniStruct
}>();

const totalSize = computed(() => { return { x: Math.abs(props.struct?.meta.size.x ?? 10), y: Math.abs(props.struct?.meta.size.y ?? 10), z: Math.abs(props.struct?.meta.size.z ?? 10) } });

const modelOffset = computed(() => {
    if (!totalSize.value) return { x: 0, y: 0, z: 0 };
    // 计算偏移工作不正常
    return {
        x: 0,
        y: 0,
        z: 0,
    };
});

const { sizes } = useTres();

/**
 * 用于计算窗口比例
 */
const aspectRatio = computed(() => {
    if (sizes.width.value === 0 || sizes.height.value === 0) {
        return 1;
    }
    return sizes.width.value / sizes.height.value;
});

/**
 * 用于计算相机位置
 */
const cameraPosition = computed(() => {
    if (!totalSize.value) return [15, 15, 15];

    // 找到模型最大的维度
    const maxDim = Math.max(totalSize.value.x, totalSize.value.y, totalSize.value.z);

    // 将相机放在一个合适的距离外，这个距离与模型大小成正比
    const distance = maxDim * 1.5;

    // 返回一个 [x, y, z] 数组作为相机位置
    return [distance, distance * 0.75, distance];
});

/**
 * 用于修正视锥裁切
 */
const cameraFarPlane = computed(() => {
    if (!totalSize.value) return 2000; // 一个默认的较大值

    // 找到模型最大的维度
    const maxDim = Math.max(totalSize.value.x, totalSize.value.y, totalSize.value.z);

    // 远裁剪平面的距离应该是：
    // 从原点到相机位置的距离 + 模型从中心到最远角的距离
    // 一个简单而有效的估算方法是：(相机距离 + 模型最大尺寸) * 2
    const cameraDist = Math.sqrt(
        (cameraPosition.value[0] ?? 0) ** 2 +
        (cameraPosition.value[1] ?? 0) ** 2 +
        (cameraPosition.value[2] ?? 0) ** 2
    );

    // 确保远平面足够远，可以容纳整个模型以及相机与模型之间的距离
    return (cameraDist + maxDim) * 2; // 乘以 2 是一个安全系数
});

/**
 * 试图修正litematic文件创建时的选点顺序带来的模型颠倒问题
 * 无法覆盖所有情况
 */
const rotationZ = computed(() => {
    let flag = false;
    for (const regionKey in props.struct?.regions) {
        const region = props.struct?.regions[regionKey]!;
        flag = region.position.y > region.size.y;
    }


    return flag ? Math.PI : 0;
});


// --- 方块处理逻辑 ---
// 将所有方块按类型（name）分组
const groupedBlocks = ref<Record<string, { x: number; y: number; z: number }[]>>({});
const isLoadingBlocks = ref(false); // 添加一个加载状态

// 使用 watch 监听 props.struct 的变化，并异步处理
watch(() => props.struct, (newStruct) => {
    if (!newStruct) {
        groupedBlocks.value = {};
        return;
    }
    
    // 开始处理，进入加载状态
    isLoadingBlocks.value = true;
    groupedBlocks.value = {}; // 清空旧数据

    // 我们将把计算任务放到下一个宏任务中，防止阻塞
    setTimeout(() => {
        processBlocksAsync(newStruct);
    }, 0);

}, { immediate: true }); // immediate: true 确保组件加载时就执行一次


async function processBlocksAsync(struct: IUniStruct) {
    const tempGroups: Record<string, { x: number; y: number; z: number }[]> = {};
    const CHUNK_SIZE = 50000; // 每次处理的方块数量，可以调整
    let blockCounter = 0;

    for (const regionKey in struct.regions) {
        const region = struct.regions[regionKey]!;
        const regionPos = region.position;
        const sizeX = Math.abs(region.size.x);
        const sizeY = Math.abs(region.size.y);
        const sizeZ = Math.abs(region.size.z);

        for (let x = 0; x < sizeX; x++) {
            for (let y = 0; y < sizeY; y++) {
                for (let z = 0; z < sizeZ; z++) {
                    const block = region.blocks[x]?.[y]?.[z];

                    if (!block || block.name === 'minecraft:air' || !block.name) {
                        continue;
                    }

                    if (!tempGroups[block.name]) {
                        tempGroups[block.name] = [];
                    }

                    tempGroups[block.name]!.push({
                        x: regionPos.x + x,
                        y: regionPos.y + y,
                        z: regionPos.z + z,
                    });

                    blockCounter++;

                    // 当处理完一个 chunk 时，交还控制权
                    if (blockCounter % CHUNK_SIZE === 0) {
                        // 更新 ref 让 UI 部分渲染
                        groupedBlocks.value = { ...groupedBlocks.value, ...tempGroups };
                        // 清空临时组，避免重复添加
                        for (const key in tempGroups) {
                            tempGroups[key] = [];
                        }
                        // 使用 await 等待下一个动画帧，让浏览器渲染
                        await new Promise(resolve => requestAnimationFrame(resolve));
                    }
                }
            }
        }
    }

    // 处理剩余的方块
    groupedBlocks.value = { ...groupedBlocks.value, ...tempGroups };
    isLoadingBlocks.value = false; // 处理完成
    console.log('All blocks processed!');
}


// 存储 InstancedMesh 的引用
const instanceRefs = ref<Record<string, THREE.InstancedMesh>>({});
const setInstanceRef = (el: any, name: string) => {
    if (el) {
        instanceRefs.value[name] = el;
    }
};

// 监听分组后的方块数据，并更新 InstancedMesh 的位置
watch(groupedBlocks, async (newGroups) => {
    // 等待 DOM 更新，确保 instanceRefs 已被填充
    await nextTick();

    const tempMatrix = new THREE.Matrix4();
    const tempObject = new THREE.Object3D();

    for (const blockName in newGroups) {
        const instances = newGroups[blockName];
        const mesh = instanceRefs.value[blockName];

        if (mesh && instances) {
            for (let i = 0; i < instances.length; i++) {
                const { x, y, z } = instances[i]!;
                // 我们将方块中心对齐到整数坐标，所以位置要加上 0.5
                tempObject.position.set(x + 0.5, y + 0.5, z + 0.5);
                tempObject.updateMatrix();
                mesh.setMatrixAt(i, tempObject.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
}, { deep: true, immediate: true });


// 为不同类型的方块提供颜色（这是一个简化的示例）
function getBlockColor(blockName: string): string {
    if (blockName.includes('stone')) return '#808080';
    if (blockName.includes('dirt')) return '#966c4a';
    if (blockName.includes('grass')) return '#7cfc00';
    if (blockName.includes('wood') || blockName.includes('log')) return '#8b5a2b';
    if (blockName.includes('leaves')) return '#228b22';
    return '#ffffff'; // 默认白色
}


// --- 实体处理逻辑 ---
const allEntities = computed(() => {
    if (!props.struct) return [];

    const entities: IUniEntity[] = [];
    for (const regionKey in props.struct.regions) {
        const region = props.struct.regions[regionKey]!;
        if (region.entities) {
            entities.push(...region.entities);
        }
    }
    return entities;
});
</script>