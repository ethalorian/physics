-- Fix for missing columns in assignments and submissions tables
-- Run this AFTER the main migration if you get column errors

-- ==============================================
-- FIX 1: Add missing columns to assignments
-- ==============================================

-- Check if columns exist before adding
DO $$ 
BEGIN
    -- Add created_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE assignments ADD COLUMN created_by TEXT;
    END IF;
END $$;

-- ==============================================
-- FIX 2: Add missing columns to submissions
-- ==============================================

DO $$ 
BEGIN
    -- Add rubric_grades if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'rubric_grades'
    ) THEN
        ALTER TABLE submissions ADD COLUMN rubric_grades JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add feedback if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'feedback'
    ) THEN
        ALTER TABLE submissions ADD COLUMN feedback JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- ==============================================
-- VERIFY FIXES
-- ==============================================

-- Show assignments table structure
SELECT 'Assignments columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assignments'
ORDER BY ordinal_position;

-- Show submissions table structure
SELECT 'Submissions columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

-- Confirm success
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'created_by')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'rubric_grades')
    THEN
        RAISE NOTICE '✓ All columns fixed successfully!';
    ELSE
        RAISE EXCEPTION '✗ Some columns still missing';
    END IF;
END $$;

