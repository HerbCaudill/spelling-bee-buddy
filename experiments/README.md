# Hint prompt experiments

A harness for iterating on the Spelling Bee hint-generation prompt (`worker/src/hints.ts`). The loop: generate a batch of hints with a numbered prompt and a model, rate them one by one in the judge UI, write an improved prompt based on the ratings and notes, repeat.

Requires `data/nytcrosswords.csv` (NYT crossword clues 1993–2021 with dates, from the Kaggle dataset via [xd corpus research](https://xd.saul.pw)) — not checked in; see `.gitignore`.

## Files

- `prompts/NNN.txt` — numbered prompt variants; `{{words}}` is replaced with the word list. `001` is the production prompt.
- `runs/NNN.json` — generated batches with ratings. Checked in: this is the experiment record.
- `generate.ts` — samples words from the corpus, runs a prompt through `codex exec`, saves a run.
- `serve.ts` + `judge.html` — the rating UI.
- `sample-clues.ts` — browse real NYT clues (by weekday, or every clue for one word).
- `corpus.ts` — loads and filters the corpus to Spelling-Bee-plausible clue/answer pairs.

## Usage

```bash
# Generate a run: 10 sampled words, prompt 001, one of luna|terra|sol
node experiments/generate.ts --prompt 001 --model terra

# Rate it at http://localhost:8123
node experiments/serve.ts

# Browse real clues
node experiments/sample-clues.ts --days fri,sat --n 30
node experiments/sample-clues.ts --word AMALGAM
```
