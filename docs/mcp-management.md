# MCP Management Guide

This document explains how the Model Context Protocol (MCP) is utilized in the **wikigacha** project to enhance AI-assisted development and gameplay features.

---

## 🌐 What is MCP?

The **Model Context Protocol (MCP)** is an open standard that allows AI models (like Gemini) to securely and efficiently access external data sources and tools. In this project, MCP is used to provide the AI agent with up-to-date documentation, real-time Wikipedia data, and specialized development utilities.

---

## 👤 User Perspective: Interacting with MCP

As a user or developer interacting with the Gemini CLI, MCP works "behind the scenes" to make the agent smarter.

### Key Benefits
- **Real-time Knowledge:** The agent uses MCP servers (like `context7`) to fetch the latest documentation for libraries like NestJS or React, preventing "hallucinations" of outdated APIs.
- **Enhanced Context:** MCP allows the agent to "see" more than just the files in the repository—it can query databases, search the web, or interact with external APIs directly.

### How to Trigger MCP Tools
You don't need to call MCP tools directly. Instead, ask the agent natural language questions:
- *"How do I set up a Prisma migration?"* (Triggers documentation MCP)
- *"Generate a card from the 'Blue Whale' Wikipedia article."* (Triggers Wikipedia MCP)

---

## 🛠 Developer Perspective: Managing MCP

Developers are responsible for configuring, maintaining, and extending the MCP servers that the AI agent uses.

### 1. Architecture
- **MCP Host (Client):** The Gemini CLI or IDE plugin that communicates with the model.
- **MCP Server:** A standalone service (local or remote) that provides specific tools and resources.

### 2. Configuration
MCP servers are typically configured in a JSON configuration file (e.g., `mcp.json` or within your agent's settings).

#### Example Configuration (`context7`):
To enable up-to-date documentation retrieval:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Example Configuration (`github`):
To enable repository management, issue tracking, and PR automation:
```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here",
        "ghcr.io/github/github-mcp-server"
      ]
    }
  }
}
```

### 3. Setup & Installation
Most MCP servers can be installed via `npm` or run via `npx` or `docker`.

**Step 1: Identify the Server**
Find the MCP server you need (e.g., `context7` for docs, `@benborla29/mcp-server-mysql` for MySQL, or `ghcr.io/github/github-mcp-server` for GitHub).

**Step 2: Install/Configure**
Add the server to your agent's configuration. Ensure all necessary environment variables are set. For the MySQL server, you can explicitly enable write operations using security flags like `ALLOW_INSERT_OPERATION`, `ALLOW_UPDATE_OPERATION`, `ALLOW_DELETE_OPERATION`, and `ALLOW_DDL_OPERATION`. For GitHub, ensure your PAT has `repo` and `read:org` scopes.

**Step 3: Verification**
Ask the agent to list its available tools:
> "Gemini, list your available tools."

### 4. Integration with AI Agents
When the Gemini CLI starts, it initializes the configured MCP servers. Each server exposes a set of **Tools** (executable functions) and **Resources** (data sources).

- **Tools:** `mcp_context7_query-docs`, `mcp_mysql_execute_query`.
- **Logic:** The agent's system prompt instructs it on *when* and *how* to use these tools based on your requests.

### 5. Best Practices
- **Security:** Never commit MCP API keys or database credentials to the repository. Use `.env` files or secure secret management.
- **Performance:** Limit the number of active MCP servers to avoid overhead during agent initialization.
- **Versioning:** When using documentation MCPs, always specify the library version if your project is locked to a specific one (e.g., `/nestjs/core/v10.0.0`).

---

## 📚 Resources
- [Official MCP Documentation](https://modelcontextprotocol.io)
- [Context7 MCP Repository](https://github.com/upstash/context7-mcp)
- [Gemini CLI Documentation](../GEMINI.md)
