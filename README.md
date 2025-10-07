# Antocci Physics Classroom

A comprehensive Next.js 15 physics education platform with AI-powered question generation, interactive lessons, vocabulary games, advanced analytics, and seamless Google Classroom integration.

## 📚 Documentation

- **[Setup Guides](docs/SETUP_GUIDES.md)** - Database setup and configuration
- **[Features Overview](docs/FEATURES.md)** - Comprehensive feature documentation
- **[Assignment System Guide](docs/ASSIGNMENTS_SYSTEM_GUIDE.md)** - Assignment management documentation
- **[Lesson System Guide](docs/LESSONS_SYSTEM_GUIDE.md)** - Lesson creation and management
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Production deployment steps

## 🎯 Key Features

- **🤖 AI-Powered Tools** - Question generation, automatic grading, and physics scenario images
- **📖 Interactive Lessons** - KaTeX math rendering, YouTube video integration, progress tracking
- **📝 Assignment System** - Assign lessons and homework to classes or individual students
- **🎯 Question Bank** - Centralized repository with advanced filtering and usage analytics
- **🎮 Vocabulary Games** - Hangman, matching, word shoot, and fill-in-the-blank games
- **📊 Student Analytics** - Real-time engagement metrics and performance tracking
- **🎨 Modern UI** - shadcn/ui components, responsive design, dark mode support
- **🔐 Role-Based Access** - Student, Teacher, and Admin permission levels

## 🚀 Technical Stack

- **Framework**: Next.js 15 with App Router + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL) with real-time features
- **Authentication**: NextAuth.js v5 with Google OAuth
- **AI Integration**: OpenAI API (GPT-4 for grading)
- **Math Rendering**: KaTeX for physics equations
- **State Management**: React Context API with custom providers

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud Console project with OAuth 2.0 credentials
- OpenAI API key (for AI grading features)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/physics-classroom.git
cd physics-classroom
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy `env.example` to `.env.local` and fill in your values:

```bash
cp env.example .env.local
```

Then edit `.env.local` with your actual credentials. See [env.example](env.example) for required variables.

4. **Configure Google OAuth**

In [Google Cloud Console](https://console.cloud.google.com):
- Enable Google Classroom API
- Create OAuth 2.0 credentials
- Add authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google` (development)
  - `https://yourdomain.com/api/auth/callback/google` (production)

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard and tools
│   ├── assignments/       # Assignment pages
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main dashboard
│   └── lessons/          # Lesson content pages
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── assignment-*      # Assignment components
│   ├── student/          # Student-specific components
│   └── ui/               # Reusable UI components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── providers/            # Context providers
└── types/                # TypeScript type definitions
```

## 🎓 Features Documentation

### Assignment System with AI Grading

The platform includes a sophisticated assignment system that uses OpenAI for intelligent grading:

#### Creating Assignments
1. Navigate to Admin → Assignments
2. Create detailed rubrics with multiple criteria
3. Set point values and scoring levels
4. Add open-response questions

#### AI Grading Process
- Students submit text responses
- AI evaluates based on your custom rubric
- Provides detailed feedback for each criterion
- Generates total scores automatically

#### Rubric Components
- **Criteria**: Individual aspects to evaluate
- **Levels**: Performance tiers (e.g., Excellent, Good, Needs Improvement)
- **Points**: Scoring for each level
- **Descriptions**: Clear expectations for each level

### Google Classroom Integration

Connect with Google Classroom to:
- Import student rosters
- Sync course information
- Track enrollment status
- Export student data

### Toast Notifications

The app uses a custom toast notification system for user feedback:
- Success messages (green, 3 seconds)
- Error messages (red, 5 seconds)
- Warning messages (yellow, 4 seconds)
- Info messages (blue, 3.5 seconds)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Recommended: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Environment Variables**
   Add all required variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your production URL)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `OPENAI_API_KEY`

4. **Update Google OAuth**
   - Add production callback URL in Google Cloud Console
   - `https://yourdomain.com/api/auth/callback/google`

5. **Deploy**
   - Vercel will automatically build and deploy
   - Monitor build logs for any errors

### Pre-Deployment Checklist

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete checklist including:
- Database migrations
- Environment variable verification
- Security review
- Performance optimization
- Testing procedures

### Alternative Platforms

The app can be deployed to any platform supporting Next.js 15:
- **Netlify**: Similar process to Vercel
- **Railway**: Good for full-stack apps with database
- **AWS Amplify**: Enterprise deployments
- **Self-hosted**: Docker or PM2 with Node.js 18+

## 🛠️ Development

### Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run tests
```

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Conventional commits for version control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues or questions:
- Create an issue in the GitHub repository
- Contact the development team

## 🔒 Security

- Authentication via NextAuth with Google OAuth
- Environment variables for sensitive data
- Secure API routes with proper authentication checks
- HTTPS required in production

## 📝 Notes

- Keep `.env.local` secure and never commit it
- Update Google OAuth redirect URIs when deploying
- Monitor OpenAI API usage to control costs
- Regular database backups recommended