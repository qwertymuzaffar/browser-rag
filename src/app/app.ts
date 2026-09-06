import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { chunkMarkdown, type Chunk } from 'chunklet';
import { MiniVec } from 'minivec';
import { ModelProgressComponent, createTextEmbedder } from 'ngx-transformers';

interface ChunkMeta {
  start: number;
  end: number;
  headings: string[];
}

interface Hit {
  score: number;
  headings: string[];
  snippet: string;
  start: number;
  end: number;
}

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModelProgressComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly embedder = createTextEmbedder();

  readonly doc = signal('');
  readonly editing = signal(false);
  readonly chunkCount = signal(0);
  readonly indexProgress = signal<{ done: number; total: number } | null>(null);
  readonly indexed = signal(false);
  readonly asking = signal(false);
  readonly hits = signal<Hit[] | null>(null);
  readonly highlight = signal<{ start: number; end: number } | null>(null);

  readonly parts = computed(() => {
    const doc = this.doc();
    const h = this.highlight();
    if (!h) return { before: doc, match: '', after: '' };
    return {
      before: doc.slice(0, h.start),
      match: doc.slice(h.start, h.end),
      after: doc.slice(h.end),
    };
  });

  readonly busy = computed(() => this.indexProgress() !== null || this.asking());

  private store: MiniVec<ChunkMeta> | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const res = await fetch('sample.md');
      this.doc.set(await res.text());
    } catch {
      this.doc.set('# Sample\n\nCould not load the sample document - paste your own text via Edit.');
    }
  }

  async buildIndex(): Promise<void> {
    const doc = this.doc();
    if (!doc.trim() || this.busy()) return;
    this.indexed.set(false);
    this.hits.set(null);
    this.highlight.set(null);

    // 1. chunklet: structure-aware chunks with exact offsets + breadcrumbs
    const chunks: Chunk[] = chunkMarkdown(doc, { maxTokens: 160, overlap: 24 });
    this.chunkCount.set(chunks.length);
    this.indexProgress.set({ done: 0, total: chunks.length });

    // 2. ngx-transformers: embed on-device; 3. minivec: index the vectors
    const store = new MiniVec<ChunkMeta>({ dim: 384 });
    const BATCH = 8;
    try {
      for (let i = 0; i < chunks.length; i += BATCH) {
        const batch = chunks.slice(i, i + BATCH);
        const texts = batch.map((c) =>
          c.meta?.headings?.length ? c.meta.headings.join(' > ') + '\n\n' + c.text : c.text,
        );
        const vectors = await this.embedder.embed(texts);
        batch.forEach((c, j) =>
          store.add(`c${c.index}`, vectors[j], {
            start: c.start,
            end: c.end,
            headings: c.meta?.headings ?? [],
          }),
        );
        this.indexProgress.set({ done: Math.min(i + BATCH, chunks.length), total: chunks.length });
      }
      this.store = store;
      this.indexed.set(true);
    } finally {
      this.indexProgress.set(null);
    }
  }

  async ask(question: string): Promise<void> {
    if (!question.trim() || !this.store || this.busy()) return;
    this.asking.set(true);
    try {
      const [queryVector] = await this.embedder.embed(question);
      const doc = this.doc();
      const results = this.store.search(queryVector, { k: 5 });
      this.hits.set(
        results.map((r) => ({
          score: r.score,
          headings: r.meta?.headings ?? [],
          snippet: doc.slice(r.meta!.start, r.meta!.end),
          start: r.meta!.start,
          end: r.meta!.end,
        })),
      );
      if (results[0]?.meta) this.select(results[0].meta.start, results[0].meta.end);
    } finally {
      this.asking.set(false);
    }
  }

  select(start: number, end: number): void {
    this.highlight.set({ start, end });
    // setTimeout, not queueMicrotask: the <mark> renders on the next
    // change-detection pass, which is itself a microtask.
    setTimeout(() => document.querySelector('mark')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }

  onDocEdited(value: string): void {
    this.doc.set(value);
    this.indexed.set(false);
    this.store = null;
    this.hits.set(null);
    this.highlight.set(null);
    this.chunkCount.set(0);
  }

  crumb(headings: string[]): string {
    return headings.length ? headings.join(' › ') : 'document';
  }
}
