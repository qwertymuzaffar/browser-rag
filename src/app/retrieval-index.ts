import { chunkMarkdown, type Chunk } from 'chunklet';
import { MiniVec } from 'minivec';

/** A passage of the document: exact offsets into it plus its heading breadcrumb. */
export interface Passage {
  start: number;
  end: number;
  headings: string[];
}

/** A passage ranked against a question; `snippet` is exactly `doc.slice(start, end)`. */
export interface Hit extends Passage {
  score: number;
  snippet: string;
}

/** What the index needs from an embedding model: one vector per text, in order. */
export interface Embedder {
  embed(texts: string[]): Promise<ArrayLike<number>[]>;
}

export interface BuildOptions {
  /** Chunks embedded per model call. */
  batchSize?: number;
  /** Called with `(0, total)` before the first model call and after every batch. */
  onProgress?: (done: number, total: number) => void;
}

/** MiniLM, the model ngx-transformers embeds with by default. */
const DIMENSIONS = 384;
const CHUNKING = { maxTokens: 160, overlap: 24 };

/** The text a chunk is embedded as: its breadcrumb first, so a passage carries its context. */
function embeddingText(chunk: Chunk): string {
  const headings = chunk.meta?.headings ?? [];
  return headings.length ? `${headings.join(' > ')}\n\n${chunk.text}` : chunk.text;
}

function passageOf(chunk: Chunk): Passage {
  return { start: chunk.start, end: chunk.end, headings: chunk.meta?.headings ?? [] };
}

/**
 * The retrieval half of RAG: chunklet splits the document, the embedder turns every chunk
 * into a vector, minivec ranks them against a question. Knows nothing about the view.
 */
export class RetrievalIndex {
  private constructor(
    private readonly doc: string,
    private readonly embedder: Embedder,
    private readonly store: MiniVec<Passage>,
  ) {}

  /** Number of passages in the index. */
  get size(): number {
    return this.store.size;
  }

  static async build(
    doc: string,
    embedder: Embedder,
    options: BuildOptions = {},
  ): Promise<RetrievalIndex> {
    const { batchSize = 8, onProgress } = options;
    const chunks = chunkMarkdown(doc, CHUNKING);
    const store = new MiniVec<Passage>({ dim: DIMENSIONS });
    onProgress?.(0, chunks.length);
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const vectors = await embedder.embed(batch.map(embeddingText));
      batch.forEach((chunk, j) => store.add(`c${chunk.index}`, vectors[j], passageOf(chunk)));
      onProgress?.(Math.min(i + batchSize, chunks.length), chunks.length);
    }
    return new RetrievalIndex(doc, embedder, store);
  }

  /** The `k` passages closest in meaning to the question, best first. */
  async search(question: string, k = 5): Promise<Hit[]> {
    const [vector] = await this.embedder.embed([question]);
    const hits: Hit[] = [];
    for (const { score, meta } of this.store.search(vector, { k })) {
      if (meta) hits.push({ ...meta, score, snippet: this.doc.slice(meta.start, meta.end) });
    }
    return hits;
  }
}
