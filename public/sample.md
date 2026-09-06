# ngx-kanban-board

[![npm version](https://img.shields.io/npm/v/ngx-kanban-board)](https://www.npmjs.com/package/ngx-kanban-board)
[![CI](https://github.com/qwertymuzaffar/ngx-kanban-board/actions/workflows/ci.yml/badge.svg)](https://github.com/qwertymuzaffar/ngx-kanban-board/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/ngx-kanban-board)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-%3E%3D19-dd0031)](https://angular.dev)

**[Live Storybook demo](https://qwertymuzaffar.github.io/ngx-kanban-board/)**

Drag-and-drop kanban board component for Angular - built on Angular CDK, with a signals-based API, WIP limits, and CSS-custom-property theming. Zero dependencies beyond `@angular/cdk`.

## Features

- **Drag & drop** across and within columns (Angular CDK `DropListGroup`)
- **WIP limits** - columns highlight and badge in red when over their `wipLimit`
- **Signals API** - `input()`/`output()` based, `OnPush`, works controlled or uncontrolled
- **Themeable** - every color and radius is a `--nkb-*` CSS custom property (dark theme = a few variables)
- **Tested & documented** - 95%+ unit-test coverage, Storybook stories for every state

## Install

```bash
npm install ngx-kanban-board @angular/cdk
```

## Usage

```ts
import { KanbanBoardComponent, KanbanColumn, CardMovedEvent } from 'ngx-kanban-board';

@Component({
  imports: [KanbanBoardComponent],
  template: `<ngx-kanban-board [columns]="columns" (cardMoved)="persist($event)" />`,
})
export class BoardPage {
  columns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', cards: [{ id: '1', title: 'First task' }] },
    { id: 'doing', title: 'Doing', wipLimit: 3, cards: [] },
    { id: 'done', title: 'Done', cards: [] },
  ];

  persist(e: CardMovedEvent) { /* e.card, e.fromColumnId, e.toColumnId, e.toIndex */ }
}
```

## API

### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `columns` | `KanbanColumn[]` | required | Board model; mutated in place on drop |
| `disabled` | `boolean` | `false` | Read-only board (dragging and editing off) |
| `showAddColumn` | `boolean` | `false` | Ghost "+ Add column" button after the last column |
| `editableTitles` | `boolean` | `false` | Inline column renaming (double-click or Enter on a title) |
| `showAddCard` | `boolean` | `false` | "+ Add card" composer at the foot of each column |

### Outputs

| Output | Payload | Fires |
|---|---|---|
| `cardMoved` | `CardMovedEvent` | After any drop (reorder or transfer) |
| `cardClicked` | `KanbanCard` | Card click |
| `columnsChange` | `KanbanColumn[]` | After any drop or rename, with the updated model |
| `addColumnRequested` | `void` | Add-column button clicked - you create the column |
| `columnRenamed` | `ColumnRenamedEvent` | Inline rename committed (`columnId`, `title`, `previousTitle`) |
| `cardAdded` | `CardAddedEvent` | Composer committed (`card`, `columnId`) - the board created the card |

### Managing columns

The board treats `columns` as its working model - column CRUD lives in your
app, so persistence, permissions, and confirmation flows stay yours:

```ts
// respond to the built-in add button (showAddColumn)
onAddColumn() {
  this.columns.push({ id: crypto.randomUUID(), title: 'New column', cards: [] });
}

// rename from code (or let editableTitles handle it inline)
rename(id: string, title: string) {
  this.columns = this.columns.map(c => (c.id === id ? { ...c, title } : c));
}

// remove a column - decide what happens to its cards
remove(id: string) {
  const dying = this.columns.find(c => c.id === id);
  this.columns.find(c => c.id !== id)?.cards.push(...(dying?.cards ?? []));
  this.columns = this.columns.filter(c => c.id !== id);
}
```

### Adding cards

Cards are different: with `showAddCard`, each column gets a Trello-style
inline composer (click "+ Add card", type a title, Enter adds and keeps the
composer open, Escape closes). The board creates the card itself with a
generated id and reports it via `cardAdded` - swap in your own id there if
you persist to a backend:

```ts
onCardAdded({ card, columnId }: CardAddedEvent) {
  this.api.createCard(columnId, card.title).subscribe(saved => (card.id = saved.id));
}
```

### Theming

Override CSS custom properties on the host or any ancestor:

```css
ngx-kanban-board {
  --nkb-bg: #0f172a;
  --nkb-column-bg: #1e293b;
  --nkb-card-bg: #273449;
  --nkb-ink: #e2e8f0;
  --nkb-accent: #38bdf8;
}
```

Full list in `kanban-board.component.scss`.

## Development

```bash
npm start                          # demo app
ng test ngx-kanban-board           # unit tests (vitest)
ng run demo:storybook              # storybook
```

Requires Node 22+ and Angular 19+.

## License

MIT


# ngx-diff-viewer

[![npm version](https://img.shields.io/npm/v/ngx-diff-viewer)](https://www.npmjs.com/package/ngx-diff-viewer)
[![CI](https://github.com/qwertymuzaffar/ngx-diff-viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/qwertymuzaffar/ngx-diff-viewer/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/ngx-diff-viewer)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-%3E%3D19-dd0031)](https://angular.dev)

**[Live Storybook demo](https://qwertymuzaffar.github.io/ngx-diff-viewer/)**

Text diff viewer component for Angular - side-by-side and inline modes with a built-in LCS line diff. Zero runtime dependencies, themeable via CSS custom properties.

## Features

- **Built-in diff** - classic LCS line diff computed from `oldText`/`newText`; no external diff library
- **Two modes** - GitHub-style `side-by-side` (change blocks aligned into rows) and unified `inline` with +/- gutters
- **Stats header** - +additions / -deletions, optional (`hideHeader`)
- **Signals API** - `input()` based, `OnPush`, recomputes on any input change
- **Themeable** - all colors/fonts are `--ndv-*` CSS custom properties (dark theme included in Storybook)
- **Tested** - 100% statement coverage on the diff engine and component

## Install

```bash
npm install ngx-diff-viewer
```

## Usage

```ts
import { DiffViewerComponent } from 'ngx-diff-viewer';

@Component({
  imports: [DiffViewerComponent],
  template: `
    <ngx-diff-viewer
      [oldText]="before"
      [newText]="after"
      mode="side-by-side"
      oldLabel="v1.ts"
      newLabel="v2.ts"
    />`,
})
export class ReviewPage {
  before = 'line 1\nline 2';
  after = 'line 1\nline 2 changed';
}
```

The diff engine is also exported standalone:

```ts
import { diffLines, diffStats, toSideBySide } from 'ngx-diff-viewer';

const lines = diffLines(before, after);   // DiffLine[] with ops + line numbers
const stats = diffStats(lines);           // { additions, deletions, unchanged }
```

## API

### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `oldText` | `string` | required | Left/original text |
| `newText` | `string` | required | Right/updated text |
| `mode` | `'side-by-side' \| 'inline'` | `'side-by-side'` | View mode |
| `oldLabel` / `newLabel` | `string` | `before` / `after` | Header labels |
| `hideHeader` | `boolean` | `false` | Hide the labels/stats bar |

### Theming

```css
ngx-diff-viewer {
  --ndv-bg: #0d1117;
  --ndv-ink: #c9d1d9;
  --ndv-add-bg: #12261e;
  --ndv-del-bg: #2d1215;
}
```

Full list in `diff-viewer.component.scss`.

## Development

```bash
npm start                        # demo app
ng test ngx-diff-viewer          # unit tests (vitest)
ng run demo:storybook            # storybook
```

Requires Node 22+ and Angular 19+.

## License

MIT


# ngx-transformers

[![npm version](https://img.shields.io/npm/v/ngx-transformers)](https://www.npmjs.com/package/ngx-transformers)
[![CI](https://github.com/qwertymuzaffar/ngx-transformers/actions/workflows/ci.yml/badge.svg)](https://github.com/qwertymuzaffar/ngx-transformers/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Run Hugging Face [Transformers.js](https://github.com/huggingface/transformers.js) models in Angular - **on-device ML with a signals API**. Text classification, sentence embeddings, semantic search, and Whisper speech-to-text that execute entirely in the browser: no server, no API key, works offline once the model is cached.

**[Live demo (Storybook)](https://qwertymuzaffar.github.io/ngx-transformers/)** - loads real models in your browser.

## Why

Transformers.js has a React tutorial and hooks ecosystem - Angular has nothing. This library closes that gap with idiomatic Angular: lazily-loaded pipelines wrapped in signals, DI-friendly configuration, automatic cleanup with the owning component, and a drop-in progress component for the model download.

## Install

```bash
npm i ngx-transformers @huggingface/transformers
```

`@huggingface/transformers` (v4) is a peer dependency. Angular >= 22.

## Quick start

```ts
import { Component, signal } from '@angular/core';
import { createTextClassifier, ModelProgressComponent } from 'ngx-transformers';

@Component({
  imports: [ModelProgressComponent],
  template: `
    <textarea #box></textarea>
    <button (click)="analyze(box.value)" [disabled]="classifier.busy()">Analyze</button>
    <ngx-model-progress [status]="classifier.status()" [progress]="classifier.progress()" />
    @if (label(); as l) { <strong>{{ l }}</strong> }
  `,
})
export class SentimentComponent {
  readonly classifier = createTextClassifier(); // no download yet - lazy
  readonly label = signal<string | null>(null);

  async analyze(text: string) {
    const [top] = await this.classifier.classify(text); // downloads model on first call
    this.label.set(`${top.label} ${(top.score * 100).toFixed(1)}%`);
  }
}
```

The model downloads on the first `classify()` call (with progress reported through the `progress` signal), is cached by the browser, and is disposed automatically when the component is destroyed.

## Semantic search

```ts
import { createTextEmbedder } from 'ngx-transformers';

readonly embedder = createTextEmbedder(); // all-MiniLM-L6-v2, ~23 MB q8

const ranked = await this.embedder.rank('how do I make my app faster?', docs);
// [{ text: 'Use trackBy and virtual scrolling...', score: 0.28, index: 2 }, ...]

const score = await this.embedder.similarity('car', 'automobile'); // ~0.8
const vectors = await this.embedder.embed(['one', 'two']); // number[][]
```

## Speech to text (v0.2)

Whisper, fully in the browser - the audio never leaves the device:

```ts
import { createMicRecorder, createSpeechRecognizer } from 'ngx-transformers';

readonly whisper = createSpeechRecognizer(); // whisper-tiny.en, ~41 MB q4
readonly mic = createMicRecorder();

// a URL, File/Blob, ArrayBuffer, or 16 kHz Float32Array:
const { text, chunks } = await this.whisper.transcribe(fileOrUrl, { returnTimestamps: true });

// dictation:
async toggle() {
  if (this.mic.recording()) {
    const audio = await this.mic.stop();            // encoded Blob
    const { text } = await this.whisper.transcribe(audio); // decoded + resampled for you
  } else {
    await this.mic.start();                          // asks for mic permission
  }
}
```

`MicRecorder` exposes `recording`, `seconds`, and `error` signals for the UI. `decodeAudio(blob)` is exported separately if you want the 16 kHz mono `Float32Array` yourself.

> Note: the recognizer defaults to `dtype: 'q4'` - q8 Whisper decoders currently fail on the v4 WASM runtime ([transformers.js#1707](https://github.com/huggingface/transformers.js/issues/1707)). Multilingual checkpoints (e.g. `onnx-community/whisper-tiny`) accept `language` and `task: 'translate'` options.

## Any pipeline

`createPipeline()` exposes the full Transformers.js task surface with the same signal lifecycle:

```ts
import { createPipeline } from 'ngx-transformers';

readonly summarizer = createPipeline<string, { summary_text: string }[]>({
  task: 'summarization',
  model: 'Xenova/distilbart-cnn-6-6',
});

const [out] = await this.summarizer.run(longText);
```

## Global configuration

```ts
import { provideTransformers } from 'ngx-transformers';

bootstrapApplication(App, {
  providers: [provideTransformers({ device: 'webgpu', dtype: 'q8' })],
});
```

Per-pipeline `device`/`dtype`/`options` win over the global config.

## API

### Handles

| Export | What it is |
|---|---|
| `createPipeline(request)` | Generic `PipelineHandle` for any Transformers.js task |
| `createTextClassifier(options?)` | `TextClassifier` - sentiment/classification, `classify(text, topK?)` |
| `createTextEmbedder(options?)` | `TextEmbedder` - `embed()`, `similarity()`, `rank()` |
| `createSpeechRecognizer(options?)` | `SpeechRecognizer` - `transcribe(audio, options?)` with timestamps |
| `createMicRecorder(deps?)` | `MicRecorder` - mic capture with `recording`/`seconds`/`error` signals |
| `cosineSimilarity(a, b)` / `decodeAudio(blob)` | Standalone helpers |

All `create*` functions must run in an injection context (field initializer, constructor, or `runInInjectionContext`); handles are disposed with the surrounding component.

### PipelineHandle signals

| Signal | Type | Meaning |
|---|---|---|
| `status` | `'idle' \| 'loading' \| 'ready' \| 'busy' \| 'error'` | Lifecycle; `error` only from a failed load, retryable |
| `progress` | `ModelProgress \| null` | Download progress: `file`, `progress` (0-100), bytes |
| `error` | `unknown` | The load error, if any |
| `ready` / `busy` | `boolean` (computed) | Convenience for buttons and spinners |

### `<ngx-model-progress>`

Status line + download bar for any handle. Inputs: `status` (required), `progress`, `labels` (override per-status text). Themeable via `--nt-accent`, `--nt-ink`, `--nt-muted`, `--nt-track`.

## Default models

| Wrapper | Model | Size (q8) | License |
|---|---|---|---|
| `createTextClassifier` | [Xenova/distilbert-base-uncased-finetuned-sst-2-english](https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-sst-2-english) | ~65 MB | Apache-2.0 |
| `createTextEmbedder` | [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) | ~23 MB | Apache-2.0 |
| `createSpeechRecognizer` | [onnx-community/whisper-tiny.en](https://huggingface.co/onnx-community/whisper-tiny.en) | ~41 MB (q4) | Apache-2.0 |

Swap any compatible checkpoint via `{ model: '...' }`. Check the license of the model you ship.

## SSR

Model loading is browser-only (WASM/WebGPU). Creating handles is safe on the server - nothing downloads until `load()`/`run()` - but call those only in browser code paths.

## Roadmap

- Zero-shot classification and translation wrappers
- WebGPU feature-detection helper

## License

MIT (c) Muzaffar Qosimov


# chunklet

[![npm version](https://img.shields.io/npm/v/chunklet)](https://www.npmjs.com/package/chunklet)
[![CI](https://github.com/qwertymuzaffar/chunklet/actions/workflows/ci.yml/badge.svg)](https://github.com/qwertymuzaffar/chunklet/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Token-aware, structure-aware text chunking for RAG pipelines - **zero dependencies**, runs in Node, browsers, and edge runtimes.

Two ideas define it. **Exact source offsets**: every chunk guarantees

```ts
chunk.text === source.slice(chunk.start, chunk.end)
```

so you can highlight citations, deep-link retrieval hits, or store embeddings without storing text. And **structure awareness**: chunks respect the document - markdown sections with heading breadcrumbs, whole sentences, atomic code fences - and a word is never cut in half unless a single word exceeds the budget.

## Install

```bash
npm i chunklet
```

## Quick start

```ts
import { chunkText } from 'chunklet';

const source = await fs.readFile('handbook.txt', 'utf8');
const chunks = chunkText(source, { maxTokens: 512, overlap: 64 });

for (const chunk of chunks) {
  console.log(chunk.index, chunk.tokens, `[${chunk.start}-${chunk.end}]`);
  console.log(chunk.text.slice(0, 60) + '...');
}
```

Every chunk is:

```ts
{
  text: string;    // exactly source.slice(start, end)
  start: number;   // character offset, inclusive
  end: number;     // character offset, exclusive
  tokens: number;  // per the active tokenizer
  index: number;   // 0-based position
  meta?: { headings?: string[] }; // markdown mode
}
```

### How the splitting works

`chunkText` splits hierarchically: paragraphs (`\n\n`) first, then lines, then sentences, then words - and only descends a level when a piece is still over the token budget. The resulting pieces are packed back together greedily up to `maxTokens`. The effect: chunks end at the most natural boundary available, and a mid-word cut can only happen when a single word alone exceeds the budget.

Chunk edges are whitespace-trimmed *with the offsets adjusted*, so the slice invariant always holds - the text is never normalized, joined with synthetic separators, or otherwise rewritten.

### Overlap

`overlap` repeats trailing context at the start of the next chunk, which softens the "answer was split across two chunks" failure mode of retrieval:

```ts
const chunks = chunkText(source, { maxTokens: 512, overlap: 64 });
// chunk 3 begins with the last ~64 tokens of chunk 2
```

Overlap is honored even when the previous chunk ends in one long piece - chunklet takes a suffix of it rather than silently skipping the overlap.

## Sentence mode

```ts
import { chunkSentences } from 'chunklet';

const chunks = chunkSentences(article, { maxTokens: 256 });
```

Whole sentences are packed into the budget, so a chunk never ends mid-sentence (unless a single sentence is itself over budget - then it degrades to word splitting). Boundaries come from `Intl.Segmenter`, which handles abbreviations like "Mr. Smith" and locale rules correctly; a regex fallback covers runtimes without it.

Use this over `chunkText` when your chunks are small (embedding models with short context, tweet-sized snippets) and a dangling half-sentence would hurt embedding quality.

## Markdown mode

```ts
import { chunkMarkdown } from 'chunklet';

const chunks = chunkMarkdown(readme, { maxTokens: 512 });

chunks[4].text;           // "## Install\n\nRun the installer..."
chunks[4].meta?.headings; // ['Guide', 'Install']
```

What it does differently:

- **Sections follow the headings.** A chunk never crosses an ATX heading (`#` through `######`), so retrieval hits map cleanly to document sections.
- **Every chunk knows where it lives.** `meta.headings` is the breadcrumb of enclosing headings, outermost first. Content before the first heading gets `[]`.
- **Code fences are atomic.** A fenced block is never merged mid-fence with prose, and only split internally (line by line) when the fence alone exceeds the budget.

## Recipes

### RAG ingestion

```ts
import { chunkMarkdown } from 'chunklet';

const chunks = chunkMarkdown(doc, { maxTokens: 400, overlap: 40 });

for (const chunk of chunks) {
  // prepend the breadcrumb - cheap and measurably better retrieval
  const context = chunk.meta?.headings?.length
    ? chunk.meta.headings.join(' > ') + '\n\n' + chunk.text
    : chunk.text;

  await db.insert({
    id: `${docId}#${chunk.index}`,
    embedding: await embed(context),
    start: chunk.start, // store offsets, not text
    end: chunk.end,
  });
}
```

### Citation highlighting

Because offsets are exact, mapping a retrieval hit back onto the original document is a slice, not a fuzzy search:

```ts
const hit = results[0]; // { start, end } straight from the stored chunk

const before = doc.slice(0, hit.start);
const match = doc.slice(hit.start, hit.end);
const after = doc.slice(hit.end);
render(`${before}<mark>${escape(match)}</mark>${after}`);
```

### Real token counts

The default tokenizer is a fast chars/4 heuristic - fine for packing budgets. For exact counts, plug in any counter:

```ts
import { encodingForModel } from 'js-tiktoken';

const enc = encodingForModel('gpt-4o');
const chunks = chunkText(doc, {
  maxTokens: 512,
  tokenizer: (t) => enc.encode(t).length,
});
```

The tokenizer is called on candidate slices during packing, so a heavyweight tokenizer slows chunking - the heuristic + a safety margin (e.g. budget 480 for a 512 limit) is often the better trade.

## API

| Export | Description |
|---|---|
| `chunkText(text, options?)` | Hierarchical separator splitting (paragraphs > lines > sentences > words) |
| `chunkSentences(text, options?)` | Sentence-boundary packing via `Intl.Segmenter` |
| `chunkMarkdown(text, options?)` | Heading-aware sections + breadcrumbs, atomic code fences |
| `estimateTokens(text)` | The default chars/4 heuristic |

### Options

| Option | Default | Description |
|---|---|---|
| `maxTokens` | `512` | Token budget per chunk |
| `overlap` | `0` | Tokens of trailing context repeated at the start of the next chunk (must be < `maxTokens`) |
| `tokenizer` | chars/4 | `(text: string) => number` |

Invalid options throw `RangeError`. Empty or whitespace-only input returns `[]`.

## Alternatives

- [llm-splitter](https://www.npmjs.com/package/llm-splitter) - offset-tracked chunks with a bring-your-own splitter function. chunklet adds the structural layer: markdown sections with heading breadcrumbs, atomic code fences, `Intl.Segmenter` sentence boundaries, and hierarchical fallback so chunks land on natural boundaries.
- LangChain / LlamaIndex text splitters - similar strategies inside much larger frameworks; reach for chunklet when you want the splitter without the framework.

## Roadmap

- `chunkCode` - blank-line and indentation-aware splitting for source files
- HTML mode

## License

MIT (c) Muzaffar Qosimov


# minivec

[![npm version](https://img.shields.io/npm/v/minivec)](https://www.npmjs.com/package/minivec)
[![CI](https://github.com/qwertymuzaffar/minivec/actions/workflows/ci.yml/badge.svg)](https://github.com/qwertymuzaffar/minivec/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Tiny embedded vector store with **HNSW approximate search implemented from scratch** - zero dependencies, no native bindings, runs anywhere JavaScript does: Node, browsers, edge runtimes.

On 20,000 x 384-dim vectors, HNSW answers queries **40-67x faster than exact search** at 99-100% recall@10 (see [Benchmarks](#benchmarks)).

## Install

```bash
npm i minivec
```

## Quick start

```ts
import { MiniVec } from 'minivec';

const store = new MiniVec<{ title: string }>({ dim: 384 });

store.add('doc-1', embedding1, { title: 'Getting started' });
store.add('doc-2', embedding2, { title: 'Deployment guide' });

const results = store.search(queryEmbedding, { k: 5 });
// [{ id: 'doc-2', score: 0.87, meta: { title: 'Deployment guide' } }, ...]
```

Scores are **higher-is-better for every metric**: cosine similarity, dot product, or negative L2 distance.

## API

### `new MiniVec(options)`

| Option | Default | Description |
|---|---|---|
| `dim` | required | Vector dimensionality |
| `metric` | `'cosine'` | `'cosine'` (inputs auto-normalized), `'dot'`, `'euclidean'` |
| `M` | `16` | HNSW: max links per node per layer |
| `efConstruction` | `200` | HNSW: build-time search width |

### Methods

| Method | Description |
|---|---|
| `add(id, vector, meta?)` | Insert; an existing id is upserted |
| `search(vector, { k, ef, filter, exact })` | Nearest neighbors, higher score first |
| `get(id)` / `has(id)` / `remove(id)` | Record access; `size` counts live records |
| `toJSON()` / `MiniVec.fromJSON(snapshot)` | Whole-store persistence (vectors base64-packed) |

### Search options

| Option | Default | Description |
|---|---|---|
| `k` | `10` | Number of results |
| `ef` | `max(k, 50)` | Search width - the recall/speed dial (see below) |
| `filter` | - | `(meta, id) => boolean`; raise `ef` for selective filters |
| `exact` | `false` | Brute-force scan: exact results, O(n) |

## How the index works

minivec implements the HNSW graph (Malkov & Yashunin, 2016): every vector becomes a node in a multi-layer proximity graph. Upper layers are sparse express lanes; a query greedily descends to the bottom layer, then runs a beam search of width `ef` among the candidates. Neighbor selection uses the paper's diversity heuristic, which spreads links across directions - the property that keeps high-dimensional graphs navigable.

Practical tuning:

- **`ef` (query time)** - the only dial most apps need. `16` is fast, `50+` is near-exact on realistic embedding data.
- **`M` / `efConstruction` (build time)** - raise for harder datasets (more clusters, higher intrinsic dimension) at the cost of memory and build speed.
- **`exact: true`** - the honest fallback for small stores (under ~2k vectors it is often just as fast).

Deletes are tombstones: removed records never appear in results, but the graph keeps routing through them until you rebuild (serialize live records into a fresh store).

## Persistence

`toJSON()` returns a plain JSON-safe snapshot with all vectors packed into one base64 string; `MiniVec.fromJSON()` restores the store *including* the built graph - no re-indexing on load.

```ts
// Node
import { writeFile, readFile } from 'node:fs/promises';
await writeFile('index.json', JSON.stringify(store.toJSON()));
const revived = MiniVec.fromJSON(JSON.parse(await readFile('index.json', 'utf8')));

// Browser (IndexedDB via idb-keyval, or any storage you like)
await set('index', store.toJSON());
const revived = MiniVec.fromJSON(await get('index'));
```

## Benchmarks

`npm run bench` - 20,000 vectors, 384 dimensions (all-MiniLM-L6-v2 size), cosine, clustered data mirroring real embedding structure, Apple silicon, Node 20:

| Search | Throughput | recall@10 |
|---|---|---|
| exact (baseline) | 54 qps | 1.000 |
| HNSW `ef=16` | 3,631 qps | 0.990 |
| HNSW `ef=50` | 2,165 qps | 1.000 |
| HNSW `ef=100` | 1,342 qps | 1.000 |

Build: ~288 adds/s at `efConstruction: 200`. Snapshot: 42 MB JSON for 20k x 384d.

A note on honesty: uniform random high-dimensional vectors are the ANN worst case (distance concentration) and no library does well on them; the clustered generator models what actual text/image embeddings look like. Run the bench on your own data for numbers that matter.

## Alternatives

- [hnswlib-node](https://www.npmjs.com/package/hnswlib-node) - native bindings to the reference C++ implementation: faster raw throughput, Node-only, requires compilation. minivec trades peak speed for zero dependencies and running in the browser.
- [vectra](https://www.npmjs.com/package/vectra) - file-based local vector store with exact search; no ANN index.
- A real vector database (pgvector, Qdrant, ...) - the right call beyond a few hundred thousand vectors or when you need multi-process access.

## License

MIT (c) Muzaffar Qosimov


