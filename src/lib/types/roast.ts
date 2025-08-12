export type RoastStatus = "pending" | "processing" | "ready" | "error";
export type RoastSource = "token" | "stripe";

export interface RoastResult {
  title?: string;
  zingers?: string[];
  insights?: string[];
  verdict?: string;
  risk_score?: number;
}

export interface RoastDoc {
  idea: string;
  harshness: 1 | 2 | 3;
  userId: string | null;
  paid: boolean;
  source: RoastSource;
  status: RoastStatus;
  result?: RoastResult;
  sessionId?: string;
  createdAt: number; // Date.now()
  updatedAt: number; // Date.now()
}
