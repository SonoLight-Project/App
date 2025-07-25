export interface UniversalStructureMeta {
    name: string
    author: string
    description: string
    size: { x: number; y: number; z: number }
    totalBlocks: number,
    createdTime: Date,
    modifiedTime: Date
}

export interface UniversalStructureBlock {
    id: string
    properties?: Record<string, any>
}

type HexChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' |
                '8' | '9' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' |
                'A' | 'B' | 'C' | 'D' | 'E' | 'F';

type HexString = HexChar[]


/**
 *  version和meta类似原理图的定义
 *  regions包含多个区域, 每个区域如下:
 *  所有的HexString应该首先被解析为bitmap
 *  paltte包含bitmap和方块的对应关系, 应该由Huffman编码生成
 *  size和position表示当前区域定位和大小
 *  blocks为空间中所有方块, 解析时按照Huffman编码处理, 顺序为Y Z X
 *  一种可能的解析伪代码:
 *  for region in regions:
 *      ParsePalette = Map<bitmap(palette.key), palette.value>
 *      blockBitmap = ParseHexString(blocks)
 *      nowBitmap = bitmap(0)
 *      idx = 0
 *      parseBlock : Block[][][]
 *      for y in size.y:
 *      for z in size.z:
 *      for x in size.x:
 *          while not nowBitmap in ParsePalette.keys():
 *              nowBitmap.push(blockBitmap[idx])
 *              idx += 1
 *          parseBlock[x, y, z] = ParsePalette[nowBitmap]
 *          nowBitmap = bitmap(0)
 *                   
 */
export interface UniversalStructure {
    minecraftDataVersion: number
    version: number
    meta: UniversalStructureMeta
    regions: {
        [key: string] : {
            blocks: HexString
            palette: Map<HexString, UniversalStructureBlock> 
            size: { x: number; y: number; z: number }
            position: { x: number; y: number; z: number }
        }
    }
}