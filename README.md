# Zap E-commerce MCP Integration

> **AI-Powered Shopping Assistant**: Transform Claude into an intelligent e-commerce companion through Anthropic's Model Context Protocol (MCP).

## Description

This project demonstrates how AI applications can be extended with real-world e-commerce capabilities, specifically focusing on Israel's leading price comparison platform, Zap.co.il. By implementing both local and remote MCP servers, we showcase how AI can interact with product catalogs, price comparisons, and shopping workflows through natural language conversations.

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
- **Protocol Selection**: MCP chosen for its structured tool calling vs generic API approaches
- **Data Generation**: Script-based mock product creation ensuring category coverage
- **Validation Strategy**: Zod schema validation for data integrity

### Best Practices Applied
- **Session Isolation**: Multi-user support with separate cart sessions
- **Error Handling**: Graceful degradation for stock/availability issues
- **CORS Configuration**: Browser-compatible remote server setup
- **Israeli Localization**: NIS pricing, Hebrew categories, local seller names

## Usage Instructions

### 🚀 Quick Start - Remote Server (Recommended)

**Ready-to-use MCP endpoint**: `https://zap-mcp-server-remote.onrender.com/mcp`

**Setup in Claude (5-minute configuration):**

1. Open Claude and navigate to **Settings → Connectors**
2. Switch to **"Organization connectors"** tab
3. Find the **"Connectors"** section
4. Click **"Add custom connector"**
5. Paste: `https://zap-mcp-server-remote.onrender.com/mcp`
6. Click **"Add"** to complete setup

**Try it**: Ask Claude *"Search for a coffee machine under 500 shekels"* and watch the MCP tools in action!

⚠️ **Note**: Render free tier hibernates after 15 minutes of inactivity - first call may fail and will wake the instance.

### 🛠️ Local Development Setup

**Prerequisites:**
- Node.js 18+
- TypeScript

**Installation:**
```bash
# Navigate to local server
cd ZapMCP/Zap-MCP-Server

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

**Claude Configuration for Local Server:**
1. Open Claude Desktop settings
2. Add to MCP servers configuration:
```json
{
  "mcpServers": {
    "zap-mcp": {
      "command": "node",
      "args": ["/path/to/Zap-Task/ZapMCP/Zap-MCP-Server/build/index.js"]
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

### 🧪 Testing the Integration

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