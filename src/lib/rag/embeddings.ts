let extractorPromise: Promise<unknown> | null = null;
let extractorInstance: unknown = null;
let initFailed = false;
const MODEL_LOAD_TIMEOUT_MS = 30_000;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

async function loadExtractor() {
  const mod = await import("@huggingface/transformers");
  mod.env.cacheDir = "./node_modules/.cache/huggingface";
  return mod.pipeline("feature-extraction", MODEL_ID, { dtype: "fp32" });
}

export const getExtractor = async (): Promise<unknown> => {
  if (extractorInstance) return extractorInstance;
  if (initFailed) throw new Error("Embedding model failed to load previously");

  if (!extractorPromise) {
    extractorPromise = Promise.race([
      loadExtractor(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Embedding model load timed out")), MODEL_LOAD_TIMEOUT_MS)
      ),
    ]).then((instance) => {
      extractorInstance = instance;
      return instance;
    }).catch((e) => {
      initFailed = true;
      throw e;
    });
  }

  return extractorPromise;
};

export const embedText = async (text: string): Promise<number[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ext = (await getExtractor()) as any;
  const output = await ext(text, { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
};

const CONCURRENT_LIMIT = 3;

export const embedBatch = async (texts: string[]): Promise<number[][]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ext = (await getExtractor()) as any;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += CONCURRENT_LIMIT) {
    const batch = texts.slice(i, i + CONCURRENT_LIMIT);
    const batchResults = await Promise.all(
      batch.map(async (text) => {
        const output = await ext(text, { pooling: "mean", normalize: true });
        return Array.from(output.data) as number[];
      })
    );
    results.push(...batchResults);
  }

  return results;
};

export const isModelLoaded = (): boolean => extractorInstance !== null;
