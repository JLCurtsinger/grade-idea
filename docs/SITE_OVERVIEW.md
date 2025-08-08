# GradeIdea.cc - Site Overview

## Overview

GradeIdea.cc is an AI-powered business idea validation platform that helps founders assess the viability of their startup ideas. The platform provides instant, founder-grade analysis using OpenAI's GPT-4 to evaluate market potential, competition, monetization clarity, and execution difficulty.

**Target Users:** Early-stage founders, entrepreneurs, and startup teams looking to validate business ideas before investing significant time and resources.

## Core Workflow

### 1. Landing Page Experience
- **Guest Users**: Can try the platform with 2 free mock analyses (no account required)
- **Signed-in Users**: Access full analysis features with token-based system
- **Input**: Users describe their startup idea in a text input field
- **Processing**: AI analysis takes ~60 seconds to complete

### 2. Analysis Process
1. **Idea Submission**: User enters idea description and clicks "Grade My Idea"
2. **Token Validation**: System checks user's token balance (1 token per analysis)
3. **AI Processing**: OpenAI GPT-4 analyzes the idea using structured prompts
4. **Results Display**: Comprehensive scoring and insights are presented
5. **Dashboard Storage**: Results are saved to user's dashboard for future reference

### 3. Post-Analysis Features
- **Detailed Scoring**: 4 key metrics with percentage scores and letter grades
- **Action Checklist**: AI-generated actionable items to improve the idea
- **Custom Notes**: Users can add personal notes to checklist items
- **Score Updates**: Dynamic score recalculation based on checklist completion
- **Public Sharing**: Option to make ideas public for community viewing

## Feature List

### Authentication & User Management
- **Firebase Authentication**: Email/password signup and login
- **User Profiles**: Token balance tracking and idea history
- **Session Management**: Persistent login state across browser sessions
- **Sign-in Modal**: Seamless authentication flow without page navigation

### Token System
- **Token Balance**: Users purchase tokens to analyze ideas (1 token per analysis)
- **Stripe Integration**: Secure payment processing for token purchases
- **Token Packages**: Multiple pricing tiers (Basic: 12 tokens, Standard: 28 tokens, Pro: 45 tokens)
- **Balance Tracking**: Real-time token balance updates with optimistic UI updates
- **Insufficient Token Handling**: Clear messaging when users need more tokens

### Idea Evaluation & Analysis
- **AI-Powered Analysis**: OpenAI GPT-4 with custom system prompts
- **Comprehensive Scoring**: 4-dimensional evaluation (Market Potential, Competition, Monetization, Execution)
- **Letter Grade System**: A+ to F grades based on overall scores
- **Detailed Insights**: AI-generated strategic observations and recommendations
- **Similar Products**: AI-identified competitive landscape analysis
- **Monetization Models**: Suggested revenue strategies
- **Go-to-Market Channels**: Recommended marketing approaches

### Scoring System
- **Dynamic Scoring**: Real-time score updates based on checklist completion
- **Base Score Protection**: Prevents scores from dropping below original AI assessment
- **Category Breakdown**: Individual scores for market, monetization, and execution
- **Visual Indicators**: Color-coded scores (green/yellow/red) and progress bars
- **Letter Grade Mapping**: A+ (95-100), A (90-94), B+ (85-89), etc.

### Checklist System
- **AI-Generated Actions**: Structured improvement suggestions for each category
- **Progress Tracking**: Visual progress indicators and completion counts
- **Interactive Toggles**: Checkbox-based completion tracking
- **Impact Scoring**: Each checklist item has an impact score (1-10)
- **Priority Levels**: High/medium/low priority categorization
- **Notes Integration**: Personal notes can be added to any checklist item

### Dashboard & Idea Management
- **Idea History**: Complete history of all analyzed ideas
- **Starring System**: Mark favorite ideas for quick access
- **Archive Feature**: Move ideas to "Past Ideas" section
- **Delete Functionality**: Permanent removal of ideas
- **Sorting Options**: By date, starred status, and recommendation type
- **Search & Filter**: Find specific ideas quickly

### Public Examples & Community
- **Public Ideas Page**: Showcase of top-rated public ideas
- **Example Prompts**: Pre-written idea examples for testing
- **Community Sharing**: Users can make their ideas public
- **Score Comparisons**: See how ideas rank against community submissions
- **Inspiration Gallery**: Browse successful idea patterns

### Enhanced Analysis Features
- **AI Plan Generation**: Generate detailed action plans for checklist items (1 token per plan)
- **Custom Notes**: Personal annotations on any analysis component
- **Risk Assessment**: AI-identified potential challenges and blind spots
- **User Archetype Analysis**: Target customer demographic and behavior insights
- **Summary Analysis**: Concise strategic overview of each idea

### UI/UX Features
- **Dark Mode Design**: Professional dark theme optimized for readability
- **Responsive Layout**: Mobile-first design with desktop optimization
- **Loading States**: Smooth animations and progress indicators
- **Toast Notifications**: User feedback for actions and errors
- **Modal System**: Detailed views without page navigation
- **Keyboard Navigation**: Full keyboard accessibility support

### Analytics & Tracking
- **Google Analytics**: User behavior and conversion tracking
- **Token Usage Analytics**: Track token consumption patterns
- **Error Logging**: Comprehensive error tracking and debugging
- **Performance Monitoring**: Load times and user experience metrics

## Tech Stack & Integrations

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui + Radix UI primitives
- **State Management**: React Context + custom hooks
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Backend & APIs
- **Runtime**: Next.js API Routes (serverless functions)
- **AI Integration**: OpenAI GPT-4 API
- **Authentication**: Firebase Auth
- **Database**: Firestore (NoSQL)
- **Payments**: Stripe API
- **Analytics**: Google Analytics 4

### External Services
- **Firebase**: Authentication, database, and hosting
- **Stripe**: Payment processing and subscription management
- **OpenAI**: GPT-4 for idea analysis and plan generation
- **Vercel**: Deployment and hosting (recommended)

### Development Tools
- **Package Manager**: npm/bun
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript strict mode
- **Code Formatting**: Prettier (via ESLint)
- **Version Control**: Git

## Known Limitations

### Partially Complete Features
- **Advanced Search**: Basic filtering exists, but advanced search not fully implemented
- **Bulk Operations**: No bulk delete or export functionality
- **Export Features**: No PDF/CSV export of analysis results
- **Collaboration**: No team sharing or collaborative features
- **Advanced Analytics**: Limited user behavior analytics beyond basic GA

### Technical Debt
- **Error Handling**: Some edge cases in API error responses
- **Performance**: Large idea lists may need pagination optimization
- **Caching**: Limited client-side caching for frequently accessed data
- **Testing**: No comprehensive test suite implemented

### Planned Features (Not Implemented)
- **Team Accounts**: Multi-user collaboration features
- **Advanced Reporting**: Detailed analytics and insights
- **API Access**: Public API for third-party integrations
- **Mobile App**: Native mobile application
- **Advanced AI**: More sophisticated analysis models

## File Location Notes

### Core Application Logic
- **Main Page**: `src/app/page.tsx` - Landing page with idea submission
- **Dashboard**: `src/app/dashboard/page.tsx` - User idea management
- **Examples**: `src/app/examples/page.tsx` - Public ideas showcase

### API Routes
- **Idea Analysis**: `src/app/api/analyzeIdea/route.ts` - Main AI analysis endpoint
- **Token Management**: `src/app/api/create-checkout-session/route.ts` - Stripe integration
- **Public Ideas**: `src/app/api/public-ideas/route.ts` - Community features
- **Plan Generation**: `src/app/api/generate-plan/route.ts` - AI action plans

### Key Components
- **Hero Section**: `src/components/hero-section.tsx` - Landing page input
- **Results Display**: `src/components/results-section.tsx` - Analysis results
- **Dashboard Cards**: `src/app/dashboard/page.tsx` - Idea management UI
- **Checklist**: `src/components/IdeaChecklist.tsx` - Action item tracking

### Business Logic
- **Scoring System**: `src/lib/scoring.ts` - Dynamic score calculations
- **Grading Scale**: `src/lib/gradingScale.ts` - Letter grade mappings
- **Firebase Config**: `src/lib/firebase.ts` - Database and auth setup
- **Stripe Integration**: `src/lib/stripe.ts` - Payment processing

### Context & State Management
- **Auth Context**: `src/context/AuthContext.tsx` - User authentication state
- **Current Idea**: `src/context/CurrentIdeaContext.tsx` - Active idea state
- **Token Balance**: `src/hooks/use-token-balance.ts` - Token management

### Styling & Design
- **Global Styles**: `src/app/globals.css` - Custom design system
- **Tailwind Config**: `tailwind.config.ts` - Theme customization
- **Component Styles**: `src/components/ui/` - shadcn/ui components

## Getting Started for Developers

### Prerequisites
- Node.js 18+
- Firebase project with Firestore and Auth enabled
- OpenAI API key
- Stripe account with configured products
- Google Analytics property (optional)

### Environment Variables Required
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID_BASIC=
STRIPE_PRICE_ID_STANDARD=
STRIPE_PRICE_ID_PRO=

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

### Development Commands
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run lint        # Run ESLint
```

### Key Development Patterns
- **Token Management**: Always check balance before API calls
- **Error Handling**: Use toast notifications for user feedback
- **Loading States**: Implement optimistic UI updates
- **Data Fetching**: Use React Query patterns for caching
- **Authentication**: Verify Firebase tokens on all protected routes

This overview provides a comprehensive understanding of GradeIdea.cc's current implementation and should help new developers quickly understand the codebase structure and functionality.
