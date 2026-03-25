# 🐾 Fellua - Pet Shop Management System

A complete pet shop management system with AI chatbot, product management, order tracking, and financial reporting.

## ✨ Features

- 👥 User authentication & role-based access (Customer, Staff, Admin)
- 🛍️ Product catalog with categories (Dogs, Cats, Birds, Hamsters, Fish)
- 📦 Order management & tracking
- 💰 PPC advertising campaigns
- 📊 Financial reports with AI analysis
- 🤖 AI chatbot for customer support
- ☁️ Cloud image storage with Cloudinary

---

## 📋 Requirements

- **Node.js** ≥ 14.0
- **npm** ≥ 6.0
- **React** 18+
- **SQL Server** 2016 or later
- Internet connection for APIs

---

## 🚀 Quick Start

### 1️⃣ Clone Repository
```bash
git clone https://github.com/Starikaa/Fellua---Pet-Shop-Management-System.git
cd Fellua---Pet-Shop-Management-System
```

### 2️⃣ Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3️⃣ Setup Database

1. Open SQL Server Management Studio
2. Create new database: `Fellua_PetShop`
3. Run the `SQLQuery1.sql` file to create tables and seed data

### 4️⃣ Configure Environment Variables

Create `.env` file in `backend` folder and fill in all required values (see **Environment Variables** section below)

### 5️⃣ Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

Backend will run on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Frontend will run on: `http://localhost:3000`

---

## 📝 Environment Variables

### Required APIs to Setup

You need to create accounts and get API keys for these three services:

#### 1️⃣ **Cloudinary** (for product images)
- **Website**: https://cloudinary.com
- **Sign up**: Free account
- **What to copy**:
  - Cloud Name
  - API Key
  - API Secret

#### 2️⃣ **Google Gemini** (for AI chatbot)
- **Website**: https://aistudio.google.com/app/apikey
- **Sign up**: Google account required
- **What to copy**:
  - API Key

#### 3️⃣ **SQL Server** (database)
- **Default login**: `sa` (SQL Server admin)
- **Your password**: The password you set during SQL Server installation
- **Database name**: `Fellua_PetShop`

---

### Backend `.env` Template

Create file `backend/.env` and fill in these values:

```env
# ===== DATABASE =====
SQL_SERVER=localhost
SQL_DATABASE=Fellua_PetShop
SQL_USER=sa
SQL_PASSWORD=YOUR_SQL_SERVER_PASSWORD_HERE

# ===== SECURITY =====
JWT_SECRET=your_secret_key_here_make_it_long_and_random_string

# ===== CLOUDINARY (Image Storage) =====
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# ===== GOOGLE GEMINI (AI Chatbot) =====
GEMINI_API_KEY=your_gemini_api_key_here

# ===== SERVER =====
PORT=5000
NODE_ENV=development
```

## 📁 Project Structure

```
Fellua---Pet-Shop-Management-System/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env                    ⭐ Create this file
├── frontend/
│   ├── src/
│   ├── package.json
│   └── public/
├── SQLQuery1.sql               ⭐ Run this on your database
└── README.md
```

---

## ✅ Checklist Before Running

- [ ] Node.js installed
- [ ] SQL Server installed and running
- [ ] Database `Fellua_PetShop` created
- [ ] `SQLQuery1.sql` executed on the database
- [ ] Cloudinary account created & credentials copied to `.env`
- [ ] Google Gemini API key copied to `.env`
- [ ] SQL Server credentials filled in `.env`
- [ ] `backend/.env` file created with all values
- [ ] `npm install` completed in both backend and frontend

---

## 📚 Main Features

### For Customers
- Browse pet products
- View product details
- Chat with AI assistant
- Create orders
- Track order status

### For Staff
- Same as customers
- View all orders
- Update order status

### For Admin
- User management (lock/unlock accounts, change roles)
- Product management (add, edit, delete)
- Order management
- Financial reports with AI insights
- Campaign management

---

## 🔗 API Endpoints

```
GET  /api/products              List all products
POST /api/orders                Create new order
GET  /api/admin/orders          Get all orders (Admin)
POST /api/chat/message          Send chat message
GET  /api/admin/reports         Get financial report
