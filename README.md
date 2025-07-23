# 🤖 Real-Time ChatBot Application

A modern, full-stack real-time chat application with AI integration, admin panel, and comprehensive user management. Built with Next.js, Express.js, Socket.io, and GitHub AI Models.

## ✨ Features

### 🚀 **Core Features**
- **Real-time messaging** with Socket.io
- **AI-powered responses** using GitHub AI Models (GPT-4.1)
- **Admin panel** for chat management
- **User session tracking** with real IP detection
- **Message persistence** with PostgreSQL
- **JWT authentication** for admin access

### 🎯 **Advanced Features**
- **Rate limit handling** with graceful fallback
- **Real-time notifications** for admins
- **AI status monitoring** with dashboard widget
- **Optimistic UI updates** for better UX
- **Environment-based configuration** for deployment
- **Comprehensive error handling** and logging

### 🔧 **Technical Features**
- **TypeScript** for type safety
- **Prisma ORM** for database management
- **TailwindCSS** for modern styling
- **Redux Toolkit** for state management
- **React Query** for server state management

## 🏗️ Architecture

```
chatBotApp/
├── client/          # Next.js Frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # Reusable components
│   │   ├── lib/           # Utilities and config
│   │   └── store/         # Redux store
│   └── package.json
├── server/          # Express.js Backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Custom middleware
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Helper functions
│   │   └── prisma/        # Database schema
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** database
- **GitHub AI Models API** token

### 1. Clone the Repository
```bash
git clone https://github.com/Meetkorat38/chatbot.git
cd chatBotApp
```

### 2. Setup Backend Server
```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)

# Setup database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### 3. Setup Frontend Client
```bash
cd client
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### 4. Access the Application
- **User Chat**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin/login
- **Backend API**: http://localhost:5000

## ⚙️ Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# Server Configuration
PORT=5000
NODE_ENV="development"

# Frontend Configuration (for CORS security)
FRONTEND_URL="http://localhost:3000"
# For Production: FRONTEND_URL="https://your-frontend-domain.com"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# AI Integration
OPENAI_API_KEY="your-github-models-api-token"
```

### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
NEXT_PUBLIC_ENV="development"
```

## 🗄️ Database Setup

### Using PostgreSQL (Recommended)
1. Create a PostgreSQL database
2. Add connection string to `DATABASE_URL` in `.env`
3. Run migrations:
```bash
cd server
npx prisma migrate dev
```

### Using Prisma Postgres (Cloud)
```bash
cd server
npx prisma platform login
npx prisma postgres create-database your-db-name --region us-east-1
# Copy the connection string to your .env file
```

## 🔑 Admin Panel Setup

### Create Admin Account
1. Start the backend server
2. Use Prisma Studio or direct database access:
```bash
cd server
npx prisma studio
```
3. Create an admin record in the `Admin` table with hashed password

### Admin Login
- Navigate to: http://localhost:3000/admin/login
- Use your admin credentials

## 🤖 AI Integration

### GitHub AI Models Setup
1. Get API token from GitHub Models
2. Add to `OPENAI_API_KEY` in server `.env`
3. The system uses GPT-4.1 model by default

### Rate Limit Handling
- **Free tier**: 50 requests/24 hours
- **Graceful fallback**: System messages when AI unavailable
- **Admin notifications**: Real-time alerts for AI failures
- **Status monitoring**: Dashboard widget shows AI availability

## 📱 Usage

### For Users
1. Visit the main page
2. Click the chat widget (💬) in bottom-right
3. Start chatting with AI or wait for admin response
4. Messages are persistent across sessions

### For Admins
1. Login to admin panel
2. View dashboard with real-time stats
3. Monitor live chats and respond to users
4. Toggle AI on/off per chat
5. Receive notifications for new messages

## 🔧 Development

### Key Scripts
```bash
# Backend
cd server
npm run dev          # Development server
npm run build        # Build for production
npm run start        # Production server
npx prisma studio    # Database GUI

# Frontend
cd client
npm run dev          # Development server
npm run build        # Build for production
npm run start        # Production server
npm run lint         # Lint code
```

### Database Commands
```bash
cd server
npx prisma migrate dev    # Create and apply migration
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open database GUI
npx prisma db push       # Push schema changes
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Run database migrations
3. Build and start:
```bash
npm run build
npm start
```

### Frontend Deployment
1. Update `NEXT_PUBLIC_API_BASE_URL` to production URL
2. Build and deploy:
```bash
npm run build
npm start
```

### Environment Configuration
Update these for production:
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL="https://your-api-domain.com"
NEXT_PUBLIC_SOCKET_URL="https://your-api-domain.com"
NEXT_PUBLIC_ENV="production"

# Backend (.env)
NODE_ENV="production"
FRONTEND_URL="https://your-frontend-domain.com"
DATABASE_URL="your-production-db-url"
PORT=5000
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Redux Toolkit** - State management
- **React Query** - Server state
- **Socket.io Client** - Real-time communication

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Socket.io** - Real-time communication
- **Prisma** - ORM and database client
- **PostgreSQL** - Database
- **JWT** - Authentication
- **OpenAI** - AI integration

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Admin Routes
- `GET /api/admin/chats` - Get all chats
- `GET /api/admin/chat/:id` - Get specific chat
- `POST /api/admin/reply` - Reply to chat
- `POST /api/admin/toggle-ai` - Toggle AI for chat

### System Routes
- `GET /api/system/ai-status` - Check AI service status

## 🔄 Socket Events

### Client → Server
- `join` - Join chat session
- `message` - Send message
- `admin-message` - Admin sends message

### Server → Client
- `message` - Receive message
- `admin-message` - Admin message broadcast
- `new-chat` - New chat notification
- `ai-error-notification` - AI service alerts

## 🐛 Troubleshooting

### Common Issues

**Rate Limit Errors**
- AI shows system messages when rate limited
- Check AI status widget in admin dashboard
- Rate limits reset every 24 hours

**Database Connection**
- Verify `DATABASE_URL` is correct
- Run `npx prisma generate` after schema changes
- Check database is accessible

**Socket Connection**
- Ensure both frontend and backend are running
- Check CORS settings in backend
- Verify `NEXT_PUBLIC_SOCKET_URL` matches backend

### Logs
- Backend logs: Check terminal running server
- Frontend logs: Check browser console
- Database logs: Use `npx prisma studio`

**Happy Chatting! 🎉**
