export default class MinHeap<T> {

  heap: { weight: number, value: T }[] = []

  constructor() {
    this.heap = [];
  }

  empty(): boolean {
    return this.heap.length === 0;
  }

  peek(): T | undefined {
    if (this.empty()) return undefined;
    return this.heap[0].value;
  }

  insert(weight: number, value: T) {
    this.heap.push({ weight: weight, value: value });

    if (this.heap.length > 0) {
      this.bubbleUp(this.heap.length - 1);
    }
  }

  pop(): T {
    let min = this.heap[0];

    if (this.heap.length === 1) {
      this.heap = [];
      return min.value;
    }

    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.splice(this.heap.length - 1);

    this.pushDown(0);

    return min.value;
  }

  private pushDown(curr: number) {
    let left = curr * 2 + 1;
    let right = curr * 2 + 2;

    while (
      this.heap[left] &&
      this.heap[right] &&
      (this.heap[curr].weight > this.heap[left].weight ||
        this.heap[curr].weight > this.heap[right].weight)) {
      if (this.heap[left].weight < this.heap[right].weight) {
        [this.heap[curr], this.heap[left]] = [this.heap[left], this.heap[curr]];
        curr = left;
      } else {
        [this.heap[curr], this.heap[right]] = [this.heap[right], this.heap[curr]];
        curr = right;
      }
      left = curr * 2 + 1;
      right = curr * 2 + 2;
    }
  }

  private bubbleUp(curr: number) {
    while (curr > 0 && this.heap[Math.floor(curr / 2)].weight > this.heap[curr].weight) {
      [this.heap[Math.floor(curr / 2)], this.heap[curr]] = [this.heap[curr], this.heap[Math.floor(curr / 2)]];
      curr = Math.floor(curr / 2);
    }
  }

}