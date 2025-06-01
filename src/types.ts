export interface Focus {
  id: string;
  topic: string;
  context: string;
  tool: "desktop" | "code";
  status: "active" | "completed";
  startedAt: string;
  completedAt?: string;
}

export interface CurrentFocusResource {
  currentFocus: Focus | null;
  recentContext: unknown[];
}

export interface SetFocusParams {
  topic: string;
  context?: string;
  tool?: "desktop" | "code";
}

export interface ContextData {
  currentFocus: Focus | null;
  focusHistory: Focus[];
}
