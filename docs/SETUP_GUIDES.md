# Setup Guides

This document consolidates all setup and implementation guides for the Physics Classroom application.

## Question Bank Setup

The question bank system provides centralized question management with advanced filtering and AI integration.

### Database Setup
1. Run the question bank migration:
   ```sql
   -- Execute: supabase/migrations/create_question_bank_tables.sql
   ```

2. The migration creates:
   - `question_bank` table with JSONB question storage
   - `units` and `lessons` tables for curriculum structure
   - `question_usage` table for analytics
   - Proper indexes and constraints

### Features
- Advanced filtering by unit, lesson, difficulty, topic
- AI-powered question generation
- Usage tracking and analytics
- Import/export capabilities
- Integration with assignment builder

## Vocabulary System Setup

The vocabulary system supports interactive word games and sentence generation.

### Database Setup
1. Run the vocabulary migration:
   ```sql
   -- Execute: supabase/migrations/create_vocabulary_tables.sql
   ```

2. Creates tables for:
   - Vocabulary sets and words
   - Game progress tracking
   - Student performance analytics

### Features
- Multiple interactive games (Hangman, Word Match, etc.)
- AI-generated example sentences
- Progress tracking
- Difficulty progression

## Student Activity Tracking

Comprehensive tracking of student engagement and progress.

### Database Setup
1. Run the student activity migration:
   ```sql
   -- Execute: supabase/migrations/create_student_activity_tables.sql
   ```

2. Tracks:
   - Lesson views and time spent
   - Assignment progress
   - Video engagement
   - Learning objective completion

### Analytics Dashboard
- Real-time activity monitoring
- Individual student progress
- Class performance metrics
- Engagement insights

## Lesson System

### Database Setup
1. Ensure lessons table exists:
   ```sql
   -- Execute: supabase/migrations/create_lessons_table.sql
   ```

2. Features:
   - Markdown content with math rendering
   - YouTube video integration
   - Learning objectives tracking
   - Mobile-optimized viewing

### Preview System
- Student view simulation
- Device testing (mobile/tablet/desktop)
- Video management interface
- Content validation tools

## Environment Variables

Required environment variables for full functionality:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key
```

## Development Workflow

1. **Initial Setup**:
   ```bash
   npm install
   npm run migrate  # Run database migrations
   npm run dev      # Start development server
   ```

2. **Database Migrations**:
   - Use Supabase Dashboard SQL Editor
   - Or run via Supabase CLI: `supabase db push`

3. **Testing**:
   - Create sample data using scripts in `src/scripts/`
   - Test with different user roles (student/teacher/admin)
   - Verify mobile responsiveness

## Troubleshooting

### Common Issues

1. **Missing Tables**: Run all migrations in order
2. **Permission Errors**: Check user roles in `src/lib/permissions.ts`
3. **API Failures**: Verify environment variables
4. **Math Rendering**: Ensure KaTeX is properly loaded

### Database Verification

Check table creation:
```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## Migration Order

Run migrations in this order:
1. `00_complete_database_setup.sql`
2. `create_lessons_table.sql`
3. `create_question_bank_tables.sql`
4. `create_vocabulary_tables.sql`
5. `create_student_activity_tables.sql`
6. `add_lesson_videos_support.sql`
7. `add_roster_tables_only.sql`
