const fs = require("fs");
const embeddingsByWord = require("./analogy-embeddings.json");

const outputFileName = "analogy-results.json";
const categories = {
  capitals: [
    { a: "Athens", b: "Greece", c: "Oslo", expected: "Norway" },
    { a: "Warsaw", b: "Poland", c: "Paris", expected: "France" },
    { a: "Rome", b: "Italy", c: "Berlin", expected: "Germany" },
    { a: "Madrid", b: "Spain", c: "Lisbon", expected: "Portugal" },
  ],
  nationalities: [
    { a: "Germany", b: "German", c: "Spain", expected: "Spanish" },
    { a: "France", b: "French", c: "Italy", expected: "Italian" },
    { a: "Poland", b: "Polish", c: "Norway", expected: "Norwegian" },
    { a: "Switzerland", b: "Swiss", c: "Portugal", expected: "Portuguese" },
  ],
  plurals: [
    { a: "mouse", b: "mice", c: "foot", expected: "feet" },
    { a: "child", b: "children", c: "tooth", expected: "teeth" },
    { a: "goose", b: "geese", c: "dollar", expected: "dollars" },
  ],
  occupations: [
    { a: "Einstein", b: "scientist", c: "Picasso", expected: "painter" },
    { a: "Newton", b: "physicist", c: "Darwin", expected: "biologist" },
    { a: "Mozart", b: "musician", c: "Bach", expected: "composer" },
  ],
  gender: [
    { a: "man", b: "woman", c: "king", expected: "queen" },
    { a: "boy", b: "girl", c: "prince", expected: "princess" },
    { a: "father", b: "mother", c: "uncle", expected: "aunt" },
  ],
};

function dotProduct(vec1, vec2) {
  let sum = 0;
  for (let i = 0; i < vec1.length; i += 1) {
    sum += vec1[i] * vec2[i];
  }
  return sum;
}

function l2Norm(vec) {
  return Math.sqrt(dotProduct(vec, vec));
}

function normalize(vec) {
  if (!Array.isArray(vec)) {
    return null;
  }

  const norm = l2Norm(vec);
  if (norm === 0) {
    return null;
  }

  return vec.map((value) => value / norm);
}

function cosineSimilarity(vec1, vec2) {
  if (
    !Array.isArray(vec1) ||
    !Array.isArray(vec2) ||
    vec1.length !== vec2.length
  ) {
    return null;
  }

  const normalized1 = normalize(vec1);
  const normalized2 = normalize(vec2);
  if (!normalized1 || !normalized2) {
    return null;
  }

  return dotProduct(normalized1, normalized2);
}

function subtractVectors(vec1, vec2) {
  if (
    !Array.isArray(vec1) ||
    !Array.isArray(vec2) ||
    vec1.length !== vec2.length
  ) {
    return null;
  }

  return vec1.map((value, index) => value - vec2[index]);
}

function addVectors(vec1, vec2) {
  if (
    !Array.isArray(vec1) ||
    !Array.isArray(vec2) ||
    vec1.length !== vec2.length
  ) {
    return null;
  }

  return vec1.map((value, index) => value + vec2[index]);
}

function getModelSet(embeddingsByWord) {
  const modelNames = new Set();

  for (const modelMap of Object.values(embeddingsByWord)) {
    for (const modelName of Object.keys(modelMap)) {
      modelNames.add(modelName);
    }
  }

  return [...modelNames];
}

function getEmbedding(embeddingsByWord, word, modelName) {
  return embeddingsByWord[word]?.[modelName] ?? null;
}

function getModelVocabulary(embeddingsByWord, modelName) {
  const vocabulary = [];

  for (const [word, modelMap] of Object.entries(embeddingsByWord)) {
    const vector = modelMap[modelName];
    if (Array.isArray(vector)) {
      vocabulary.push({ word, vector });
    }
  }

  return vocabulary;
}

function rankCandidates(queryVector, candidates) {
  return candidates
    .map(({ word, vector }) => ({
      word,
      score: cosineSimilarity(queryVector, vector),
    }))
    .filter((item) => typeof item.score === "number")
    .sort((a, b) => b.score - a.score);
}

function evaluateAnalogyTest(embeddingsByWord, modelName, test) {
  const vecA = getEmbedding(embeddingsByWord, test.a, modelName);
  const vecB = getEmbedding(embeddingsByWord, test.b, modelName);
  const vecC = getEmbedding(embeddingsByWord, test.c, modelName);
  const vecExpected = getEmbedding(embeddingsByWord, test.expected, modelName);

  if (
    !Array.isArray(vecA) ||
    !Array.isArray(vecB) ||
    !Array.isArray(vecC) ||
    !Array.isArray(vecExpected)
  ) {
    return {
      query: `${test.a}:${test.b}::${test.c}:?`,
      expected: test.expected,
      rank: null,
      cosineExpected: null,
      hitAt1: false,
      hitAt5: false,
      hitAt10: false,
      top10: [],
      missingEmbeddings: true,
    };
  }

  const relation = subtractVectors(normalize(vecB), normalize(vecA));
  const queryRaw = addVectors(normalize(vecC), relation);
  const queryVector = normalize(queryRaw);

  if (!queryVector) {
    return {
      query: `${test.a}:${test.b}::${test.c}:?`,
      expected: test.expected,
      rank: null,
      cosineExpected: null,
      hitAt1: false,
      hitAt5: false,
      hitAt10: false,
      top10: [],
      missingEmbeddings: true,
    };
  }

  const excludedWords = new Set([test.a, test.b, test.c]);
  const candidates = getModelVocabulary(embeddingsByWord, modelName).filter(
    ({ word }) => !excludedWords.has(word),
  );

  const ranking = rankCandidates(queryVector, candidates);
  const rank = ranking.findIndex((item) => item.word === test.expected) + 1;
  const cosineExpected = cosineSimilarity(queryVector, vecExpected);

  return {
    query: `${test.a}:${test.b}::${test.c}:?`,
    expected: test.expected,
    rank: rank === 0 ? null : rank,
    cosineExpected,
    hitAt1: rank === 1,
    hitAt5: rank > 0 && rank <= 5,
    hitAt10: rank > 0 && rank <= 10,
    top10: ranking.slice(0, 10),
    missingEmbeddings: false,
  };
}

function summarizeCategory(testResults) {
  const valid = testResults.filter((test) => !test.missingEmbeddings);

  if (valid.length === 0) {
    return {
      testsCount: testResults.length,
      validTestsCount: 0,
      hitAt1: null,
      hitAt5: null,
      hitAt10: null,
      meanReciprocalRank: null,
    };
  }

  const hitAt1 = valid.filter((test) => test.hitAt1).length / valid.length;
  const hitAt5 = valid.filter((test) => test.hitAt5).length / valid.length;
  const hitAt10 = valid.filter((test) => test.hitAt10).length / valid.length;
  const mrr =
    valid
      .map((test) => (test.rank ? 1 / test.rank : 0))
      .reduce((sum, value) => sum + value, 0) / valid.length;

  return {
    testsCount: testResults.length,
    validTestsCount: valid.length,
    hitAt1,
    hitAt5,
    hitAt10,
    meanReciprocalRank: mrr,
  };
}

function evaluateCategory(embeddingsByWord, modelName, tests) {
  const testResults = tests.map((test) =>
    evaluateAnalogyTest(embeddingsByWord, modelName, test),
  );

  return {
    summary: summarizeCategory(testResults),
    tests: testResults,
  };
}

function buildResults(embeddingsByWord) {
  const models = getModelSet(embeddingsByWord);

  const output = {};

  for (const modelName of models) {
    const modelOutput = { categories: {} };

    for (const [categoryName, tests] of Object.entries(categories)) {
      modelOutput.categories[categoryName] = evaluateCategory(
        embeddingsByWord,
        modelName,
        tests,
      );
    }

    output[modelName] = modelOutput;
  }

  return output;
}

const results = buildResults(embeddingsByWord);

fs.writeFileSync(outputFileName, JSON.stringify(results, null, 2), "utf-8");
console.log(`Zapisano wyniki do ${outputFileName}`);
