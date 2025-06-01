# Thinking Partner MCP Raycast Extension

A Raycast extension that acts as an MCP (Model Context Protocol) client for the thinking-partner-mcp server, enabling quick focus management for your thinking workflow.

## Features

- **View Current Focus**: See your active focus topic at a glance
- **Set New Focus**: Quickly set a new focus with topic and context
- **Focus History**: Browse and resume previous focus sessions
- **Time Tracking**: See when you started each focus session

## Prerequisites

- [Raycast](https://raycast.com/) v1.98.0+ (with MCP support)
- [thinking-partner-mcp](https://github.com/nathanwant/thinking-partner-mcp) server set up at `~/projects/thinking-partner-mcp`
- Node.js installed

## Installation

### Step 1: Add MCP Server to Raycast

**Important**: You need to add your thinking-partner MCP server to Raycast first.

1. Open Raycast and search for "Add MCP Server"
2. Configure with:
   - Name: `thinking-partner`
   - Command: `node`
   - Arguments: `/Users/YOUR_USERNAME/projects/thinking-partner-mcp/src/index.js`
   - Working Directory: `/Users/YOUR_USERNAME/projects/thinking-partner-mcp`

### Step 2: Install the Extension

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build and run in development mode:
   ```bash
   npm run dev
   ```

See [SETUP.md](./SETUP.md) for detailed setup instructions and troubleshooting.

## Usage

1. Launch Raycast and search for "Quick Focus"
2. The extension will connect to your thinking-partner-mcp server
3. View your current focus or set a new one
4. Browse focus history and resume previous sessions

## Development

- `npm run dev` - Run in development mode
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run fix-lint` - Fix linting issues

## License

MIT