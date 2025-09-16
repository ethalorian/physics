# Question Bank Database Setup

## Overview
The question bank has been migrated from localStorage to your Supabase database for better persistence, scalability, and multi-user access.

## Database Migration Steps

### 1. Run the Database Migrations

You have two options to set up the database:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and run the following SQL files in order:
   - First: `supabase/migrations/create_question_bank_tables.sql`
   - Second: `supabase/migrations/seed_units_lessons.sql`

#### Option B: Using Supabase CLI
If you have the Supabase CLI installed:
```bash
# From your project root
supabase db push
```

### 2. Verify the Setup

After running the migrations, verify that the following tables were created:
- `units` - Contains physics units
- `lessons` - Contains lessons for each unit
- `question_bank` - Stores all questions
- `question_usage_log` - Tracks question usage

## Features Now Available

### Database Benefits
✅ **Persistent Storage** - Questions stored in database, not browser
✅ **Multi-User Access** - All teachers can share the same question bank
✅ **Usage Tracking** - Track how often questions are used
✅ **Better Performance** - Database queries are optimized
✅ **Backup & Recovery** - Database backups protect your data
✅ **Role-Based Access** - Only admin/teachers can modify questions

### API Endpoints Created
- `/api/question-bank` - CRUD operations for questions
- `/api/question-bank/units` - Manage units and lessons
- `/api/question-bank/usage` - Track question usage

## Testing the Setup

1. **Sign in as admin or teacher**
2. **Navigate to Question Bank** (`/admin/question-bank`)
3. **Try adding a question** from the assignment builder
4. **Verify it appears** in the question bank

## Migration from localStorage

If you had questions in localStorage:
1. Export them using the Export button in Question Bank
2. Import them back after database setup
3. They'll be saved to the database

## Troubleshooting

### If you see "Failed to load questions"
- Check that migrations ran successfully
- Verify your Supabase connection in `.env.local`
- Ensure you're signed in as admin/teacher

### If you can't add/edit questions
- Only admin and teacher roles can modify questions
- Check your user role in the database

## Security

The database implements Row Level Security (RLS):
- All authenticated users can VIEW questions
- Only admin/teacher can CREATE, UPDATE, DELETE questions
- Usage tracking is limited to admin/teacher

## Next Steps

1. Run the migrations
2. Test adding a question
3. Import any existing questions
4. Start building your question library!

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database tables were created
3. Ensure proper user permissions
