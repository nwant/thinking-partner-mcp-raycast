import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";

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

let client: Client | null = null;
let transport: StdioClientTransport | null = null;

export async function connectToMCP(): Promise<Client> {
  if (client) {
    return client;
  }

  const serverPath = join(homedir(), "projects", "thinking-partner-mcp", "src", "index.js");

  console.log("Connecting to MCP server at:", serverPath);

  if (!existsSync(serverPath)) {
    throw new Error(`MCP server not found at ${serverPath}. Please ensure thinking-partner-mcp is installed.`);
  }

  try {
    transport = new StdioClientTransport({
      command: "node",
      args: [serverPath],
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    });

    client = new Client(
      {
        name: "thinking-partner-raycast",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: { subscribe: false },
        },
      },
    );

    await client.connect(transport);
    console.log("Successfully connected to MCP server");

    // List available tools for debugging
    const tools = await client.listTools();
    console.log("Available MCP tools:", tools);

    return client;
  } catch (error) {
    console.error("Failed to connect to MCP server:", error);
    client = null;
    transport = null;
    throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function disconnectFromMCP(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    transport = null;
  }
}

export async function getCurrentFocus(): Promise<CurrentFocusResource> {
  const mcpClient = await connectToMCP();

  const response = await mcpClient.readResource({
    uri: "thinking-partner://current-focus",
  });

  if (response.contents && response.contents.length > 0) {
    const content = response.contents[0];
    if (content.text) {
      return JSON.parse(content.text as string);
    }
  }

  return { currentFocus: null, recentContext: [] };
}

export async function setFocus(params: SetFocusParams): Promise<Focus> {
  const mcpClient = await connectToMCP();

  const response = await mcpClient.callTool({
    name: "set_focus",
    arguments: {
      topic: params.topic,
      context: params.context || "",
      tool: params.tool || "desktop",
    },
  });

  if (response.content && Array.isArray(response.content) && response.content.length > 0) {
    const content = response.content[0];
    if ("text" in content && typeof content.text === "string") {
      const result = JSON.parse(content.text);
      return result.currentFocus;
    }
  }

  throw new Error("Failed to set focus");
}

export async function getFocusHistory(): Promise<Focus[]> {
  const mcpClient = await connectToMCP();

  const response = await mcpClient.callTool({
    name: "get_context",
    arguments: {
      tool: "desktop",
      scope: "all",
    },
  });

  if (response.content && Array.isArray(response.content) && response.content.length > 0) {
    const content = response.content[0];
    if ("text" in content && typeof content.text === "string") {
      const result = JSON.parse(content.text);
      return result.focusHistory || [];
    }
  }

  return [];
}
