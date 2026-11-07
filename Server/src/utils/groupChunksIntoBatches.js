export const groupChunksIntoBatches = (chunks, batchSize = 5) => {
  const batches = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    batches.push(chunks.slice(i, i + batchSize));
  }
  return batches;
};