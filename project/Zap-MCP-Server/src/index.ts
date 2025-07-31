#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  sub_subcategory: string;
  brand: string;
  base_price: number;
  image_url: string;
  description: string;
  specs: Record<string, any>;
  keywords: string[];
}

interface Seller {
  id: string;
  name: string;
  rating: number;
  shipping_cost: number;
  shipping_time: string;
}

interface CartItem {
  product_id: string;
  seller_id: string;
  quantity: number;
  price: number;
}

let products: Product[] = [];
let sellers: Seller[] = [];
let cart: CartItem[] = [];

function loadData() {
  try {
    // Try multiple possible paths for the data files
    const possiblePaths = [
      join(__dirname, "../data"),           // Local development
      join(__dirname, "../../data"),        // NPM package structure (build/ -> root)
      join(__dirname, "../../../data"),     // NPM global install structure
      join(__dirname, "data"),              // Alternative structure
      join(process.cwd(), "data"),          // Current working directory
      join(process.cwd(), "node_modules/zap-mcp-server-home-assigment/data"), // NPM local install
      // For NPM package: data should be at package root, accessed from build/
      join(__dirname, "..", "data"),       // From build/ back to package root
    ];
    
    let dataLoaded = false;
    
    for (const basePath of possiblePaths) {
      try {
        const productsPath = join(basePath, "products.json");
        const sellersPath = join(basePath, "sellers.json");
        
        console.error(`Trying to load data from: ${basePath}`);
        console.error(`  Products path: ${productsPath}`);
        console.error(`  Sellers path: ${sellersPath}`);
        
        products = JSON.parse(readFileSync(productsPath, "utf-8"));
        sellers = JSON.parse(readFileSync(sellersPath, "utf-8"));
        
        console.error(`✅ Successfully loaded ${products.length} products and ${sellers.length} sellers from ${basePath}`);
        dataLoaded = true;
        break;
      } catch (pathError) {
        console.error(`❌ Failed to load from ${basePath}:`, pathError instanceof Error ? pathError.message : String(pathError));
        continue;
      }
    }
    
    if (!dataLoaded) {
      console.error("⚠️  Could not load data files from any path, using fallback data");
      console.error("📍 Current working directory:", process.cwd());
      console.error("📍 __dirname:", __dirname);
      console.error("📍 __filename:", __filename);
      console.error(`📦 Using fallback: ${products.length} products and ${sellers.length} sellers`);
    }
    
  } catch (error) {
    console.error("❌ Critical error loading data:", error);
    console.error("🔄 Falling back to minimal dataset");
    
    // Use fallback data as last resort
    console.error(`🆘 Emergency fallback: ${products.length} products and ${sellers.length} sellers`);
  }
}

const server = new McpServer({
  name: "zap-mcp-server-home-assigment",
  version: "1.0.5",
  capabilities: {
    resources: {},
    tools: {},
  },
});

function generatePriceVariation(basePrice: number, sellerId: string): number {
  const seed = sellerId.charCodeAt(sellerId.length - 1);
  const variation = (seed % 30 - 15) / 100;
  return Math.round(basePrice * (1 + variation));
}

function searchProducts(query: string, filters?: { price_min?: number; price_max?: number; category?: string; subcategory?: string; sub_subcategory?: string; brand?: string }): Product[] {
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
    
    if (filters?.price_min && product.base_price < filters.price_min) return false;
    if (filters?.price_max && product.base_price > filters.price_max) return false;
    if (filters?.category && product.category.toLowerCase() !== filters.category.toLowerCase()) return false;
    if (filters?.subcategory && product.subcategory.toLowerCase() !== filters.subcategory.toLowerCase()) return false;
    if (filters?.sub_subcategory && product.sub_subcategory.toLowerCase() !== filters.sub_subcategory.toLowerCase()) return false;
    if (filters?.brand && product.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
    
    return true;
  });
}

server.tool(
  "product_search",
  "Search Zap's product catalog using natural language",
  {
    query: z.string().describe("Natural language search query (e.g., 'gaming laptop under 5000 NIS')"),
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
          text: `Error searching products: ${error}`
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
          text: `Error getting product details: ${error}`
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
          text: `Error comparing prices: ${error}`
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
      
      if (!product) {
        return {
          content: [{
            type: "text",
            text: `Product with ID ${product_id} not found`
          }]
        };
      }
      
      if (!seller) {
        return {
          content: [{
            type: "text", 
            text: `Seller with ID ${seller_id} not found`
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
      const totalShipping = cart.reduce((sum, item) => {
        const itemSeller = sellers.find(s => s.id === item.seller_id);
        return sum + (itemSeller?.shipping_cost || 0);
      }, 0);

      return {
        content: [{
          type: "text",
          text: `✅ Added to cart: ${quantity}x ${product.name} from ${seller.name}

Cart Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Items: ${totalItems}
Subtotal: ₪${totalPrice}
Shipping: ₪${totalShipping}
Grand Total: ₪${totalPrice + totalShipping}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error adding to cart: ${error}`
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
            text: "Cart is empty. Add items to cart before generating payment link."
          }]
        };
      }

      const orderSummary = cart.map(item => {
        const product = products.find(p => p.id === item.product_id);
        const seller = sellers.find(s => s.id === item.seller_id);
        return `${item.quantity}x ${product?.name} from ${seller?.name} - ₪${item.price * item.quantity}`;
      }).join("\n");

      const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalShipping = cart.reduce((sum, item) => {
        const itemSeller = sellers.find(s => s.id === item.seller_id);
        return sum + (itemSeller?.shipping_cost || 0);
      }, 0);
      const grandTotal = totalPrice + totalShipping;

      const orderId = `ZAP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const paymentUrl = `https://shop.zap.co.il/cart/${orderId}`;

      return {
        content: [{
          type: "text",
          text: `💳 Payment Link Generated

Order ID: ${orderId}
Payment URL: ${paymentUrl}
User Email: ${user_email}

Order Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderSummary}

Subtotal: ₪${totalPrice}
Shipping: ₪${totalShipping}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ₪${grandTotal}

✉️ Payment link will be sent to: ${user_email}
🔗 Click here to complete payment: ${paymentUrl}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error generating payment link: ${error}`
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
      
      if (!product) {
        return {
          content: [{
            type: "text",
            text: `Product with ID ${product_id} not found`
          }]
        };
      }
      
      if (!seller) {
        return {
          content: [{
            type: "text",
            text: `Seller with ID ${seller_id} not found`
          }]
        };
      }

      const inStock = Math.random() > 0.2;
      const stockLevel = inStock ? Math.floor(Math.random() * 50) + 1 : 0;
      const deliveryTime = inStock ? 
        ["1-2 business days", "2-3 business days", "3-5 business days"][Math.floor(Math.random() * 3)] :
        "Out of stock";

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
          text: `Error checking availability: ${error}`
        }]
      };
    }
  }
);

async function main() {
  try {
    console.error("Starting Zap MCP Server v1.0.5");
    loadData();
    
    const transport = new StdioServerTransport();
    console.error("Connecting to transport...");
    await server.connect(transport);
    console.error("Zap MCP Server running on stdio");
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.error("Received SIGINT, shutting down gracefully");
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.error("Received SIGTERM, shutting down gracefully");
      process.exit(0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error("Uncaught Exception:", error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
    
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});