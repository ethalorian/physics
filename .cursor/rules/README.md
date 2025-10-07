# Cursor Rules for Physics Classroom

This directory contains Cursor AI rules to assist with development of the Physics Classroom application.

## Available Rules

### Core Rules (Always Applied)

#### `core-architecture.mdc` 
**Always Applied**: Yes  
**Description**: Core project architecture and technology stack

Contains:
- Technology stack overview
- Critical file locations
- Provider hierarchy
- Import organization standards
- Environment variables

### Feature-Specific Rules

#### `assignment-system-development.mdc`
**Description**: Development patterns and best practices for assignment system components

Contains:
- Assignment and question types
- Context management patterns
- Assignment builder components
- API route patterns
- Grading system implementation
- Storage strategies

#### `database-assignment-patterns.mdc`
**Applies to**: `*.sql`, `**/api/**/*.ts`  
**Description**: Database patterns and SQL practices for the assignment system

Contains:
- Supabase client usage
- JSONB storage patterns
- Row Level Security (RLS) policies
- Performance optimizations
- Query patterns
- Function security

#### `lesson-management-enhanced.mdc`
**Description**: Enhanced lesson management interface patterns and UX improvements

Contains:
- Lesson structure and organization
- Math content rendering with KaTeX
- Lesson components (student and admin)
- Lesson APIs
- Progress tracking

#### `interactive-video-questions.mdc`
**Description**: Interactive video questions system (EdPuzzle-style) patterns and implementation

Contains:
- YouTube Player API integration
- Video question structure
- Time monitoring patterns
- Question overlay components
- Progress tracking
- Custom video controls

#### `vocabulary-games-architecture.mdc`
**Applies to**: `**/vocabulary/**/*.tsx`, `**/vocabulary/**/*.ts`  
**Description**: Vocabulary games system architecture and patterns

Contains:
- Vocabulary context management
- Game types (Hangman, Matching, Word Shoot, Speed Quiz)
- Game components
- Scoring system
- Progress tracking
- Leaderboard system
- AI integration

#### `vocabulary-game-mechanics.mdc`
**Description**: Vocabulary games mechanics and scoring systems

Contains:
- Spaced repetition system
- Difficulty adaptation
- Game-specific mechanics
- Combo and streak systems
- Achievement system
- Power-ups and boosters

#### `youtube-integration.mdc`
**Description**: YouTube Player API integration patterns and best practices

Contains:
- Player initialization
- Control methods
- State management
- Time tracking and progress
- Custom controls UI
- Playlist management
- Error handling
- Performance optimization

## Usage

### Automatic Application
Rules marked as "Always Applied" are automatically included in every AI interaction.

### Manual Application
To fetch a specific rule, reference it in your conversation:
- "Use the assignment system development patterns"
- "Follow the database patterns for this SQL query"
- "Apply the vocabulary game mechanics"

### File-Specific Application
Rules with glob patterns automatically apply when working with matching files:
- SQL files automatically use `database-assignment-patterns.mdc`
- Vocabulary components automatically use `vocabulary-games-architecture.mdc`

## Best Practices

1. **Import Organization**: Always follow the 3-part import structure (React/Next → External → Internal)
2. **Type Safety**: Use strict TypeScript with explicit types
3. **Authentication**: Always check auth and permissions in API routes
4. **Math Content**: Use MathMarkdown component for all physics/math content
5. **Database Queries**: Follow RLS patterns and performance optimizations
6. **Component Structure**: Follow established patterns in rules

## Updating Rules

To update an existing rule:
1. Edit the `.mdc` file
2. Maintain the frontmatter metadata
3. Keep examples current with codebase
4. Update this README if adding/removing rules

## Related Documentation

See also:
- `/docs/` - Comprehensive feature documentation
- `REPOSITORY_STATUS.md` - Current project status
- `README.md` - Project setup and overview
