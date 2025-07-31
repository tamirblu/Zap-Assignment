# Zap E-commerce MCP Integration

> **Proof of Concept**: Remote Model Context Protocol (MCP) server implementation for Zap.co.il.

## 🎯 Overview

This project demonstrates how AI applications can be extended with real-world e-commerce capabilities through Anthropic's Model Context Protocol (MCP). While we focus on Claude as the primary example (being the leader in MCP adoption), this same integration approach works across AI assistant platforms like the GPT's and many more. 

By implementing both local and remote MCP servers, this POC showcases how AI can interact with product catalogs, price comparisons, and shopping workflows in a structured, scalable way.

**Key Capability**: Transform any MCP-compatible AI into an intelligent shopping assistant that can search products, compare prices across sellers, manage shopping carts, and generate payment links - all through natural language conversations.

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
│                  MCP-Compatible AI Platforms                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   ChatGPT       │  │   Claude        │  │   Other MCP     │ │
│  │   (Custom GPT)  │  │   (Desktop/Web) │  │   Platforms     │ │
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
- **Custom ChatGPT**: Hosted At - https://chatgpt.com/g/g-688b4875d61c81918746a73da6c90812-zap-mcp-mock
- **Cloud Deployment**: Hosted on Render with auto-scaling capabilities → [**Live Demo**](https://zap-mcp-server-remote.onrender.com)
- **HTTP Transport**: Uses StreamableHTTP for browser-based MCP clients
- **Session Management**: Multi-user support with session isolation
- **CORS Configuration**: Enables direct browser access to MCP endpoints

## 🔄 Example User Flow

### Natural Language Shopping Experience

```
1. 👤 User: "אני מעוניין לקנות מחשב" (I want to buy a computer)
   🤖 AI → product_search("מחשב")
   📊 Results: ASUS ROG Strix G15 (₪4,899) + other options

2. 👤 User: "האם המחשב גיימינג יוכל לשמש אותי גם ללימודים?" (Can the gaming computer work for studies too?)
   🤖 AI → get_product_details("1001")
   📊 Results: Full specs + suitability analysis

3. 👤 User: "נשמע מעולה" (Sounds great)
   🤖 AI → compare_prices("1001")
   📊 Results: 3 sellers, GadgetPro highest rated (4.9⭐)

4. 👤 User: "אני מעדיף את החברה עם הדירוג הגבוה ביותר" (I prefer the highest-rated company)
   🤖 AI → add_to_cart("1001", "seller_003", 1)
   📊 Results: Cart total ₪5,228 including shipping

5. 👤 User: "המייל שלי - test@gmail.com" (My email is...)
   🤖 AI → generate_payment_link("test@gmail.com")
   📊 Results: ✅ Payment link generated with order #ZAP-1753926849308
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