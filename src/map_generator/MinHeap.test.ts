import MinHeap from './MinHeap';

test('MinHeap', () => {
  const h = new MinHeap<number>();
  h.insert(5, 0);
  expect(h.peek()).toBe(0);
  h.insert(6, 1);
  expect(h.peek()).toBe(0);
  h.insert(7, 2);
  expect(h.peek()).toBe(0);
  h.insert(2, 3);
  expect(h.peek()).toBe(3);
  h.insert(3, 4);
  expect(h.peek()).toBe(3);

  expect(h.pop()).toBe(3);
  expect(h.peek()).toBe(4);
  expect(h.pop()).toBe(4);
  h.insert(4, 5);
  expect(h.peek()).toBe(5);
})