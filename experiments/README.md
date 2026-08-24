# Hint prompt experiments

A harness for iterating on the Spelling Bee hint-generation prompt (`worker/src/hints.ts`). The loop: generate 20 hints with a numbered prompt, review them in the terminal, give Codex feedback, and repeat. Start with Sol while refining the prompt, then compare cheaper models with the same prompt and words.

Requires `data/nytcrosswords.csv` (NYT crossword clues 1993–2021 with dates, from the Kaggle dataset via [xd corpus research](https://xd.saul.pw)) — not checked in; see `.gitignore`.

## Files

- `prompts/NNN.txt` — numbered prompt variants; `{{words}}` is replaced with the word list. `001` is the production prompt.
- `runs/NNN.json` — generated batches. Checked in as the experiment record.
- `generate.ts` — samples words from the corpus, runs a prompt through `codex exec`, saves a run.
- `sample-clues.ts` — browse real NYT clues (by weekday, or every clue for one word).
- `corpus.ts` — loads and filters the corpus to Spelling-Bee-plausible clue/answer pairs.

## Usage

```bash
# Generate a run: 20 sampled words with Sol
node experiments/generate.ts --prompt 003

# Later, compare the same prompt and words with a cheaper model
node experiments/generate.ts --prompt 003 --model terra --words WORD1,WORD2,...

# Claude models use the same runner and default to high effort
node experiments/generate.ts --prompt 004 --model fable --words WORD1,WORD2,...
node experiments/generate.ts --prompt 004 --model opus --words WORD1,WORD2,...

# Compare reasoning levels
node experiments/generate.ts --prompt 004 --model opus --effort low --words WORD1,WORD2,...
node experiments/generate.ts --prompt 004 --model luna --effort xhigh --words WORD1,WORD2,...

# Browse real clues
node experiments/sample-clues.ts --days fri,sat --n 30
node experiments/sample-clues.ts --word AMALGAM
```
