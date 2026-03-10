const gemini = require("./gemini-embedding-001.json");
const qwen = require("./qwen3-embedding-8b.json");
const mistral = require("./mistral-embed-2312.json");
const openai = require("./text-embedding-3-small.json");

const models = {
  gemini,
  qwen,
  mistral,
  openai,
};

function euclideanDistance(vec1, vec2) {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.pow(vec1[i] - vec2[i], 2);
  }
  return Math.sqrt(sum);
}

function manhattanDistance(vec1, vec2) {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.abs(vec1[i] - vec2[i]);
  }
  return sum;
}

function cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += Math.pow(vec1[i], 2);
    normB += Math.pow(vec2[i], 2);
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function dotProduct(vec1, vec2) {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += vec1[i] * vec2[i];
  }
  return sum;
}

function rankSimilarities(query, embeddings) {
  const words = Object.keys(embeddings);
  const qVec = embeddings[query];

  const results = words
    .filter((w) => w !== query)
    .map((word) => {
      const wVec = embeddings[word];
      return {
        word,
        euclid: euclideanDistance(qVec, wVec),
        manhattan: manhattanDistance(qVec, wVec),
        cosine: cosineSimilarity(qVec, wVec),
        dotProduct: dotProduct(qVec, wVec),
      };
    });

  const euclidSorted = results
    .toSorted((a, b) => a.euclid - b.euclid)
    .map((r) => [r.word, r.euclid]);
  const manhattanSorted = results
    .toSorted((a, b) => a.manhattan - b.manhattan)
    .map((r) => [r.word, r.manhattan]);
  const cosineSorted = results
    .toSorted((a, b) => b.cosine - a.cosine)
    .map((r) => [r.word, r.cosine]);
  const dotProductSorted = results
    .toSorted((a, b) => b.dotProduct - a.dotProduct)
    .map((r) => [r.word, r.dotProduct]);

  return {
    euclid: euclidSorted,
    manhattan: manhattanSorted,
    cosine: cosineSorted,
    dotProduct: dotProductSorted,
  };
}

const fs = require("fs");

const output = {};

for (const [modelName, emb] of Object.entries(models)) {
  const words = Object.keys(emb);
  for (const q of words) {
    if (!output[q]) output[q] = {};
    if (!output[q][modelName]) output[q][modelName] = {};

    const distances = rankSimilarities(q, emb);
    output[q][modelName].euclid = distances.euclid;
    output[q][modelName].manhattan = distances.manhattan;
    output[q][modelName].cosine = distances.cosine;
    output[q][modelName].dotProduct = distances.dotProduct;
  }
}

fs.writeFileSync("results.json", JSON.stringify(output, null, 2), "utf-8");
console.log("Wyniki zapisane w results.json");
