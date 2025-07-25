type Bit = boolean;

interface BitmapInterface extends Iterable<Bit> {
    readonly length: number;

    // 单 bit 操作
    get(index: number): Bit;
    set(index: number, value: Bit): void;
    pushBit(value: Bit): void;
    popBit(): Bit;

    // 批量操作
    setRange(start: number, end: number, value: Bit): void;
    forEachBit(fn: (bit: Bit, index: number) => void): void;
    forEachByte(fn: (byte: number, byteIndex: number) => void): void;

    // 迭代
    [Symbol.iterator](): Iterator<Bit>;

    // 序列化
    toHexString(): string;
    toBigIntArray(): bigint[];
    toString(): string;

    // 运算
    and(other: Bitmap): Bitmap;
    or(other: Bitmap): Bitmap;
    xor(other: Bitmap): Bitmap;
    invert(): Bitmap;
    concat(other: Bitmap): Bitmap;
}

declare class Bitmap implements BitmapInterface {
    constructor(bits?: number);
    static fromHexString(hex: string): Bitmap;

    readonly length: number;

    get(index: number): Bit;
    set(index: number, value: Bit): void;
    pushBit(value: Bit): void;
    popBit(): Bit;

    setRange(start: number, end: number, value: Bit): void;
    forEachBit(fn: (bit: Bit, index: number) => void): void;
    forEachByte(fn: (byte: number, byteIndex: number) => void): void;

    [Symbol.iterator](): Iterator<Bit>;

    toHexString(): string;
    toBigIntArray(): bigint[];
    toString(): string;

    and(other: Bitmap): Bitmap;
    or(other: Bitmap): Bitmap;
    xor(other: Bitmap): Bitmap;
    invert(): Bitmap;
    concat(other: Bitmap): Bitmap;
}
