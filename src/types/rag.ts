export interface EmbeddingVector {
  id: string;
  values: number[];
}

export interface TextChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  showId: number;
  type: "tv" | "movie";
  title: string;
  field: "overview" | "genres" | "providers" | "combined";
  posterPath: string | null;
}

export interface VectorEntry {
  chunk: TextChunk;
  embedding: number[];
}

export interface SearchResult {
  chunk: TextChunk;
  score: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: SearchResult[];
  timestamp: number;
}

export interface RAGStatus {
  seeded: boolean;
  totalChunks: number;
  totalEmbeddings: number;
  modelLoaded: boolean;
}

export interface SeedProgress {
  status: "idle" | "seeding" | "done" | "error";
  current: number;
  total: number;
  currentTitle: string;
}
