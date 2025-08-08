# GradeIdea - AI-Powered Business Idea Validation

A Next.js application that helps founders validate their business ideas using AI-powered analysis and scoring.

## 🚀 Features

- **AI-Powered Analysis**: Get instant feedback on market potential, competition, monetization, and execution difficulty
- **Interactive Scorecards**: Animated progress bars and detailed justifications for each metric
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Dark Mode**: Professional dark theme optimized for readability
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Radix UI
- **State Management**: React Query
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <YOUR_REPO_URL>
cd gradeidea-next

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles and design system
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Homepage
│   └── not-found.tsx      # 404 page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── header.tsx        # Site header
│   ├── hero-section.tsx  # Landing page hero
│   ├── results-section.tsx # Analysis results
│   └── conversion-footer.tsx # Bottom CTA
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions
```

## 🎨 Design System

The application uses a custom "Founder-Grade" design system with:

- **Dark Mode First**: Professional dark theme with purple brand colors
- **Semantic Colors**: Success, warning, danger, and brand color variants
- **Typography**: Inter font with custom text classes
- **Animations**: Smooth transitions and micro-interactions
- **Components**: Consistent card, button, and input styling

## 🚀 Deployment

This project is optimized for deployment on Vercel:

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or support, please contact the development team.
