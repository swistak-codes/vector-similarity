require("dotenv").config();
const fs = require("fs");

const models = [
  "google/gemini-embedding-001",
  "openai/text-embedding-3-small",
  "qwen/qwen3-embedding-8b",
  "mistralai/mistral-embed-2312",
];

const inputs = [
  "cat",
  "kitten",
  "dog",
  "puppy",
  "german shepherd",
  "animal",
  "pet",
  "lion",
  "tiger",
  "car",
  "electric car",
  "vehicle",
  "truck",
  "bicycle",
  "train",
  "apple",
  "banana",
  "orange",
  "fruit",
  "vegetable",
  "I have a cat",
  "The dog is sleeping on the sofa",
  "I bought a new electric car",
  "The train arrived at the station",
  "She is eating a banana",
  "The stock market crashed yesterday",
  "Investors are worried about inflation",
  "Quantum physics studies the behavior of particles",
  "The universe is expanding",
  "A black hole bends spacetime",
];

(async () => {
  for (const model of models) {
    try {
      console.log(`Pobieranie z ${model}...`);
      const result = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "<YOUR_SITE_URL>",
          "X-OpenRouter-Title": "<YOUR_SITE_NAME>",
        },
        body: JSON.stringify({
          model,
          input: inputs,
          encoding_format: "float",
        }),
      });

      const data = await result.json();

      const pairs = Object.fromEntries(
        data.data.map((item, idx) => [inputs[idx], item.embedding]),
      );

      const fileName = `${model.split("/").pop()}.json`;
      fs.writeFileSync(fileName, JSON.stringify(pairs));

      console.log(`Zapisano ${pairs.length} embeddings do ${fileName}`);
    } catch (err) {
      console.error(`Błąd podczas przetwarzania modelu ${model}:`, err);
    }
  }
})();
