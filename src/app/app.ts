import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { ModelProgressComponent, createTextEmbedder } from 'ngx-transformers';
import { RetrievalIndex, type Hit } from './retrieval-index';

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
  readonly index = signal<RetrievalIndex | null>(null);
  readonly indexProgress = signal<{ done: number; total: number } | null>(null);
  readonly asking = signal(false);
  readonly hits = signal<Hit[] | null>(null);
  readonly highlight = signal<{ start: number; end: number } | null>(null);

  readonly indexed = computed(() => this.index() !== null);
  readonly chunkCount = computed(() => this.indexProgress()?.total ?? this.index()?.size ?? 0);
  readonly busy = computed(() => this.indexProgress() !== null || this.asking());

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
    this.discardIndex();
    try {
      const index = await RetrievalIndex.build(doc, this.embedder, {
        onProgress: (done, total) => this.indexProgress.set({ done, total }),
      });
      this.index.set(index);
    } finally {
      this.indexProgress.set(null);
    }
  }

  async ask(question: string): Promise<void> {
    const index = this.index();
    if (!question.trim() || !index || this.busy()) return;
    this.asking.set(true);
    try {
      const hits = await index.search(question);
      this.hits.set(hits);
      if (hits[0]) this.select(hits[0].start, hits[0].end);
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
    this.discardIndex();
  }

  crumb(headings: string[]): string {
    return headings.length ? headings.join(' › ') : 'document';
  }

  /** Drops the index and everything shown from it; the document itself stays. */
  private discardIndex(): void {
    this.index.set(null);
    this.hits.set(null);
    this.highlight.set(null);
  }
}
