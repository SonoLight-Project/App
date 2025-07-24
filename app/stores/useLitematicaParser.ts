// stores/litematic-parser.ts
import { defineNuxtPlugin } from '#app'
import pako from 'pako'
import { Buffer } from 'buffer'
import { parse, simplify } from 'prismarine-nbt'

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
    }
    regions: Record<string, {
        position: { x: number; y: number; z: number }
        size: { x: number; y: number; z: number }
        palette: BlockState[]
        blocks: DecodedBlock[][][]
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
        //这里还能解析出来createTime和modifiedTime, 但是解析的数值似乎有问题
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
        console.log('name:',name ,'regino: ', region, 'type: ', typeof region)

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

        let blocks: DecodedBlock[][][] = []
        const rawStates = region.BlockStates as bigint[] | undefined
        if (rawStates && palette.length > 0) {
            blocks = decodeBlockStates(rawStates, palette, size)
        }
        console.log('blocks: ', blocks);

        regions[name] = { position, size, palette, blocks }
    });

    return { minecraftDataVersion, version, metadata, regions }
}

// 将 bit-packed 数组解码为三维方块
const decodeBlockStates = (
    blockStates: bigint[],
    palette: BlockState[],
    size: { x: number; y: number; z: number }
): DecodedBlock[][][] => {
    if(palette[0] === undefined){
        return [];
    }
    const { x: sizeX, y: sizeY, z: sizeZ } = {x : Math.abs(size.x), y : Math.abs(size.y), z : Math.abs(size.z)}
    const totalBlocks = sizeX * sizeY * sizeZ;

    // 1. 计算每个方块索引需要多少位 (bit)
    // 如果调色板只有一种方块（比如全是空气），log2(1) = 0，至少需要1位
    const bitsPerBlock = Math.max(1, Math.ceil(Math.log2(palette.length)));

    // 2. 创建一个用于提取单个方块索引的位掩码 (bitmask)
    // BigInt is crucial here!
    const mask = (1n << BigInt(bitsPerBlock)) - 1n;

    const decodedBlocks: DecodedBlock[][][] = 
    Array.from({ length: sizeX }, () =>
        Array.from({ length: sizeY }, () => 
            Array.from({ length: sizeZ }, () => ({ state: {name: 'minecraft:air'} })))
    );

    let blockIndex = 0; // 0 to totalBlocks-1
    let longIndex = 0; // 指向 blockStates 数组的当前索引
    let bitIndex = 0; // 指向当前 long (bigint) 中的比特位位置
    // 3. 循环遍历每个方块位置 (Y -> Z -> X 顺序)
    for (let y = 0; y < sizeY; y++) {
        for (let z = 0; z < sizeZ; z++) {
            for (let x = 0; x < sizeX; x++) {
                if (blockIndex >= totalBlocks) break;

                const currentLong = blockStates[longIndex] || 0n; // 0n -> minecraft:air

                // 从当前 long 中提取 palette 索引
                const paletteIndex = Number((currentLong >> BigInt(bitIndex)) & mask);

                const state = palette[paletteIndex] || palette[0];

                // @ts-ignore
                decodedBlocks[x][y][z] = {state}; //忽略这里的报错, 反正绝对不会出问题

                // 更新比特位索引
                bitIndex += bitsPerBlock;

                // 如果当前 long 的比特位已经用完，则移动到下一个 long
                if (bitIndex + bitsPerBlock > 64) {
                    longIndex++;
                    bitIndex = 0;
                }

                blockIndex++;
            }
        }
    }
    return decodedBlocks;
};

