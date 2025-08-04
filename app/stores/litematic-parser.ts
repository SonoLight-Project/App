// stores/litematic-parser.ts
import { defineNuxtPlugin } from '#app'
import pako from 'pako'
import { Buffer } from 'buffer'
import { parse, simplify } from 'prismarine-nbt'
import type { IUniEntity, IUniTileEntity, IUniStruct } from '~/types/unistruct/unistruct'
import nbt from 'prismarine-nbt';
import type { NBT, Long as PrismarineLong } from 'prismarine-nbt';
import { gzip as pakoGzip } from 'pako';

export interface BlockState {
    name: string
    properties?: Record<string, any>
}

export interface DecodedBlock {
    state: BlockState
}



export interface ParsedLitematica {
    minecraftDataVersion: number
    version: number
    metadata: {
        name: string
        author: string
        description: string
        size: { x: number; y: number; z: number }
        totalBlocks: number,
        createdTime: bigint,
        modifiedTime: bigint
    }
    regions: Record<string, {
        position: { x: number; y: number; z: number }
        size: { x: number; y: number; z: number }
        palette: BlockState[]
        blocks: BlockState[][][]
        entities?: IUniEntity[]
        tileEntities?: IUniTileEntity[]
    }>
}

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.provide('parseLitematica', parseLitematica)
})

export async function parseLitematica(
    input: File | string | Uint8Array
): Promise<ParsedLitematica> {
    let compressed: Uint8Array
    if (typeof File !== 'undefined' && input instanceof File) {
        compressed = new Uint8Array(await input.arrayBuffer())
    } else if (typeof input === 'string') {
        const buf = await fetch(input).then(r => r.arrayBuffer())
        compressed = new Uint8Array(buf)
    } else if (input instanceof Uint8Array) {
        compressed = input
    } else {
        throw new Error('Unsupported input type')
    }

    let nbtArray: Uint8Array
    try {
        nbtArray = pako.ungzip(compressed)
    } catch {
        nbtArray = compressed
    }

    const parseBuffer = Buffer.from(nbtArray.buffer, nbtArray.byteOffset, nbtArray.byteLength)
    const { parsed } = await parse(parseBuffer)
    const rootValue = simplify(parsed) as Record<string, any>
    console.log('rootValue', rootValue)
    const version = rootValue.Version as number
    const minecraftDataVersion = rootValue.MinecraftDataVersion as number
    if (version == null || minecraftDataVersion == null) {
        console.warn('Invalid schematic: missing version info')
    }

    const metaRaw = rootValue.Metadata as Record<string, any> | undefined
    if (!metaRaw) {
        throw new Error('Invalid schematic: missing Metadata')
    }



    const metadata = {
        name: metaRaw.Name as string || '',
        author: metaRaw.Author as string || '',
        description: metaRaw.Description as string || '',
        size: metaRaw.EnclosingSize as { 'x': number, 'y': number, 'z': number },
        totalBlocks: metaRaw.TotalBlocks as number || 0,
        createdTime: combineTimestamps(metaRaw.TimeCreated[0], metaRaw.TimeCreated[1]),
        modifiedTime: combineTimestamps(metaRaw.TimeModified[0], metaRaw.TimeModified[1])
    }

    const regions: ParsedLitematica['regions'] = {}
    const regionListRaw = rootValue.Regions as { [key: string]: Record<string, any> } | undefined
    console.log('reginoListRaw', regionListRaw, 'type: ', typeof regionListRaw)
    if (!regionListRaw) {
        throw new Error('Invalid schematic: missing Regions')
    }
    //解析区域
    Object.keys(regionListRaw).forEach(key => { // 没有返回值, 全是副作用
        const region = regionListRaw[key] as Record<string, any>;
        const name = key;
        console.log('name:', name, 'regino: ', region, 'type: ', typeof region)

        const posArr = region.Position as any
        const sizeArr = region.Size as any
        if (posArr['x'] === undefined || posArr['y'] === undefined || posArr['z'] === undefined ||
            sizeArr['x'] === undefined || sizeArr['y'] === undefined || sizeArr['z'] === undefined) {
            console.warn('Invalid schematic: invalid region position or size')
            return;
        }
        const position = posArr;
        const size = sizeArr;

        const palette: BlockState[] = []
        const paletteRaw = region.BlockStatePalette as any[] | undefined
        if (paletteRaw) {
            for (const entry of paletteRaw) {
                const nameVal = entry.Name as string || 'minecraft:air'
                const propsVal = entry.Properties as Record<string, any> || {}
                palette.push({ name: nameVal, properties: propsVal })
            }
        }

        let blocks: BlockState[][][] = []
        const rawStates = region.BlockStates as bigint[] | undefined
        if (rawStates && palette.length > 0) {
            blocks = decodeBlockStates(rawStates, palette, size)
        }
        console.log('blocks: ', blocks);

        const entities: IUniEntity[] = [];
        const entitiesRaw = region.Entities as any[] | undefined
        if (entitiesRaw) {
            for (const entityRaw of entitiesRaw) {
                const entity: IUniEntity = {
                    name: entityRaw.id as string,
                    position: {
                        x: entityRaw.Pos[0] as number,
                        y: entityRaw.Pos[1] as number,
                        z: entityRaw.Pos[2] as number
                    },
                    rotation: {
                        a: entityRaw.Rotation[0],
                        b: entityRaw.Rotation[1]
                    },
                    properties: entityRaw as Record<string, any> || {}
                }
                entities.push(entity)
            }
        }
        console.log('entities: ', entities);

        const tileEntities: IUniTileEntity[] = [];
        const tileEntitiesRaw = region.TileEntities as any[] | undefined
        if (tileEntitiesRaw) {
            for (const tileEntityRaw of tileEntitiesRaw) {
                const tileEntity: IUniTileEntity = {
                    position: {
                        x: tileEntityRaw.x as number,
                        y: tileEntityRaw.y as number,
                        z: tileEntityRaw.z as number
                    },
                    properties: tileEntityRaw as Record<string, any> || {}
                }
                tileEntities.push(tileEntity)
            }

        }
        console.log('tileEntities: ', tileEntities);

        regions[name] = { position, size, palette, blocks, entities, tileEntities }
    });

    return { minecraftDataVersion, version, metadata, regions }
}

function combineTimestamps(high: number, low: number): bigint {
    // 将高 32 位和低 32 位组合成 64 位时间戳
    const highPart = BigInt(high) << 32n;
    const lowPart = BigInt(low >>> 0);  // 将低 32 位转换为无符号整数
    return BigInt(highPart + lowPart);
}

// 将 bit-packed 数组解码为三维方块
function decodeBlockStates(
    blockStates: bigint[], // 包含有符号的 64-bit BigInt
    palette: BlockState[],
    size: { x: number; y: number; z: number }
): BlockState[][][] {
    if (palette.length === 0) {
        return [];
    }
    
    // 确保有一个 air 方块作为默认值
    const airState = palette.find(p => p.name === 'minecraft:air') || { name: 'minecraft:air', properties: {} };
    
    const { x: sizeX, y: sizeY, z: sizeZ } = { x: Math.abs(size.x), y: Math.abs(size.y), z: Math.abs(size.z) };
    const totalBlocks = sizeX * sizeY * sizeZ;

    // 预先用 air 填充整个区域
    const decodedBlocks: BlockState[][][] =
        Array.from({ length: sizeX }, () =>
            Array.from({ length: sizeY }, () =>
                Array.from({ length: sizeZ }, () => ({ ...airState }))
            )
        );

    if (totalBlocks === 0 || blockStates.length === 0) {
        return decodedBlocks;
    }
    
    // 计算每个方块索引需要多少位 (bit)，litematica 规范中最少为 2
    const bitsPerBlock = Math.max(2, Math.ceil(Math.log2(palette.length)));
    const mask = (1n << BigInt(bitsPerBlock)) - 1n;
    
    // 用于将有符号 long 转换为无符号 64-bit 值的常量
    const TWO_POW_64 = 2n ** 64n;

    let blockIndex = 0;
    let longIndex = 0;
    let data = 0n;       // 数据缓冲区
    let dataLength = 0;  // 缓冲区中有效位数

    // Litematica 标准迭代顺序: Y -> Z -> X
    for (let y = 0; y < sizeY; y++) {
        for (let z = 0; z < sizeZ; z++) {
            for (let x = 0; x < sizeX; x++) {
                // 如果所有方块都已处理，则提前退出
                if (blockIndex >= totalBlocks) break;

                // 检查缓冲区中是否有足够的位用于下一次读取
                while (dataLength < bitsPerBlock && longIndex < blockStates.length) {
                    const signedLong = blockStates[longIndex++]!;
                    
                    // *** 关键修复 ***
                    // 将从文件中读取的有符号 long 转换为其 64 位无符号表示
                    const unsignedLong = signedLong < 0n ? signedLong + TWO_POW_64 : signedLong;

                    // 将新的无符号 64 位值加载到缓冲区的“高位”
                    data |= unsignedLong << BigInt(dataLength);
                    dataLength += 64;
                }

                // 如果在尝试填充后，缓冲区仍然没有足够的位，
                // 这意味着数据已结束，剩余部分应为 air（已预填充），可以安全退出。
                if (dataLength < bitsPerBlock) {
                    blockIndex = totalBlocks; // 强制外层循环也退出
                    break;
                }

                // 从缓冲区的低位提取索引
                const paletteIndex = Number(data & mask);

                const state = palette[paletteIndex] || airState;
                decodedBlocks[x]![y]![z] = { ...state };

                // 从缓冲区中“消耗”掉已使用的位
                data >>= BigInt(bitsPerBlock);
                dataLength -= bitsPerBlock;
                
                blockIndex++;
            }
            if (blockIndex >= totalBlocks) break;
        }
        if (blockIndex >= totalBlocks) break;
    }
    
    return decodedBlocks;
};

// 辅助函数 1：保持不变
function bigIntToPrismarineLong(n: bigint): [number, number] {
    const msb = Number(n >> 32n);
    const lsb = Number(n & 0xFFFFFFFFn) | 0;
    return [msb, lsb];
}

/**
 * 将任意 JS 值/对象递归转换为 NBT 详细格式。
 * @param value - 要转换的 JS 值
 * @param keyHint - (可选) 当前值的键名，用于类型推断
 */
function jsToNbt(value: any, keyHint: string = ''): any {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === 'object' && value.type && value.hasOwnProperty('value')) {
        return value;
    }

    const lowerKey = keyHint.toLowerCase();

    // 1. 字符串处理
    if (typeof value === 'string') {

        return { name: keyHint, type: 'string', value };

        // 随意转换可能导致解析失败
        if (value.toLowerCase() === 'true') return { name: keyHint, type: 'string', value: 'true' };
        if (value.toLowerCase() === 'false') return { name: keyHint, type: 'string', value: 'false' };
        // 检查是否是数字字符串
        if (/^-?\d+$/.test(value)) {
            value = parseInt(value, 10);
        } else if (/^-?\d*\.\d+$/.test(value)) {
            value = parseFloat(value);
        } else {
            return { name: keyHint, type: 'string', value };
        }
    }

    // 2. 数字处理
    if (typeof value === 'number') {
        if (!Number.isInteger(value)) {
            if (['x', 'y', 'z'].includes(lowerKey) && keyHint !== 'x' && keyHint !== 'y' && keyHint !== 'z') { // Heuristic for entity/tile entity root coords
                return { name: keyHint, type: 'int', value };
            }
            if (lowerKey === 'pos' || lowerKey === 'motion' || lowerKey === 'rotation' || keyHint === 'x' || keyHint === 'y' || keyHint === 'z') { // for lists of coords
                return { name: keyHint, type: 'double', value };
            }
            return { name: keyHint, type: 'float', value };
        }

        // --- 明确的整数类型规则 (不再基于值范围) ---
        if (['count', 'slot', 'glowingtext', 'canpickuploot', 'invulnerable', 'fallflying', 
            'forcedage', 'portalcooldown', 'absorptionamount', 'deathtime', 'xp', 'persistenceforced', 
            'health', 'lefthanded', 'onground', 'restockstoday', 'canbreakdoors', 'hurttime', 
            'drownedconversiontime', 'isbaby', 'operation', 'uses', 'specialprice', 'demand', 'rewardexp'].includes(lowerKey)) {
            return { name: keyHint, type: 'byte', value };
        }
        if (['air', 'conversiontime', 'maxuses'].includes(lowerKey)) {
            return { name: keyHint, type: 'short', value };
        }

        if (['level'].includes(lowerKey)) {
            return { name: keyHint, type: 'string', value: value.toString() }
        }

        // 默认所有其他整数都为 'int'
        return { name: keyHint, type: 'int', value };
    }

    if (typeof value === 'bigint') {
        return { name: keyHint, type: 'long', value: bigIntToPrismarineLong(value) };
    }
    if (typeof value === 'boolean') {
        return { name: keyHint, type: 'byte', value: value ? 1 : 0 };
    }

    // 3. 数组处理
    if (Array.isArray(value)) {
        if (keyHint.toLowerCase() === 'uuid') {
            return { name: keyHint, type: 'intArray', value: value };
        }
        if (value.length === 0) {
            const listType = (lowerKey === 'items' || lowerKey === 'inventory' || lowerKey === 'recipes' || lowerKey === 'attributes' || lowerKey === 'modifiers' || lowerKey === 'gossips' || lowerKey === 'handitems' || lowerKey === 'armoritems') ? 'compound' : 'end';
            return { name: keyHint, type: 'list', value: { type: listType, value: [] } };
        }
        const firstElement = value[0];
        if (typeof firstElement === 'number' && !Number.isInteger(firstElement)) {
            return { name: keyHint, type: 'list', value: { type: 'double', value: value } };
        }
        if (typeof firstElement === 'number' && Number.isInteger(firstElement)) {
            return { name: keyHint, type: 'list', value: { type: 'int', value: value } }; // 默认整数列表为 int list
        }
        if (typeof firstElement === 'object') {
            const listValue = value.map(item => jsToNbt(item, '').value);
            return { name: keyHint, type: 'list', value: { type: 'compound', value: listValue } };
        }
    }

    // 4. 对象处理
    if (typeof value === 'object') {
        const compoundValue: Record<string, any> = {};
        for (const key in value) {
            const nbtTag = jsToNbt(value[key], key);
            if (nbtTag) {
                compoundValue[key] = { type: nbtTag.type, value: nbtTag.value };
            }
        }
        return { name: keyHint, type: 'compound', value: compoundValue };
    }
    return undefined;
}


export function convertUniStructToLitematic(uniStruct: IUniStruct): Buffer {
    const litematicRegions: Record<string, any> = {};

    for (const regionName in uniStruct.regions) {
        const uniRegion = uniStruct.regions[regionName]!;

        // --- 1. PALETTE ---
        const sizeX = Math.abs(uniRegion.size.x);
        const sizeY = Math.abs(uniRegion.size.y);
        const sizeZ = Math.abs(uniRegion.size.z);

        const paletteMap = new Map<string, number>();
        const palette: any[] = [];
        const blockStateIndices: number[] = new Array(sizeX * sizeY * sizeZ);
        
        //保证 'minecraft:air' 始终在调色板索引 0
        let paletteIndexCounter = 1; // 计数器从 1 开始，因为 0 被 air 占用
        const airKey = 'minecraft:air{}'; // 使用带空属性的key，保持一致性
        paletteMap.set(airKey, 0);
        palette.push({
            Name: { type: 'string', value: 'minecraft:air' },
            Properties: { type: 'compound', value: {} }
        });

        // YZX XYZ XZY 
        console.log('uniregion.blocks: ', uniRegion.blocks)
        for (let y = 0; y < sizeY; y++) {
            for (let x = 0; x < sizeX; x++) {
                for (let z = 0; z < sizeZ; z++) {
                
                    const block = uniRegion.blocks[x]![y]![z]!;
                    
                    if (!block) {
                        // 如果遇到空方块，当作空气处理
                        const arrayIndex = (y * sizeZ + z) * sizeX + x;
                        blockStateIndices[arrayIndex] = 0; // air's index
                        continue;
                    }

                    const propertiesString = block.properties ? JSON.stringify(Object.entries(block.properties).sort()) : '{}';
                    const blockStateKey = `${block.name}${propertiesString}`;
                    
                    let paletteIndex = paletteMap.get(blockStateKey);

                    if (paletteIndex === undefined) {
                        // 如果是 'minecraft:air'，它的 key 已经被预置了，理论上不会进入这里。
                        // 但为保险起见，如果遇到 air，强制使用索引 0。
                        if (block.name === 'minecraft:air' && (!block.properties || Object.keys(block.properties).length === 0)) {
                            paletteIndex = 0;
                        } else {
                            paletteIndex = paletteIndexCounter++;
                            paletteMap.set(blockStateKey, paletteIndex);
                            const propertiesNbt = jsToNbt(block.properties || {}, 'Properties').value;
                            palette.push({
                                Name: { type: 'string', value: block.name },
                                Properties: { type: 'compound', value: propertiesNbt || {} }
                            });
                        }
                    }

                    // 使用与 Y -> Z -> X 顺序匹配的正确索引公式
                    const arrayIndex = (y * sizeZ + z) * sizeX + x;
                    blockStateIndices[arrayIndex] = paletteIndex;
                }
            }
        }

        // --- 2.BLOCKSTATES   ---
        const bitsPerBlock = Math.max(2, Math.ceil(Math.log2(palette.length))); 
        const totalLongs = Math.ceil((blockStateIndices.length * bitsPerBlock) / 64);
        
        // 这个数组将包含无符号的 64 位整数
        const unsignedPackedLongs: bigint[] = new Array(totalLongs).fill(0n);

        const MASK_64_BIT = 0xFFFFFFFFFFFFFFFFn;
        let data = 0n;
        let dataLength = 0;
        let longIndex = 0;

        for (const index of blockStateIndices) {
            data |= BigInt(index) << BigInt(dataLength);
            dataLength += bitsPerBlock;
            while (dataLength >= 64) {
                unsignedPackedLongs[longIndex++] = data & MASK_64_BIT;
                data >>= 64n;
                dataLength -= 64;
            }
        }
        if (dataLength > 0) {
            unsignedPackedLongs[longIndex] = data;
        }

        // 将无符号 bigint 数组转换为有符号 bigint 数组
        const SIGNED_THRESHOLD = 2n ** 63n;
        const TWO_POW_64 = 2n ** 64n;
        const signedPackedLongs = unsignedPackedLongs.map(unsignedLong =>
            unsignedLong >= SIGNED_THRESHOLD
                ? unsignedLong - TWO_POW_64
                : unsignedLong
        );

        // --- 3. ENTITIES & TILE ENTITIES ---
        const litematicEntities = uniRegion.entities?.map(e => {
            const entityObject = { ...e.properties, id: e.name, Pos: [e.position.x, e.position.y, e.position.z], Rotation: [e.rotation.a, e.rotation.b] };
            return jsToNbt(entityObject).value;
        }) || [];

        const litematicTileEntities = uniRegion.tileEntities?.map(te => {
            const tileEntityObject = { ...te.properties, x: te.position.x, y: te.position.y, z: te.position.z };
            return jsToNbt(tileEntityObject).value;
        }) || [];

        const positionNbt = jsToNbt(uniRegion.position, 'Position');
        const sizeNbt = jsToNbt(uniRegion.size, 'Size');

        // --- 4. 组合区域 ---
        litematicRegions[regionName] = {
            type: 'compound',
            value: {
                Position: { type: positionNbt.type, value: positionNbt.value },
                Size: { type: sizeNbt.type, value: sizeNbt.value },
                BlockStates: {  type: 'longArray', value: signedPackedLongs },
                BlockStatePalette: { type: 'list', value: { type: 'compound', value: palette } },
                ...(litematicEntities.length > 0 && { Entities: { type: 'list', value: { type: 'compound', value: litematicEntities } } }),
                ...(litematicTileEntities.length > 0 && { TileEntities: { type: 'list', value: { type: 'compound', value: litematicTileEntities } } }),
            }
        };
    }

    // --- 5. 构建根 NBT ---
    const rootNbt: NBT = {
        type: 'compound',
        name: '',
        value: {
            Version: { type: 'int', value: 6 },
            MinecraftDataVersion: { type: 'int', value: uniStruct.minecraftDataVersion },
            Metadata: {
                type: 'compound',
                value: {
                    Name: { type: 'string', value: uniStruct.meta.name },
                    Author: { type: 'string', value: uniStruct.meta.author },
                    Description: { type: 'string', value: uniStruct.meta.description },
                    TimeCreated: { type: 'long', value: bigIntToPrismarineLong(uniStruct.meta.createdTime) },
                    TimeModified: { type: 'long', value: bigIntToPrismarineLong(uniStruct.meta.modifiedTime) },
                    TotalBlocks: { type: 'int', value: uniStruct.meta.totalBlocks },
                    TotalVolume: { type: 'int', value: uniStruct.meta.size.x * uniStruct.meta.size.y * uniStruct.meta.size.z },
                    RegionCount: { type: 'int', value: Object.keys(litematicRegions).length },
                    EnclosingSize: { type: 'compound', value: jsToNbt(uniStruct.meta.size).value },
                }
            },
            Regions: { type: 'compound', value: litematicRegions }
        }
    };

    console.log(rootNbt);

    // --- 6. 序列化与压缩 ---
    const nbtBuffer = nbt.writeUncompressed(rootNbt);
    const nbtUint8Array = new Uint8Array(nbtBuffer.buffer, nbtBuffer.byteOffset, nbtBuffer.byteLength);
    const gzippedUint8Array = pakoGzip(nbtUint8Array);

    return Buffer.from(gzippedUint8Array);
}