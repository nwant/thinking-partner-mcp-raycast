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


    try {
      await newClient.connect(transport);
      
      // Only set the global client after successful connection
      client = newClient;
      
      // Set up error handlers after connection
      transport.onerror = (error) => {
        console.error("Transport error:", error);
      };

      transport.onclose = () => {
        if (client === newClient) {
          client = null;
          transport = null;
        }
      };
      
      // Wait a bit for the connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
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
        
        // The MCP server returns: { success: true, context: { currentFocus: {...}, ... } }
        if (result.success && result.context) {
          return {
            currentFocus: result.context.currentFocus || null,
            recentContext: result.context.recentDecisions || [],
          };
        }
        
        // Fallback for different structures
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
      
      // The MCP server likely returns the new focus in a similar structure
      if (result.success && result.focus) {
        return result.focus;
      } else if (result.success && result.currentFocus) {
        return result.currentFocus;
      }
      
      // Fallback
      return result.currentFocus || result;
    }
  }

  throw new Error("Failed to set focus");
}

export async function getFocusHistory(): Promise<Focus[]> {
  const mcpClient = await connectToMCP();

  try {
    // First try the new get_focus_history tool
    try {
      const response = await mcpClient.callTool({
        name: "get_focus_history",
        arguments: {
          tool: config.defaults.tool,
          limit: 50, // Get last 50 focuses
        },
      });

      if (response.content && Array.isArray(response.content) && response.content.length > 0) {
        const content = response.content[0];
        if ("text" in content && typeof content.text === "string") {
          const result = JSON.parse(content.text);
          if (result.success && result.focusHistory) {
            return result.focusHistory;
          }
        }
      }
    } catch {
      // get_focus_history tool not available, fall back to get_context
    }
    
    // Fallback to enhanced get_context with scope "all"
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
          // The enhanced server now returns focusHistory with scope "all"
          if (result.success && result.context && result.context.focusHistory) {
            return result.context.focusHistory;
          }
        }
      }
    } catch (error) {
      console.error("Failed to get focus history with get_context:", error);
    }
    
    return [];
    
  } catch (error) {
    console.error("Failed to get focus history:", error);
  }

  return [];
}
