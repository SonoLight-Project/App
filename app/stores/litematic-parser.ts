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
const decodeBlockStates = (
    blockStates: bigint[],
    palette: BlockState[],
    size: { x: number; y: number; z: number }
): BlockState[][][] => {
    if (palette[0] === undefined) {
        return [];
    }
    const { x: sizeX, y: sizeY, z: sizeZ } = { x: Math.abs(size.x), y: Math.abs(size.y), z: Math.abs(size.z) }
    const totalBlocks = sizeX * sizeY * sizeZ;

    // 1. 计算每个方块索引需要多少位 (bit)
    // 如果调色板只有一种方块（比如全是空气），log2(1) = 0，至少需要1位
    const bitsPerBlock = Math.max(1, Math.ceil(Math.log2(palette.length)));

    // 2. 创建一个用于提取单个方块索引的位掩码 (bitmask)
    // BigInt is crucial here!
    const mask = (1n << BigInt(bitsPerBlock)) - 1n;

    const decodedBlocks: BlockState[][][] =
        Array.from({ length: sizeX }, () =>
            Array.from({ length: sizeY }, () =>
                Array.from({ length: sizeZ }, () => ({ name: 'minecraft:air' })))
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
                decodedBlocks[x][y][z] = { ...state }; //忽略这里的报错, 反正绝对不会出问题

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

/**
 * 辅助函数：将 BigInt 转换为 prismarine-nbt 的 Long 格式 ([msb, lsb])
 * @param n 要转换的 BigInt
 * @returns 一个包含两个32位整数的数组
 */
function bigIntToPrismarineLong(n: bigint): [number, number] {
    const lsb = Number(n & 0xFFFFFFFFn);
    const msb = Number(n >> 32n);
    return [msb, lsb];
}

/**
 * 将 IUniStruct 对象转换为 .litematic 文件格式的 Buffer，使用 prismarine-nbt。
 * @param uniStruct 要转换的 universal structure 对象
 * @returns 一个 Promise，解析为包含 .litematic 文件数据的 Buffer
 */
export function convertUniStructToLitematic(uniStruct: IUniStruct): Buffer {
    const litematicRegions: Record<string, any> = {};

    // 遍历所有区域并进行转换
    for (const regionName in uniStruct.regions) {
        const uniRegion = uniStruct.regions[regionName]!;
        const size = uniRegion.size;
        const position = uniRegion.position;

        // --- 1. 创建方块调色板 (Palette) 和索引数组 ---
        const palette: any[] = []; // prismarine-nbt 使用普通对象
        const blockStateMap = new Map<string, number>();
        const blockStateIndices: number[] = new Array(size.x * size.y * size.z);
        let paletteIndexCounter = 0;

        for (let y = 0; y < size.y; y++) {
            for (let z = 0; z < size.z; z++) {
                for (let x = 0; x < size.x; x++) {
                    const block = uniRegion.blocks[y]![x]![z]!;
                    const propertiesString = block.properties
                        ? `[${Object.entries(block.properties).map(([k, v]) => `${k}=${v}`).join(',')}]`
                        : '';
                    const blockStateKey = `${block.name}${propertiesString}`;

                    let paletteIndex = blockStateMap.get(blockStateKey);

                    if (paletteIndex === undefined) {
                        paletteIndex = paletteIndexCounter++;
                        blockStateMap.set(blockStateKey, paletteIndex);
                        
                        const nbtProperties: Record<string, any> = {};
                        if (block.properties) {
                            for(const propKey in block.properties) {
                                nbtProperties[propKey] = { type: 'string', value: String(block.properties[propKey]) };
                            }
                        }

                        palette.push({
                            type: 'compound',
                            value: {
                                Name: { type: 'string', value: block.name },
                                Properties: { type: 'compound', value: nbtProperties },
                            }
                        });
                    }

                    const arrayIndex = (y * size.z + z) * size.x + x;
                    blockStateIndices[arrayIndex] = paletteIndex;
                }
            }
        }

        // --- 2. 将索引数组打包成 Long Array ---
        const paletteSize = palette.length;
        const bitsPerBlock = Math.max(2, Math.ceil(Math.log2(paletteSize)));
        const packedStates: [number, number][] = [];

        let currentLong = 0n;
        let bitIndex = 0;

        for(let i = 0; i < blockStateIndices.length; i++) {
            const index = BigInt(blockStateIndices[i]!);
            currentLong |= (index << BigInt(bitIndex));
            bitIndex += bitsPerBlock;

            if(bitIndex >= 64) {
                packedStates.push(bigIntToPrismarineLong(currentLong));
                bitIndex -= 64;
                currentLong = index >> BigInt(64 - (bitIndex + bitsPerBlock));
            }
        }
        if(bitIndex > 0) {
            packedStates.push(bigIntToPrismarineLong(currentLong));
        }

        // --- 3. 转换实体 (Entities) ---
        const litematicEntities = uniRegion.entities?.map(e => ({
            type: 'compound',
            value: {
                id: { type: 'string', value: e.name },
                Pos: { type: 'list', value: { type: 'double', value: [e.position.x, e.position.y, e.position.z] } },
                Rotation: { type: 'list', value: { type: 'float', value: [e.rotation.a, e.rotation.b] } },
                ...e.properties
            }
        })) || [];
        
        // --- 4. 转换方块实体 (Tile Entities) ---
        const litematicTileEntities = uniRegion.tileEntities?.map(te => ({
            type: 'compound',
            value: {
                x: { type: 'int', value: te.position.x },
                y: { type: 'int', value: te.position.y },
                z: { type: 'int', value: te.position.z },
                ...te.properties
            }
        })) || [];

        // --- 5. 组合成单个区域的 NBT 数据 ---
        litematicRegions[regionName] = {
            type: 'compound',
            value: {
                Position: { type: 'compound', value: {
                    x: { type: 'int', value: position.x },
                    y: { type: 'int', value: position.y },
                    z: { type: 'int', value: position.z },
                }},
                Size: { type: 'compound', value: {
                    x: { type: 'int', value: size.x },
                    y: { type: 'int', value: size.y },
                    z: { type: 'int', value: size.z },
                }},
                BlockStates: { type: 'long_array', value: packedStates },
                Palette: { type: 'list', value: { type: 'compound', value: palette } },
                ...(litematicEntities.length > 0 && { Entities: { type: 'list', value: { type: 'compound', value: litematicEntities } } }),
                ...(litematicTileEntities.length > 0 && { TileEntities: { type: 'list', value: { type: 'compound', value: litematicTileEntities } } }),
            }
        };
    }
    
    // --- 6. 构建最终的 Litematic NBT 结构 ---
    const rootNbt: NBT = {
        type: 'compound',
        name: '', // Root tag name must be empty for litematics
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
                    EnclosingSize: { type: 'compound', value: {
                        x: { type: 'int', value: uniStruct.meta.size.x },
                        y: { type: 'int', value: uniStruct.meta.size.y },
                        z: { type: 'int', value: uniStruct.meta.size.z },
                    }},
                }
            },
            Regions: {
                type: 'compound',
                value: litematicRegions
            }
        }
    };
    
    // --- 7. 序列化为 NBT 并用 GZIP 压缩 ---
    const nbtBuffer = nbt.writeUncompressed(rootNbt, 'big');
    const nbtUint8Array = new Uint8Array(nbtBuffer.buffer, nbtBuffer.byteOffset, nbtBuffer.byteLength);
    const gzippedUint8Array = pakoGzip(nbtUint8Array);
    
    // pako 返回一个 Uint8Array, 我们需要将其转换为 Node.js Buffer 以便写入文件
    return Buffer.from(gzippedUint8Array);
}