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