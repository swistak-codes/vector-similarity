# vector-similarity

Kod do artykułu na bloga o podobieństwie wektorów.

## Użycie

### Przygotowanie środowiska

1. Zainstaluj NodeJS.
2. Sklonuj to repozytorium i przejdź do niego (`cd`).
3. Uruchom `npm install`, aby zainstalować zależności.
4. Utwórz plik `.env` z kluczem API OpenRouter:

```
API_KEY=your_openrouter_api_key
```

### Generowanie embeddingów do testu rankingów

`npm run start:generate`

Jako wynik otrzymasz pliki JSON o nazwach użytych modeli, zawierające embeddingi dla słów z testu rankingowego. Pliki są już uprzednio wygenerowane i dostępne w repozytorium, więc ten krok jest opcjonalny.

### Generowanie rezultatów testu rankingowego

`npm run start:tests`

Jako wynik otrzymasz plik `results.json` z wynikami testu rankingowego dla każdego modelu.

### Generowanie embeddingów do testu analogii

`npm run start:analogy-generate`

Jako wynik otrzymasz plik `analogy-embeddings.json` z embeddingami dla słów z testu analogii. Plik jest już uprzednio wygenerowany i dostępny w repozytorium, więc ten krok jest opcjonalny.

### Generowanie rezultatów testu analogii

`npm run start:analogy-tests`

Jako wynik otrzymasz plik `analogy-results.json` z wynikami testu analogii dla każdego modelu.