$root = "madlenCRM"

$folders = @(
    "$root/server/src/models",
    "$root/server/src/routes",
    "$root/server/src/controllers",
    "$root/server/src/middleware",
    "$root/server/src/utils",
    "$root/client/src/pages/Dashboard",
    "$root/client/src/pages/Clients",
    "$root/client/src/pages/Calendar",
    "$root/client/src/pages/Staff",
    "$root/client/src/pages/Finance",
    "$root/client/src/pages/Inventory",
    "$root/client/src/pages/Loyalty",
    "$root/client/src/pages/Analytics",
    "$root/client/src/pages/Settings",
    "$root/client/src/components/ui",
    "$root/client/src/components/layout",
    "$root/client/src/components/shared",
    "$root/client/src/styles",
    "$root/client/src/store",
    "$root/client/src/api"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

Set-Content "$root/server/package.json" '{
  "name": "madlen-crm-server",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-validator": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.1",
    "morgan": "^1.10.0",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.3"
  }
}'

Set-Content "$root/server/.env.example" 'PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/madlenCRM?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173'

Set-Content "$root/server/.env" 'PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/madlenCRM?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173'

Set-Content "$root/server/src/app.js" 'const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected: " + socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected: " + socket.id));
});

app.set("io", io);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api/auth",         require("./routes/auth.routes"));
app.use("/api/clients",      require("./routes/clients.routes"));
app.use("/api/staff",        require("./routes/staff.routes"));
app.use("/api/services",     require("./routes/services.routes"));
app.use("/api/appointments", require("./routes/appointments.routes"));
app.use("/api/finance",      require("./routes/finance.routes"));
app.use("/api/inventory",    require("./routes/inventory.routes"));
app.use("/api/loyalty",      require("./routes/loyalty.routes"));
app.use("/api/analytics",    require("./routes/analytics.routes"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ message: err.message || "Internal Server Error" });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    httpServer.listen(process.env.PORT || 5000, () =>
      console.log("Server running on http://localhost:" + (process.env.PORT || 5000))
    );
  })
  .catch((err) => { console.error("MongoDB error:", err.message); process.exit(1); });'

$routes = @("auth", "clients", "staff", "services", "appointments", "finance", "inventory", "loyalty", "analytics")
foreach ($route in $routes) {
    Set-Content "$root/server/src/routes/$route.routes.js" "const router = require('express').Router();
// TODO: $route routes
module.exports = router;"
}

Set-Content "$root/client/src/styles/_variables.scss" '$color-primary:    #6C63FF;
$color-secondary:  #F5A623;
$color-bg:         #0F0F13;
$color-surface:    #1A1A24;
$color-border:     #2A2A3A;
$color-text:       #E8E8F0;
$color-text-muted: #8888AA;
$color-success:    #4CAF7D;
$color-danger:     #FF5C5C;

$font-family: "Inter", sans-serif;
$font-size-base: 14px;

$radius-sm:  6px;
$radius-md:  10px;
$radius-lg:  16px;

$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;

$sidebar-width: 240px;'

Set-Content "$root/client/src/styles/_mixins.scss" '@use "variables" as *;

@mixin flex($direction: row, $align: center, $justify: flex-start) {
  display: flex;
  flex-direction: $direction;
  align-items: $align;
  justify-content: $justify;
}

@mixin card {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: $spacing-md;
}

@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}'

Set-Content "$root/client/src/styles/main.scss" '@use "variables" as *;
@use "mixins" as *;

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: $font-family;
  font-size: $font-size-base;
  background: $color-bg;
  color: $color-text;
  line-height: 1.5;
}

a { color: inherit; text-decoration: none; }
button { cursor: pointer; font-family: inherit; }
input, textarea, select { font-family: inherit; }'

Set-Content "$root/.gitignore" 'node_modules/
.env
dist/
.DS_Store'

Set-Content "$root/README.md" '# madlenCRM

CRM for barbershops and beauty salons.

## Stack
- Backend: Node.js + Express + MongoDB
- Frontend: React + Vite + SCSS
- Auth: JWT
- Real-time: Socket.io

## Run

### Backend
cd server && npm install && npm run dev

### Frontend
cd client && npm install && npm run dev'

Write-Host "Done! madlenCRM structure created." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd madlenCRM/server && npm install"
Write-Host "  2. Fill in server/.env (MONGODB_URI from Atlas)"
Write-Host "  3. cd ../client && npm create vite@latest . -- --template react"