# Zap MCP Server Remote

A remote Model Context Protocol (MCP) server for Zap.co.il integration - deployed on Render with StreamableHTTP transport.

## Overview

This is the remote version of the Zap MCP Server, designed to run as a web service on Render. It provides the same e-commerce functionality as the local version but accessible via HTTP transport using MCP's StreamableHTTPServerTransport.

## Features

### 🛍️ MCP Tools (Same as Local Version)

1. **`product_search`** - Search products using natural language queries
2. **`get_product_details`** - Get detailed product specifications
3. **`compare_prices`** - Compare prices across multiple sellers
4. **`add_to_cart`** - Add items to shopping cart
5. **`generate_payment_link`** - Generate mock payment URLs
6. **`check_availability`** - Check real-time stock status

### 🌐 Remote MCP Capabilities

- **StreamableHTTP Transport** with session management
- **CORS enabled** for browser-based MCP clients
- **Auto-scaling** on Render platform
- **Environment-based configuration**
- **SSE support** for real-time notifications
- **Local data files** - Products and sellers loaded from JSON files in ./data directory

## Project Structure

```
Zap-MCP-Server-Remote/
├── index.js              # Main server file (Node.js + Express)
├── package.json           # Dependencies and scripts
├── render.yaml            # Render deployment config
├── data/                  # Data directory (436KB)
│   ├── products.json      # Product catalog with specs and pricing
│   └── sellers.json       # Seller info with ratings and shipping
├── README.md              # This documentation
├── DEPLOY.md              # Quick deployment guide
└── SUMMARY.md             # Project summary
```

## Quick Deploy to Render

### Step 1: Repository Setup

1. Create a new GitHub repository
2. Clone this directory to your repository:

```bash
git clone <your-repo-url>
cd <your-repo-name>
# Copy all files from Zap-MCP-Server-Remote to your repo
git add .
git commit -m "Initial commit: Zap MCP Server Remote"
git push origin main
```

### Step 2: Deploy on Render

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `zap-mcp-server-remote`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (for testing)

5. **Click "Deploy"**

Render will automatically:
- Install dependencies (`npm install`)
- Start the server (`npm start`)
- Provide you with a public URL

### Step 3: Test Your Deployment

Once deployed, visit your Render URL (e.g., `https://zap-mcp-server-remote.onrender.com`):

```json
{
  "name": "Zap MCP Server Remote",
  "version": "1.0.0",
  "status": "running",
  "products": 6,
  "sellers": 4,
  "mcp_endpoint": "/mcp"
}
```

## MCP Client Configuration

### Method 1: Claude Desktop Connectors (Recommended)

For Claude Desktop users on Pro, Max, Team, and Enterprise plans:

1. Open Claude Desktop → Settings → Connectors
2. Click "Add custom connector"
3. Enter your server URL: `https://your-app-name.onrender.com/mcp`
4. Click "Add" to finish configuration

### Method 2: Traditional MCP Configuration

For other MCP clients or Claude Desktop with config file:

```json
{
  "mcpServers": {
    "zap-remote": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-app-name.onrender.com/mcp"
      ],
      "enabled": true
    }
  }
}
```

Replace `your-app-name` with your actual Render app name.

### Method 3: Claude Code (CLI)

```bash
claude mcp add --transport http --scope local zap-remote https://your-app-name.onrender.com/mcp
```

## Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Server will run on http://localhost:3000
```

## API Endpoints

### Health Check
```
GET /
```
Returns server status and statistics.

### MCP Endpoint
```
POST /mcp
GET /mcp (SSE notifications)
DELETE /mcp (session termination)
```
StreamableHTTP transport endpoint for MCP communication with session management.

## Environment Variables

The server uses these environment variables:

- `PORT` - Server port (default: 3000, Render sets this automatically)

## Data Management

### Local Data Files

The server loads product and seller data from JSON files in the `./data` directory:

- **`data/products.json`** - Product catalog with specifications and pricing
- **`data/sellers.json`** - Seller information with ratings and shipping costs

This approach allows easy data management without code changes - simply update the JSON files and restart the server.

### Sample Products

The remote server includes 6 sample products:
- DeLonghi Coffee Machine (₪499)
- ASUS Gaming Laptop (₪4,899)
- Samsung Galaxy S24 (₪3,299)
- Sony Headphones (₪1,299)
- LG Refrigerator (₪8,999)
- Bosch Refrigerator (₪3,299)

### Project Size

- **Total project size**: 556KB
- **Data directory**: 436KB (78% of total)
- **Code and dependencies**: 120KB
- Well within free hosting limits for services like Render

## Deployment Architecture

```
GitHub Repository
       ↓
   Render Platform
       ↓
   Web Service (Node.js + MCP SDK)
       ↓
   MCP Client (StreamableHTTP)
```

## Troubleshooting

### Common Issues

1. **Render Deployment Fails**
   - Check that `package.json` has correct dependencies
   - Ensure `"type": "module"` is set for ES modules
   - Verify start command is `npm start`

2. **MCP Client Can't Connect**
   - Make sure your Render URL is correct
   - Check that `/mcp` endpoint is accessible
   - Verify CORS headers include `Mcp-Session-Id`
   - Ensure your MCP client supports HTTP transport

3. **Server Sleeps on Free Tier**
   - Render free tier sleeps after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds
   - Consider upgrading to paid tier for production

4. **Session Management Issues**
   - Sessions are stored in-memory (reset on server restart)
   - Each MCP client gets its own session ID
   - Session cleanup happens automatically on disconnect

### Logs

View logs in Render dashboard:
1. Go to your service dashboard
2. Click "Logs" tab
3. Monitor real-time server activity

## Differences from Local Version

| Feature | Local | Remote |
|---------|-------|--------|
| Transport | stdio | StreamableHTTP |
| Data Storage | JSON files | JSON files + in-memory cache |
| Scaling | Single instance | Auto-scaling |
| Access | Local only | Internet accessible |
| Configuration | CLI args | Environment vars |
| Session Management | Single session | Multi-session |
| Data Management | Direct file editing | Update JSON files + restart |

## CORS Configuration

The server includes proper CORS configuration for browser-based MCP clients:

```javascript
app.use(cors({
  origin: '*', // Configure appropriately for production
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));
```

## Cost

- **Free Tier**: 750 hours/month (sufficient for testing)
- **Starter**: $7/month (recommended for production)
- **Standard**: $25/month (high availability)

## Security Notes

- No authentication implemented (this is a demo)
- CORS enabled for all origins
- All data is in-memory (resets on restart)
- Use HTTPS URLs for production clients
- DNS rebinding protection disabled for compatibility

## License

ISC License - Proof-of-concept implementation.