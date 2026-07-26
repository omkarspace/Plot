/* eslint-disable @typescript-eslint/no-explicit-any */
let extractorInstance: any = null;
let modelLoading = false;
let initFailed = false;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

export const getExtractor = async (): Promise<any> => {
  if (extractorInstance) return extractorInstance;
  if (initFailed) throw new Error("Embedding model failed to load previously");
  if (modelLoading) {
    while (modelLoading) await new Promise((r) => setTimeout(r, 200));
    if (extractorInstance) return extractorInstance;
    throw new Error("Embedding model failed to load");
  }

  modelLoading = true;
  try {
    const mod = await import("@huggingface/transformers");
    mod.env.cacheDir = "./node_modules/.cache/huggingface";
    extractorInstance = await mod.pipeline("feature-extraction", MODEL_ID, {
      dtype: "fp32",
    });
    return extractorInstance;
  } catch (e) {
    initFailed = true;
    throw e;
  } finally {
    modelLoading = false;
  }
};

export const embedText = async (text: string): Promise<number[]> => {
  const ext = await getExtractor();
  const output = await ext(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};

export const embedBatch = async (texts: string[]): Promise<number[][]> => {
  const ext = await getExtractor();
  const results: number[][] = [];
  for (const text of texts) {
    const output = await ext(text, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data));
  }
  return results;
};

export const isModelLoaded = (): boolean => extractorInstance !== null;
