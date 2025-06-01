import { homedir } from "os";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

export interface Focus {
  id: string;
  topic: string;
  context: string;
  tool: "desktop" | "code";
  status: "active" | "completed";
  startedAt: string;
  completedAt?: string;
}

export interface ContextData {
  currentFocus: Focus | null;
  focusHistory: Focus[];
}

const CONTEXT_FILE_PATH = join(homedir(), "projects", "thinking-partner-mcp", "data", "context.json");

export function readContextData(): ContextData {
  try {
    if (!existsSync(CONTEXT_FILE_PATH)) {
      return { currentFocus: null, focusHistory: [] };
    }

    const data = readFileSync(CONTEXT_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data);

    return {
      currentFocus: parsed.currentFocus || null,
      focusHistory: parsed.focusHistory || [],
    };
  } catch (error) {
    console.error("Failed to read context data:", error);
    return { currentFocus: null, focusHistory: [] };
  }
}

export function writeContextData(data: ContextData): void {
  try {
    const currentData = readFullContextData();
    const updatedData = {
      ...currentData,
      currentFocus: data.currentFocus,
      focusHistory: data.focusHistory,
    };

    writeFileSync(CONTEXT_FILE_PATH, JSON.stringify(updatedData, null, 2));
  } catch (error) {
    console.error("Failed to write context data:", error);
    throw error;
  }
}

function readFullContextData(): Record<string, unknown> {
  try {
    if (!existsSync(CONTEXT_FILE_PATH)) {
      return {};
    }
    const data = readFileSync(CONTEXT_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function setFocus(topic: string, context: string = "", tool: "desktop" | "code" = "desktop"): Focus {
  const data = readContextData();

  // End current focus if exists
  if (data.currentFocus) {
    data.currentFocus.completedAt = new Date().toISOString();
    data.focusHistory.unshift(data.currentFocus);
  }

  // Create new focus
  const newFocus: Focus = {
    id: Date.now().toString(),
    topic,
    context,
    tool,
    status: "active",
    startedAt: new Date().toISOString(),
  };

  data.currentFocus = newFocus;
  writeContextData(data);

  return newFocus;
}
