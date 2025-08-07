import { Bitmap } from './bitmap';

// 引入 Bitmap 类型（假设它在 bitmap.ts 中定义）
import type { Bitmap } from './bitmap';

/**
 * BitmapMap 是一个使用 Bitmap 内容为键的结构相等 Map。
 * 它支持泛型值类型 V，并以 Bitmap 的十六进制表示作为键值索引。
 */
export interface IBitmapMap<V> extends Iterable<[Bitmap, V]> {
    /**
     * 添加或更新一个键值对。
     */
    set(key: Bitmap, value: V): void;

    /**
     * 获取某个键对应的值。
     */
    get(key: Bitmap): V | undefined;

    /**
     * 检查是否存在该键。
     */
    has(key: Bitmap): boolean;

    /**
     * 删除某个键值对。
     */
    delete(key: Bitmap): boolean;

    /**
     * 清空整个 Map。
     */
    clear(): void;

    /**
     * 返回当前键值对的数量。
     */
    readonly size: number;

    /**
     * 返回所有键的迭代器。
     */
    keys(): IterableIterator<Bitmap>;

    /**
     * 返回所有值的迭代器。
     */
    values(): IterableIterator<V>;

    /**
     * 返回所有键值对的迭代器。
     */
    entries(): IterableIterator<[Bitmap, V]>;

    /**
     * 遍历所有键值对。
     */
    forEach(callback: (value: V, key: Bitmap, map: BitmapMap<V>) => void): void;
}

