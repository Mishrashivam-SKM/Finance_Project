# FinanceGuide - Personal Finance Coach

A comprehensive MERN stack application that helps users manage their personal finances with AI-powered insights, interactive budgeting tools, and financial literacy quizzes.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-9.0-green.svg)

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Project Overview

FinanceGuide is a full-stack personal finance management application designed to empower users to take control of their financial health. The application combines traditional financial tracking tools with cutting-edge AI technology to provide personalized saving tips and actionable insights.

### Key Highlights

- **Smart Financial Tracking**: Track income, expenses, assets, and debts in one place
- **AI-Powered Insights**: Get personalized saving tips from Google's Gemini AI based on your spending patterns
- **Investment Simulations**: Plan for the future with compound interest and retirement calculators
- **Financial Literacy**: Test and improve your financial knowledge with interactive quizzes
- **Beautiful UI**: Modern, responsive interface built with Chakra UI

## ✨ Core Features

### User Authentication & Security
- Secure user registration and login with JWT authentication
- Password hashing with bcrypt
- Protected routes for authenticated users
- Admin role for content management

### Financial Management
- **Transaction Tracking**: Log income and expenses with categories
- **Asset Management**: Track investments, properties, and other assets
- **Debt Management**: Monitor loans, credit cards, and other liabilities
- **Budget Planning**: Set and track monthly budgets by category

### Reports & Analytics
- **Net Worth Calculator**: Real-time calculation of assets minus debts
- **Spending Breakdown**: Visual pie charts showing expense distribution
- **90-Day Financial Summary**: Comprehensive overview of financial activity

### Investment Simulations
- **Compound Interest Calculator**: Project investment growth over time
- **Retirement Planner**: Calculate inflation-adjusted retirement savings
- Yearly projection charts with Recharts visualization

### AI Finance Coach
- **Personalized Saving Tips**: AI-generated advice based on your financial data
- Powered by Google Gemini 2.5 Flash model
- Contextual recommendations considering income, expenses, and spending patterns

### Financial Literacy Quizzes
- Multiple-choice questions on various financial topics
- Categories: Debt, Investing, Budgeting, Saving, Tax Planning, Retirement
- Score tracking and answer review
- Admin panel for quiz management

### Admin Dashboard
- Create and manage financial tips
- CRUD operations for quiz questions
- Content publishing controls

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library for building user interfaces |
| **Chakra UI** | Component library for accessible, responsive design |
| **React Router** | Client-side routing |
| **Recharts** | Data visualization (charts and graphs) |
| **Context API** | State management for authentication |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js 5** | Web application framework |
| **MongoDB** | NoSQL database for data persistence |
| **Mongoose 9** | MongoDB object modeling |
| **JWT** | Token-based authentication |
| **bcrypt** | Password hashing |

### AI & APIs
| Technology | Purpose |
|------------|---------|
| **Google Gemini API** | AI-powered personalized financial advice |
| **@google/generative-ai** | Official Google AI SDK for Node.js |

### Development Tools
| Tool | Purpose |
|------|---------|
| **dotenv** | Environment variable management |
| **cors** | Cross-Origin Resource Sharing |
| **nodemon** | Development server with hot reload |

## 📁 Project Structure

```
Finance_Project/
├── server.js                 # Express server entry point
├── package.json              # Backend dependencies
├── config/
│   └── db.js                 # MongoDB connection
├── middleware/
│   ├── auth.js               # JWT authentication middleware
│   └── adminAuth.js          # Admin authorization middleware
├── models/
│   ├── User.js               # User schema
│   ├── Transaction.js        # Income/expense transactions
│   ├── Asset.js              # User assets
│   ├── Debt.js               # User debts
│   ├── Budget.js             # Budget plans
│   ├── Category.js           # Transaction categories
│   ├── Tip.js                # Admin financial tips
│   └── QuizQuestion.js       # Quiz questions
├── routes/
│   ├── auth.routes.js        # Authentication endpoints
│   ├── transactions.routes.js # Transaction CRUD
│   ├── asset.routes.js       # Asset management
│   ├── debt.routes.js        # Debt management
│   ├── budget.routes.js      # Budget operations
│   ├── reports.routes.js     # Reports & simulations
│   ├── admin.routes.js       # Admin operations
│   └── quizzes.routes.js     # Quiz endpoints
├── utils/
│   ├── financialCalculations.js  # Investment calculators
│   └── geminiAI.js           # Gemini AI integration
└── finance-client/           # React frontend
    ├── package.json
    ├── public/
    └── src/
        ├── components/       # Reusable UI components
        ├── context/          # React Context providers
        └── pages/            # Page components
```

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Google Cloud Account** (for Gemini API key)

### 1. Clone the Repository

```bash
git clone https://github.com/Mishrashivam-SKM/Finance_Project.git
cd Finance_Project
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd finance-client
npm install
cd ..
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the required environment variables (see [Environment Variables](#environment-variables) section).

### 5. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running locally
mongod
```

**Option B: MongoDB Atlas**
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Add it to your `.env` file

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/financeguide
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/financeguide

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting Your API Keys

#### MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Click "Connect" and choose "Connect your application"
4. Copy the connection string

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

#### JWT Secret
Generate a secure random string:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🏃 Running the Application

### Development Mode

#### Run Backend Only
```bash
npm run server
```

#### Run Frontend Only
```bash
cd finance-client
npm start
```

#### Run Both Concurrently

First, install concurrently (if not already installed):
```bash
npm install concurrently --save-dev
```

Add these scripts to your root `package.json`:
```json
{
  "scripts": {
    "start": "node server.js",
    "server": "nodemon server.js",
    "client": "npm start --prefix finance-client",
    "dev": "concurrently \"npm run server\" \"npm run client\""
  }
}
```

Then run:
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Production Mode

#### Build the Frontend
```bash
cd finance-client
npm run build
cd ..
```

#### Start Production Server
```bash
NODE_ENV=production npm start
```

The application will serve both the API and the React build from http://localhost:5000

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get all transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | Get all assets |
| POST | `/api/assets` | Create asset |
| PUT | `/api/assets/:id` | Update asset |
| DELETE | `/api/assets/:id` | Delete asset |

### Debts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/debts` | Get all debts |
| POST | `/api/debts` | Create debt |
| PUT | `/api/debts/:id` | Update debt |
| DELETE | `/api/debts/:id` | Delete debt |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Get all budgets |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |

### Reports & Simulations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/networth` | Get net worth |
| GET | `/api/reports/spending-breakdown` | Get spending by category |
| GET | `/api/reports/saving-tips` | Get AI-powered saving tips |
| POST | `/api/reports/simulations/investment` | Run investment simulation |
| POST | `/api/reports/simulations/retirement` | Run retirement simulation |

### Quizzes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quizzes/start` | Start a quiz (10 random questions) |
| POST | `/api/quizzes/submit` | Submit quiz answers |

### Admin (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/tips` | Get all tips |
| POST | `/api/admin/tips` | Create tip |
| PUT | `/api/admin/tips/:id` | Update tip |
| DELETE | `/api/admin/tips/:id` | Delete tip |
| GET | `/api/admin/quizzes` | Get all quiz questions |
| POST | `/api/admin/quizzes` | Create quiz question |
| PUT | `/api/admin/quizzes/:id` | Update quiz question |
| DELETE | `/api/admin/quizzes/:id` | Delete quiz question |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

---

Built with ❤️ using the MERN Stack
