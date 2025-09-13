# Antocci Physics Classroom

An interactive online physics education platform built with Next.js, featuring Google Classroom integration, AI-powered grading, and dynamic lesson content.

## 🚀 Features

### Core Functionality
- **Interactive Physics Lessons** - Engaging, step-by-step physics lessons with real-time feedback
- **Google Authentication** - Secure login with school Google accounts
- **Google Classroom Integration** - Import student rosters and sync with existing classes
- **AI-Powered Grading** - OpenAI integration for automatic grading of open-response questions
- **Assignment Management** - Create, distribute, and grade assignments with custom rubrics
- **Progress Tracking** - Monitor student progress and performance analytics

### Technical Features
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** for database and real-time features
- **NextAuth** for authentication
- **Toast Notifications** for user feedback
- **Responsive Design** for all devices

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

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

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

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Self-hosted with Node.js

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