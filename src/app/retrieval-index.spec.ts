import { describe, expect, it } from 'vitest';
import { RetrievalIndex, type Embedder } from './retrieval-index';

const DOC = [
  '# Guide',
  '',
  '## Kanban',
  '',
  'The kanban board supports themes. Set the kanban theme via CSS variables.',
  '',
  '## Vectors',
  '',
  'A vector store answers nearest-neighbour queries. Vector search is fast.',
  '',
  '## Chunks',
  '',
  'A chunk carries exact offsets. Chunk text is never rewritten.',
  '',
].join('\n');

const TOPICS = ['kanban', 'vector', 'chunk'];

/**
 * A stand-in model: a text's vector counts its mentions of each topic word, plus a constant
 * so that no vector is zero. `seen` collects every text the model was asked to embed.
 */
function fakeEmbedder(seen: string[] = []): Embedder {
  return {
    async embed(texts) {
      seen.push(...texts);
      return texts.map((text) => {
        const vector = new Array<number>(384).fill(0);
        TOPICS.forEach((topic, i) => (vector[i] = text.toLowerCase().split(topic).length - 1));
        vector[TOPICS.length] = 1;
        return vector;
      });
    },
  };
}

describe('RetrievalIndex', () => {
  it('embeds every chunk behind its breadcrumb and reports progress per batch', async () => {
    const seen: string[] = [];
    const progress: [number, number][] = [];
    const index = await RetrievalIndex.build(DOC, fakeEmbedder(seen), {
      batchSize: 2,
      onProgress: (done, total) => progress.push([done, total]),
    });

    expect(index.size).toBe(4);
    expect(progress).toEqual([
      [0, 4],
      [2, 4],
      [4, 4],
    ]);
    expect(seen.some((text) => text.startsWith('Guide > Kanban\n\n## Kanban'))).toBe(true);
  });

  it('ranks the passage about the question first, with its exact text', async () => {
    const index = await RetrievalIndex.build(DOC, fakeEmbedder());

    const hits = await index.search('how do I theme the kanban board?');

    expect(hits[0].headings).toEqual(['Guide', 'Kanban']);
    expect(hits[0].snippet).toBe(DOC.slice(hits[0].start, hits[0].end));
    expect(hits[0].snippet).toContain('kanban theme');
    const scores = hits.map((hit) => hit.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('returns at most k hits', async () => {
    const index = await RetrievalIndex.build(DOC, fakeEmbedder());

    expect(await index.search('vector', 2)).toHaveLength(2);
  });
});
