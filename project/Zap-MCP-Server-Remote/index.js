#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration for browser-based MCP clients
app.use(cors());

app.use(express.json());

// Map to store transports by session ID
const transports = {};

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load data from JSON files
const sellers = JSON.parse(readFileSync(join(__dirname, 'data', 'sellers.json'), 'utf8'));
const products = JSON.parse(readFileSync(join(__dirname, 'data', 'products.json'), 'utf8'));

// Cart storage (in-memory for demo)
let cart = [];

// Helper functions
function generatePriceVariation(basePrice, sellerId) {
  const seed = sellerId.charCodeAt(sellerId.length - 1);
  const variation = (seed % 30 - 15) / 100;
  return Math.round(basePrice * (1 + variation));
}

function searchProducts(query, filters = {}) {
  const queryLower = query.toLowerCase();
  
  return products.filter(product => {
    const matchesQuery = product.keywords.some(keyword => 
      keyword.toLowerCase().includes(queryLower)
    ) || product.name.toLowerCase().includes(queryLower) ||
       product.description.toLowerCase().includes(queryLower) ||
       product.category.toLowerCase().includes(queryLower) ||
       product.subcategory.toLowerCase().includes(queryLower) ||
       product.sub_subcategory.toLowerCase().includes(queryLower);
    
    if (!matchesQuery) return false;
    
    if (filters.price_min && product.base_price < filters.price_min) return false;
    if (filters.price_max && product.base_price > filters.price_max) return false;
    if (filters.category && product.category.toLowerCase() !== filters.category.toLowerCase()) return false;
    if (filters.subcategory && product.subcategory.toLowerCase() !== filters.subcategory.toLowerCase()) return false;
    if (filters.sub_subcategory && product.sub_subcategory.toLowerCase() !== filters.sub_subcategory.toLowerCase()) return false;
    if (filters.brand && product.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
    
    return true;
  });
}

// Create MCP server instance
function createMcpServer() {
  const server = new McpServer({
    name: "zap-mcp-server-remote",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Register MCP tools
  server.tool(
    "product_search",
    "Search Zap's product catalog using natural language",
    {
      query: z.string().describe("Natural language search query (e.g., 'gaming laptop under 5000 NIS'), not case-sensitive, for example: 'laptop', 'gaming laptop', 'laptop under 5000 NIS' or 'ארון' , 'ארונות'"),
      filters: z.object({
        price_min: z.number().optional().describe("Minimum price in NIS"),
        price_max: z.number().optional().describe("Maximum price in NIS"),
        category: z.string().optional().describe("Main category filter (Hebrew)"),
        subcategory: z.string().optional().describe("Subcategory filter (Hebrew)"),
        sub_subcategory: z.string().optional().describe("Sub-subcategory filter (Hebrew)"),
        brand: z.string().optional().describe("Brand filter")
      }).optional().describe("Optional filters for search")
    },
    async ({ query, filters }) => {
      try {
        const results = searchProducts(query, filters);
        
        if (results.length === 0) {
          console.error(`No products found for query: "${query}"`);
          return {
            content: [{
              type: "text",
              text: `No products found for query: "${query}"`
            }]
          };
        }

        const productList = results.slice(0, 10).map(product => 
          `• ${product.name} (${product.brand})\n  Price: ₪${product.base_price}\n  Category: ${product.category} > ${product.subcategory} > ${product.sub_subcategory}\n  ID: ${product.id}\n  ${product.description}`
        ).join("\n\n");
        console.log(`Search results for "${query}":`, productList);

        return {
          content: [{
            type: "text", 
            text: `Found ${results.length} products for "${query}":\n\n${productList}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error searching products: ${error.message}`
          }]
        };
      }
    }
  );

  server.tool(
    "get_product_details",
    "Retrieve detailed information about a specific product",
    {
      product_id: z.string().describe("Product ID to get details for")
    },
    async ({ product_id }) => {
      try {
        const product = products.find(p => p.id === product_id);
        
        if (!product) {
          console.error(`Product with ID ${product_id} not found`);
          return {
            content: [{
              type: "text",
              text: `Product with ID ${product_id} not found`
            }]
          };
        }

        const specs = Object.entries(product.specs)
          .map(([key, value]) => `  ${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("\n");

        const details = `Product Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${product.name}
Brand: ${product.brand}
Category: ${product.category} > ${product.subcategory} > ${product.sub_subcategory}
Base Price: ₪${product.base_price}
Product ID: ${product.id}

Description:
${product.description}

Specifications:
${specs}

Image: ${product.image_url}`;
        console.log(`Product details for ID ${product_id}:`, details);
        return {
          content: [{
            type: "text",
            text: details
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting product details: ${error.message}`
          }]
        };
      }
    }
  );

  server.tool(
    "compare_prices",
    "Get Wisebuy price comparison data across sellers",
    {
      product_id: z.string().describe("Product ID to compare prices for")
    },
    async ({ product_id }) => {
      try {
        const product = products.find(p => p.id === product_id);
        
        if (!product) {
          return {
            content: [{
              type: "text",
              text: `Product with ID ${product_id} not found`
            }]
          };
        }

        const priceComparison = sellers.map(seller => {
          const price = generatePriceVariation(product.base_price, seller.id);
          const totalWithShipping = price + seller.shipping_cost;
          const inStock = Math.random() > 0.2;
          
          return `• ${seller.name} (Rating: ${seller.rating}⭐)
  Price: ₪${price}
  Shipping: ₪${seller.shipping_cost} (${seller.shipping_time})
  Total: ₪${totalWithShipping}
  Stock: ${inStock ? "✅ In Stock" : "❌ Out of Stock"}
  Seller ID: ${seller.id}`;
        }).join("\n\n");

        console.log(`Price comparison for product ID ${product_id}:`, priceComparison);

        return {
          content: [{
            type: "text",
            text: `Price Comparison for ${product.name}:\n\n${priceComparison}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error comparing prices: ${error.message}`
          }]
        };
      }
    }
  );

  server.tool(
    "add_to_cart",
    "Add selected items to shopping cart",
    {
      product_id: z.string().describe("Product ID to add to cart"),
      seller_id: z.string().describe("Seller ID from price comparison"),
      quantity: z.number().min(1).describe("Quantity to add")
    },
    async ({ product_id, seller_id, quantity }) => {
      try {
        const product = products.find(p => p.id === product_id);
        const seller = sellers.find(s => s.id === seller_id);
        
        if (!product || !seller) {
          return {
            content: [{
              type: "text",
              text: `Product or seller not found`
            }]
          };
        }

        const price = generatePriceVariation(product.base_price, seller_id);
        
        const existingItem = cart.find(item => 
          item.product_id === product_id && item.seller_id === seller_id
        );
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.push({ product_id, seller_id, quantity, price });
        }

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        console.log(`Added ${quantity}x ${product.name} to cart from seller ${seller.name}. Cart now has ${totalItems} items totaling ₪${totalPrice}.`);

        return {
          content: [{
            type: "text",
            text: `✅ Added to cart: ${quantity}x ${product.name}\n\nCart Summary:\nTotal Items: ${totalItems}\nTotal Price: ₪${totalPrice}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error adding to cart: ${error.message}`
          }]
        };
      }
    }
  );

  server.tool(
    "generate_payment_link",
    "Generate a payment link for the user's cart. Always return the payment URL to the user so they can complete their purchase.",
    {
      user_email: z.string().email().describe("User email for sending payment link")
    },
    async ({ user_email }) => {
      try {
        if (cart.length === 0) {
          return {
            content: [{
              type: "text",
              text: "Cart is empty"
            }]
          };
        }

        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderId = `ZAP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const paymentUrl = `https://shop.zap.co.il/cart/${orderId}`;
        console.log(`Generated payment link for order ${orderId} totaling ₪${totalPrice} to ${user_email}.`);

        return {
          content: [{
            type: "text",
            text: `💳 Payment Link Generated\n\nOrder ID: ${orderId}\nTotal: ₪${totalPrice}\nPayment URL: ${paymentUrl}\n\n✉️ Link sent to: ${user_email}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error generating payment link: ${error.message}`
          }]
        };
      }
    }
  );

  server.tool(
    "check_availability",
    "Check real-time stock status for a product from specific seller",
    {
      product_id: z.string().describe("Product ID to check"),
      seller_id: z.string().describe("Seller ID to check stock from")
    },
    async ({ product_id, seller_id }) => {
      try {
        const product = products.find(p => p.id === product_id);
        const seller = sellers.find(s => s.id === seller_id);
        
        if (!product || !seller) {
          console.error(`Product or seller not found for ID ${product_id} and seller ${seller_id}`);
          return {
            content: [{
              type: "text",
              text: `Product or seller not found`
            }]
          };
        }

        const inStock = Math.random() > 0.2;
        const stockLevel = inStock ? Math.floor(Math.random() * 50) + 1 : 0;
        const deliveryTime = inStock ? 
          ["1-2 business days", "2-3 business days", "3-5 business days"][Math.floor(Math.random() * 3)] :
          "Out of stock";
        console.log(`Checked availability for product ID ${product_id} from seller ${seller.name}: ${inStock ? "In Stock" : "Out of Stock"}.`);

        return {
          content: [{
            type: "text",
            text: `Stock Check Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product: ${product.name}
Seller: ${seller.name}
Status: ${inStock ? "✅ IN STOCK" : "❌ OUT OF STOCK"}
${inStock ? `Stock Level: ${stockLevel} units available` : ""}
Estimated Delivery: ${deliveryTime}
Price: ₪${generatePriceVariation(product.base_price, seller_id)}
Shipping: ₪${seller.shipping_cost} (${seller.shipping_time})`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error checking availability: ${error.message}`
          }]
        };
      }
    }
  );

  return server;
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: "Zap MCP Server Remote",
    version: "1.0.0",
    status: "running",
    products: products.length,
    sellers: sellers.length,
    mcp_endpoint: "/mcp",
    api_endpoints: {
      search: {
        method: "GET",
        path: "/api/search",
        params: "?query=<search_term>&limit=<number>&price_min=<min>&price_max=<max>&category=<cat>&brand=<brand>",
        description: "Search products by query with optional filters"
      },
      product_details: {
        method: "GET", 
        path: "/api/product/<product_id>",
        description: "Get detailed information about a specific product"
      },
      price_comparison: {
        method: "GET",
        path: "/api/compare/<product_id>",
        description: "Compare prices across different sellers for a product"
      },
      add_to_cart: {
        method: "POST",
        path: "/api/cart/add",
        body: { product_id: "string", seller_id: "string", quantity: "number" },
        description: "Add items to shopping cart"
      },
      view_cart: {
        method: "GET",
        path: "/api/cart",
        description: "View current cart contents and totals"
      },
      generate_payment: {
        method: "POST",
        path: "/api/payment/generate",
        body: { user_email: "string" },
        description: "Generate payment link for cart contents"
      },
      check_availability: {
        method: "GET",
        path: "/api/availability/<product_id>/<seller_id>",
        description: "Check real-time stock status for a product from specific seller"
      }
    }
  });
});

// Simple REST API endpoints for OpenAI actions
app.get('/api/search', (req, res) => {
  try {
    const { query, limit = 10, price_min, price_max, category, subcategory, brand } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const filters = {};
    if (price_min) filters.price_min = parseInt(price_min);
    if (price_max) filters.price_max = parseInt(price_max);
    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;
    if (brand) filters.brand = brand;

    const results = searchProducts(query, filters);
    const limitedResults = results.slice(0, parseInt(limit));

    res.json({
      query,
      total_found: results.length,
      returned: limitedResults.length,
      products: limitedResults.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.base_price,
        category: product.category,
        subcategory: product.subcategory,
        sub_subcategory: product.sub_subcategory,
        description: product.description,
        image_url: product.image_url
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/product/:id', (req, res) => {
  try {
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.base_price,
      category: product.category,
      subcategory: product.subcategory,
      sub_subcategory: product.sub_subcategory,
      description: product.description,
      specs: product.specs,
      keywords: product.keywords,
      image_url: product.image_url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/compare/:id', (req, res) => {
  try {
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const comparison = sellers.map(seller => {
      const price = generatePriceVariation(product.base_price, seller.id);
      const totalWithShipping = price + seller.shipping_cost;
      const inStock = Math.random() > 0.2;
      
      return {
        seller_id: seller.id,
        seller_name: seller.name,
        price: price,
        shipping_cost: seller.shipping_cost,
        shipping_time: seller.shipping_time,
        total_price: totalWithShipping,
        rating: seller.rating,
        in_stock: inStock
      };
    });

    res.json({
      product_id: product.id,
      product_name: product.name,
      base_price: product.base_price,
      sellers: comparison
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cart/add', (req, res) => {
  try {
    const { product_id, seller_id, quantity } = req.body;
    
    if (!product_id || !seller_id || !quantity) {
      return res.status(400).json({ error: "product_id, seller_id, and quantity are required" });
    }

    const product = products.find(p => p.id === product_id);
    const seller = sellers.find(s => s.id === seller_id);
    
    if (!product || !seller) {
      return res.status(404).json({ error: "Product or seller not found" });
    }

    const price = generatePriceVariation(product.base_price, seller_id);
    
    const existingItem = cart.find(item => 
      item.product_id === product_id && item.seller_id === seller_id
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ product_id, seller_id, quantity, price });
    }

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      success: true,
      message: `Added ${quantity}x ${product.name} to cart from ${seller.name}`,
      cart_summary: {
        total_items: totalItems,
        total_price: totalPrice,
        items: cart.map(item => {
          const prod = products.find(p => p.id === item.product_id);
          const sell = sellers.find(s => s.id === item.seller_id);
          return {
            product_id: item.product_id,
            product_name: prod?.name,
            seller_id: item.seller_id,
            seller_name: sell?.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
          };
        })
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cart', (req, res) => {
  try {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      total_items: totalItems,
      total_price: totalPrice,
      items: cart.map(item => {
        const product = products.find(p => p.id === item.product_id);
        const seller = sellers.find(s => s.id === item.seller_id);
        return {
          product_id: item.product_id,
          product_name: product?.name,
          seller_id: item.seller_id,
          seller_name: seller?.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        };
      })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payment/generate', (req, res) => {
  try {
    const { user_email } = req.body;
    
    if (!user_email) {
      return res.status(400).json({ error: "user_email is required" });
    }

    if (cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = `ZAP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const paymentUrl = `https://shop.zap.co.il/cart/${orderId}`;

    res.json({
      success: true,
      order_id: orderId,
      total_price: totalPrice,
      payment_url: paymentUrl,
      user_email: user_email,
      message: `Payment link generated for order ${orderId}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/availability/:product_id/:seller_id', (req, res) => {
  try {
    const { product_id, seller_id } = req.params;
    
    const product = products.find(p => p.id === product_id);
    const seller = sellers.find(s => s.id === seller_id);
    
    if (!product || !seller) {
      return res.status(404).json({ error: "Product or seller not found" });
    }

    const inStock = Math.random() > 0.2;
    const stockLevel = inStock ? Math.floor(Math.random() * 50) + 1 : 0;
    const deliveryTime = inStock ? 
      ["1-2 business days", "2-3 business days", "3-5 business days"][Math.floor(Math.random() * 3)] :
      "Out of stock";

    res.json({
      product_id: product.id,
      product_name: product.name,
      seller_id: seller.id,
      seller_name: seller.name,
      in_stock: inStock,
      stock_level: stockLevel,
      estimated_delivery: deliveryTime,
      price: generatePriceVariation(product.base_price, seller_id),
      shipping_cost: seller.shipping_cost,
      shipping_time: seller.shipping_time
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  try {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'];
    let transport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          // Store the transport by session ID
          transports[sessionId] = transport;
        },
        // DNS rebinding protection is disabled by default for backwards compatibility
        enableDnsRebindingProtection: false,
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      const server = createMcpServer();

      // Connect to the MCP server
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

// Start server
app.listen(port, () => {
  console.log(`🚀 Zap MCP Server Remote running on port ${port}`);
  console.log(`📊 Loaded ${products.length} products and ${sellers.length} sellers`);
  console.log(`🌐 Health check: http://localhost:${port}`);
  console.log(`🔌 MCP endpoint: http://localhost:${port}/mcp`);
});