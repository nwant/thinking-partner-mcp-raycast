import { homedir } from "os";
import { join } from "path";

const NODE_PATHS = [
  "/opt/homebrew/bin/node", // macOS Apple Silicon
  "/usr/local/bin/node", // macOS Intel or Linux
  "/usr/bin/node", // Linux system install
  "node", // Fallback to PATH
];

export const config = {
  mcp: {
    serverName: "thinking-partner-mcp",
    serverPath: join(homedir(), "projects", "thinking-partner-mcp", "src", "index.js"),
    clientName: "thinking-partner-raycast",
    clientVersion: "1.0.0",
  },
  paths: {
    contextFile: join(homedir(), "projects", "thinking-partner-mcp", "data", "context.json"),
  },
  defaults: {
    tool: "desktop" as const,
  },
  node: {
    paths: NODE_PATHS,
  },
} as const;
