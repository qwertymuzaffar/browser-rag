# browser-rag

A RAG retrieval pipeline running **entirely in your browser** - no server, no API key, nothing leaves the device.

**[Live demo](https://qwertymuzaffar.github.io/browser-rag/)**

## How it works

Three npm packages - all mine - compose into the pipeline:

1. **[chunklet](https://www.npmjs.com/package/chunklet)** splits the document into structure-aware chunks: markdown sections with heading breadcrumbs, whole sentences, atomic code fences - each with exact `[start, end)` offsets into the source.
2. **[ngx-transformers](https://www.npmjs.com/package/ngx-transformers)** embeds every chunk on-device with MiniLM (Transformers.js) - the ~23 MB model downloads once, then embedding is local and free. Breadcrumbs are prepended before embedding for better retrieval.
3. **[minivec](https://www.npmjs.com/package/minivec)** indexes the vectors in an HNSW graph and answers queries in about a millisecond.

Ask a question and the same model embeds it into the same vector space; the top chunks come back ranked by meaning, and clicking one highlights the **exact passage** in the original document - `doc.slice(start, end)`, straight from chunklet's offset guarantee.

The sample document is the concatenated READMEs of my published packages, so try: *"how do I theme the kanban board?"* or *"how fast is approximate search vs exact?"* - or paste your own text via Edit.

Measured on the sample (M-series MacBook, Chrome): 81 chunks indexed in ~14 s including the model download; queries are near-instant.

This is the retrieval half of RAG - the part that decides answer quality. There is no LLM generation step (a browser-sized LLM would add hundreds of MB); wiring the retrieved chunks into any chat API is the standard next step.

## Run locally

```bash
npm ci
npx ng serve
```

## Stack

Angular 22 (zoneless, signals) + chunklet + ngx-transformers + minivec. MIT.
