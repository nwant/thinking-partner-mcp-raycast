# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension that acts as an MCP (Model Context Protocol) client for the thinking-partner-mcp server. The extension provides a "Quick Focus" command to help users manage their focus and productivity.

## Development Commands

### Building and Running
- `npm run dev` - Start the extension in development mode with hot reloading
- `npm run build` - Build the extension for production

### Code Quality
- `npm run lint` - Run ESLint to check code style and quality
- `npm run fix-lint` - Automatically fix linting issues where possible

### Publishing
- `npm run publish` - Publish the extension to the Raycast Store

## Architecture

The extension follows Raycast's standard structure:
- Extension manifest and metadata in `package.json`
- Main command implementation in `src/quick-focus.tsx`
- Currently uses the Raycast AI utility (`useAI`) as a placeholder implementation

## Key Implementation Notes

The current `quick-focus.tsx` implementation is a placeholder that demonstrates AI integration. To properly implement MCP client functionality, this will need to be replaced with:
1. MCP client connection logic to connect to the thinking-partner-mcp server
2. UI components to display current focus, set new focus, and show focus history
3. State management for focus data

The extension is configured to use:
- TypeScript with strict mode enabled
- React JSX for UI components
- CommonJS modules targeting ES2023