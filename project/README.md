# Zap E-commerce MCP Integration

> **Proof of Concept**: Remote Model Context Protocol (MCP) server implementation for Zap.co.il, Israel's leading price comparison platform.

## 🎯 Overview

This project demonstrates how AI applications can be extended with real-world e-commerce capabilities through Anthropic's Model Context Protocol (MCP). While we focus on Claude as the primary example (being the leader in MCP adoption), this same integration approach works across AI assistant platforms. ChatGPT has begun early-stage MCP implementation available to Pro subscribers for advanced research, with broader rollout expected as the protocol gains industry adoption.

By implementing both local and remote MCP servers, this POC showcases how AI can interact with product catalogs, price comparisons, and shopping workflows in a structured, scalable way.

**Key Capability**: Transform Claude into an intelligent shopping assistant that can search products, compare prices across sellers, manage shopping carts, and generate payment links - all through natural language conversations.

## 📊 Dataset & Assumptions

### Sample Data
- **634 categories** scraped it from  official zap.co.il webpage categories (חשמל ואלקטרוניקה > subcategory > sub-subcategory)
- **634+ products** Using a script we generated at least one mock product acroos this categories.
- **4 mock sellers** with varying prices, ratings, and shipping options
- **Price variations** of ±15% based on seller algorithms
- **Stock simulation** with 80% availability rate

### Key Assumptions
- **Israeli Market Focus**: All prices in NIS (₪), Hebrew categories, local seller names
- **Mock Payment System**: Payment URLs are non-functional for demo purposes
- **Session-based Carts**: Shopping carts persist during server runtime only
- **Simplified Authentication**: No user authentication for POC demonstration - mock email usage


## 🏗️ System Architecture -

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Applications                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Claude Web    │  │ Claude Desktop  │  │   Claude CLI    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ MCP Protocol
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│Local Server │     │ Remote Server   │     │Third-party  │
│             │     │                 │     │MCP Servers  │
│stdio        │     │HTTP/StreamableHTTP    │             │
│transport    │     │transport        │     │             │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                      │
       │            ┌─────────┼──────────┐
       │            │         │          │
       ▼            ▼         ▼          ▼
 ┌─────────────┐  ┌─────────┐ │ ┌─────────────┐
 │Local JSON   │  │Render   │ │ │Other Cloud  │
 │Data Files   │  │Platform │ │ │Platforms    │
 └─────────────┘  └─────────┘ │ └─────────────┘
                              │
                    ┌─────────┼──────────┐
                    │         │          │
                    ▼         ▼          ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │Products  │ │Sellers   │ │Cart      │
              │JSON      │ │JSON      │ │Memory    │
              └──────────┘ └──────────┘ └──────────┘
```

**Focus: Remote MCP Implementation**
- **Cloud Deployment**: Hosted on Render with auto-scaling capabilities → [**Live Demo**](https://zap-mcp-server-remote.onrender.com)
- **HTTP Transport**: Uses StreamableHTTP for browser-based MCP clients
- **Session Management**: Multi-user support with session isolation
- **CORS Configuration**: Enables direct browser access to MCP endpoints

## 🔄 Example User Flow

### Natural Language Shopping Experience

```
1. 👤 User: "I need a coffee machine under 500 shekels"
   🤖 Claude → product_search("coffee machine", {price_max: 500})
   📊 Results: DeLonghi Magnifica S (₪499) + other options

2. 👤 User: "Compare prices for the DeLonghi one"
   🤖 Claude → compare_prices("1001")
   📊 Results: 4 sellers with prices, ratings, shipping costs

3. 👤 User: "Add it from TechZone IL to my cart"
   🤖 Claude → add_to_cart("1001", "seller_001", 1)
   📊 Results: Cart updated with total ₪524 (including shipping)

4. 👤 User: "I'm ready to checkout"
   🤖 Claude → generate_payment_link("user@example.com")
   📊 Results: Mock payment URL generated

5. 👤 User: "Check if it's still in stock"
   🤖 Claude → check_availability("1001", "seller_001")
   📊 Results: ✅ 23 units available, 1-2 business days delivery
```

### Available MCP Tools
- `product_search` - Natural language product search with filters
- `get_product_details` - Detailed product specifications
- `compare_prices` - Multi-seller price comparison
- `check_availability` - Real-time stock verification
- `add_to_cart` - Virtual shopping cart management
- `generate_payment_link` - Checkout URL generation

## ⚠️ Known Limitations

### Technical Constraints
- **Mock Data Only**: Uses local JSON files, not real Zap.co.il API
- **In-Memory Storage**: Cart data doesn't persist between server restarts
- **Simulated Stock**: Random availability generation (80% in-stock rate)
- **No Authentication**: No user management or secure sessions
- **Free Tier Sleep**: Render free tier hibernates after 15 minutes of inactivity - first call will only "wake" the instance and will fail.


## 🚀 Future Improvements

### Production Readiness
- **User Authentication**: Implement session management


### Enhanced Features
- **Real-time Inventory**: WebSocket connections for live stock updates
- **Price Alerts**: Notification system for price drops
- **Order History**: Persistent user purchase tracking
- **Advanced Search**: AI-powered product recommendations

---


## 🛠️ Quick Start

### Remote Server (Recommended)

**Ready-to-use MCP endpoint**: `https://zap-mcp-server-remote.onrender.com/mcp`

**Setup in Claude (5-minute configuration):**

1. Open Claude and navigate to **Settings → Connectors**
2. Switch to **"Organization connectors"** tab
3. Find the **"Connectors"** section
4. Click **"Add custom connector"**
5. Paste: `https://zap-mcp-server-remote.onrender.com/mcp`
6. Click **"Add"** to complete setup

**Test it**: Ask Claude *"Search for a coffee machine under 500 shekels"* and watch the MCP tools in action!

📖 **Detailed guide**: `/Zap-MCP-Server-Remote/README.md`

### Local Development Server

📖 **Development guide**: `/Zap-MCP-Server/README.md`

**Stack**: TypeScript, Node.js, Express, MCP SDK, Zod validation