require("dotenv").config();
const fs = require("fs");
const skipGramEmbeddings = require("wink-embeddings-sg-100d");

const models = [
  "google/gemini-embedding-001",
  "openai/text-embedding-3-small",
  "qwen/qwen3-embedding-8b",
  "mistralai/mistral-embed-2312",
];

const classicalModelName = "glove/wink-embeddings-sg-100d";
const outputFileName = "analogy-embeddings.json";
const classicalDimensions = skipGramEmbeddings.dimensions;

const words = [
  "king",
  "queen",
  "man",
  "woman",
  "prince",
  "princess",
  "boy",
  "girl",
  "father",
  "mother",
  "uncle",
  "aunt",
  "Athens",
  "Greece",
  "Oslo",
  "Norway",
  "Warsaw",
  "Poland",
  "Paris",
  "France",
  "Rome",
  "Italy",
  "Berlin",
  "Germany",
  "Madrid",
  "Spain",
  "Bern",
  "Switzerland",
  "Lisbon",
  "Portugal",
  "Dublin",
  "Ireland",
  "Greek",
  "Norwegian",
  "Polish",
  "French",
  "Italian",
  "German",
  "Spanish",
  "Swiss",
  "Portuguese",
  "Irish",
  "mouse",
  "mice",
  "dollar",
  "dollars",
  "foot",
  "feet",
  "child",
  "children",
  "tooth",
  "teeth",
  "goose",
  "geese",
  "Einstein",
  "scientist",
  "Newton",
  "physicist",
  "Darwin",
  "biologist",
  "Picasso",
  "painter",
  "Mozart",
  "musician",
  "Bach",
  "composer",
];

function buildBaseOutput(items) {
  return Object.fromEntries(items.map((item) => [item, {}]));
}

function getSkipGramEmbedding(text) {
  const vector = skipGramEmbeddings.vectors[text.toLowerCase()];
  if (!Array.isArray(vector)) {
    return null;
  }

  return vector.slice(0, classicalDimensions);
}

async function fetchModelEmbeddings(model, input) {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "<YOUR_SITE_URL>",
      "X-OpenRouter-Title": "<YOUR_SITE_NAME>",
    },
    body: JSON.stringify({
      model,
      input,
      encoding_format: "float",
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      `Embedding request failed for ${model}: ${JSON.stringify(payload)}`,
    );
  }

  return payload.data.map((item) => item.embedding);
}

(async () => {
  const output = buildBaseOutput(words);
  const canFetchRemote = Boolean(process.env.API_KEY);

  if (!canFetchRemote) {
    console.warn(
      "API_KEY is missing. Remote model embeddings will be stored as null.",
    );
  }

  for (const model of models) {
    if (!canFetchRemote) {
      words.forEach((word) => {
        output[word][model] = null;
      });
      continue;
    }

    try {
      console.log(`Pobieranie embeddingów z ${model}...`);
      const embeddings = await fetchModelEmbeddings(model, words);

      words.forEach((word, index) => {
        output[word][model] = embeddings[index] ?? null;
      });

      console.log(`Zebrano ${embeddings.length} embeddingów z ${model}.`);
    } catch (error) {
      console.error(`Nie udało się dla ${model}:`, error.message);
      words.forEach((word) => {
        output[word][model] = null;
      });
    }
  }

  for (const word of words) {
    output[word][classicalModelName] = getSkipGramEmbedding(word);
  }

  fs.writeFileSync(outputFileName, JSON.stringify(output, null, 2));
  console.log(`Zapisano embeddingi analogii do ${outputFileName}`);
})();
