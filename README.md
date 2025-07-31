# Zap E-commerce MCP Integration

> **AI-Powered Shopping Assistant**: Transform Claude into an intelligent e-commerce companion through Anthropic's Model Context Protocol (MCP).

## Description

This project shows how AI assistants can connect directly to Zap platform, using the Model Context Protocol (MCP). By running both local and remote MCP servers, chat-based agents can search the Zap catalog, compare prices, and build a cart and send generated link for purchase, all through natural-language conversations, no hyphens needed.

**Core Innovation**: Transform Claude into an intelligent shopping assistant that can search products, compare prices across sellers, manage shopping carts, and generate payment links - all through conversational AI.

## Demo Logic

The demonstration follows a complete e-commerce user journey:
1. **Product Discovery** - Natural language search across 634+ products in Hebrew categories
2. **Price Comparison** - Multi-seller analysis with ratings and shipping costs
3. **Cart Management** - Session-based shopping cart with real-time totals
4. **Checkout Flow** - Payment link generation (mock for demo purposes)
5. **Stock Verification** - Availability checking across multiple sellers

**Example Flow**: *"I need a coffee machine under 500 shekels"* → Search → Compare → Add to cart → Checkout - all handled conversationally by Claude through MCP tools.

## Thought Process & Methodology

### Research & Market Analysis
- **Deep Research**: Analyzed MCP adoption trends across AI platforms, with Claude leading implementation
- **Market Focus**: Identified Israeli e-commerce market needs through Zap.co.il structure analysis
- **Category Mapping**: Scraped 634 official categories from Zap.co.il (חשמל ואלקטרוניקה > subcategories)

### Technical Approach
- **Dual Architecture**: Both local (stdio) and remote (HTTP) servers for different use cases
- **Protocol Selection**: MCP chosen for its structured tool calling and it's generally adopted
- **Data Generation**: Script-based mock product creation ensuring category coverage - based on zap web data.
- **Israeli Localization**: NIS pricing, Hebrew categories, local seller names - works great using Hebrew.

### Demo Test

- **Hebrew - Consive Tone** - https://claude.ai/share/4b6ff194-b97b-4f6b-899a-761ffe663907
- **Hebrew - None Formal Tone** - https://claude.ai/share/0ab0eda9-80c1-4821-9db2-cc304dbf4cb6
- **English - Consive Tone** - https://claude.ai/share/4aac91d1-0daf-48f4-aada-6903181ea887




## Usage Instructions

### 🚀 Quick Start - Remote Server (Recommended)

**Ready-to-use MCP endpoint**: `https://zap-mcp-server-remote.onrender.com/mcp`

**Setup in Claude (5-minute configuration):**
1. Open the link - https://claude.ai/settings/connectors
or
1.
  a. Open Claude and navigate to **Settings → Connectors**
  b. Switch to **"Organization connectors"** tab
  c. Find the **"Connectors"** section
2. Click **"Add custom connector"**
3. Paste: `https://zap-mcp-server-remote.onrender.com/mcp`
4. Click **"Add"** to complete setup

**Try it**: Ask Claude *"Search for a coffee machine under 500 shekels"* and watch the MCP tools in action!

⚠️ **Note**: Render free tier hibernates after 15 minutes of inactivity - first call may fail and will wake the instance.

### Alternative - 🛠️ Local Server Usage Setup

**Prerequisites:**
- Node.js 18+

**Installation:**
```bash
# Install globally
npm install -g zap-mcp-server-home-assigment

## MCP Client Configuration

Add to your MCP client settings:


```

**Claude Configuration for Local Server:**
1. Open Claude Desktop settings
2. Add to MCP servers configuration:
```json
{
  "mcpServers": {
    "zap-mcp-server-home-assigment": {
      "command": "npx",
      "args": ["zap-mcp-server-home-assigment"]
    }
  }
}
```

**Available MCP Tools:**
- `product_search` - Natural language product search with filters
- `get_product_details` - Detailed product specifications
- `compare_prices` - Multi-seller price comparison
- `check_availability` - Real-time stock verification
- `add_to_cart` - Virtual shopping cart management
- `generate_payment_link` - Checkout URL generation

### 🧪 Quick try using this queries:

Once configured, try these sample queries in Claude:
- *"Find smartphones under 2000 shekels"*
- *"Compare prices for iPhone 15"*
- *"Add the cheapest one to my cart"*
- *"Check what's in my cart and generate a payment link"*

## Project Structure

```
├── README.md                          # Main documentation
├── idea_summary.pdf                   # Project concept
└── project/
    ├── Zap-MCP-Server/               # Local MCP Server (stdio)
    │   ├── build/index.js            # Compiled output
    │   └── data/                     # Product & seller data
    └── Zap-MCP-Server-Remote/        # Remote MCP Server (HTTP)
        ├── index.js                  # Express server
        ├── package.json              # Dependencies
        ├── render.yaml               # Deployment config
        └── data/                     # Product & seller data
```


## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **MCP**: Anthropic MCP SDK
- **Validation**: Zod schemas
- **Deployment**: Render Platform
- **Data**: JSON-based mock datasets

---

*Built as a proof of concept for AI-driven e-commerce integration using Anthropic's Model Context Protocol.*