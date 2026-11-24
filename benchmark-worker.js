importScripts('algorithms.js');
self.onmessage = async ({data}) => {
  try { self.postMessage({ok: true, result: await MenuAlgorithms.runBenchmark(data)}); }
  catch (error) { self.postMessage({ok: false, error: error.message}); }
};
