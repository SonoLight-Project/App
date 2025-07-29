import type { IUniStructMeta, IUniBlock, IUniStruct, IUniStructRaw, IUniEntity, IUniTileEntity } from '~/types/unistruct/unistruct'
import { parseLitematica } from '~/stores/litematic-parser';
import type { ParsedLitematica } from '~/stores/litematic-parser';
import Bitmap from './bitmap';
import BitmapMap from './bitmap-map';
import { toHandlerKey } from 'vue';
/**
文件头   
0        4        5        6        8                                   12  
+--------+--------+--------+--------+--------+--------+--------+--------+  
|  Magic | Version| Flags  |Reserved|        Data Version (uint32)      |  
+--------+--------+--------+--------+--------+--------+--------+--------+  

Magic (4字节): 0x55, 0x4E, 0x49, 0x53 ("UNIS")

Version (1字节): 文件格式版本

Flags (1字节): 选项标志位

Reserved (2字节): 保留字段

Data Version (4字节): Minecraft数据版本

元数据   
+--------+--------+--------+--------+--------+  
| Name Len| Author Len | Desc Len |  Size X  |  
+--------+--------+--------+--------+--------+   
|  Size Y |  Size Z | Total Blocks (uint32)  |   
+--------+--------+--------+--------+--------+    
|       Created Time (uint64 - ms)          |  
+--------+--------+--------+--------+--------+  
|      Modified Time (uint64 - ms)          |   
+--------+--------+--------+--------+--------+  
|  Name (UTF-8)  | Author (UTF-8) | Desc... |  
+-------------------------------------------+   

所有长度字段均为2字节(uint16)

尺寸字段为4字节(uint32)

时间戳为8字节(uint64)

字符串存储为UTF-8编码

区域:   
区域头   
+--------+--------+--------+--------+--------+  
| Region ID Len | Pos X | Pos Y | Pos Z |Sz X|
+--------+--------+--------+--------+--------+  
|  Sz Y  | Sz Z  | Bit Depth |  
+--------+--------+--------+--------+--------+   
|       Blocks Data Length (uint32)         |   
+--------+--------+--------+--------+--------+    
|        Region ID (UTF-8)                  |   
+-------------------------------------------+    

Position (4字节int32)

Size (2字节uint16)

Bit Depth (1字节): 每个索引的位数(1-8)

Blocks Data Length (4字节): 块数据字节长度

调色板    
0        2        4        6        ...
+--------+--------+--------+--------+
| Block ID Len | Properties Flag    |
+--------+--------+--------+--------+
|   Block ID (UTF-8)   | Properties?|
+-----------------------------------+

Block ID Len (2字节)

Properties Flag (1字节):

0x00: 无属性

0x01: 简单属性(键值对)

0x02: 完整属性(JSON)

属性存储为:

简单属性: [KeyLen, Key, ValueType, Value]

完整属性: [JSON Length, JSON Data]

数据块
0        ...  
+--------+  
| Data   |
+--------+   
使用位流存储，每个方块使用调色板索引编码，每个字节使用Huffman编码。

存储顺序: Y → Z → X

*/
export class Unistruct {

    private static readonly MAGIC = 0x554E4953; // "UNIS"
    private static readonly VERSION = 1;
    public static readonly DEFAULT_DATA: IUniStruct = {
        minecraftDataVersion: 0,
        meta: {
            name: "Unnamed",
            author: "Unknown",
            description: "If you see this, something went wrong.",
            size: { x: 0, y: 0, z: 0 },
            totalBlocks: 0,
            createdTime: 0n,
            modifiedTime: 0n
        },
        regions: {}
    }

    public data: IUniStruct;


    constructor(data?: IUniStruct) {
        this.data = data ?? Unistruct.DEFAULT_DATA;
    }

    static async fromUnistructFile(file: File): Promise<Unistruct> {
        const result = OptimizedUniStructDeserializer.deserialize(await file.arrayBuffer());
        return new Unistruct(result);
    }

    static async fromLitematicaFile(file: File): Promise<Unistruct> {
        const litematicData = await parseLitematica(file);
        const result = new Unistruct({
            minecraftDataVersion: litematicData.minecraftDataVersion,
            meta: litematicData.metadata,
            regions: litematicData.regions
        });
        return result;
    }

    static fromLitematicaData(data: ParsedLitematica): Unistruct {
        const result = new Unistruct();
        result.data = {
            minecraftDataVersion: data.minecraftDataVersion,
            meta: data.metadata,
            regions: data.regions
        }
        return result;
    }

    generateFile(): File {
        if (this.data === Unistruct.DEFAULT_DATA) {
            throw new Error("Empty Unistruct");
        }
        const buffer = OptimizedUniStructSerializer.serialize(this.data);
        const file = new File([buffer], `${this.data.meta.name}.unis`, { type: 'application/octet-stream' });
        return file;
    }

    toLitematicaData(): ParsedLitematica {
        const result: ParsedLitematica = {
            version: 6,
            minecraftDataVersion: this.data.minecraftDataVersion,
            metadata: this.data.meta,
            regions: {}
        };
        for (const [regionId, region] of Object.entries(this.data.regions)) {
            result.regions[regionId] = {
                position: region.position,
                size: region.size,
                palette: [],
                blocks: region.blocks,
                entities: region.entities ?? [],
                tileEntities: region.tileEntities ?? []
            };
        }
        return result;
    }

}

// 类型定义
type Int16 = number;
type Uint16 = number;
type Uint8 = number;
type Uint32 = number;
type Bit = 0 | 1;
type HuffmanCode = string; // 二进制字符串如 "0101"

interface Vector3 {
    x: Int16;
    y: Int16;
    z: Int16;
}

// Huffman树节点
class HuffmanNode {
    constructor(
        public symbol: string | null = null,
        public frequency: number = 0,
        public left: HuffmanNode | null = null,
        public right: HuffmanNode | null = null
    ) { }
}

interface RegionData {
    blocks: IUniBlock[][][];
    size: Vector3;
    position: Vector3;
    entity?: IUniEntity[];
    tileEntity?: IUniTileEntity[];
}

// 高效二进制序列化器
export class OptimizedUniStructSerializer {
    public static readonly MAGIC = 0x554E4953; // "UNIS"
    public static readonly VERSION = 1; // version 1 
    static serialize(data: IUniStruct): ArrayBuffer {
        // 计算总大小
        const totalSize = this.calculateTotalSize(data);
        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);
        let offset = 0;

        // 写入文件头
        view.setUint32(offset, this.MAGIC);
        view.setUint8(offset + 4, this.VERSION);
        view.setUint8(offset + 5, 0); // Flags
        view.setUint16(offset + 6, 0); // Reserved
        view.setUint32(offset + 8, data.minecraftDataVersion);
        offset += 12;

        // 序列化元数据
        offset = this.serializeMeta(view, offset, data.meta);

        // 写入区域数量
        view.setUint16(offset, Object.keys(data.regions).length, true);
        offset += 2;

        // 序列化每个区域
        for (const [regionId, regionData] of Object.entries(data.regions)) {
            offset = this.serializeRegion(view, offset, regionId, regionData);
        }

        return buffer;
    }

    private static calculateTotalSize(data: IUniStruct): number {
        // 文件头(12) + 区域数量(2)
        let size = 14;

        // 元数据大小
        size += this.calculateMetaSize(data.meta);

        // 遍历每个区域计算大小
        for (const [regionId, region] of Object.entries(data.regions)) {
            size += this.calculateStringSize(regionId, true); // 区域ID (使用1字节长度)
            size += 12; // position (3x int32)
            size += 12; // size (3x int32)

            // 哈夫曼树大小
            const [huffmanRoot, _] = this.buildHuffmanTree(region.blocks);
            size += 2; // 哈夫曼树节点数 (uint16)
            size += this.calculateHuffmanTreeSize(huffmanRoot);

            // 方块数据大小
            const encodedData = this.encodeBlocks(region.blocks);
            const byteLength = Math.ceil(encodedData.length / 8);
            size += 4 + byteLength; // 位长度(uint32) + 数据

            // --- 新增: 计算方块实体和实体的大小 ---
            size += this.calculateTileEntitiesSize(region.tileEntities);
            size += this.calculateEntitiesSize(region.entities);
            // --- 结束新增 ---
        }

        return size;
    }

    private static calculateMetaSize(meta: IUniStructMeta): number {
        let size = 0;
        size += this.calculateStringSize(meta.name, true);
        size += this.calculateStringSize(meta.author, true);
        size += this.calculateStringSize(meta.description, true);
        size += 12; // size (3x int32)
        size += 4;  // totalBlocks (uint32)
        size += 16; // 2x bigint (timestamps)
        return size;
    }

    private static calculateStringSize(str: string, isShort: boolean): number {
        // 使用TextEncoder来精确计算UTF-8编码后的字节数
        const encoder = new TextEncoder();
        const encodedLength = encoder.encode(str).length;
        return encodedLength + (isShort ? 1 : 4);
    }

    private static calculateTileEntitiesSize(tileEntities?: IUniTileEntity[]): number {
        if (!tileEntities || tileEntities.length === 0) {
            return 4; // 只有一个表示数量为0的uint32
        }
        let size = 4; // 数量 (uint32)
        for (const te of tileEntities) {
            size += 12; // position (3x int32)
            const propertiesJson = JSON.stringify(te.properties ?? {});
            size += this.calculateStringSize(propertiesJson, false); // JSON字符串 (使用4字节长度)
        }
        return size;
    }

    private static calculateEntitiesSize(entities?: IUniEntity[]): number {
        if (!entities || entities.length === 0) {
            return 4; // 只有一个表示数量为0的uint32
        }
        let size = 4; // 数量 (uint32)
        for (const entity of entities) {
            size += this.calculateStringSize(entity.name, true); // 实体名称 (使用1字节长度)
            size += 24; // position (3x float64)
            size += 16; // rotation (2x float64)
            const propertiesJson = JSON.stringify(entity.properties ?? {});
            size += this.calculateStringSize(propertiesJson, false); // JSON字符串 (使用4字节长度)
        }
        return size;
    }



    private static calculateHuffmanTreeSize(node: HuffmanNode | null): number {
        if (!node) return 0;

        let size = 1; // 节点类型标志

        if (node.symbol !== null) {
            // 叶节点: 类型标志 + 符号字符串
            size += this.calculateStringSize(node.symbol, true);
        } else {
            // 内部节点: 递归计算子树
            size += this.calculateHuffmanTreeSize(node.left);
            size += this.calculateHuffmanTreeSize(node.right);
        }

        return size;
    }

    public static getBlockKey(block: IUniBlock): string {
        let key = block.name;
        if (block.properties) {
            // 简单序列化属性
            const propKeys = Object.keys(block.properties).sort();
            for (const prop of propKeys) {
                const propValue = block.properties[prop];
                // 只序列化简单类型（string, number, boolean）
                if (typeof propValue === 'string' || typeof propValue === 'number' || typeof propValue === 'boolean') {
                    key += `|${prop}=${propValue}`;
                } else {
                    console.warn(`无法简单序列化的属性: ${prop}，类型为 ${typeof propValue}`);
                }
            }
        }
        return key;
    }

    private static buildHuffmanTree(blocks: IUniBlock[][][]): [HuffmanNode, Map<string, string>] {
        // 统计频率
        const frequencyMap = new Map<string, number>();

        try {

            // 计算频率
            for (let y = 0; y < blocks.length; y++) {
                if (!blocks[y]) continue;

                for (let z = 0; z < blocks[y]!.length; z++) {
                    if (!blocks[y]![z]) continue;

                    for (let x = 0; x < blocks[y]![z]!.length; x++) {
                        const block = blocks[y]![z]![x];
                        if (!block) continue;

                        const key = this.getBlockKey(block);
                        frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
                    }
                }
            }

            // 创建叶节点
            const nodes: HuffmanNode[] = [];
            for (const [symbol, freq] of frequencyMap.entries()) {
                if (freq > 0) {
                    nodes.push(new HuffmanNode(symbol, freq));
                }
            }

            // 如果没有节点，创建一个空节点
            if (nodes.length === 0) {
                nodes.push(new HuffmanNode("minecraf:air", 1));
            }

            // 构建Huffman树
            while (nodes.length > 1) {
                nodes.sort((a, b) => a.frequency - b.frequency);

                const left = nodes.shift()!;
                const right = nodes.shift()!;

                const parent = new HuffmanNode(
                    null,
                    left.frequency + right.frequency,
                    left,
                    right
                );

                nodes.push(parent);
            }

            const root = nodes[0]!;

            if (root === undefined) {
                throw new Error("计算过程被宇宙射线击中了");
            }

            // 生成编码表
            const codeMap = new Map<string, string>();
            this.generateCodes(root, "", codeMap);
            console.log("Huffman code map:", codeMap);
            return [root, codeMap];
        } catch (error) {
            console.error("Error building Huffman tree:", error);
            // 返回一个简单的树作为后备
            const root = new HuffmanNode("air", 1);
            const codeMap = new Map<string, string>([["air", "0"]]);
            return [root, codeMap];
        }
    }

    private static generateCodes(node: HuffmanNode, code: HuffmanCode, codeMap: Map<string, HuffmanCode>) {
        if (node.symbol !== null) {
            codeMap.set(node.symbol, code);
            return;
        }

        if (node.left) {
            this.generateCodes(node.left, code + "0", codeMap);
        }

        if (node.right) {
            this.generateCodes(node.right, code + "1", codeMap);
        }
    }

    private static encodeBlocks(blocks: IUniBlock[][][]): string {
        const [_, codeMap] = this.buildHuffmanTree(blocks);
        let bitString = "";
        let blockCount = 0;
        const expectedBlocks = blocks.length * blocks[0]!.length * blocks[0]![0]!.length;

        try {
            // 按Y Z X顺序编码
            for (let y = 0; y < blocks.length; y++) {
                for (let z = 0; z < blocks[y]!.length; z++) {
                    for (let x = 0; x < blocks[y]![z]!.length; x++) {
                        const block = blocks[y]![z]![x]!;
                        const key = this.getBlockKey(block);
                        const code = codeMap.get(key);

                        if (!code) {
                            throw new Error(`Block key not found in palette: ${key}`);
                        }

                        bitString += code;
                        blockCount++;
                    }
                }
            }

            if (blockCount !== expectedBlocks) {
                console.warn(`Encoded ${blockCount} blocks, expected ${expectedBlocks}. Data size may be incorrect.`);
            }
        } catch (error) {
            console.error("Error encoding blocks:", error);
            // 返回空字符串作为错误指示
            return "";
        }
        console.log("Encoded bit string:", bitString);
        return bitString;
    }

    private static serializeMeta(view: DataView, offset: number, meta: IUniStructMeta): number {
        // 写入字符串长度和数据
        offset = this.writeString(view, offset, meta.name, true);
        offset = this.writeString(view, offset, meta.author, true);
        offset = this.writeString(view, offset, meta.description, true);

        // 写入尺寸 (int16)
        view.setInt16(offset, meta.size.x, true);
        view.setInt16(offset + 2, meta.size.y, true);
        view.setInt16(offset + 4, meta.size.z, true);
        offset += 6;

        // 写入方块总数
        view.setUint32(offset, meta.totalBlocks, true);
        offset += 4;

        // 写入时间戳 (uint64)
        view.setBigUint64(offset, BigInt(meta.createdTime), true);
        offset += 8;
        view.setBigUint64(offset, BigInt(meta.modifiedTime), true);
        offset += 8;

        return offset;
    }

    private static serializeRegion(
        view: DataView,
        offset: number,
        regionId: string,
        region: IUniStruct['regions'][string]
    ): number {
        // --- 序列化区域头、哈夫曼树和方块数据 (这部分逻辑保持不变) ---
        offset = this.writeString(view, offset, regionId, true);
        view.setInt32(offset, region.position.x, true);
        view.setInt32(offset + 4, region.position.y, true);
        view.setInt32(offset + 8, region.position.z, true);
        offset += 12;
        view.setInt32(offset, region.size.x, true);
        view.setInt32(offset + 4, region.size.y, true);
        view.setInt32(offset + 8, region.size.z, true);
        offset += 12;
        const [huffmanRoot, _] = this.buildHuffmanTree(region.blocks);
        offset = this.serializeHuffmanTree(view, offset, huffmanRoot);
        const encodedData = this.encodeBlocks(region.blocks);
        view.setUint32(offset, encodedData.length, true);
        offset += 4;
        offset = this.writeBitString(view, offset, encodedData);

        offset = this.serializeTileEntities(view, offset, region.tileEntities);
        offset = this.serializeEntities(view, offset, region.entities);
        

        return offset;
    }

    private static serializeHuffmanTree(
        view: DataView,
        offset: number,
        root: HuffmanNode
    ): number {
        // 使用先序遍历序列化Huffman树
        const nodeCount = this.countNodes(root);
        view.setUint16(offset, nodeCount, true);
        offset += 2;

        return this.serializeNode(view, offset, root);
    }

    private static serializeNode(
        view: DataView,
        offset: number,
        node: HuffmanNode
    ): number {
        // 检查偏移量是否有效
        if (offset >= view.byteLength) {
            throw new Error(`SerializeNode offset out of bounds: ${offset} >= ${view.byteLength}`);
        }

        if (node.symbol !== null) {
            // 叶节点: 标志位1 + 符号
            view.setUint8(offset, 1);
            offset += 1;

            // 检查字符串写入前的偏移量
            if (offset >= view.byteLength) {
                throw new Error(`SerializeNode symbol write out of bounds: ${offset} >= ${view.byteLength}`);
            }

            offset = this.writeString(view, offset, node.symbol, true);
        } else {
            // 内部节点: 标志位0
            view.setUint8(offset, 0);
            offset += 1;

            // 递归序列化左子树和右子树
            if (node.left) {
                // 检查左子树写入前的偏移量
                if (offset >= view.byteLength) {
                    throw new Error(`SerializeNode left child write out of bounds: ${offset} >= ${view.byteLength}`);
                }

                offset = this.serializeNode(view, offset, node.left);
            }

            if (node.right) {
                // 检查右子树写入前的偏移量
                if (offset >= view.byteLength) {
                    throw new Error(`SerializeNode right child write out of bounds: ${offset} >= ${view.byteLength}`);
                }

                offset = this.serializeNode(view, offset, node.right);
            }
        }

        return offset;
    }


    private static countNodes(node: HuffmanNode | null): number {
        if (!node) return 0;
        return 1 + this.countNodes(node.left) + this.countNodes(node.right);
    }

    private static writeBitString(view: DataView, offset: number, bitString: string): number {
        const byteCount = Math.ceil(bitString.length / 8);

        for (let i = 0; i < byteCount; i++) {
            let byte = 0;
            const start = i * 8;
            const end = Math.min(start + 8, bitString.length);

            for (let j = start; j < end; j++) {
                if (bitString[j] === '1') {
                    byte |= 1 << (7 - (j - start));
                }
            }

            view.setUint8(offset, byte);
            offset++;
        }

        return offset;
    }

    private static writeString(view: DataView, offset: number, str: string, isShort: boolean): number {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(str);

        if (isShort) {
            view.setUint8(offset, encoded.length);
            offset += 1;
        } else {
            view.setUint32(offset, encoded.length, true);
            offset += 4;
        }

        // 检查缓冲区是否足够
        if (offset + encoded.length > view.byteLength) {
            throw new Error(`Buffer overflow when writing string: "${str}"`);
        }

        // 写入字符串数据
        encoded.forEach((byte, i) => {
            view.setUint8(offset + i, byte);
        });

        return offset + encoded.length;
    }

    private static serializeTileEntities(view: DataView, offset: number, tileEntities?: IUniTileEntity[]): number {
        const count = tileEntities?.length ?? 0;
        view.setUint32(offset, count, true);
        offset += 4;

        if (count > 0) {
            for (const te of tileEntities!) {
                // 写入位置 (3x int32)
                view.setInt32(offset, te.position.x, true);
                view.setInt32(offset + 4, te.position.y, true);
                view.setInt32(offset + 8, te.position.z, true);
                offset += 12;

                // 写入属性 (JSON字符串)
                const propertiesJson = JSON.stringify(te.properties ?? {});
                offset = this.writeString(view, offset, propertiesJson, false); // 使用4字节长度
            }
        }
        return offset;
    }

    private static serializeEntities(view: DataView, offset: number, entities?: IUniEntity[]): number {
        const count = entities?.length ?? 0;
        view.setUint32(offset, count, true);
        offset += 4;

        if (count > 0) {
            for (const entity of entities!) {
                // 写入名称 (短字符串)
                offset = this.writeString(view, offset, entity.name, true);

                // 写入位置 (3x float64)
                view.setFloat64(offset, entity.position.x, true);
                view.setFloat64(offset + 8, entity.position.y, true);
                view.setFloat64(offset + 16, entity.position.z, true);
                offset += 24;

                // 写入旋转 (2x float64)
                view.setFloat64(offset, entity.rotation.a, true);
                view.setFloat64(offset + 8, entity.rotation.b, true);
                offset += 16;

                // 写入属性 (JSON字符串)
                const propertiesJson = JSON.stringify(entity.properties ?? {});
                offset = this.writeString(view, offset, propertiesJson, false); // 使用4字节长度
            }
        }
        return offset;
    }
}



// 反序列化器
export class OptimizedUniStructDeserializer {
    static deserialize(buffer: ArrayBuffer): IUniStruct {
        const view = new DataView(buffer);
        let offset = 0;

        try {
            // 读取文件头
            const magic = view.getUint32(offset);
            if (magic !== OptimizedUniStructSerializer.MAGIC) {
                throw new Error('Invalid file format: Magic number mismatch');
            }

            const version = view.getUint8(offset + 4);
            if (version !== 1) {
                throw new Error(`Unsupported file version: ${version}, expected 1`);
            }

            const dataVersion = view.getUint32(offset + 8);
            offset += 12;

            // 读取元数据
            const [meta, metaOffset] = this.deserializeMeta(view, offset);
            offset = metaOffset;

            // 读取区域数量
            const regionCount = view.getUint16(offset, true);
            offset += 2;

            if (regionCount > 1000) {
                throw new Error(`Unreasonable region count: ${regionCount}`);
            }

            // 读取区域数据
            const regions: { [key: string]: RegionData } = {};
            for (let i = 0; i < regionCount; i++) {
                const [regionId, regionData, regionOffset] = this.deserializeRegion(view, offset);
                regions[regionId] = regionData;
                offset = regionOffset;
            }

            return {
                minecraftDataVersion: dataVersion,
                meta,
                regions
            };
        } catch (error) {
            console.error("Deserialization failed:", error);
            // 返回空结构作为错误后备
            return {
                minecraftDataVersion: 0,
                meta: {
                    name: "Error",
                    author: "System",
                    description: "Failed to deserialize structure",
                    size: { x: 0, y: 0, z: 0 },
                    totalBlocks: 0,
                    createdTime: BigInt(new Date().getTime()),
                    modifiedTime: BigInt(new Date().getTime())
                },
                regions: {}
            };
        }
    }

    private static deserializeMeta(view: DataView, offset: number): [IUniStructMeta, number] {
        const [name, nameOffset] = this.readString(view, offset, true);
        offset = nameOffset;

        const [author, authorOffset] = this.readString(view, offset, true);
        offset = authorOffset;

        const [description, descOffset] = this.readString(view, offset, true);
        offset = descOffset;

        const size = {
            x: view.getInt16(offset, true),
            y: view.getInt16(offset + 2, true),
            z: view.getInt16(offset + 4, true)
        };
        offset += 6;

        const totalBlocks = view.getUint32(offset, true);
        offset += 4;

        const createdTime = view.getBigUint64(offset, true);
        offset += 8;
        const modifiedTime = view.getBigUint64(offset, true);
        offset += 8;

        const meta: IUniStructMeta = {
            name,
            author,
            description,
            size,
            totalBlocks,
            createdTime,
            modifiedTime
        };

        return [meta, offset];
    }

    private static deserializeRegion(
        view: DataView,
        offset: number
    ): [string, IUniStruct['regions'][string], number] {
        try {
            if (offset + 1 > view.byteLength) {
                throw new Error(`Region ID length out of bounds`);
            }

            const [regionId, idOffset] = this.readString(view, offset, true);
            offset = idOffset;

            if (offset + 12 > view.byteLength) {
                throw new Error(`Region position out of bounds`);
            }

            const position = { 
                x: view.getInt32(offset, true), 
                y: view.getInt32(offset + 4, true), 
                z: view.getInt32(offset + 8, true) 
            };
            offset += 12;

            if (offset + 12 > view.byteLength) {
                throw new Error(`Region size out of bounds`);
            }

            const size = { 
                x: view.getInt32(offset, true), 
                y: view.getInt32(offset + 4, true), 
                z: view.getInt32(offset + 8, true) 
            };
            offset += 12;


            if (offset + 2 > view.byteLength) {
                throw new Error(`Huffman tree header out of bounds`);
            }

            const [huffmanRoot, huffmanOffset] = this.deserializeHuffmanTree(view, offset);
            offset = huffmanOffset;

            if (offset + 4 > view.byteLength) {
                throw new Error(`Bitstream length out of bounds`);
            }

            const bitLength = view.getUint32(offset, true);
            offset += 4;

            if (bitLength === 0) {
                console.warn("Empty bitstream detected, creating empty blocks");
                const blocks = this.createEmptyBlocks(size);
                return [regionId, {
                    blocks,
                    size,
                    position
                }, offset];
            }

            const [bitString, bitStringOffset] = this.readBitString(view, offset, bitLength);
            offset = bitStringOffset;

            const blocks = this.decodeBlocks(bitString, huffmanRoot, size);

            const [tileEntities, teOffset] = this.deserializeTileEntities(view, offset);
            offset = teOffset;
            const [entities, eOffset] = this.deserializeEntities(view, offset);
            offset = eOffset;

            const regionData: IUniStruct['regions'][string] = {
                blocks,
                size,
                position,
                tileEntities,
                entities      
            };
            
            return [regionId, regionData, offset];
        } catch (error) {
            console.error("Region deserialization failed:", error);
            return ["error_region", {
                position: { x: 0, y: 0, z: 0 },
                size: { x: 0, y: 0, z: 0 },
                blocks: []
            }, offset];
        }
    }

    private static deserializeTileEntities(view: DataView, offset: number): [IUniTileEntity[], number] {
        const tileEntities: IUniTileEntity[] = [];
        const count = view.getUint32(offset, true);
        offset += 4;

        for (let i = 0; i < count; i++) {
            // 读取位置
            const position = {
                x: view.getInt32(offset, true),
                y: view.getInt32(offset + 4, true),
                z: view.getInt32(offset + 8, true)
            };
            offset += 12;

            // 读取属性JSON字符串
            const [propertiesJson, propOffset] = this.readString(view, offset, false); // 使用4字节长度
            offset = propOffset;
            
            // 解析JSON
            const properties = JSON.parse(propertiesJson);
            tileEntities.push({ position, properties });
        }
        return [tileEntities, offset];
    }

    private static deserializeEntities(view: DataView, offset: number): [IUniEntity[], number] {
        const entities: IUniEntity[] = [];
        const count = view.getUint32(offset, true);
        offset += 4;

        for (let i = 0; i < count; i++) {
            // 读取名称
            const [name, nameOffset] = this.readString(view, offset, true);
            offset = nameOffset;

            // 读取位置
            const position = {
                x: view.getFloat64(offset, true),
                y: view.getFloat64(offset + 8, true),
                z: view.getFloat64(offset + 16, true)
            };
            offset += 24;

            // 读取旋转
            const rotation = {
                a: view.getFloat64(offset, true),
                b: view.getFloat64(offset + 8, true)
            };
            offset += 16;

            // 读取属性JSON字符串
            const [propertiesJson, propOffset] = this.readString(view, offset, false); // 使用4字节长度
            offset = propOffset;
            
            // 解析JSON
            const properties = JSON.parse(propertiesJson);
            entities.push({ name, position, rotation, properties });
        }
        return [entities, offset];
    }

    private static createEmptyBlocks(size: Vector3): IUniBlock[][][] {
        const blocks: IUniBlock[][][] = [];
        const width = Math.abs(size.x);
        const height = Math.abs(size.y);
        const depth = Math.abs(size.z);

        for (let y = 0; y < height; y++) {
            blocks[y] = [];
            for (let z = 0; z < depth; z++) {
                blocks[y]![z] = [];
                for (let x = 0; x < width; x++) {
                    blocks[y]![z]![x] = { name: "minecraft:air" };
                }
            }
        }
        return blocks;
    }

    private static deserializeHuffmanTree(
        view: DataView,
        offset: number
    ): [HuffmanNode, number] {
        // 修复1: 添加更精确的边界检查
        console.log(`Deserializing Huffman tree at offset ${offset}`);
        if (offset + 2 > view.byteLength) {
            throw new Error(`Huffman tree header out of bounds: ${offset + 2} > ${view.byteLength}`);
        }

        const nodeCount = view.getUint16(offset, true);
        offset += 2;

        // 修复2: 添加节点数合理性检查
        if (nodeCount === 0) {
            console.warn("Empty Huffman tree detected");
            return [new HuffmanNode("air", 1), offset];
        }

        // 修复3: 添加最大深度限制
        const [node, newOffset] = this.deserializeNode(view, offset, 0, 50);
        return [node, newOffset];
    }

    private static deserializeNode(
        view: DataView,
        offset: number,
        depth: number,
        maxDepth: number
    ): [HuffmanNode, number] {
        console.log(`Deserializing node at offset ${offset}, depth ${depth}`);
        // 修复4: 添加递归深度限制
        if (depth > maxDepth) {
            throw new Error(`Huffman tree too deep: ${depth} > ${maxDepth}`);
        }

        // 修复5: 精确到字节的边界检查
        if (offset >= view.byteLength) {
            throw new Error(`Node offset out of bounds: ${offset} >= ${view.byteLength}`);
        }

        const nodeType = view.getUint8(offset);
        offset += 1;

        if (nodeType === 1) {
            // 叶节点
            if (offset >= view.byteLength) {
                throw new Error(`Leaf node string offset out of bounds: ${offset} >= ${view.byteLength}`);
            }

            const [symbol, symbolOffset] = this.readString(view, offset, true);
            offset = symbolOffset;
            return [new HuffmanNode(symbol), offset];
        } else if (nodeType === 0) {
            // 内部节点
            const node = new HuffmanNode();

            // 左子树
            if (offset >= view.byteLength) {
                throw new Error(`Left child offset out of bounds: ${offset} >= ${view.byteLength}`);
            }

            const [left, leftOffset] = this.deserializeNode(view, offset, depth + 1, maxDepth);
            offset = leftOffset;
            node.left = left;

            // 修复6: 检查是否有右子树数据
            if (offset >= view.byteLength) {
                console.warn("Huffman tree missing right child, using left as right");
                node.right = null;
                return [node, offset];
            }

            // 右子树
            const [right, rightOffset] = this.deserializeNode(view, offset, depth + 1, maxDepth);
            offset = rightOffset;
            node.right = right;

            return [node, offset];
        } else {
            throw new Error(`Invalid node type: ${nodeType}`);
        }
    }

    private static readString(view: DataView, offset: number, isShort: boolean): [string, number] {
        const decoder = new TextDecoder('utf-8');
        let length: number;

        if (isShort) {
            if (offset + 1 > view.byteLength) throw new Error("Buffer underflow reading short string length");
            length = view.getUint8(offset);
            offset += 1;
        } else {
            if (offset + 4 > view.byteLength) throw new Error("Buffer underflow reading long string length");
            length = view.getUint32(offset, true);
            offset += 4;
        }
        
        if (offset + length > view.byteLength) {
            throw new Error(`Buffer underflow reading string data. Expected ${length} bytes, but only ${view.byteLength - offset} available.`);
        }
        
        // 从buffer中创建一个子视图进行解码，更高效
        const stringBytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
        const str = decoder.decode(stringBytes);
        
        return [str, offset + length];
    }

    private static decodeBlocks(
        bitString: string,
        huffmanRoot: HuffmanNode,
        size: Vector3
    ): IUniBlock[][][] {
        //console.log(`Decoding blocks with palette size ${palette.size}, bit length ${bitString.length}`);
        // 创建空3D数组
        const blocks: IUniBlock[][][] = [];
        const { x, y, z } = { x: Math.abs(size.x), y: Math.abs(size.y), z: Math.abs(size.z) }
        const totalBlocks = x * y * z;

        for (let y = 0; y < y; y++) {
            blocks[y] = [];
            for (let z = 0; z < z; z++) {
                blocks[y]![z] = [];
                for (let x = 0; x < x; x++) {
                    // 初始化为空气方块作为后备
                    blocks[y]![z]![x] = { name: "minecraft:air" };
                }
            }
        }

        try {
            let currentNode = huffmanRoot;
            let index = 0;

            // 按Y Z X顺序解码
            const width = Math.abs(size.x);
            const height = Math.abs(size.y);
            const depth = Math.abs(size.z);

            // 使用不同的变量名避免冲突
            for (let yIdx = 0; yIdx < height; yIdx++) {
                blocks[yIdx] = [];
                for (let zIdx = 0; zIdx < depth; zIdx++) {
                    blocks[yIdx]![zIdx] = [];
                    for (let xIdx = 0; xIdx < width; xIdx++) {
                        // 遍历Huffman树直到找到叶节点
                        while (currentNode && currentNode.symbol === null) {
                            if (index >= bitString.length) {
                                throw new Error("Unexpected end of bit stream");
                            }

                            const bit = bitString[index++];
                            currentNode = bit === '0' ? currentNode.left! : currentNode.right!;

                            // 添加安全中断
                            if (!currentNode) {
                                throw new Error("Invalid Huffman tree path");
                            }
                        }

                        if (!currentNode || !currentNode.symbol) {
                            throw new Error("Invalid Huffman tree node");
                        }

                        const blockKey = currentNode.symbol;
                        const block = OptimizedUniStructDeserializer.getBlockFromKey(blockKey);

                        if (block) {
                            blocks[yIdx]![zIdx]![xIdx] = block;
                        } else {
                            console.warn(`Block not found in palette: ${blockKey}`);
                            blocks[yIdx]![zIdx]![xIdx] = { name: "minecraft:air" };
                        }

                        // 重置为根节点
                        currentNode = huffmanRoot;
                    }
                }
            }

            // 严格验证解码的方块数量
            let actualBlocks = 0;
            for (let y = 0; y < blocks.length; y++) {
                for (let z = 0; z < blocks[y]!.length; z++) {
                    actualBlocks += blocks[y]![z]!.length;
                }
            }

            if (actualBlocks !== totalBlocks) {
                console.error(`Block count mismatch: decoded ${actualBlocks} blocks, expected ${totalBlocks}`);
                // 创建新的正确大小的区块数组
                const correctedBlocks = this.createEmptyBlocks(size);

                // 尽可能多地复制已解码的区块
                const copyY = Math.min(blocks.length, correctedBlocks.length);
                for (let y = 0; y < copyY; y++) {
                    const copyZ = Math.min(blocks[y]!.length, correctedBlocks[y]!.length);
                    for (let z = 0; z < copyZ; z++) {
                        const copyX = Math.min(blocks[y]![z]!.length, correctedBlocks[y]![z]!.length);
                        for (let x = 0; x < copyX; x++) {
                            correctedBlocks[y]![z]![x] = blocks[y]![z]![x]!;
                        }
                    }
                }

                return correctedBlocks;
            }
        } catch (error) {
            console.error("Block decoding failed:", error);
            // 部分解码失败时，返回已解码的部分
        }

        return blocks;
    }

    private static readBitString(view: DataView, offset: number, bitLength: number): [string, number] {
        // 计算需要的字节数
        const byteCount = Math.ceil(bitLength / 8);

        // 修复19: 精确的边界检查
        if (offset + byteCount > view.byteLength) {
            // 尝试读取尽可能多的数据
            const availableBytes = view.byteLength - offset;
            const availableBits = Math.min(bitLength, availableBytes * 8);

            let bitString = "";
            for (let i = 0; i < availableBytes; i++) {
                const byte = view.getUint8(offset + i);
                const bitsInByte = (i === availableBytes - 1)
                    ? availableBits % 8 || 8
                    : 8;

                for (let j = 0; j < bitsInByte; j++) {
                    bitString += (byte & (1 << (7 - j))) ? '1' : '0';
                }
            }

            console.warn(`Truncated bitstream: expected ${bitLength} bits, got ${availableBits}`);
            return [bitString, offset + availableBytes];
        }

        let bitString = "";
        for (let i = 0; i < byteCount; i++) {
            const byte = view.getUint8(offset + i);
            const bitsInByte = (i === byteCount - 1)
                ? bitLength % 8 || 8
                : 8;

            for (let j = 0; j < bitsInByte; j++) {
                bitString += (byte & (1 << (7 - j))) ? '1' : '0';
            }
        }

        return [bitString, offset + byteCount];
    }

    static getBlockFromKey(key: string): IUniBlock {
        const args = key.split('|');
        const name = args[0] ?? "minecraft:air";
        const properties: Record<string, any> = {}
        for (let i = 1; i < args.length; i++) {
            const [key, value] = args[i]!.split('=');
            if (key && value)
                properties[key] = value;
        }
        return { name, properties: (properties.length === 0 ? undefined : properties) };
    }
}
