export type TranscriptStatus = "partial" | "final";

export type TranscriptTimestamp = {
  startMs: number;
  endMs?: number;
};

export type TranscriptConfidence = {
  value: number;
};

export type NormalizedTranscript = {
  status: TranscriptStatus;
  text: string;
  timestamp: TranscriptTimestamp;
  confidence?: TranscriptConfidence;
  speakerId?: string;
  languageCode?: string;
  vendor?: string;
  raw?: Record<string, unknown>;
};
