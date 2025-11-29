-- Add Free Body Diagram simulation to the database
-- This script adds the new interactive free body diagram simulation

-- Add the Free Body Diagram simulation
INSERT INTO public.simulations (
    title,
    slug,
    description,
    category,
    unit,
    difficulty,
    component_path,
    estimated_time,
    objectives,
    key_concepts,
    published,
    created_by
)
VALUES (
    'Free Body Diagram Lab',
    'free-body-diagram',
    'Interactive free body diagram simulation where students can experiment with force vectors and see how they affect acceleration. Drag and drop force vectors to explore Newton''s Second Law (F = ma) with real-time calculations showing the relationship between force, mass, and acceleration.',
    'forces',
    'Unit 2: Forces',
    'intermediate',
    '/simulations/free-body-diagram',
    25,
    ARRAY[
        'Understand Newton''s Second Law (F = ma)',
        'Practice vector addition and decomposition',
        'Visualize how multiple forces affect an object',
        'Explore equilibrium conditions'
    ],
    ARRAY['force', 'mass', 'acceleration', 'vectors', 'Newton''s Second Law', 'free body diagram'],
    true,
    'system'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    difficulty = EXCLUDED.difficulty,
    component_path = EXCLUDED.component_path,
    estimated_time = EXCLUDED.estimated_time,
    objectives = EXCLUDED.objectives,
    key_concepts = EXCLUDED.key_concepts,
    published = EXCLUDED.published,
    updated_at = CURRENT_TIMESTAMP;

-- Also add some related simulations if they don't exist
INSERT INTO public.simulations (
    title,
    slug,
    description,
    category,
    unit,
    difficulty,
    component_path,
    estimated_time,
    objectives,
    key_concepts,
    published,
    created_by
)
VALUES 
    (
        'Newton''s Laws Explorer',
        'newtons-laws',
        'Explore all three of Newton''s Laws of Motion through interactive demonstrations. See how forces, mass, and acceleration relate to each other.',
        'forces',
        'Unit 2: Forces',
        'beginner',
        '/simulations/newtons-laws',
        30,
        ARRAY[
            'Understand Newton''s three laws of motion',
            'See the relationship between force, mass, and acceleration',
            'Explore action-reaction pairs'
        ],
        ARRAY['Newton''s Laws', 'inertia', 'force', 'acceleration', 'action-reaction'],
        true,
        'system'
    ),
    (
        'Force and Motion Basics',
        'force-motion-basics',
        'Learn the fundamentals of forces and motion. Push and pull objects to see how forces affect motion.',
        'forces',
        'Unit 2: Forces',
        'beginner',
        '/simulations/force-motion-basics',
        20,
        ARRAY[
            'Understand what forces are',
            'Learn how forces affect motion',
            'Explore push and pull forces'
        ],
        ARRAY['force', 'motion', 'push', 'pull', 'friction'],
        true,
        'system'
    ),
    (
        'Balanced and Unbalanced Forces',
        'balanced-unbalanced-forces',
        'Explore what happens when forces are balanced versus unbalanced. Create different force scenarios and predict the motion.',
        'forces',
        'Unit 2: Forces',
        'beginner',
        '/simulations/balanced-unbalanced-forces',
        15,
        ARRAY[
            'Distinguish between balanced and unbalanced forces',
            'Predict motion based on force conditions',
            'Understand equilibrium'
        ],
        ARRAY['balanced forces', 'unbalanced forces', 'equilibrium', 'net force'],
        true,
        'system'
    )
ON CONFLICT (slug) DO NOTHING;

-- Grant proper permissions if RLS is enabled
DO $$
BEGIN
    -- Check if RLS is enabled on simulations
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'simulations' 
        AND rowsecurity = true
    ) THEN
        -- Ensure policies exist for viewing simulations
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'simulations' 
            AND policyname = 'Everyone can view published simulations'
        ) THEN
            CREATE POLICY "Everyone can view published simulations"
                ON public.simulations
                FOR SELECT
                USING (published = true);
        END IF;
        
        -- Admin/teacher management policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'simulations' 
            AND policyname = 'Admins and teachers can manage simulations'
        ) THEN
            IF EXISTS (SELECT FROM pg_proc WHERE proname = 'is_admin_or_teacher') THEN
                CREATE POLICY "Admins and teachers can manage simulations"
                    ON public.simulations
                    FOR ALL
                    USING (public.is_admin_or_teacher())
                    WITH CHECK (public.is_admin_or_teacher());
            END IF;
        END IF;
    END IF;
END $$;

-- Verify the simulation was added
SELECT 
    id,
    title,
    slug,
    category,
    difficulty,
    unit,
    component_path,
    published
FROM public.simulations
WHERE slug = 'free-body-diagram';

-- Show all Force unit simulations
SELECT 
    title,
    slug,
    category,
    difficulty,
    component_path,
    estimated_time,
    published
FROM public.simulations
WHERE unit LIKE '%Force%' OR category = 'forces'
ORDER BY 
    CASE difficulty 
        WHEN 'beginner' THEN 1 
        WHEN 'intermediate' THEN 2 
        WHEN 'advanced' THEN 3 
        ELSE 4 
    END,
    title;
