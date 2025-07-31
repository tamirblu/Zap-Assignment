# Zap MCP Server Remote

Ready-to-use MCP server for Zap.co.il e-commerce integration with Claude Desktop.

## Quick Setup

**Server URL:** `https://zap-mcp-server-remote.onrender.com/mcp`

**Claude Desktop Configuration:**
1. Open Claude Desktop → Settings → Connectors
2. Click "Add custom connector"
3. Paste: `https://zap-mcp-server-remote.onrender.com/mcp`
4. Click "Add"

## Available Tools

- **`product_search`** - Search 634+ products with natural language
- **`compare_prices`** - Compare prices across multiple sellers
- **`add_to_cart`** - Manage virtual shopping cart
- **`get_product_details`** - Get detailed specifications
- **`check_availability`** - Real-time stock verification
- **`generate_payment_link`** - Mock checkout URLs

## Try These Commands

- *"Find a coffee machine under 500 shekels"*
- *"Compare prices for Samsung Galaxy S24"*
- *"Add the cheapest option to my cart"*
- *"What's in my cart and generate payment link"*

## Sample Products

- DeLonghi Coffee Machine (₪499)
- Samsung Galaxy S24 (₪3,299)
- ASUS Gaming Laptop (₪4,899)
- Sony Headphones (₪1,299)
- Home appliances and electronics

## Troubleshooting

**Server not responding?** Free tier hibernates after 15 min - first request wakes it up (30 sec delay). (demo limitation)

**Cart disappeared?** Cart data resets on server restart (demo limitation).

**Connection issues?** Verify URL and Claude connector configuration.

## Important

⚠️ **Demo only** - Mock data, non-functional payments, simulated stock
✅ **Perfect for** testing MCP capabilities and AI shopping workflows

---

*Proof-of-concept for Anthropic's Model Context Protocol e-commerce integration*