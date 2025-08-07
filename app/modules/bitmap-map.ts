//utils/.bitmap-map.ts
//你先别管这个名字
//为了解决Map中直接用bitmap做键可能导致引用比较的问题, 这是一个特化的Map, 使用值比较
import Bitmap  from './bitmap';

export default class BitmapMap<V> {
    private map = new Map<string, V>();
    private keyMap = new Map<string, Bitmap>(); // 保存原始 Bitmap 键

    private keyToHash(key: Bitmap): string {
        return key.hash(); // hash -> toHexString 
    }

    set(key: Bitmap, value: V): void {
        const hash = this.keyToHash(key);
        this.map.set(hash, value);
        this.keyMap.set(hash, key);
    }

    get(key: Bitmap): V | undefined {
        return this.map.get(this.keyToHash(key));
    }

    has(key: Bitmap): boolean {
        return this.map.has(this.keyToHash(key));
    }

    delete(key: Bitmap): boolean {
        const hash = this.keyToHash(key);
        this.keyMap.delete(hash);
        return this.map.delete(hash);
    }

    clear(): void {
        this.map.clear();
        this.keyMap.clear();
    }

    get size(): number {
        return this.map.size;
    }

    keys(): IterableIterator<Bitmap> {
        return this.keyMap.values();
    }

    values(): IterableIterator<V> {
        return this.map.values();
    }

    entries(): IterableIterator<[Bitmap, V]> {
        const keyMap = this.keyMap;
        const map = this.map;
        return (function* () {
            for (const [hash, value] of map.entries()) {
                yield [keyMap.get(hash)!, value] as [Bitmap, V];
            }
        })();
    }

    [Symbol.iterator](): IterableIterator<[Bitmap, V]> {
        return this.entries();
    }

    forEach(callback: (value: V, key: Bitmap, map: BitmapMap<V>) => void): void {
        for (const [key, value] of this.entries()) {
            callback(value, key, this);
        }
    }
}
