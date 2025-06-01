import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { existsSync } from "fs";
import { Focus, CurrentFocusResource, SetFocusParams } from "./types";
import { config } from "./config";
import { execSync } from "child_process";

let client: Client | null = null;
let transport: StdioClientTransport | null = null;
let connectionPromise: Promise<Client> | null = null;

function findNodeBinary(): string {
  for (const nodePath of config.node.paths) {
    try {
      if (nodePath === "node") {
        // Try to use node from PATH
        execSync("node --version", { stdio: "ignore" });
        return "node";
      } else if (existsSync(nodePath)) {
        // Check if the binary exists and is executable
        execSync(`${nodePath} --version`, { stdio: "ignore" });
        return nodePath;
      }
    } catch {
      // Continue to next path
    }
  }
  throw new Error("Node.js not found. Please ensure Node.js is installed.");
}

export async function connectToMCP(): Promise<Client> {
  // Return existing client if connected
  if (client && transport) {
    return client;
  }

  // Return existing connection attempt if in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start new connection
  connectionPromise = doConnect();
  
  try {
    const result = await connectionPromise;
    return result;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

async function doConnect(): Promise<Client> {
  const { serverPath } = config.mcp;

  if (!existsSync(serverPath)) {
    throw new Error(`MCP server not found at ${serverPath}. Please ensure ${config.mcp.serverName} is installed.`);
  }

  const nodeBinary = findNodeBinary();
  console.log("Creating transport with node binary:", nodeBinary);

  try {
    transport = new StdioClientTransport({
      command: nodeBinary,
      args: [serverPath],
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    });

    // Create client first
    const newClient = new Client({
      name: config.mcp.clientName,
      version: config.mcp.clientVersion,
      capabilities: {
        tools: {},
        resources: {},
      },
    });


    console.log("Connecting with node:", nodeBinary, "to server:", serverPath);
    
    try {
      await newClient.connect(transport);
      console.log("Client connected successfully");
      
      // Only set the global client after successful connection
      client = newClient;
      
      // Set up error handlers after connection
      transport.onerror = (error) => {
        console.error("Transport error:", error);
      };

      transport.onclose = () => {
        console.log("Transport closed");
        if (client === newClient) {
          client = null;
          transport = null;
        }
      };
      
      // Wait a bit for the connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Test the connection
      try {
        await client.ping();
        console.log("Ping successful");
      } catch (pingError) {
        console.error("Ping failed:", pingError);
      }
    } catch (connectError) {
      console.error("Connection error:", connectError);
      throw connectError;
    }

    connectionPromise = null;
    return client;
  } catch (error) {
    console.error("Connection failed:", error);
    client = null;
    transport = null;
    connectionPromise = null;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to connect to thinking-partner-mcp server: ${errorMessage}`);
  }
}

export async function disconnectFromMCP(): Promise<void> {
  connectionPromise = null;
  if (client) {
    try {
      await client.close();
    } catch (error) {
      console.error("Error closing client:", error);
    }
    client = null;
    transport = null;
  }
}

export async function getCurrentFocus(): Promise<CurrentFocusResource> {
  const mcpClient = await connectToMCP();

  try {
    // Use get_context tool to retrieve current focus
    const response = await mcpClient.callTool({
      name: "get_context",
      arguments: {
        tool: config.defaults.tool,
        scope: "current",
      },
    });

    if (response.content && Array.isArray(response.content) && response.content.length > 0) {
      const content = response.content[0];
      if ("text" in content && typeof content.text === "string") {
        const result = JSON.parse(content.text);
        return {
          currentFocus: result.currentFocus || null,
          recentContext: result.recentContext || [],
        };
      }
    }
  } catch (error) {
    console.error("Failed to get current focus:", error);
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
      tool: params.tool || config.defaults.tool,
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

  try {
    const response = await mcpClient.callTool({
      name: "get_context",
      arguments: {
        tool: config.defaults.tool,
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
  } catch (error) {
    console.error("Failed to get focus history:", error);
  }

  return [];
}
