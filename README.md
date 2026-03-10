# vector-similarity

Kod do artykułu na bloga o podobieństwie wektorów.

## Użycie

1. Zainstaluj NodeJS.
2. Sklonuj to repozytorium i przejdź do niego (`cd`).
3. Uruchom `npm install`, aby zainstalować zależności.
4. Utwórz plik `.env` z kluczem API OpenRouter:

```
API_KEY=your_openrouter_api_key
```

5. (opcjonalnie) Uruchom `npm run start:generate`, aby wygenerować embeddings dla przykładowych danych wejściowych. Spowoduje to utworzenie plików JSON z embeddings.
6. Uruchom `npm run start:tests`, aby uruchomić testy podobieństwa. Wyniki zostaną zapisane do `results.json`.