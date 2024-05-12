/**https://juejin.cn/post/6945437607983595534 */

export default class Queue<T> {
    private count: number;
    private lowestCount: number;
    private items: Map<number, T>;

    constructor() {
        this.count = 0;
        this.lowestCount = 0;
        this.items = new Map();
    }

    enqueue(element: T): void {
        this.items.set(this.count, element);
        this.count++;
    }

    dequeue(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }
        const result: T | undefined = this.items.get(this.lowestCount);
        this.items.delete(this.lowestCount);
        this.lowestCount++;
        return result;
    }

    peek(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items.get(this.lowestCount);
    }

    isEmpty(): boolean {
        return this.items.size === 0;
    }

    clear(): void {
        this.items = new Map();
        this.count = 0;
        this.lowestCount = 0;
    }

    size(): number {
        return this.items.size;
    }

    toString(): string {
        if (this.isEmpty()) {
            return '';
        }
        let objString: string = `${this.items.get(this.lowestCount)}`;
        for (let i = this.lowestCount + 1; i < this.count; i++) {
            objString = `${objString},${this.items.get(i)}`;
        }
        return objString;
    }
}