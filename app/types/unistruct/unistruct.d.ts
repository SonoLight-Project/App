// unistruct -> universal structure

export interface IUniStructMeta {
    name: string
    author: string
    description: string
    size: { x: number; y: number; z: number }
    totalBlocks: number,
    createdTime: bigint,
    modifiedTime: bigint
}

export interface IUniBlock {
    name: string
    properties?: Record<string, any>
}

export interface IUniEntity {
    name: string
    position: { x: number; y: number; z: number }
    rotation: { a: number; b: number;}
    properties?: Record<string, any>
}

export interface IUniTileEntity {
    position: { x: number; y: number; z: number }
    properties?: Record<string, any>
}

type IHexString = string;


/**
 *  version和meta类似原理图的定义   
 *  regions包含多个区域, 每个区域如下:   
 *  所有的HexString应该首先被解析为bitmap   
 *  paltte包含bitmap和方块的对应关系, 应该由Huffman编码生成   
 *  size和position表示当前区域定位和大小   
 *  blocks为空间中所有方块, 解析时按照Huffman编码处理, 顺序为Y Z X   
 *  一种可能的解析伪代码:   
 *  ```
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
 *  ```
 */
export interface IUniStructRaw {
    minecraftDataVersion: number
    meta: IUniStructMeta
    regions: {
        [key: string] : {
            blocks: IHexString
            palette: Map<IHexString, IUniBlock> 
            size: { x: number; y: number; z: number }
            position: { x: number; y: number; z: number }
        }
    }
}

export interface IUniStruct {
    minecraftDataVersion: number
    meta: IUniStructMeta
    regions: {
        [key: string] : {
            blocks: IUniBlock[][][]
            entities?: IUniEntity[]
            tileEntities?: IUniTileEntity[]
            size: { x: number; y: number; z: number }
            position: { x: number; y: number; z: number }
        }
    }
}