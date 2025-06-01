# Setup Guide for Thinking Partner MCP Raycast Extension

## Prerequisites

1. Raycast v1.98.0 or later (with MCP support)
2. thinking-partner-mcp server installed at `~/projects/thinking-partner-mcp`

## Installation Steps

### Step 1: Add MCP Server to Raycast

You have two options to add your thinking-partner MCP server to Raycast:

#### Option A: Using Raycast's Add Server Command
1. Open Raycast
2. Search for "Add MCP Server" command
3. Fill in the configuration:
   - Name: `thinking-partner`
   - Command: `node`
   - Arguments: `/Users/YOUR_USERNAME/projects/thinking-partner-mcp/src/index.js`
   - Working Directory: `/Users/YOUR_USERNAME/projects/thinking-partner-mcp`

#### Option B: Manual Configuration
1. Find Raycast's MCP configuration file (usually in Raycast's support directory)
2. Add your server configuration:
```json
{
  "thinking-partner": {
    "command": "node",
    "args": ["/Users/YOUR_USERNAME/projects/thinking-partner-mcp/src/index.js"],
    "cwd": "/Users/YOUR_USERNAME/projects/thinking-partner-mcp",
    "env": {}
  }
}
```

### Step 2: Verify MCP Server Installation
1. Open Raycast
2. Search for "Manage MCP Servers"
3. Verify that "thinking-partner" appears in the list

### Step 3: Use the Extension
1. Once the MCP server is installed in Raycast, you can:
   - Use Quick AI and mention `@thinking-partner` to interact with it
   - Use this extension which provides a dedicated UI for focus management

## Alternative Approach: Direct Connection

If you prefer not to use Raycast's MCP integration, the extension includes a direct connection mode that spawns the MCP server as a subprocess. This is implemented in `src/quick-focus.tsx`.

## Troubleshooting

### "Failed to connect to MCP server" error
1. Ensure the thinking-partner-mcp server is installed at the correct path
2. Check that Node.js is installed and accessible
3. Try running the server manually: `cd ~/projects/thinking-partner-mcp && node src/index.js`

### MCP server not showing in Raycast
1. Make sure you're using Raycast v1.98.0 or later
2. Check the MCP configuration file for syntax errors
3. Restart Raycast after adding the server

## Usage

Once set up, the extension provides:
- **Current Focus View**: See your active focus at a glance
- **Set New Focus**: Quick form to set a new focus topic
- **Focus History**: Browse and resume previous focus sessions