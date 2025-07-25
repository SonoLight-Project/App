import { IBitmapInterface } from '~/types/bitmap' 

/* 
* Bitmap 使用Uint8Array模拟
*/
export default class Bitmap implements IBitmapInterface {
    private data: Uint8Array;
    private _length: number = 0;

    /**
     * 构造函数
     * @param bits 位数，默认为0
     */
    constructor(bits: number = 0) {
        const size = Math.ceil(bits / 8);
        this.data = new Uint8Array(size);
        this._length = bits;
    }

    /**
     * 从16进制字符串初始化bitmap
     * @param hex 16进制字符串
     * @returns bitmap自身
     */
    static fromHexString(hex: string): Bitmap {
        if (hex.startsWith('0x')) hex = hex.slice(2);
        const bytes = new Uint8Array(Math.ceil(hex.length / 2));
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        const bitmap = new Bitmap(bytes.length * 8);
        bitmap.data = bytes;
        return bitmap;
    }
    /**
     * 导出为16进制字符串
     * @returns 16进制字符串
     */
    toHexString(): string {
        return [...this.data]
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }
    /**
     * 导出为bigint数组
     * @returns bigInt数组
     */
    toBigIntArray(): bigint[] {
        const result: bigint[] = [];
        for (let i = 0; i < this.data.length; i += 8) {
            let value = 0n;
            for (let j = 0; j < 8; j++) {
                if (i + j < this.data.length) {
                    value |= BigInt(this.data[i + j] ?? 0b0) << BigInt(8 * j);
                }
            }
            result.push(value);
        }
        return result;
    }


    get length(): number {
        return this._length;
    }

    equals(other: Bitmap): boolean {
        if (this.length !== other.length) return false;
        for (let i = 0; i < this.length; i++) {
            if (this.get(i) !== other.get(i)) return false;
        }
        return true;
    }

    hash(): string {
        return this.toHexString(); // 或者 Base64、SHA1 等
    }

    /**
     * 扩容bitmap
     * @param bits 位数
     */
    private ensureCapacity(bits: number) {
        const needed = Math.ceil(bits / 8);
        if (needed > this.data.length) {
            const newData = new Uint8Array(needed * 2);
            newData.set(this.data);
            this.data = newData;
        }
    }

    /**
     * 设置位
     * @param index 索引
     * @param value 值
     */
    set(index: number, value: boolean): void {
        if (index < 0) throw new RangeError('Index must be non-negative');
        this.ensureCapacity(index + 1);
        if (value) {
            //@ts-ignore
            this.data[index >> 3] |= 1 << (index & 7);
            // 定位后按位或来添加
        } else {
            //@ts-ignore
            this.data[index >> 3] &= ~(1 << (index & 7));
            //定位后按位与一个反码来删除
        }
        if (index >= this._length) this._length = index + 1;
    }

    /**
     * get
     * @param index 索引
     * @returns bit(boolen)
     */
    get(index: number): boolean {
        if (index < 0 || index >= this._length) return false;
        // @ts-ignore
        return (this.data[index >> 3] & (1 << (index & 7))) !== 0;
        // index >> 3 取整除以8, 定位bit所在的U8int，再(对8取模后)与掩码与, 判断第index位是否为1
        // 相当于this.data[Math.floor(index / 8)] & (1 << (index % 8))
    }

    pushBit(value: boolean): void {
        this.set(this._length, value);
    }

    popBit(): boolean {
        if (this._length === 0) throw new RangeError('Cannot pop from empty bitmap');
        const last = this.get(this._length - 1);
        this._length--;
        return last;
    }

    [Symbol.iterator](): Iterator<boolean> {
        let index = 0;
        return {
            next: (): IteratorResult<boolean> => {
                if (index >= this._length) return { done: true, value: false };
                const value = this.get(index);
                index++;
                return { value, done: false };
            },
        };
    }

    forEachBit(fn: (bit: boolean, index: number) => void) {
        for (let i = 0; i < this._length; i++) {
            fn(this.get(i), i);
        }
    }

    forEachByte(fn: (byte: number, byteIndex: number) => void) {
        const byteLength = Math.ceil(this._length / 8);
        for (let i = 0; i < byteLength; i++) {
            fn(this.data[i] ?? 0b0, i);
        }
    }

    concat(other: Bitmap): Bitmap {
        const result = new Bitmap(this._length + other.length);
        for (let i = 0; i < this._length; i++) {
            result.set(i, this.get(i));
        }
        for (let i = 0; i < other.length; i++) {
            result.set(this._length + i, other.get(i));
        }
        return result;
    }

    toString(): string {
        return [...this].map(bit => (bit ? '1' : '0')).join('');
    }

    // 位运算（按位与）
    and(other: Bitmap): Bitmap {
        const minLen = Math.min(this._length, other._length);
        const result = new Bitmap(minLen);
        for (let i = 0; i < minLen; i++) {
            result.set(i, this.get(i) && other.get(i));
        }
        return result;
    }

    // 位运算（按位或）
    or(other: Bitmap): Bitmap {
        const maxLen = Math.max(this._length, other._length);
        const result = new Bitmap(maxLen);
        for (let i = 0; i < maxLen; i++) {
            result.set(i, this.get(i) || other.get(i));
        }
        return result;
    }

    // 位运算（按位异或）
    xor(other: Bitmap): Bitmap {
        const maxLen = Math.max(this._length, other._length);
        const result = new Bitmap(maxLen);
        for (let i = 0; i < maxLen; i++) {
            result.set(i, this.get(i) !== other.get(i));
        }
        return result;
    }

    // 批量设置位范围（包括 start，不包括 end）
    setRange(start: number, end: number, value: boolean): void {
        if (start < 0 || end < start) throw new RangeError('Invalid range');
        this.ensureCapacity(end);
        for (let i = start; i < end; i++) {
            this.set(i, value);
        }
    }

    // 反转位
    invert(): Bitmap {
        const result = new Bitmap(this._length);
        for (let i = 0; i < this._length; i++) {
            result.set(i, !this.get(i));
        }
        return result;
    }

}
