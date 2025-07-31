# Zap-MCP-Server

MCP server for Zap.co.il e-commerce integration with local mock data.

## Installation

```bash
# Install globally
npm install -g zap-mcp-server-home-assigment

# Or use directly
npx zap-mcp-server-home-assigment
```

## MCP Client Configuration

Add to your MCP client settings:

```json
{
  "mcpServers": {
    "zap-mcp-server-home-assigment": {
      "command": "npx",
      "args": ["zap-mcp-server-home-assigment"],
      "enabled": true
    }
  }
}
```

## Features

- **product_search** - Search products with filters
- **get_product_details** - Get detailed product info
- **compare_prices** - Compare prices across sellers
- **add_to_cart** - Manage shopping cart
- **generate_payment_link** - Create payment URLs
- **check_availability** - Check stock status
- **browse_categories** - Browse Hebrew categories
- **get_categories** - Get category hierarchy

## Local Development

```bash
# Clone and install
npm install
npm run build

# Run server
node build/index.js
```

## Mock Data

- 634+ products with Hebrew categories
- 4 mock sellers with varying prices
- Session-based cart management
- 80% stock availability simulation

## Example Usage

1. Search: `product_search("coffee machine", {price_max: 500})`
2. Compare: `compare_prices("product_id")`
3. Add to cart: `add_to_cart("product_id", "seller_id", 1)`
4. Payment: `generate_payment_link("user@email.com")`