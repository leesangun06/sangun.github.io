/* 직접 구현한 정렬 함수. Array.prototype.sort는 정렬 알고리즘에 사용하지 않습니다. */
(function (scope) {
  'use strict';
  function mergeSort(array, compare) {
    const n = array.length;
    let source = array, target = new Array(n);
    for (let width = 1; width < n; width *= 2) {
      for (let start = 0; start < n; start += width * 2) {
        const mid = Math.min(start + width, n), end = Math.min(start + width * 2, n);
        let left = start, right = mid;
        for (let out = start; out < end; out++) {
          if (left < mid && (right >= end || compare(source[left], source[right]) <= 0)) target[out] = source[left++];
          else target[out] = source[right++];
        }
      }
      [source, target] = [target, source];
    }
    if (source !== array) for (let i = 0; i < n; i++) array[i] = source[i];
    return array;
  }
  function quickSort(array, compare) {
    const stack = [[0, array.length - 1]];
    while (stack.length) {
      let [lo, hi] = stack.pop();
      while (lo < hi) {
        const pivot = array[lo + Math.floor((hi - lo) / 2)];
        let lt = lo, i = lo, gt = hi;
        while (i <= gt) {
          const c = compare(array[i], pivot);
          if (c < 0) { [array[lt], array[i]] = [array[i], array[lt]]; lt++; i++; }
          else if (c > 0) { [array[i], array[gt]] = [array[gt], array[i]]; gt--; }
          else i++;
        }
        // 큰 구간을 스택에 보관하고 작은 구간을 즉시 처리합니다.
        if (lt - lo < hi - gt) { if (gt + 1 < hi) stack.push([gt + 1, hi]); hi = lt - 1; }
        else { if (lo < lt - 1) stack.push([lo, lt - 1]); lo = gt + 1; }
      }
    }
    return array;
  }
  function makeComparator(order) {
    const collator = new Intl.Collator('ko');
    return (a, b) => (order === 'name' ? collator.compare(a.name, b.name) : a.rank - b.rank) || a.id - b.id;
  }
  function createInput(menus, size, seed) {
    const input = Array.from({length: size}, (_, i) => ({...menus[i % menus.length], id: i}));
    let state = seed >>> 0;
    function random() { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    for (let i = input.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [input[i], input[j]] = [input[j], input[i]]; }
    return input;
  }
  function isSorted(array, compare) { for (let i = 1; i < array.length; i++) if (compare(array[i - 1], array[i]) > 0) return false; return true; }
  async function runBenchmark({menus, size, order, seed}) {
    const input = createInput(menus, size, seed), compare = makeComparator(order);
    const algorithms = {merge: mergeSort, quick: quickSort}, samples = {merge: [], quick: []};
    const batch = Math.max(1, Math.min(1000, Math.floor(16000 / size)));
    for (let warm = 0; warm < 3; warm++) for (const fn of Object.values(algorithms)) fn(input.slice(), compare);
    for (let round = 0; round < 9; round++) {
      for (const key of round % 2 ? ['quick', 'merge'] : ['merge', 'quick']) {
        const copies = Array.from({length: batch}, () => input.slice());
        const start = performance.now();
        for (const copy of copies) algorithms[key](copy, compare);
        samples[key].push((performance.now() - start) / batch);
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    const result = {size, order, seed, batch, rounds: 9, results: {}};
    let previous;
    for (const key of ['merge', 'quick']) {
      let comparisons = 0;
      const sorted = algorithms[key](input.slice(), (a, b) => { comparisons++; return compare(a, b); });
      if (!isSorted(sorted, compare) || sorted.length !== input.length) throw new Error('정렬 검증 실패');
      if (previous && sorted.some((item, i) => item.id !== previous[i].id)) throw new Error('두 알고리즘의 결과가 다릅니다.');
      previous = sorted;
      const ordered = mergeSort(samples[key].slice(), (a, b) => a - b);
      result.results[key] = {ms: ordered[4], comparisons, samples: samples[key]};
    }
    return result;
  }
  const api = {mergeSort, quickSort, makeComparator, createInput, isSorted, runBenchmark};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.MenuAlgorithms = api;
})(typeof self !== 'undefined' ? self : globalThis);
