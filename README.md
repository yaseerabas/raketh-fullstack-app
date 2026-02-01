# RaketH Clone

<div align="center">
  
  ![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)
  ![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red)

  **AI-powered voice cloning and text-to-speech platform with modern glassmorphism UI**
  
  [Features](#features) • [Demo](#screenshots) • [Getting Started](#getting-started) • [Documentation](#api-documentation)

</div>

---

## ✨ Features

### Core Capabilities
- 🎙️ **Voice Cloning**: Upload voice samples and create AI clones with auto-generated IDs
- 🗣️ **Text-to-Speech (TTS)**: Convert text to speech with streaming audio output
- 🌐 **Translate & TTS**: Translate text between 11+ languages, then generate speech
- 💳 **Credit-Based System**: Purchase credits once, use them forever - no expiration
- 🌍 **Multi-Language Support**: Support for English, Spanish, French, German, Chinese, Japanese, Arabic, and more
- 📱 **WhatsApp Integration**: Direct subscription management via WhatsApp (+92 302 529 337)
- 🔐 **User Authentication**: Secure NextAuth.js authentication with credentials provider
- 📊 **Real-Time Tracking**: Monitor credit usage, generation history, and statistics

### Modern UI/UX
- ✨ **Glassmorphism Design**: Modern glass-effect cards with backdrop blur
- 🎨 **Gradient Themes**: Beautiful OKLCH color system with violet/purple primary theme
- 🌊 **Smooth Animations**: Floating elements, fade-ins, scale effects, and shimmer animations
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop devices
- 🎯 **Interactive Elements**: Hover effects with scale and glow transformations
- 🚀 **Performance Optimized**: Fast load times with Next.js 16 and Turbopack

### Admin Features
- 👥 **User Management**: View all users, subscription status, and credit usage
- 📦 **Plan Management**: Create and manage subscription tiers
- 💰 **Subscription Control**: Assign plans to users and track payments
- 📈 **Analytics Dashboard**: Real-time statistics for users, subscriptions, credits, and revenue
- 🔍 **Search & Filter**: Advanced user search and filtering capabilities
- 📞 **Direct Communication**: WhatsApp links for each user with pre-filled messages

## 💰 Pricing Plans

**One-Time Payment • Credits Never Expire • Cancel Anytime**

| Plan | Price (PKR) | Characters | Voice Clones | Support |
|------|-------------|------------|--------------|---------|
| **Basic** | RS 1,499 | 1 Million | 5 | ✉️ Email |
| **Pro** | RS 3,499 | 3 Million | 10 | ⚡ Priority |
| **Premium** | RS 5,999 | 5 Million | 25 | ⚡ Priority |
| **Enterprise** | RS 7,999 | 10 Million | Unlimited | 🎯 Dedicated |

### 💡 How Credits Work
- **Character-Based**: Each character = 1 credit (e.g., "Hello world" = 11 credits)
- **Never Expire**: Use credits at your own pace, no time limits
- **Real-Time Tracking**: Monitor usage in your dashboard
- **Transparent Pricing**: What you see is what you pay
- **Easy Activation**: Contact via WhatsApp to activate subscription

### 📞 How to Subscribe
1. Register on the platform
2. Choose your plan
3. Click "Get Started" or "Contact via WhatsApp"
4. Complete payment with admin via WhatsApp (+92 302 529 337)
5. Admin activates your subscription
6. Start generating immediately!

---

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js 18+ or Bun runtime
- MySQL database (or SQLite for development)
- External TTS API service (see [EXTERNAL_API_DOCUMENTATION.md](EXTERNAL_API_DOCUMENTATION.md))

### 🛠️ Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd raketh-nextjs-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Configuration**
   
   Create `.env` file in the root directory:
   ```env
   # Database Configuration
   DATABASE_URL="mysql://user:password@localhost:3306/raketh_clone"
   # For SQLite (development): DATABASE_URL="file:./db/custom.db"
   
   # NextAuth Configuration
   NEXTAUTH_SECRET="your-super-secure-random-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # External TTS API
   EXTERNAL_TTS_API_URL="http://localhost:8000"
   # EXTERNAL_TTS_API_KEY="your-api-key-if-required"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Apply database migrations
   npx prisma db push
   
   # Seed with admin account and subscription plans
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```
   
   Application will be available at: **http://localhost:3000**

### 🔑 Default Admin Credentials

After running the seed script:
- **Email**: `admin@rakehclone.com`
- **Password**: `admin123`

> ⚠️ **Important**: Change the admin password immediately in production!

### 📍 Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page with features and pricing |
| `/signup` | User registration |
| `/login` | User authentication |
| `/dashboard` | User dashboard with stats and quick actions |
| `/generate` | TTS and Translate-TTS generation interface |
| `/history` | Generation history with pagination |
| `/voice-clones` | Voice clone library management |
| `/admin` | Admin dashboard (admin role required) |
| `/privacy` | Privacy Policy and Terms of Service |

---

## 📱 Screenshots

### Modern Landing Page
- Glassmorphism navigation with gradient mesh background
- Animated floating elements and smooth transitions
- Featured pricing cards with WhatsApp integration
- Demo voice player with audio controls

### Dashboard
- Glass-card stats with gradient icon backgrounds
- Recent generation history (mobile responsive)
- Credit usage visualization with progress bars
- Quick action buttons for common tasks

### Generate Page
- Modern tabbed interface (TTS / Translate-TTS)
- Voice selection with availability badges
- Glass-card sections with gradient buttons
- Real-time audio preview with download

### Admin Panel
- Gradient stat cards (Users, Subscriptions, Credits, Revenue)
- User management with search and filters
- Credit usage tracking per user
- Plan assignment with WhatsApp communication

---

## 🏗️ Project Structure

```
raketh-nextjs-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── generate/             # Voice generation (TTS & Translate-TTS)
│   │   │   ├── voice-clones/         # Voice clone management
│   │   │   │   ├── upload/           # Upload voice samples
│   │   │   │   └── [id]/             # Delete voice clones
│   │   │   ├── user/                 # User data & subscription info
│   │   │   ├── generations/          # Generation history
│   │   │   ├── languages/            # Supported languages
│   │   │   ├── audio/[filename]/     # Serve audio files
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   │   ├── [...nextauth]/    # NextAuth handlers
│   │   │   │   └── register/         # User registration
│   │   │   └── admin/                # Admin-only endpoints
│   │   │       ├── users/            # List all users
│   │   │       ├── plans/            # List subscription plans
│   │   │       ├── stats/            # Platform statistics
│   │   │       ├── subscribe/        # Assign subscriptions
│   │   │       └── subscriptions/    # Subscription management
│   │   ├── page.tsx                  # Landing page (glassmorphism design)
│   │   ├── login/page.tsx            # Login page (glass-card UI)
│   │   ├── signup/page.tsx           # Registration page (glass-card UI)
│   │   ├── dashboard/page.tsx        # User dashboard (stats, quick actions)
│   │   ├── generate/page.tsx         # Generation interface (tabbed UI)
│   │   ├── history/page.tsx          # Generation history (paginated)
│   │   ├── voice-clones/page.tsx     # Voice library (upload & manage)
│   │   ├── admin/page.tsx            # Admin dashboard (user & plan management)
│   │   ├── privacy/page.tsx          # Privacy Policy & Terms of Service
│   │   ├── layout.tsx                # Root layout with providers
│   │   └── globals.css               # Global styles, animations, utilities
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components (35+ components)
│   │   │   ├── button.tsx            # Enhanced with scale & glow effects
│   │   │   ├── card.tsx              # Rounded-2xl with smooth transitions
│   │   │   ├── input.tsx             # Modern input styling
│   │   │   ├── select.tsx            # Dropdown select
│   │   │   ├── tabs.tsx              # Tabbed interface
│   │   │   ├── badge.tsx             # Status badges
│   │   │   └── ...                   # Other shadcn components
│   │   └── providers.tsx             # SessionProvider wrapper
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth configuration
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── external-tts-api.ts       # External API integration
│   │   └── utils.ts                  # Utility functions (cn, etc.)
│   ├── types/
│   │   └── next-auth.d.ts            # NextAuth type definitions
│   └── hooks/
│       ├── use-toast.ts              # Toast notification hook
│       └── use-mobile.ts             # Mobile detection hook
├── prisma/
│   ├── schema.prisma                 # Database schema (User, Plan, Subscription, etc.)
│   ├── seed.ts                       # Database seeding script
│   └── db/                           # SQLite database files
├── storage/
│   └── audio/                        # Generated audio files
├── public/
│   ├── robots.txt                    # SEO configuration
│   └── demo/                         # Demo assets
├── components.json                   # shadcn/ui configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies and scripts
```

---

## 🎨 Tech Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0 with OKLCH color system
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Custom CSS keyframes with tw-animate-css

### Backend
- **API**: Next.js API Routes (App Router)
- **Authentication**: NextAuth.js v4 with credentials provider
- **Database**: Prisma ORM (MySQL/SQLite)
- **External Services**: Custom TTS API integration

### Development Tools
- **Runtime**: Node.js 18+ / Bun
- **Package Manager**: npm / bun
- **Code Quality**: ESLint, TypeScript strict mode
- **Build Tool**: Next.js Turbopack (ultra-fast compilation)

### Design System
- **Primary Color**: `oklch(0.55 0.25 280)` (violet/purple)
- **Effects**: Glassmorphism, gradients, shadows, blur
- **Animations**: Float, pulse-glow, gradient-x, shimmer, fade-in, scale-in
- **Transitions**: Smooth (300ms ease), bounce (cubic-bezier)

---

## 👨‍💻 User Guide

### 🎯 How to Use the Platform

#### 1️⃣ Registration & Subscription
1. Navigate to `/signup` and create an account (email, password, optional WhatsApp)
2. Users can login but initially have no credits
3. Click "Contact via WhatsApp" button or choose a plan
4. Complete payment with admin via WhatsApp (+92 302 529 337)
5. Admin activates subscription through admin panel
6. Credits are immediately available in your account

#### 2️⃣ Voice Generation
1. Go to `/generate`
2. Choose generation type:
   - **TTS**: Text-to-Speech in one language
   - **Translate-TTS**: Translate text, then generate speech
3. Select voice from your clone library or default voices
4. Enter or paste your text
5. Click "Generate" - credits are deducted automatically
6. Listen to preview and download WAV file

#### 3️⃣ Voice Cloning
1. Navigate to `/voice-clones`
2. Click "Upload Voice Clone"
3. Provide a name for your voice
4. Upload audio file (WAV, MP3, FLAC, OGG)
5. System generates unique voice ID (e.g., "custom_eva_123")
6. Voice appears in your library for future generations
7. Clone limit enforced by your subscription plan

#### 4️⃣ Monitor Usage
- **Dashboard**: View credits remaining, total generations, voice clone count
- **History**: Browse all past generations with pagination
- **Progress Bars**: Visual representation of credit usage
- **Real-Time Updates**: Stats update after each generation

---

## 🛡️ Admin Guide

### 🔐 Admin Access
- Navigate to `/admin` (requires admin role)
- Default credentials: `admin@rakehclone.com` / `admin123`

### 📊 Dashboard Features
- **Real-Time Statistics**: Total users, active subscriptions, credits used, revenue
- **User Management**: Search, filter, and view all registered users
- **Subscription Control**: Assign plans, track usage, manage status
- **WhatsApp Integration**: Direct communication links with pre-filled messages

### 👥 User Management
1. **View All Users**: Complete list with subscription details
2. **Search Users**: Filter by email, name, or WhatsApp number
3. **Monitor Usage**: See credit usage with gradient progress bars (red >90%, amber >70%)
4. **Credit Tracking**: Real-time display of purchased vs. used credits
5. **Contact Users**: WhatsApp buttons with user email pre-filled

### 💼 Subscription Management
1. **View Plans**: All 4 tiers with subscriber counts
2. **Assign Plans**: Select user → choose plan → click Subscribe
3. **Track Status**: Active, canceled, or expired subscriptions
4. **Enforce Limits**: System automatically checks voice clone limits
5. **Manual Control**: Override or adjust subscriptions as needed

### 📱 WhatsApp Communication
- **User Cards**: Each user has "Contact via WhatsApp" button
- **Pre-filled Messages**: Includes user email and subscription context
- **Direct Number**: All links open to +92 302 529 337
- **Plan Context**: Selected plan info automatically added to message

---

## 🔌 API Documentation

### 🔓 Public Endpoints

#### **POST** `/api/generate`
Generate voice from text with TTS or Translate-TTS.

**Request (TTS):**
```json
{
  "text": "Hello world",
  "voiceId": "default_male_01",
  "type": "tts",
  "language": "en"
}
```

**Request (Translate-TTS):**
```json
{
  "text": "Hello world",
  "voiceId": "default_female_01",
  "type": "translate-tts",
  "sourceLanguage": "eng_Latn",
  "targetLanguage": "fra_Latn"
}
```

**Response:**
```json
{
  "id": "gen_123",
  "url": "data:audio/wav;base64,...",
  "duration": 2.5,
  "type": "tts",
  "textLength": 11,
  "credits": {
    "purchased": 1000000,
    "used": 11,
    "remaining": 999989
  }
}
```

**Error (Insufficient Credits):**
```json
{
  "error": "Insufficient credits",
  "creditsRemaining": 2500,
  "creditsNeeded": 5000,
  "message": "You need 5000 credits but only have 2500 remaining"
}
```

---

#### **GET** `/api/user`
Get current user data with subscription info.

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "whatsapp": "+923001234567"
  },
  "subscription": {
    "id": "sub_123",
    "plan": {
      "name": "Pro",
      "price": 3499,
      "credits": 3000000,
      "maxClones": 10
    },
    "creditsPurchased": 3000000,
    "creditsUsed": 25000,
    "creditsRemaining": 2975000,
    "creditsPercentage": 0.83
  },
  "stats": {
    "generationsThisMonth": 25,
    "totalGenerations": 150,
    "voiceClonesCount": 3
  }
}
```

---

#### **GET** `/api/voice-clones`
List all available voices (default + user's custom clones).

**Response:**
```json
{
  "voices": [
    {
      "id": "clone_123",
      "voiceId": "custom_eva_456",
      "name": "Eva Voice",
      "description": "Uploaded on 2025-01-15",
      "sampleUrl": "/storage/voices/eva_456/voice.wav",
      "isDefault": false,
      "available": true
    },
    {
      "id": "default_1",
      "voiceId": "default_male_01",
      "name": "Default Male",
      "description": "A standard male voice for general use",
      "isDefault": true,
      "available": true
    }
  ]
}
```

---

#### **POST** `/api/voice-clones/upload`
Upload a new voice clone sample.

**Request (multipart/form-data):**
```
user_id=custom_eva_123
name=My Custom Voice
voice_file=@audio.wav
```

**Response:**
```json
{
  "id": "clone_456",
  "voiceId": "custom_eva_789",
  "name": "My Custom Voice",
  "description": "Uploaded at 2025-01-15",
  "sampleUrl": "/storage/voices/eva_789/voice.wav"
}
```

---

#### **GET** `/api/languages`
Get supported languages for TTS and translation.

**Response:**
```json
{
  "translation": {
    "model": "NLLB-200",
    "languages": [
      { "code": "eng_Latn", "name": "English", "tts_code": "en" },
      { "code": "spa_Latn", "name": "Spanish", "tts_code": "es" },
      { "code": "fra_Latn", "name": "French", "tts_code": "fr" }
    ]
  },
  "tts": {
    "model": "Qwen3-TTS-0.6B-Base",
    "languages": [
      { "code": "en", "name": "English", "nllb_code": "eng_Latn" },
      { "code": "es", "name": "Spanish", "nllb_code": "spa_Latn" },
      { "code": "fr", "name": "French", "nllb_code": "fra_Latn" }
    ]
  }
}
```

---

#### **GET** `/api/generations`
Get user's generation history with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "generations": [
    {
      "id": "gen_123",
      "text": "Hello world",
      "voiceId": "default_male_01",
      "audioUrl": "/api/audio/gen_123.wav",
      "duration": 2.5,
      "type": "tts",
      "creditsUsed": 11,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

### 🔒 Admin Endpoints

> **Note**: All admin endpoints require authentication with admin role.

#### **GET** `/api/admin/users`
List all users with subscription details.

**Response:**
```json
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "whatsapp": "+923001234567",
      "role": "user",
      "subscriptions": [
        {
          "id": "sub_123",
          "plan": { "name": "Basic", "price": 1499, "credits": 1000000 },
          "creditsPurchased": 1000000,
          "creditsUsed": 25000,
          "status": "active"
        }
      ],
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

#### **GET** `/api/admin/plans`
List all available subscription plans.

**Response:**
```json
{
  "plans": [
    {
      "id": "plan_1",
      "name": "Basic",
      "price": 1499,
      "credits": 1000000,
      "maxClones": 5,
      "features": "{\"1 Million characters\":true,\"Voice cloning\":true}"
    }
  ]
}
```

---

#### **GET** `/api/admin/stats`
Get platform-wide statistics.

**Response:**
```json
{
  "totalUsers": 150,
  "activeSubscriptions": 75,
  "totalCreditsUsed": 25000000,
  "totalRevenue": 262425
}
```

---

#### **POST** `/api/admin/subscribe`
Assign subscription plan to a user.

**Request:**
```json
{
  "userId": "user_123",
  "planId": "plan_2"
}
```

**Response:**
```json
{
  "message": "User subscribed successfully",
  "subscription": {
    "id": "sub_456",
    "userId": "user_123",
    "planName": "Pro",
    "creditsPurchased": 3000000,
    "status": "active"
  }
}
```

---

## 🌍 Supported Languages

### Translation Languages (NLLB-200 Codes)
| Code | Language | TTS Code |
|------|----------|----------|
| `eng_Latn` | English | `en` |
| `spa_Latn` | Spanish | `es` |
| `fra_Latn` | French | `fr` |
| `deu_Latn` | German | `de` |
| `ita_Latn` | Italian | `it` |
| `por_Latn` | Portuguese | `pt` |
| `zho_Hans` | Chinese (Simplified) | `zh` |
| `jpn_Jpan` | Japanese | `ja` |
| `kor_Hang` | Korean | `ko` |
| `ara_Arab` | Arabic | `ar` |
| `hin_Deva` | Hindi | `hi` |

### TTS Languages (Qwen3-TTS Codes)
All above languages supported with corresponding TTS codes.

---

## 📡 External API Integration

RaketH Clone integrates with an external TTS service for voice processing.

### Required Endpoints
- **POST** `/voice/upload` - Upload voice samples for cloning
- **GET** `/voice/list` - List available voices
- **GET** `/languages` - Get supported languages
- **POST** `/tts/stream` - Streaming text-to-speech generation
- **POST** `/translate-tts/stream` - Translation + TTS streaming

### Configuration
Set the external API URL in your environment:
```env
EXTERNAL_TTS_API_URL=http://localhost:8000
# EXTERNAL_TTS_API_KEY=your-key-if-required
```

See [EXTERNAL_API_DOCUMENTATION.md](EXTERNAL_API_DOCUMENTATION.md) for detailed API specification.

---

## 💾 Database Schema

### Key Models

#### **User**
- Stores user credentials and profile
- Fields: id, email, name, whatsapp, password (hashed), role
- Relations: subscriptions, voiceClones, generations

#### **Plan**
- Subscription tiers with pricing
- Fields: id, name, price, credits, maxClones, features (JSON)
- Relations: subscriptions

#### **Subscription**
- Links users to plans
- Fields: id, userId, planId, creditsPurchased, creditsUsed, status
- Computed: creditsRemaining, creditsPercentage
- Relations: user, plan

#### **VoiceClone**
- User-uploaded voice samples
- Fields: id, userId, voiceId, name, description, sampleUrl, isActive
- Relations: user

#### **VoiceGeneration**
- Records all voice generations
- Fields: id, userId, text, voiceId, audioFilename, duration, type, creditsUsed, language info
- Relations: user

---

## 📱 WhatsApp Integration

### Contact Number
**+92 302 529 337**

### User Features
- **Pricing Page**: "Get Started" buttons open WhatsApp with plan-specific messages
- **Dashboard**: "Contact via WhatsApp" with user email pre-filled
- **Format**: `https://wa.me/+923025295337?text=<message>`

### Admin Features
- **User Cards**: Direct WhatsApp link for each user
- **Pre-filled Context**: User email, selected plan info
- **Quick Communication**: One-click access to user conversations

---

## 🚀 Deployment

### Development
```bash
# Install dependencies
npm install
# or
bun install

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
# or
bun run dev
```

### Production Build
```bash
# Build for production
npm run build
# or
bun run build

# Start production server
npm start
# or
bun start
```

### Environment Variables (Production)
```env
NODE_ENV=production
NEXTAUTH_SECRET=<super-secure-random-string>
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=<production-database-url>
EXTERNAL_TTS_API_URL=<production-api-url>
```

### Deployment Checklist
- ✅ Change admin password from default
- ✅ Set secure `NEXTAUTH_SECRET`
- ✅ Configure production database
- ✅ Enable HTTPS/SSL
- ✅ Set proper CORS policies
- ✅ Configure external API endpoints
- ✅ Test WhatsApp integration
- ✅ Verify payment workflow

---

## 🛠️ Development Scripts

```bash
# Start development server (Turbopack)
npm run dev
bun run dev

# Build for production
npm run build
bun run build

# Start production server
npm start
bun start

# Run linter
npm run lint

# Database operations
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma db seed       # Seed database with admin & plans
npx prisma studio        # Open Prisma Studio GUI
```

---

## 🐛 Troubleshooting

### Database Issues
**Problem**: Connection error
- ✅ Verify `DATABASE_URL` in `.env`
- ✅ Run `npx prisma generate`
- ✅ Run `npx prisma db push`

**Problem**: Seeding fails
- ✅ Check if admin already exists
- ✅ Manually delete database and re-run seed

### Authentication Issues
**Problem**: Login not working
- ✅ Verify `NEXTAUTH_SECRET` is set
- ✅ Clear browser cookies
- ✅ Check user exists in database

### External API Issues
**Problem**: Generation fails
- ✅ Verify `EXTERNAL_TTS_API_URL` is correct
- ✅ Check external API is running
- ✅ Review firewall/network settings
- ✅ Check API key if required

### Credit Deduction Issues
**Problem**: Credits not deducting
- ✅ Verify user has active subscription
- ✅ Check `creditsPurchased` and `creditsUsed` in database
- ✅ Ensure subscription status is "active"

### Build Issues
**Problem**: Next.js build fails
- ✅ Clear `.next` folder
- ✅ Delete `node_modules` and reinstall
- ✅ Check TypeScript errors with `npm run lint`

---

## 📞 Support & Contact

### For Users
- **WhatsApp**: +92 302 529 337
- **Email**: admin@rakehclone.com
- **Dashboard**: Contact via WhatsApp button

### For Developers
- **Documentation**: See `EXTERNAL_API_DOCUMENTATION.md`
- **Issues**: Report via WhatsApp
- **API Help**: Check API documentation section

---

## 📄 License

**Copyright © 2025 RaketH Clone. All Rights Reserved.**

This project is proprietary software. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

## 🎉 Features Showcase

### ✨ Modern UI/UX
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Smooth Animations**: Floating, fading, scaling, shimmer effects
- **Gradient Themes**: OKLCH color system with violet/purple gradients
- **Responsive Design**: Optimized for all screen sizes
- **Interactive Elements**: Hover effects with scale and glow
- **Cursor Feedback**: Pointer cursors on all clickable elements

### 🎯 User Experience
- **One-Click Actions**: Quick access to common tasks
- **Real-Time Updates**: Live credit tracking and statistics
- **Progress Visualization**: Gradient progress bars for credit usage
- **Intuitive Navigation**: Clear routing with breadcrumbs
- **Toast Notifications**: Instant feedback for all actions
- **Loading States**: Smooth loading indicators

### 🔐 Security & Privacy
- **NextAuth Integration**: Secure authentication
- **Password Hashing**: bcrypt encryption
- **Role-Based Access**: Admin and user roles
- **Session Management**: Secure JWT tokens
- **Privacy Policy**: Comprehensive legal pages
- **Terms of Service**: Clear usage guidelines

---

<div align="center">
  
  **Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
  
  [⬆ Back to Top](#raketh-clone)

</div>
