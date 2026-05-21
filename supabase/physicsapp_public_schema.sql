-- PhysicsAPP schema load — PUBLIC schema, STRUCTURE ONLY (no data).
-- Extracted from your cluster backup (2025-11-16); this is the authoritative prod schema.
-- PhysicsAPP already contains the mastery tables; none of these names collide with them.
-- Apply (psql wraps the whole file in ONE transaction; nothing commits if anything errors):
--   psql "postgresql://postgres:[YOUR_PHYSICSAPP_DB_PASSWORD]@db.ymszffulqmkqgvhioege.supabase.co:5432/postgres" -1 -v ON_ERROR_STOP=1 -f supabase/physicsapp_public_schema.sql

SET statement_timeout = 0;
SET client_min_messages = warning;

-- Name: assign_student_to_course(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.assign_student_to_course(p_student_id uuid, p_course_id uuid, p_assigned_by uuid) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Check if student exists
  IF NOT EXISTS(SELECT 1 FROM public.students WHERE id = p_student_id) THEN
    RETURN QUERY SELECT false, 'Student not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if course exists
  IF NOT EXISTS(SELECT 1 FROM public.courses WHERE id = p_course_id) THEN
    RETURN QUERY SELECT false, 'Course not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already enrolled
  IF EXISTS(
    SELECT 1 FROM public.course_students 
    WHERE student_id = p_student_id AND course_id = p_course_id
  ) THEN
    RETURN QUERY SELECT false, 'Student already enrolled in this course'::TEXT;
    RETURN;
  END IF;
  
  -- Enroll student
  INSERT INTO public.course_students (
    course_id,
    student_id,
    enrollment_state,
    enrolled_via,
    enrolled_by,
    enrolled_at
  )
  VALUES (
    p_course_id,
    p_student_id,
    'ACTIVE',
    'manual',
    p_assigned_by,
    NOW()
  );
  
  RETURN QUERY SELECT true, 'Student successfully assigned to course'::TEXT;
END;
$$;


ALTER FUNCTION public.assign_student_to_course(p_student_id uuid, p_course_id uuid, p_assigned_by uuid) OWNER TO postgres;

-- Name: calculate_assignment_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_assignment_stats(assignment_uuid uuid) RETURNS TABLE(total_submissions bigint, submitted_count bigint, graded_count bigint, average_score numeric, completion_rate numeric)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_submissions,
    COUNT(CASE WHEN status IN ('submitted', 'graded') THEN 1 END)::BIGINT as submitted_count,
    COUNT(CASE WHEN status = 'graded' THEN 1 END)::BIGINT as graded_count,
    AVG(score)::DECIMAL as average_score,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(CASE WHEN status IN ('submitted', 'graded') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL)
      ELSE 0
    END as completion_rate
  FROM public.submissions
  WHERE assignment_id = assignment_uuid;
END;
$$;


ALTER FUNCTION public.calculate_assignment_stats(assignment_uuid uuid) OWNER TO postgres;

-- Name: calculate_letter_grade(integer, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_letter_grade(p_total_score integer, p_rubric_id uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_grade_a_min INTEGER;
  v_grade_b_min INTEGER;
  v_grade_c_min INTEGER;
BEGIN
  -- Get thresholds from rubric
  SELECT grade_a_min, grade_b_min, grade_c_min
  INTO v_grade_a_min, v_grade_b_min, v_grade_c_min
  FROM simulation_rubrics
  WHERE id = p_rubric_id;
  
  -- Determine letter grade
  IF p_total_score >= v_grade_a_min THEN
    RETURN 'A';
  ELSIF p_total_score >= v_grade_b_min THEN
    RETURN 'B';
  ELSIF p_total_score >= v_grade_c_min THEN
    RETURN 'C';
  ELSE
    RETURN 'Fail';
  END IF;
END;
$$;


ALTER FUNCTION public.calculate_letter_grade(p_total_score integer, p_rubric_id uuid) OWNER TO postgres;

-- Name: FUNCTION calculate_letter_grade(p_total_score integer, p_rubric_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calculate_letter_grade(p_total_score integer, p_rubric_id uuid) IS 'Converts numeric score to letter grade based on rubric thresholds';


-- Name: calculate_total_score(jsonb, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_total_score(p_criterion_scores jsonb, p_rubric_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_criteria JSONB;
  v_criterion_key TEXT;
  v_criterion_weight INTEGER;
  v_criterion_score INTEGER;
  v_weighted_sum NUMERIC := 0;
  v_total_weight INTEGER := 0;
BEGIN
  -- Get criteria weights from rubric
  SELECT criteria INTO v_criteria
  FROM simulation_rubrics
  WHERE id = p_rubric_id;
  
  -- Calculate weighted average
  FOR v_criterion_key IN SELECT jsonb_object_keys(v_criteria)
  LOOP
    v_criterion_weight := (v_criteria->v_criterion_key->>'weight')::INTEGER;
    v_criterion_score := (p_criterion_scores->>v_criterion_key)::INTEGER;
    
    v_weighted_sum := v_weighted_sum + (v_criterion_score * v_criterion_weight);
    v_total_weight := v_total_weight + v_criterion_weight;
  END LOOP;
  
  -- Return weighted average
  IF v_total_weight > 0 THEN
    RETURN ROUND(v_weighted_sum / v_total_weight);
  ELSE
    RETURN 0;
  END IF;
END;
$$;


ALTER FUNCTION public.calculate_total_score(p_criterion_scores jsonb, p_rubric_id uuid) OWNER TO postgres;

-- Name: FUNCTION calculate_total_score(p_criterion_scores jsonb, p_rubric_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calculate_total_score(p_criterion_scores jsonb, p_rubric_id uuid) IS 'Calculates weighted total score from individual criterion scores';


-- Name: check_simulation_assignment_overdue(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_simulation_assignment_overdue(p_student_id text) RETURNS TABLE(assignment_id uuid, simulation_title text, due_date timestamp with time zone, days_overdue integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    s.title,
    sa.due_date,
    EXTRACT(DAY FROM NOW() - sa.due_date)::INTEGER
  FROM simulation_assignments sa
  JOIN simulations s ON s.id = sa.simulation_id
  JOIN student_simulation_assignments ssa ON ssa.simulation_assignment_id = sa.id
  WHERE ssa.student_id = p_student_id
  AND sa.due_date < NOW()
  AND ssa.status NOT IN ('completed', 'submitted', 'graded')
  AND sa.is_active = TRUE
  ORDER BY sa.due_date ASC;
END;
$$;


ALTER FUNCTION public.check_simulation_assignment_overdue(p_student_id text) OWNER TO postgres;

-- Name: FUNCTION check_simulation_assignment_overdue(p_student_id text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.check_simulation_assignment_overdue(p_student_id text) IS 'Returns overdue simulation assignments for a student';


-- Name: check_user_security_status(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_user_security_status(user_email text) RETURNS TABLE(requires_reauth boolean, requires_mfa boolean, account_suspended boolean, account_deleted boolean, reason text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uss.requires_reauth,
    uss.requires_mfa,
    uss.account_suspended,
    uss.account_deleted,
    uss.reason
  FROM user_security_status uss
  WHERE uss.email = user_email;
END;
$$;


ALTER FUNCTION public.check_user_security_status(user_email text) OWNER TO postgres;

-- Name: FUNCTION check_user_security_status(user_email text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.check_user_security_status(user_email text) IS 'Checks if a user requires re-authentication or has security restrictions';


-- Name: cleanup_expired_tokens(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_tokens() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM user_tokens
  WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION public.cleanup_expired_tokens() OWNER TO postgres;

-- Name: FUNCTION cleanup_expired_tokens(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.cleanup_expired_tokens() IS 'Removes expired tokens from storage';


-- Name: create_student_assignment_assignments(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_student_assignment_assignments(p_assignment_assignment_id uuid, p_student_ids uuid[]) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  student_id UUID;
  created_count INTEGER := 0;
BEGIN
  FOREACH student_id IN ARRAY p_student_ids
  LOOP
    INSERT INTO public.student_assignment_assignments (
      assignment_assignment_id,
      student_id,
      status,
      created_at
    ) VALUES (
      p_assignment_assignment_id,
      student_id,
      'assigned',
      NOW()
    )
    ON CONFLICT (assignment_assignment_id, student_id) DO NOTHING;
    
    created_count := created_count + 1;
  END LOOP;

  RETURN created_count;
END;
$$;


ALTER FUNCTION public.create_student_assignment_assignments(p_assignment_assignment_id uuid, p_student_ids uuid[]) OWNER TO postgres;

-- Name: FUNCTION create_student_assignment_assignments(p_assignment_assignment_id uuid, p_student_ids uuid[]); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_student_assignment_assignments(p_assignment_assignment_id uuid, p_student_ids uuid[]) IS 'Creates student assignment assignment records with SET search_path for security';


-- Name: create_student_assignment_records(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_student_assignment_records() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  student_record RECORD;
BEGIN
  -- If assigning to a course, create records for all students in that course
  IF NEW.course_id IS NOT NULL THEN
    FOR student_record IN 
      SELECT s.id, s.email, s.name
      FROM students s
      JOIN course_students cs ON cs.student_id = s.id
      JOIN courses c ON c.id = cs.course_id
      WHERE c.google_course_id = NEW.course_id
      AND cs.enrollment_state = 'ACTIVE'
    LOOP
      INSERT INTO student_assignment_progress (
        unified_assignment_id,
        student_id,
        student_email,
        status,
        max_score
      ) VALUES (
        NEW.id,
        student_record.id::TEXT,
        student_record.email,
        'assigned',
        NEW.max_score
      ) ON CONFLICT (unified_assignment_id, student_id, attempt_number) DO NOTHING;
    END LOOP;
    
    -- Update total_assigned count
    UPDATE unified_assignments
    SET total_assigned = (
      SELECT COUNT(*) FROM student_assignment_progress
      WHERE unified_assignment_id = NEW.id
    )
    WHERE id = NEW.id;
  END IF;
  
  -- If assigning to specific students
  IF NEW.assigned_students IS NOT NULL AND array_length(NEW.assigned_students, 1) > 0 THEN
    FOR student_record IN 
      SELECT s.id, s.email, s.name
      FROM students s
      WHERE s.id::TEXT = ANY(NEW.assigned_students)
    LOOP
      INSERT INTO student_assignment_progress (
        unified_assignment_id,
        student_id,
        student_email,
        status,
        max_score
      ) VALUES (
        NEW.id,
        student_record.id::TEXT,
        student_record.email,
        'assigned',
        NEW.max_score
      ) ON CONFLICT (unified_assignment_id, student_id, attempt_number) DO NOTHING;
    END LOOP;
    
    -- Update total_assigned count
    UPDATE unified_assignments
    SET total_assigned = array_length(NEW.assigned_students, 1)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_student_assignment_records() OWNER TO postgres;

-- Name: create_student_lesson_assignments(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_student_lesson_assignments(p_lesson_assignment_id uuid, p_student_ids uuid[]) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  student_id UUID;
  created_count INTEGER := 0;
BEGIN
  FOREACH student_id IN ARRAY p_student_ids
  LOOP
    INSERT INTO public.student_lesson_assignments (
      lesson_assignment_id,
      student_id,
      status,
      created_at
    ) VALUES (
      p_lesson_assignment_id,
      student_id,
      'assigned',
      NOW()
    )
    ON CONFLICT (lesson_assignment_id, student_id) DO NOTHING;
    
    created_count := created_count + 1;
  END LOOP;

  RETURN created_count;
END;
$$;


ALTER FUNCTION public.create_student_lesson_assignments(p_lesson_assignment_id uuid, p_student_ids uuid[]) OWNER TO postgres;

-- Name: FUNCTION create_student_lesson_assignments(p_lesson_assignment_id uuid, p_student_ids uuid[]); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_student_lesson_assignments(p_lesson_assignment_id uuid, p_student_ids uuid[]) IS 'Creates student lesson assignment records with SET search_path for security';


-- Name: enroll_student_with_code(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enroll_student_with_code(p_student_email text, p_join_code text) RETURNS TABLE(success boolean, message text, course_id uuid, course_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_course_id UUID;
  v_course_name TEXT;
  v_student_id UUID;
  v_enrollment_count INTEGER;
  v_max_enrollments INTEGER;
  v_code_enabled BOOLEAN;
  v_code_expires TIMESTAMPTZ;
BEGIN
  -- Find course by join code
  SELECT 
    c.id, 
    c.name, 
    c.join_code_enabled, 
    c.join_code_expires_at,
    c.max_enrollments
  INTO 
    v_course_id, 
    v_course_name, 
    v_code_enabled, 
    v_code_expires,
    v_max_enrollments
  FROM public.courses c
  WHERE c.join_code = UPPER(p_join_code);
  
  -- Check if course exists
  IF v_course_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid join code'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if join code is enabled
  IF NOT v_code_enabled THEN
    RETURN QUERY SELECT false, 'This join code is no longer active'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if join code has expired
  IF v_code_expires IS NOT NULL AND v_code_expires < NOW() THEN
    RETURN QUERY SELECT false, 'This join code has expired'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check enrollment limit
  IF v_max_enrollments IS NOT NULL THEN
    SELECT COUNT(*) INTO v_enrollment_count
    FROM public.course_students cs
    WHERE cs.course_id = v_course_id;
    
    IF v_enrollment_count >= v_max_enrollments THEN
      RETURN QUERY SELECT false, 'This course has reached maximum enrollment'::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Find or create student record
  SELECT id INTO v_student_id
  FROM public.students
  WHERE email = p_student_email;
  
  IF v_student_id IS NULL THEN
    -- Create student record if it doesn't exist
    INSERT INTO public.students (email, name, google_user_id)
    VALUES (
      p_student_email, 
      SPLIT_PART(p_student_email, '@', 1), -- Use email prefix as temporary name
      'user_' || MD5(p_student_email) -- Generate temporary google_user_id
    )
    RETURNING id INTO v_student_id;
    
    RAISE NOTICE 'Created new student record: % (ID: %)', p_student_email, v_student_id;
  END IF;
  
  -- Check if already enrolled (use table alias to avoid ambiguity)
  IF EXISTS(
    SELECT 1 FROM public.course_students cs
    WHERE cs.course_id = v_course_id AND cs.student_id = v_student_id
  ) THEN
    RETURN QUERY SELECT true, 'Already enrolled in this course'::TEXT, v_course_id, v_course_name;
    RETURN;
  END IF;
  
  -- Enroll student (don't use enrolled_by to avoid foreign key issue)
  INSERT INTO public.course_students (
    course_id, 
    student_id, 
    enrollment_state, 
    enrolled_via,
    enrolled_at
  )
  VALUES (
    v_course_id, 
    v_student_id, 
    'ACTIVE', 
    'join_code',
    NOW()
  );
  
  RAISE NOTICE 'Student % enrolled in course % via join code', p_student_email, v_course_name;
  
  RETURN QUERY SELECT true, 'Successfully enrolled'::TEXT, v_course_id, v_course_name;
END;
$$;


ALTER FUNCTION public.enroll_student_with_code(p_student_email text, p_join_code text) OWNER TO postgres;

-- Name: FUNCTION enroll_student_with_code(p_student_email text, p_join_code text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.enroll_student_with_code(p_student_email text, p_join_code text) IS 'Enroll a student in a course using a join code. Auto-creates student record if needed.';


-- Name: generate_join_code(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_join_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code (uppercase, no confusing chars like O, 0, I, 1)
    v_code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6)
    );
    -- Replace confusing characters
    v_code := TRANSLATE(v_code, '0O1IL', 'ABCDE');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.courses WHERE join_code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;


ALTER FUNCTION public.generate_join_code() OWNER TO postgres;

-- Name: get_assignment_overview(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_assignment_overview(p_teacher_email text, p_course_id text DEFAULT NULL::text) RETURNS TABLE(assignment_id uuid, assignment_type text, title text, due_date timestamp with time zone, course_id text, total_assigned integer, total_started integer, total_completed integer, total_submitted integer, average_score numeric, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.assignment_type,
    ua.title,
    ua.due_date,
    ua.course_id,
    ua.total_assigned,
    ua.total_started,
    ua.total_completed,
    ua.total_submitted,
    ua.average_score,
    ua.created_at
  FROM unified_assignments ua
  WHERE ua.assigned_by = p_teacher_email
  AND (p_course_id IS NULL OR ua.course_id = p_course_id)
  AND ua.published = true
  ORDER BY ua.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_assignment_overview(p_teacher_email text, p_course_id text) OWNER TO postgres;

-- Name: FUNCTION get_assignment_overview(p_teacher_email text, p_course_id text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_assignment_overview(p_teacher_email text, p_course_id text) IS 'Returns assignment overview for teacher with analytics';


-- Name: get_assignment_with_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_assignment_with_stats(assignment_uuid uuid) RETURNS TABLE(assignment_data jsonb, stats jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(a.*) AS assignment_data,
    jsonb_build_object(
      'total_assigned', COALESCE((SELECT COUNT(*) FROM public.assignment_submissions WHERE assignment_id = a.id), 0),
      'submitted_count', COALESCE((SELECT COUNT(*) FROM public.assignment_submissions WHERE assignment_id = a.id AND status IN ('submitted', 'graded')), 0),
      'graded_count', COALESCE((SELECT COUNT(*) FROM public.assignment_submissions WHERE assignment_id = a.id AND status = 'graded'), 0),
      'average_score', COALESCE((SELECT AVG(score) FROM public.assignment_submissions WHERE assignment_id = a.id AND status = 'graded'), 0)
    ) AS stats
  FROM public.assignments a
  WHERE a.id = assignment_uuid;
END;
$$;


ALTER FUNCTION public.get_assignment_with_stats(assignment_uuid uuid) OWNER TO postgres;

-- Name: FUNCTION get_assignment_with_stats(assignment_uuid uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_assignment_with_stats(assignment_uuid uuid) IS 'Gets assignment data with statistics with SET search_path for security';


-- Name: get_auth_email_safe(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_auth_email_safe() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  email_value TEXT;
BEGIN
  -- Try JWT first
  email_value := auth.jwt() ->> 'email';
  
  -- If not in JWT, try users table
  IF email_value IS NULL THEN
    SELECT email INTO email_value 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(email_value, '');
END;
$$;


ALTER FUNCTION public.get_auth_email_safe() OWNER TO postgres;

-- Name: get_auth_user_id_text(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_auth_user_id_text() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(auth.uid()::TEXT, '')
$$;


ALTER FUNCTION public.get_auth_user_id_text() OWNER TO postgres;

-- Name: get_course_students(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_course_students(p_course_id uuid) RETURNS TABLE(id uuid, google_user_id text, email text, name text, photo_url text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.google_user_id, s.email, s.name, s.photo_url
  FROM public.students s
  INNER JOIN public.course_students cs ON cs.student_id = s.id
  WHERE cs.course_id = p_course_id
  ORDER BY s.name;
END;
$$;


ALTER FUNCTION public.get_course_students(p_course_id uuid) OWNER TO postgres;

-- Name: FUNCTION get_course_students(p_course_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_course_students(p_course_id uuid) IS 'Returns students in a course with SET search_path for security';


-- Name: get_student_activity_summary(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_student_activity_summary(p_student_id uuid DEFAULT NULL::uuid, p_user_email text DEFAULT NULL::text) RETURNS TABLE(total_assignments integer, completed_assignments integer, total_lessons integer, completed_lessons integer, total_games integer, total_points integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_id_to_check TEXT;
BEGIN
  -- Determine which user to check
  IF p_user_email IS NOT NULL THEN
    user_id_to_check := p_user_email;
  ELSIF p_student_id IS NOT NULL THEN
    SELECT email INTO user_id_to_check FROM public.users WHERE id = p_student_id;
  ELSE
    user_id_to_check := auth.uid()::TEXT;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((SELECT COUNT(*) FROM public.gradebook_entries WHERE user_email = user_id_to_check AND item_type = 'assignment'), 0)::INTEGER AS total_assignments,
    COALESCE((SELECT COUNT(*) FROM public.gradebook_entries WHERE user_email = user_id_to_check AND item_type = 'assignment' AND status = 'graded'), 0)::INTEGER AS completed_assignments,
    COALESCE((SELECT COUNT(*) FROM public.lesson_progress WHERE user_email = user_id_to_check), 0)::INTEGER AS total_lessons,
    COALESCE((SELECT COUNT(*) FROM public.lesson_progress WHERE user_email = user_id_to_check AND status = 'completed'), 0)::INTEGER AS completed_lessons,
    COALESCE((SELECT COUNT(*) FROM public.vocabulary_game_scores WHERE user_email = user_id_to_check), 0)::INTEGER AS total_games,
    COALESCE((SELECT SUM(score) FROM public.vocabulary_game_scores WHERE user_email = user_id_to_check), 0)::INTEGER AS total_points;
END;
$$;


ALTER FUNCTION public.get_student_activity_summary(p_student_id uuid, p_user_email text) OWNER TO postgres;

-- Name: FUNCTION get_student_activity_summary(p_student_id uuid, p_user_email text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_student_activity_summary(p_student_id uuid, p_user_email text) IS 'Gets activity summary for a student with SET search_path for security';


-- Name: get_student_assignments(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_student_assignments(p_student_id text, p_status_filter text DEFAULT NULL::text, p_assignment_type_filter text DEFAULT NULL::text) RETURNS TABLE(assignment_id uuid, assignment_type text, title text, description text, due_date timestamp with time zone, status text, progress_percentage integer, score numeric, max_score integer, percentage numeric, time_spent integer, is_late boolean, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.assignment_type,
    ua.title,
    ua.description,
    ua.due_date,
    sap.status,
    sap.progress_percentage,
    sap.score,
    sap.max_score,
    sap.percentage,
    sap.time_spent,
    sap.is_late,
    sap.last_accessed_at
  FROM unified_assignments ua
  JOIN student_assignment_progress sap ON sap.unified_assignment_id = ua.id
  WHERE sap.student_id = p_student_id
  AND (p_status_filter IS NULL OR sap.status = p_status_filter)
  AND (p_assignment_type_filter IS NULL OR ua.assignment_type = p_assignment_type_filter)
  AND ua.published = true
  ORDER BY 
    CASE WHEN ua.due_date IS NULL THEN 1 ELSE 0 END,
    ua.due_date ASC,
    ua.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_student_assignments(p_student_id text, p_status_filter text, p_assignment_type_filter text) OWNER TO postgres;

-- Name: FUNCTION get_student_assignments(p_student_id text, p_status_filter text, p_assignment_type_filter text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_student_assignments(p_student_id text, p_status_filter text, p_assignment_type_filter text) IS 'Returns all assignments for a student with filtering';


-- Name: get_unassigned_students(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_unassigned_students() RETURNS TABLE(id uuid, email text, name text, google_user_id text, created_at timestamp with time zone, last_sign_in timestamp with time zone, course_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.email,
    s.name,
    s.google_user_id,
    s.created_at,
    s.updated_at as last_sign_in,
    COALESCE(
      (SELECT COUNT(*) FROM public.course_students cs WHERE cs.student_id = s.id),
      0
    )::INTEGER as course_count
  FROM public.students s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.course_students cs 
    WHERE cs.student_id = s.id
  )
  ORDER BY s.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_unassigned_students() OWNER TO postgres;

-- Name: get_user_email(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_email() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get email from users table based on auth.uid()
  SELECT email INTO user_email
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN user_email;
END;
$$;


ALTER FUNCTION public.get_user_email() OWNER TO postgres;

-- Name: FUNCTION get_user_email(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_user_email() IS 'Gets the email of the currently authenticated user from the users table';


-- Name: increment_question_usage(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_question_usage(p_question_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.question_bank
  SET usage_count = COALESCE(usage_count, 0) + 1,
      updated_at = NOW()
  WHERE id = p_question_id;
END;
$$;


ALTER FUNCTION public.increment_question_usage(p_question_id uuid) OWNER TO postgres;

-- Name: FUNCTION increment_question_usage(p_question_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.increment_question_usage(p_question_id uuid) IS 'Increments question bank usage count with SET search_path for security';


-- Name: increment_simulation_views(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_simulation_views(simulation_slug text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE simulations
  SET view_count = view_count + 1
  WHERE slug = simulation_slug;
END;
$$;


ALTER FUNCTION public.increment_simulation_views(simulation_slug text) OWNER TO postgres;

-- Name: increment_tool_uses(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_tool_uses(tool_slug text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE tools
  SET use_count = use_count + 1
  WHERE slug = tool_slug;
END;
$$;


ALTER FUNCTION public.increment_tool_uses(tool_slug text) OWNER TO postgres;

-- Name: is_admin_or_teacher(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin_or_teacher() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_email TEXT;
BEGIN
  user_email := public.get_auth_email_safe();
  
  -- Check user_roles table
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = user_email 
    AND role IN ('admin', 'teacher')
  );
END;
$$;


ALTER FUNCTION public.is_admin_or_teacher() OWNER TO postgres;

-- Name: is_admin_or_teacher(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin_or_teacher(check_email text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = check_email 
    AND role IN ('admin', 'teacher')
  );
END;
$$;


ALTER FUNCTION public.is_admin_or_teacher(check_email text) OWNER TO postgres;

-- Name: is_student(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_student() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN NOT public.is_admin_or_teacher();
END;
$$;


ALTER FUNCTION public.is_student() OWNER TO postgres;

-- Name: FUNCTION is_student(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.is_student() IS 'Checks if the current user is a student (not admin/teacher)';


-- Name: mark_overdue_assignments(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_overdue_assignments() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE student_assignment_progress
  SET status = 'overdue'
  WHERE unified_assignment_id IN (
    SELECT id FROM unified_assignments
    WHERE due_date < NOW()
    AND published = true
  )
  AND status IN ('assigned', 'started', 'in_progress')
  AND NOT is_excused;
END;
$$;


ALTER FUNCTION public.mark_overdue_assignments() OWNER TO postgres;

-- Name: FUNCTION mark_overdue_assignments(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.mark_overdue_assignments() IS 'Marks assignments as overdue based on due_date';


-- Name: record_assignment_submission(uuid, text, text, jsonb, numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.record_assignment_submission(p_assignment_id uuid, p_user_id text, p_user_email text, p_submission_data jsonb, p_score numeric DEFAULT NULL::numeric, p_max_score numeric DEFAULT NULL::numeric) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  submission_id UUID;
  assignment_title TEXT;
  assignment_course TEXT;
  assignment_due TIMESTAMPTZ;
BEGIN
  -- Get assignment details
  SELECT title, course_id, due_date
  INTO assignment_title, assignment_course, assignment_due
  FROM public.assignments
  WHERE id = p_assignment_id;

  -- Insert submission record
  INSERT INTO public.assignment_submissions (
    assignment_id,
    user_id,
    user_email,
    submission_data,
    score,
    max_score,
    status,
    submitted_at,
    created_at
  ) VALUES (
    p_assignment_id,
    p_user_id,
    p_user_email,
    p_submission_data,
    p_score,
    p_max_score,
    CASE WHEN p_score IS NOT NULL THEN 'graded' ELSE 'submitted' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (assignment_id, user_id)
  DO UPDATE SET
    submission_data = EXCLUDED.submission_data,
    score = EXCLUDED.score,
    max_score = EXCLUDED.max_score,
    status = EXCLUDED.status,
    submitted_at = EXCLUDED.submitted_at,
    updated_at = NOW()
  RETURNING id INTO submission_id;

  -- Update or create gradebook entry
  INSERT INTO public.gradebook_entries (
    user_id,
    user_email,
    item_type,
    item_id,
    item_title,
    course_id,
    score,
    max_score,
    percentage,
    status,
    due_date,
    submitted_at,
    graded_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_user_email,
    'assignment',
    p_assignment_id::TEXT,
    assignment_title,
    assignment_course,
    p_score,
    p_max_score,
    CASE WHEN p_score IS NOT NULL AND p_max_score > 0 
         THEN (p_score / p_max_score * 100) 
         ELSE NULL END,
    CASE WHEN p_score IS NOT NULL THEN 'graded' ELSE 'submitted' END,
    assignment_due,
    NOW(),
    CASE WHEN p_score IS NOT NULL THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (user_id, item_type, item_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    max_score = EXCLUDED.max_score,
    percentage = EXCLUDED.percentage,
    status = EXCLUDED.status,
    submitted_at = EXCLUDED.submitted_at,
    graded_at = EXCLUDED.graded_at,
    updated_at = NOW();

  RETURN submission_id;
END;
$$;


ALTER FUNCTION public.record_assignment_submission(p_assignment_id uuid, p_user_id text, p_user_email text, p_submission_data jsonb, p_score numeric, p_max_score numeric) OWNER TO postgres;

-- Name: FUNCTION record_assignment_submission(p_assignment_id uuid, p_user_id text, p_user_email text, p_submission_data jsonb, p_score numeric, p_max_score numeric); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.record_assignment_submission(p_assignment_id uuid, p_user_id text, p_user_email text, p_submission_data jsonb, p_score numeric, p_max_score numeric) IS 'Records an assignment submission and updates gradebook with SET search_path for security';


-- Name: record_lesson_view(text, text, text, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.record_lesson_view(p_user_id text, p_user_email text, p_user_name text, p_lesson_id uuid, p_lesson_slug text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  progress_id UUID;
BEGIN
  -- Insert or update lesson progress
  INSERT INTO public.lesson_progress (
    user_id,
    user_email,
    lesson_id,
    lesson_slug,
    status,
    started_at,
    last_accessed_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_user_email,
    p_lesson_id,
    p_lesson_slug,
    'in_progress',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    last_accessed_at = NOW(),
    updated_at = NOW(),
    status = CASE 
      WHEN public.lesson_progress.status = 'not_started' THEN 'in_progress'
      ELSE public.lesson_progress.status
    END
  RETURNING id INTO progress_id;

  RETURN progress_id;
END;
$$;


ALTER FUNCTION public.record_lesson_view(p_user_id text, p_user_email text, p_user_name text, p_lesson_id uuid, p_lesson_slug text) OWNER TO postgres;

-- Name: FUNCTION record_lesson_view(p_user_id text, p_user_email text, p_user_name text, p_lesson_id uuid, p_lesson_slug text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.record_lesson_view(p_user_id text, p_user_email text, p_user_name text, p_lesson_id uuid, p_lesson_slug text) IS 'Records a lesson view and updates progress with SET search_path for security';


-- Name: sync_course(text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_course(p_google_course_id text, p_name text, p_section text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_room text DEFAULT NULL::text, p_teacher_email text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  course_id UUID;
BEGIN
  -- Insert or update course
  INSERT INTO public.courses (
    google_course_id,
    name,
    section,
    description,
    room,
    teacher_email,
    updated_at
  ) VALUES (
    p_google_course_id,
    p_name,
    p_section,
    p_description,
    p_room,
    p_teacher_email,
    NOW()
  )
  ON CONFLICT (google_course_id)
  DO UPDATE SET
    name = EXCLUDED.name,
    section = EXCLUDED.section,
    description = EXCLUDED.description,
    room = EXCLUDED.room,
    teacher_email = EXCLUDED.teacher_email,
    updated_at = NOW()
  RETURNING id INTO course_id;

  RETURN course_id;
END;
$$;


ALTER FUNCTION public.sync_course(p_google_course_id text, p_name text, p_section text, p_description text, p_room text, p_teacher_email text) OWNER TO postgres;

-- Name: FUNCTION sync_course(p_google_course_id text, p_name text, p_section text, p_description text, p_room text, p_teacher_email text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sync_course(p_google_course_id text, p_name text, p_section text, p_description text, p_room text, p_teacher_email text) IS 'Syncs course data from Google Classroom with SET search_path for security';


-- Name: sync_student(text, text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_student(p_google_user_id text, p_email text, p_name text, p_photo_url text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_student_id UUID;  -- Use v_ prefix to avoid ambiguity
BEGIN
  -- Insert or update student
  INSERT INTO public.students (
    google_user_id,
    email,
    name,
    photo_url,
    updated_at
  ) VALUES (
    p_google_user_id,
    p_email,
    p_name,
    p_photo_url,
    NOW()
  )
  ON CONFLICT (google_user_id)
  DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    photo_url = EXCLUDED.photo_url,
    updated_at = NOW()
  RETURNING id INTO v_student_id;

  -- If course_id provided, link student to course
  IF p_course_id IS NOT NULL THEN
    INSERT INTO public.course_students (course_id, student_id)
    VALUES (p_course_id, v_student_id)
    ON CONFLICT (course_id, student_id) DO NOTHING;
  END IF;

  RETURN v_student_id;
END;
$$;


ALTER FUNCTION public.sync_student(p_google_user_id text, p_email text, p_name text, p_photo_url text, p_course_id uuid) OWNER TO postgres;

-- Name: FUNCTION sync_student(p_google_user_id text, p_email text, p_name text, p_photo_url text, p_course_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sync_student(p_google_user_id text, p_email text, p_name text, p_photo_url text, p_course_id uuid) IS 'Syncs student data from Google Classroom and links to course via course_students junction table';


-- Name: update_assignment_analytics(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_assignment_analytics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE unified_assignments
  SET 
    total_started = (
      SELECT COUNT(DISTINCT student_id) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND status IN ('started', 'in_progress', 'completed', 'submitted', 'graded')
    ),
    total_completed = (
      SELECT COUNT(DISTINCT student_id) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND status IN ('completed', 'submitted', 'graded')
    ),
    total_submitted = (
      SELECT COUNT(DISTINCT student_id) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND status IN ('submitted', 'graded')
    ),
    average_score = (
      SELECT AVG(percentage) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND percentage IS NOT NULL
    ),
    average_time_spent = (
      SELECT AVG(time_spent) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND time_spent > 0
    )
  WHERE id = NEW.unified_assignment_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_assignment_analytics() OWNER TO postgres;

-- Name: update_assignment_assignment_analytics(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_assignment_assignment_analytics() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Function implementation remains the same
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_assignment_assignment_analytics() OWNER TO postgres;

-- Name: update_assignment_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_assignment_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_assignment_timestamp() OWNER TO postgres;

-- Name: update_course_student_counts(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_course_student_counts() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.courses c
  SET 
    student_count = (
      SELECT COUNT(*)
      FROM public.course_students cs
      WHERE cs.course_id = c.id
    ),
    updated_at = NOW();
END;
$$;


ALTER FUNCTION public.update_course_student_counts() OWNER TO postgres;

-- Name: FUNCTION update_course_student_counts(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.update_course_student_counts() IS 'Updates student counts for all courses with SET search_path for security';


-- Name: update_lesson_assignment_analytics(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_lesson_assignment_analytics() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Function implementation remains the same
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_lesson_assignment_analytics() OWNER TO postgres;

-- Name: update_lesson_progress_percentage(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_lesson_progress_percentage() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.max_possible_score > 0 THEN
    NEW.percentage = (NEW.total_score::DECIMAL / NEW.max_possible_score::DECIMAL) * 100;
  ELSE
    NEW.percentage = 0;
  END IF;
  
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_lesson_progress_percentage() OWNER TO postgres;

-- Name: update_rubric_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_rubric_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_rubric_updated_at() OWNER TO postgres;

-- Name: update_simulation_assignment_analytics(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_simulation_assignment_analytics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update counts on simulation_assignments table
  UPDATE simulation_assignments
  SET 
    total_started = (
      SELECT COUNT(*) FROM student_simulation_assignments 
      WHERE simulation_assignment_id = NEW.simulation_assignment_id 
      AND status IN ('started', 'in_progress', 'completed', 'submitted', 'graded')
    ),
    total_completed = (
      SELECT COUNT(*) FROM student_simulation_assignments 
      WHERE simulation_assignment_id = NEW.simulation_assignment_id 
      AND simulation_completed = TRUE
    ),
    total_submitted = (
      SELECT COUNT(*) FROM student_simulation_assignments 
      WHERE simulation_assignment_id = NEW.simulation_assignment_id 
      AND status IN ('submitted', 'graded')
    )
  WHERE id = NEW.simulation_assignment_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_simulation_assignment_analytics() OWNER TO postgres;

-- Name: update_simulation_assignment_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_simulation_assignment_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_simulation_assignment_timestamp() OWNER TO postgres;

-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

-- Name: FUNCTION update_updated_at_column(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to auto-update updated_at timestamps with SET search_path for security';


-- Name: update_vocabulary_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_vocabulary_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_vocabulary_updated_at() OWNER TO postgres;

-- Name: validate_lesson_videos(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_lesson_videos(lesson_uuid uuid) RETURNS TABLE(video_id text, is_valid boolean, error_message text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  lesson_videos JSONB;
  video_item JSONB;
BEGIN
  -- Get videos from lesson
  SELECT videos INTO lesson_videos
  FROM public.lessons
  WHERE id = lesson_uuid;

  -- Validate each video
  IF lesson_videos IS NOT NULL THEN
    FOR video_item IN SELECT * FROM jsonb_array_elements(lesson_videos)
    LOOP
      RETURN QUERY
      SELECT
        video_item->>'id' AS video_id,
        (video_item->>'id' IS NOT NULL AND video_item->>'title' IS NOT NULL) AS is_valid,
        CASE
          WHEN video_item->>'id' IS NULL THEN 'Missing video ID'
          WHEN video_item->>'title' IS NULL THEN 'Missing video title'
          ELSE NULL
        END AS error_message;
    END LOOP;
  END IF;
END;
$$;


ALTER FUNCTION public.validate_lesson_videos(lesson_uuid uuid) OWNER TO postgres;

-- Name: FUNCTION validate_lesson_videos(lesson_uuid uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validate_lesson_videos(lesson_uuid uuid) IS 'Validates video data in a lesson with SET search_path for security';


-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(255) NOT NULL,
    provider character varying(255) NOT NULL,
    provider_account_id character varying(255) NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    token_type character varying(255),
    scope character varying(255),
    id_token text,
    session_state character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.accounts OWNER TO postgres;

-- Name: admin_emails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_emails (
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admin_emails OWNER TO postgres;

-- Name: assignment_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id text NOT NULL,
    assignment_title text NOT NULL,
    total_assigned integer DEFAULT 0,
    total_submitted integer DEFAULT 0,
    total_completed integer DEFAULT 0,
    avg_score numeric(5,2),
    median_score numeric(5,2),
    min_score numeric(5,2),
    max_score numeric(5,2),
    avg_time_spent integer,
    median_time_spent integer,
    last_calculated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.assignment_analytics OWNER TO postgres;

-- Name: assignment_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id text NOT NULL,
    course_id text,
    assigned_students uuid[],
    assigned_by text NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    due_date timestamp with time zone,
    title text,
    instructions text,
    max_attempts integer DEFAULT 1,
    time_limit integer,
    is_active boolean DEFAULT true,
    published boolean DEFAULT true,
    total_assigned integer DEFAULT 0,
    total_started integer DEFAULT 0,
    total_submitted integer DEFAULT 0,
    total_completed integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT assignment_assignments_check CHECK (((course_id IS NOT NULL) OR (assigned_students IS NOT NULL))),
    CONSTRAINT assignment_assignments_check1 CHECK ((NOT ((course_id IS NOT NULL) AND (assigned_students IS NOT NULL))))
);


ALTER TABLE public.assignment_assignments OWNER TO postgres;

-- Name: TABLE assignment_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.assignment_assignments IS 'Assignments of homework assignments to classes or individual students';


-- Name: COLUMN assignment_assignments.max_attempts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assignment_assignments.max_attempts IS 'Number of submission attempts allowed (default 1)';


-- Name: COLUMN assignment_assignments.time_limit; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assignment_assignments.time_limit IS 'Time limit for assignment completion in minutes';


-- Name: assignment_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_progress_id uuid,
    commenter_email text NOT NULL,
    commenter_name text,
    comment_text text NOT NULL,
    is_private boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.assignment_comments OWNER TO postgres;

-- Name: TABLE assignment_comments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.assignment_comments IS 'Teacher-student comments on assignments';


-- Name: assignment_reminders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_assignment_id uuid,
    assignment_assignment_id uuid,
    student_id uuid NOT NULL,
    reminder_type text NOT NULL,
    days_before_due integer,
    sent_at timestamp with time zone,
    is_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT assignment_reminders_check CHECK (((lesson_assignment_id IS NOT NULL) OR (assignment_assignment_id IS NOT NULL))),
    CONSTRAINT assignment_reminders_check1 CHECK ((NOT ((lesson_assignment_id IS NOT NULL) AND (assignment_assignment_id IS NOT NULL)))),
    CONSTRAINT assignment_reminders_reminder_type_check CHECK ((reminder_type = ANY (ARRAY['due_soon'::text, 'overdue'::text, 'incomplete'::text])))
);


ALTER TABLE public.assignment_reminders OWNER TO postgres;

-- Name: TABLE assignment_reminders; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.assignment_reminders IS 'Reminders for upcoming or overdue assignments';


-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id text NOT NULL,
    user_id text NOT NULL,
    user_email text NOT NULL,
    user_name text,
    submission_data jsonb NOT NULL,
    score numeric(5,2),
    max_score numeric(5,2),
    percentage numeric(5,2),
    time_started timestamp with time zone,
    time_submitted timestamp with time zone DEFAULT now() NOT NULL,
    time_spent integer,
    auto_graded boolean DEFAULT false,
    manually_graded boolean DEFAULT false,
    graded_by text,
    graded_at timestamp with time zone,
    feedback text,
    question_scores jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.assignment_submissions OWNER TO postgres;

-- Name: assignment_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unified_assignment_id uuid,
    tag_name text NOT NULL,
    tag_category text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.assignment_tags OWNER TO postgres;

-- Name: TABLE assignment_tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.assignment_tags IS 'Tags for organizing and filtering assignments';


-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    instructions text,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    lesson_id uuid,
    due_date timestamp with time zone,
    published boolean DEFAULT false,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.assignments OWNER TO postgres;

-- Name: course_students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    student_id uuid NOT NULL,
    enrollment_state text DEFAULT 'ACTIVE'::text,
    enrolled_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    enrolled_via text DEFAULT 'import'::text,
    enrolled_by uuid
);


ALTER TABLE public.course_students OWNER TO postgres;

-- Name: TABLE course_students; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.course_students IS 'Junction table linking students to courses (many-to-many relationship)';


-- Name: COLUMN course_students.enrollment_state; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_students.enrollment_state IS 'Student enrollment state: ACTIVE, INACTIVE, WITHDRAWN';


-- Name: COLUMN course_students.enrolled_via; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_students.enrolled_via IS 'How the student was enrolled: import, join_code, or manual';


-- Name: COLUMN course_students.enrolled_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_students.enrolled_by IS 'User ID who enrolled the student (null for self-enrollment)';


-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    google_course_id text NOT NULL,
    name text NOT NULL,
    section text,
    description text,
    room text,
    owner_id text,
    course_state text DEFAULT 'ACTIVE'::text,
    creation_time timestamp with time zone,
    update_time timestamp with time zone,
    last_synced_at timestamp with time zone DEFAULT now(),
    student_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    teacher_email text,
    join_code text,
    join_code_enabled boolean DEFAULT false,
    join_code_expires_at timestamp with time zone,
    max_enrollments integer,
    CONSTRAINT courses_course_state_check CHECK ((course_state = ANY (ARRAY['ACTIVE'::text, 'ARCHIVED'::text, 'PROVISIONED'::text, 'DECLINED'::text, 'SUSPENDED'::text])))
);


ALTER TABLE public.courses OWNER TO postgres;

-- Name: gradebook_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gradebook_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    user_email text NOT NULL,
    student_name text,
    item_type text NOT NULL,
    item_id text NOT NULL,
    item_title text NOT NULL,
    course_id text,
    score numeric(10,2),
    max_score numeric(10,2),
    percentage numeric(5,2),
    status text,
    due_date timestamp with time zone,
    submitted_at timestamp with time zone,
    graded_at timestamp with time zone,
    synced_to_classroom boolean DEFAULT false,
    classroom_grade_id text,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_item_type CHECK ((item_type = ANY (ARRAY['assignment'::text, 'lesson'::text, 'vocabulary_game'::text]))),
    CONSTRAINT valid_status_gradebook CHECK (((status IS NULL) OR (status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'submitted'::text, 'graded'::text, 'completed'::text]))))
);


ALTER TABLE public.gradebook_entries OWNER TO postgres;

-- Name: TABLE gradebook_entries; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gradebook_entries IS 'Unified gradebook view for all graded items, syncs to Google Classroom';


-- Name: interactive_lesson_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interactive_lesson_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    lesson_id uuid,
    interactive_lesson_id uuid,
    current_step_id text,
    completed_steps text[] DEFAULT '{}'::text[],
    step_scores jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'not_started'::text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    last_accessed_at timestamp with time zone DEFAULT now(),
    total_score integer DEFAULT 0,
    max_possible_score integer DEFAULT 0,
    percentage numeric(5,2),
    total_ai_interactions integer DEFAULT 0,
    ai_conversation_history jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT interactive_lesson_progress_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])))
);


ALTER TABLE public.interactive_lesson_progress OWNER TO postgres;

-- Name: TABLE interactive_lesson_progress; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.interactive_lesson_progress IS 'Tracks student progress through interactive lessons';


-- Name: COLUMN interactive_lesson_progress.step_scores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interactive_lesson_progress.step_scores IS 'JSONB object mapping step IDs to scores';


-- Name: interactive_lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interactive_lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid,
    steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    ai_enabled boolean DEFAULT true,
    ai_scaffolding_level text DEFAULT 'adaptive'::text,
    ai_system_prompt text,
    requires_sequential boolean DEFAULT true,
    passing_score integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT interactive_lessons_ai_scaffolding_level_check CHECK ((ai_scaffolding_level = ANY (ARRAY['none'::text, 'minimal'::text, 'adaptive'::text, 'full'::text]))),
    CONSTRAINT interactive_lessons_passing_score_check CHECK (((passing_score >= 0) AND (passing_score <= 100)))
);


ALTER TABLE public.interactive_lessons OWNER TO postgres;

-- Name: TABLE interactive_lessons; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.interactive_lessons IS 'Multi-step interactive lessons that combine simulations, tools, questions, and AI guidance';


-- Name: COLUMN interactive_lessons.steps; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interactive_lessons.steps IS 'JSONB array of step objects defining the lesson flow';


-- Name: COLUMN interactive_lessons.ai_scaffolding_level; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interactive_lessons.ai_scaffolding_level IS 'How much AI assistance: none, minimal, adaptive, or full';


-- Name: lesson_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    course_id text,
    assigned_students uuid[],
    assigned_by text NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    due_date timestamp with time zone,
    title text,
    instructions text,
    estimated_time integer,
    is_active boolean DEFAULT true,
    published boolean DEFAULT true,
    total_assigned integer DEFAULT 0,
    total_started integer DEFAULT 0,
    total_completed integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lesson_assignments_check CHECK (((course_id IS NOT NULL) OR (assigned_students IS NOT NULL))),
    CONSTRAINT lesson_assignments_check1 CHECK ((NOT ((course_id IS NOT NULL) AND (assigned_students IS NOT NULL))))
);


ALTER TABLE public.lesson_assignments OWNER TO postgres;

-- Name: TABLE lesson_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lesson_assignments IS 'Assignments of lessons to classes or individual students';


-- Name: COLUMN lesson_assignments.course_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lesson_assignments.course_id IS 'Google Classroom course ID if assigning to entire class';


-- Name: COLUMN lesson_assignments.assigned_students; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lesson_assignments.assigned_students IS 'Array of student UUIDs if assigning to specific students';


-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    user_email text NOT NULL,
    lesson_id uuid NOT NULL,
    lesson_slug text,
    status text DEFAULT 'not_started'::text NOT NULL,
    progress_percentage integer DEFAULT 0,
    objectives_completed integer DEFAULT 0,
    objectives_total integer DEFAULT 0,
    videos_watched integer DEFAULT 0,
    videos_total integer DEFAULT 0,
    video_questions_answered integer DEFAULT 0,
    video_questions_correct integer DEFAULT 0,
    video_questions_total integer DEFAULT 0,
    time_spent integer DEFAULT 0,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    last_accessed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_progress CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100))),
    CONSTRAINT valid_status_lesson CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text])))
);


ALTER TABLE public.lesson_progress OWNER TO postgres;

-- Name: TABLE lesson_progress; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lesson_progress IS 'Tracks student progress through lessons including videos and objectives';


-- Name: lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text,
    description text,
    published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    unit text DEFAULT 'General'::text NOT NULL,
    lesson_number integer DEFAULT 1 NOT NULL,
    videos jsonb DEFAULT '[]'::jsonb,
    estimated_time integer,
    objectives text[] DEFAULT '{}'::text[],
    lesson_type text DEFAULT 'markdown'::text,
    simulation_id uuid,
    embedded_questions jsonb DEFAULT '[]'::jsonb,
    question_timing text DEFAULT 'after'::text,
    CONSTRAINT lessons_lesson_type_check CHECK ((lesson_type = ANY (ARRAY['video'::text, 'simulation'::text, 'markdown'::text]))),
    CONSTRAINT lessons_question_timing_check CHECK ((question_timing = ANY (ARRAY['before'::text, 'after'::text, 'mixed'::text])))
);


ALTER TABLE public.lessons OWNER TO postgres;

-- Name: TABLE lessons; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lessons IS 'Stores physics lessons with content, videos, and learning objectives';


-- Name: COLUMN lessons.slug; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lessons.slug IS 'URL-friendly identifier for the lesson';


-- Name: COLUMN lessons.lesson_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lessons.lesson_number IS 'Sequential number within the unit';


-- Name: COLUMN lessons.videos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lessons.videos IS 'Array of video objects: [{"id": "string", "title": "string", "youtubeId": "string", "duration": "string", "description": "string", "timestamp": number}]';


-- Name: COLUMN lessons.estimated_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lessons.estimated_time IS 'Estimated time to complete lesson in minutes';


-- Name: COLUMN lessons.objectives; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lessons.objectives IS 'Array of learning objectives as strings';


-- Name: COLUMN lessons.lesson_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lessons.lesson_type IS 'Type of lesson: video (EdPuzzle-style) or simulation (interactive)';


-- Name: COLUMN lessons.simulation_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lessons.simulation_id IS 'For simulation lessons, references the simulation to display';


-- Name: COLUMN lessons.embedded_questions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lessons.embedded_questions IS 'JSONB array of questions to show before/after simulation';


-- Name: COLUMN lessons.question_timing; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lessons.question_timing IS 'When to show questions: before, after, or mixed';


-- Name: physics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.physics (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.physics OWNER TO postgres;

-- Name: physics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.physics ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.physics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


-- Name: question_bank; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_bank (
    id text DEFAULT gen_random_uuid() NOT NULL,
    question_data jsonb NOT NULL,
    unit_id text NOT NULL,
    lesson_id uuid,
    question_type text NOT NULL,
    question_text text NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    difficulty text,
    topics text[] DEFAULT '{}'::text[],
    tags text[] DEFAULT '{}'::text[],
    cognitive_level text,
    estimated_time integer,
    usage_count integer DEFAULT 0,
    created_by text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT question_bank_cognitive_level_check CHECK ((cognitive_level = ANY (ARRAY['remember'::text, 'understand'::text, 'apply'::text, 'analyze'::text, 'evaluate'::text, 'create'::text]))),
    CONSTRAINT question_bank_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])))
);


ALTER TABLE public.question_bank OWNER TO postgres;

-- Name: question_usage_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_usage_log (
    id integer NOT NULL,
    question_id text NOT NULL,
    assignment_id text,
    user_id text,
    used_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE public.question_usage_log OWNER TO postgres;

-- Name: question_usage_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_usage_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_usage_log_id_seq OWNER TO postgres;

-- Name: question_usage_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_usage_log_id_seq OWNED BY public.question_usage_log.id;


-- Name: rubric_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rubric_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rubric_id uuid,
    student_simulation_assignment_id uuid NOT NULL,
    student_id text NOT NULL,
    criterion_scores jsonb DEFAULT '{}'::jsonb NOT NULL,
    total_score integer,
    letter_grade text,
    feedback text,
    strengths text[],
    improvements text[],
    graded_by text,
    graded_at timestamp with time zone DEFAULT now(),
    auto_graded boolean DEFAULT false,
    manual_override boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rubric_assessments_letter_grade_check CHECK ((letter_grade = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'Fail'::text]))),
    CONSTRAINT rubric_assessments_total_score_check CHECK (((total_score >= 0) AND (total_score <= 100)))
);


ALTER TABLE public.rubric_assessments OWNER TO postgres;

-- Name: TABLE rubric_assessments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.rubric_assessments IS 'Individual student grades based on simulation rubrics';


-- Name: COLUMN rubric_assessments.criterion_scores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rubric_assessments.criterion_scores IS 'JSONB object with score (0-100) for each criterion';


-- Name: security_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    user_identifier text NOT NULL,
    event_data jsonb NOT NULL,
    processed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.security_events OWNER TO postgres;

-- Name: TABLE security_events; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.security_events IS 'Stores security events received from Google RISC';


-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_token character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sessions OWNER TO postgres;

-- Name: simulation_activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulation_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    simulation_id uuid,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    time_spent integer DEFAULT 0,
    interactions jsonb DEFAULT '[]'::jsonb,
    final_state jsonb,
    ai_hints_used integer DEFAULT 0,
    ai_messages jsonb DEFAULT '[]'::jsonb,
    score integer,
    passed boolean,
    lesson_id uuid,
    step_id text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.simulation_activity OWNER TO postgres;

-- Name: TABLE simulation_activity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.simulation_activity IS 'Tracks student interactions with simulations including AI assistance';


-- Name: COLUMN simulation_activity.interactions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.simulation_activity.interactions IS 'JSONB array of student actions and data throughout the session';


-- Name: simulation_assignment_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulation_assignment_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid,
    student_id text NOT NULL,
    student_email text NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    score numeric(5,2),
    max_score integer,
    percentage numeric(5,2),
    started_at timestamp with time zone DEFAULT now(),
    submitted_at timestamp with time zone,
    time_spent integer DEFAULT 0,
    attempt_number integer DEFAULT 1,
    is_latest_attempt boolean DEFAULT true,
    status text DEFAULT 'in_progress'::text,
    feedback jsonb,
    simulation_data jsonb,
    simulation_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT simulation_assignment_submissions_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'submitted'::text, 'graded'::text, 'returned'::text])))
);


ALTER TABLE public.simulation_assignment_submissions OWNER TO postgres;

-- Name: simulation_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulation_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    simulation_id uuid,
    course_id text,
    assigned_students text[],
    assigned_by text NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    due_date timestamp with time zone,
    title text,
    instructions text,
    min_time_required integer,
    requires_data_export boolean DEFAULT false,
    rubric_id uuid,
    is_active boolean DEFAULT true,
    published boolean DEFAULT true,
    total_assigned integer DEFAULT 0,
    total_started integer DEFAULT 0,
    total_completed integer DEFAULT 0,
    total_submitted integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.simulation_assignments OWNER TO postgres;

-- Name: TABLE simulation_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.simulation_assignments IS 'Simulation assignments created by teachers for students';


-- Name: unified_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unified_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_type text NOT NULL,
    reference_id text NOT NULL,
    title text NOT NULL,
    description text,
    instructions text,
    course_id text,
    assigned_students text[],
    assigned_at timestamp with time zone DEFAULT now(),
    available_from timestamp with time zone DEFAULT now(),
    due_date timestamp with time zone,
    closes_at timestamp with time zone,
    max_attempts integer DEFAULT 1,
    time_limit integer,
    allow_late_submission boolean DEFAULT true,
    requires_completion boolean DEFAULT true,
    max_score integer,
    weight numeric(5,2) DEFAULT 1.0,
    published boolean DEFAULT false,
    assigned_by text NOT NULL,
    total_assigned integer DEFAULT 0,
    total_started integer DEFAULT 0,
    total_completed integer DEFAULT 0,
    total_submitted integer DEFAULT 0,
    average_score numeric(5,2),
    average_time_spent integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT unified_assignments_assignment_type_check CHECK ((assignment_type = ANY (ARRAY['lesson'::text, 'homework'::text, 'vocabulary'::text, 'simulation'::text, 'simulation_embedded'::text])))
);


ALTER TABLE public.unified_assignments OWNER TO postgres;

-- Name: TABLE unified_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.unified_assignments IS 'Central table for all assignment types (lessons, homework, vocabulary, simulations)';


-- Name: COLUMN unified_assignments.assignment_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.unified_assignments.assignment_type IS 'Type: lesson, homework, vocabulary, simulation, simulation_embedded';


-- Name: COLUMN unified_assignments.reference_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.unified_assignments.reference_id IS 'ID of the actual content item';


-- Name: COLUMN unified_assignments.weight; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.unified_assignments.weight IS 'Weight for grade calculation (0-100)';


-- Name: simulation_assignments_unified; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.simulation_assignments_unified AS
 SELECT id,
    (reference_id)::uuid AS simulation_id,
    course_id,
    assigned_students,
    assigned_by,
    assigned_at,
    due_date,
    title,
    instructions,
    time_limit AS min_time_required,
    false AS requires_data_export,
    NULL::uuid AS rubric_id,
    true AS is_active,
    published,
    total_assigned,
    total_started,
    total_completed,
    total_submitted,
    created_at,
    updated_at
   FROM public.unified_assignments ua
  WHERE (assignment_type = ANY (ARRAY['simulation'::text, 'simulation_embedded'::text]));


ALTER VIEW public.simulation_assignments_unified OWNER TO postgres;

-- Name: VIEW simulation_assignments_unified; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.simulation_assignments_unified IS 'Backward compatibility view - makes unified assignments appear as simulation_assignments';


-- Name: simulation_embedded_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulation_embedded_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    simulation_slug text NOT NULL,
    simulation_id uuid,
    title text NOT NULL,
    description text,
    instructions text,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_points integer DEFAULT 0,
    show_on_start boolean DEFAULT false,
    show_on_complete boolean DEFAULT false,
    allow_skip boolean DEFAULT true,
    required_for_progress boolean DEFAULT false,
    time_limit integer,
    available_after integer DEFAULT 0,
    max_attempts integer DEFAULT 1,
    allow_late_submission boolean DEFAULT true,
    published boolean DEFAULT false,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.simulation_embedded_assignments OWNER TO postgres;

-- Name: simulation_rubrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulation_rubrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    simulation_id uuid,
    name text NOT NULL,
    description text,
    grade_a_min integer DEFAULT 85,
    grade_b_min integer DEFAULT 70,
    grade_c_min integer DEFAULT 50,
    criteria jsonb DEFAULT '{"analysis": {"name": "Analysis & Interpretation", "levels": {"A": "Correctly analyzes data and draws accurate conclusions", "B": "Generally correct analysis with minor misconceptions", "C": "Partial analysis with some correct elements", "Fail": "Analysis is incorrect or missing"}, "weight": 25}, "calculations": {"name": "Calculations & Math", "levels": {"A": "All calculations correct with proper units and significant figures", "B": "Most calculations correct with minor errors", "C": "Some calculations correct but with notable mistakes", "Fail": "Calculations are incorrect or missing"}, "weight": 25}, "understanding": {"name": "Conceptual Understanding", "levels": {"A": "Demonstrates deep understanding of physics concepts", "B": "Shows solid understanding with minor gaps", "C": "Basic understanding but missing key concepts", "Fail": "Does not demonstrate understanding of concepts"}, "weight": 25}, "data_collection": {"name": "Data Collection", "levels": {"A": "Accurately collects all required data with proper precision", "B": "Collects most data accurately with minor errors", "C": "Collects some data but with significant gaps or errors", "Fail": "Does not collect required data or data is unusable"}, "weight": 25}}'::jsonb NOT NULL,
    grade_descriptions jsonb DEFAULT '{"A": {"name": "Advanced / Exceeds Standards", "description": "Demonstrates exceptional understanding and skill in all areas"}, "B": {"name": "Proficient / Meets Standards", "description": "Demonstrates solid understanding with minor areas for improvement"}, "C": {"name": "Basic / Approaching Standards", "description": "Demonstrates basic understanding but needs significant improvement"}, "Fail": {"name": "Below Standards", "description": "Does not meet minimum requirements for understanding"}}'::jsonb,
    is_default boolean DEFAULT false,
    published boolean DEFAULT true,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT simulation_rubrics_grade_a_min_check CHECK (((grade_a_min >= 0) AND (grade_a_min <= 100))),
    CONSTRAINT simulation_rubrics_grade_b_min_check CHECK (((grade_b_min >= 0) AND (grade_b_min <= 100))),
    CONSTRAINT simulation_rubrics_grade_c_min_check CHECK (((grade_c_min >= 0) AND (grade_c_min <= 100)))
);


ALTER TABLE public.simulation_rubrics OWNER TO postgres;

-- Name: TABLE simulation_rubrics; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.simulation_rubrics IS 'Standards-based rubrics for grading simulation assignments with A/B/C/Fail levels';


-- Name: COLUMN simulation_rubrics.criteria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.simulation_rubrics.criteria IS 'JSONB object defining grading criteria with weights and level descriptions';


-- Name: simulations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    thumbnail_url text,
    category text NOT NULL,
    unit text NOT NULL,
    difficulty text,
    tags text[] DEFAULT '{}'::text[],
    component_path text NOT NULL,
    estimated_time integer,
    objectives text[] DEFAULT '{}'::text[],
    key_concepts text[] DEFAULT '{}'::text[],
    prerequisite_knowledge text[] DEFAULT '{}'::text[],
    can_embed boolean DEFAULT true,
    has_ai_guide boolean DEFAULT false,
    supported_question_types text[] DEFAULT '{}'::text[],
    published boolean DEFAULT false,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    view_count integer DEFAULT 0,
    embed_count integer DEFAULT 0,
    CONSTRAINT simulations_category_check CHECK ((category = ANY (ARRAY['kinematics'::text, 'forces'::text, 'energy'::text, 'momentum'::text, 'waves'::text, 'electricity'::text, 'magnetism'::text, 'optics'::text, 'thermodynamics'::text, 'modern-physics'::text, 'lab-skills'::text]))),
    CONSTRAINT simulations_difficulty_check CHECK ((difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text])))
);


ALTER TABLE public.simulations OWNER TO postgres;

-- Name: TABLE simulations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.simulations IS 'Interactive physics simulations that can be embedded in lessons';


-- Name: COLUMN simulations.component_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.simulations.component_path IS 'URL path to the simulation component';


-- Name: COLUMN simulations.has_ai_guide; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.simulations.has_ai_guide IS 'Whether this simulation has AI-powered hints and guidance';


-- Name: student_activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    user_email text NOT NULL,
    user_name text,
    activity_type text NOT NULL,
    lesson_id uuid,
    assignment_id text,
    session_duration integer,
    page_views integer DEFAULT 1,
    ip_address inet,
    user_agent text,
    referrer text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_activity_activity_type_check CHECK ((activity_type = ANY (ARRAY['lesson_view'::text, 'assignment_start'::text, 'assignment_submit'::text, 'assignment_complete'::text])))
);


ALTER TABLE public.student_activity OWNER TO postgres;

-- Name: student_assignment_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_assignment_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status text DEFAULT 'assigned'::text,
    started_at timestamp with time zone,
    submitted_at timestamp with time zone,
    attempts_used integer DEFAULT 0,
    current_submission_id text,
    time_spent integer DEFAULT 0,
    last_accessed timestamp with time zone,
    score numeric(5,2),
    max_score numeric(5,2),
    percentage numeric(5,2),
    feedback text,
    graded_at timestamp with time zone,
    graded_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_assignment_assignments_status_check CHECK ((status = ANY (ARRAY['assigned'::text, 'started'::text, 'in_progress'::text, 'submitted'::text, 'graded'::text, 'overdue'::text])))
);


ALTER TABLE public.student_assignment_assignments OWNER TO postgres;

-- Name: TABLE student_assignment_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.student_assignment_assignments IS 'Individual student progress on assigned homework assignments';


-- Name: COLUMN student_assignment_assignments.attempts_used; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_assignment_assignments.attempts_used IS 'Number of submission attempts used by student';


-- Name: student_assignment_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_assignment_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unified_assignment_id uuid,
    student_id text NOT NULL,
    student_email text NOT NULL,
    status text DEFAULT 'assigned'::text,
    progress_percentage integer DEFAULT 0,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    submitted_at timestamp with time zone,
    first_viewed_at timestamp with time zone,
    last_accessed_at timestamp with time zone,
    time_spent integer DEFAULT 0,
    attempt_number integer DEFAULT 1,
    attempts_used integer DEFAULT 0,
    score numeric(10,2),
    max_score integer,
    percentage numeric(5,2),
    letter_grade text,
    rubric_scores jsonb,
    feedback text,
    graded_at timestamp with time zone,
    graded_by text,
    submission_data jsonb,
    is_late boolean DEFAULT false,
    is_excused boolean DEFAULT false,
    needs_attention boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_assignment_progress_progress_percentage_check CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100))),
    CONSTRAINT student_assignment_progress_status_check CHECK ((status = ANY (ARRAY['assigned'::text, 'started'::text, 'in_progress'::text, 'completed'::text, 'submitted'::text, 'graded'::text, 'overdue'::text, 'late_submitted'::text])))
);


ALTER TABLE public.student_assignment_progress OWNER TO postgres;

-- Name: TABLE student_assignment_progress; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.student_assignment_progress IS 'Tracks individual student progress on any assignment type';


-- Name: student_lesson_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_lesson_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status text DEFAULT 'assigned'::text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    progress_percentage integer DEFAULT 0,
    time_spent integer DEFAULT 0,
    last_accessed timestamp with time zone,
    score numeric(5,2),
    max_score numeric(5,2),
    feedback text,
    graded_at timestamp with time zone,
    graded_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_lesson_assignments_progress_percentage_check CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100))),
    CONSTRAINT student_lesson_assignments_status_check CHECK ((status = ANY (ARRAY['assigned'::text, 'started'::text, 'in_progress'::text, 'completed'::text, 'overdue'::text])))
);


ALTER TABLE public.student_lesson_assignments OWNER TO postgres;

-- Name: TABLE student_lesson_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.student_lesson_assignments IS 'Individual student progress on assigned lessons';


-- Name: student_simulation_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_simulation_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    simulation_assignment_id uuid,
    student_id text NOT NULL,
    status text DEFAULT 'assigned'::text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    submitted_at timestamp with time zone,
    simulation_completed boolean DEFAULT false,
    time_spent_in_simulation integer DEFAULT 0,
    interactions_count integer DEFAULT 0,
    data_exported boolean DEFAULT false,
    question_responses jsonb DEFAULT '[]'::jsonb,
    total_time_spent integer DEFAULT 0,
    last_accessed timestamp with time zone,
    letter_grade text,
    score integer,
    max_score integer,
    rubric_scores jsonb,
    feedback text,
    graded_at timestamp with time zone,
    graded_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_simulation_assignments_letter_grade_check CHECK ((letter_grade = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'Fail'::text]))),
    CONSTRAINT student_simulation_assignments_status_check CHECK ((status = ANY (ARRAY['assigned'::text, 'started'::text, 'in_progress'::text, 'completed'::text, 'submitted'::text, 'graded'::text, 'overdue'::text])))
);


ALTER TABLE public.student_simulation_assignments OWNER TO postgres;

-- Name: TABLE student_simulation_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.student_simulation_assignments IS 'Individual student progress on simulation assignments';


-- Name: COLUMN student_simulation_assignments.letter_grade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_simulation_assignments.letter_grade IS 'Standards-based grade: A, B, C, or Fail';


-- Name: COLUMN student_simulation_assignments.rubric_scores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_simulation_assignments.rubric_scores IS 'JSONB object with scores for each rubric criterion';


-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    google_user_id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    first_name text,
    last_name text,
    profile_photo_url text,
    course_id text,
    enrollment_state text DEFAULT 'ACTIVE'::text,
    grade_level text,
    student_id text,
    last_synced_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    photo_url text,
    CONSTRAINT students_enrollment_state_check CHECK ((enrollment_state = ANY (ARRAY['ACTIVE'::text, 'INVITED'::text, 'DECLINED'::text])))
);


ALTER TABLE public.students OWNER TO postgres;

-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    user_id text NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    score numeric(10,2),
    max_score numeric(10,2),
    feedback jsonb DEFAULT '{}'::jsonb,
    rubric_grades jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'partial'::text,
    submitted_at timestamp with time zone,
    graded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT submissions_status_check CHECK ((status = ANY (ARRAY['partial'::text, 'submitted'::text, 'graded'::text])))
);


ALTER TABLE public.submissions OWNER TO postgres;

-- Name: tools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    icon_name text,
    category text NOT NULL,
    tool_type text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    component_path text NOT NULL,
    can_embed boolean DEFAULT true,
    compatible_simulations text[] DEFAULT '{}'::text[],
    data_input_schema jsonb,
    data_output_schema jsonb,
    published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    use_count integer DEFAULT 0,
    CONSTRAINT tools_category_check CHECK ((category = ANY (ARRAY['measurement'::text, 'calculator'::text, 'data-analysis'::text, 'visualization'::text, 'conversion'::text])))
);


ALTER TABLE public.tools OWNER TO postgres;

-- Name: TABLE tools; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tools IS 'Utility tools (rulers, calculators, etc.) that can be embedded or used standalone';


-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE public.units OWNER TO postgres;

-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'teacher'::text, 'student'::text])))
);


ALTER TABLE public.user_roles OWNER TO postgres;

-- Name: user_security_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_security_status (
    email text NOT NULL,
    requires_reauth boolean DEFAULT false,
    requires_mfa boolean DEFAULT false,
    account_suspended boolean DEFAULT false,
    account_deleted boolean DEFAULT false,
    reason text,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_security_status OWNER TO postgres;

-- Name: TABLE user_security_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_security_status IS 'Tracks user security status based on RISC events';


-- Name: user_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    token_type text NOT NULL,
    encrypted_token text NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_tokens OWNER TO postgres;

-- Name: TABLE user_tokens; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_tokens IS 'Stores encrypted user tokens for management';


-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255),
    email character varying(255),
    email_verified timestamp with time zone,
    image text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_tokens (
    identifier character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.verification_tokens OWNER TO postgres;

-- Name: video_question_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_question_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    user_email text NOT NULL,
    lesson_id uuid NOT NULL,
    video_id text NOT NULL,
    question_id text NOT NULL,
    answer jsonb NOT NULL,
    is_correct boolean,
    score integer DEFAULT 0,
    max_score integer DEFAULT 0,
    feedback text,
    attempt_number integer DEFAULT 1,
    time_to_answer integer,
    answered_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.video_question_responses OWNER TO postgres;

-- Name: TABLE video_question_responses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.video_question_responses IS 'Records student responses to interactive video questions';


-- Name: vocabulary_game_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vocabulary_game_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    user_email text NOT NULL,
    vocabulary_set_id uuid NOT NULL,
    game_type text NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    max_score integer NOT NULL,
    accuracy numeric(5,2),
    time_spent integer,
    difficulty text,
    terms_completed integer DEFAULT 0,
    terms_total integer DEFAULT 0,
    perfect_game boolean DEFAULT false,
    hints_used integer DEFAULT 0,
    mistakes integer DEFAULT 0,
    game_data jsonb,
    completed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_difficulty_game CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))),
    CONSTRAINT valid_game_type CHECK ((game_type = ANY (ARRAY['hangman'::text, 'crossword'::text, 'matching'::text, 'concentration'::text, 'quiz-bowl'::text, 'word-shoot'::text, 'equation-visualizer'::text])))
);


ALTER TABLE public.vocabulary_game_scores OWNER TO postgres;

-- Name: TABLE vocabulary_game_scores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.vocabulary_game_scores IS 'Stores scores from all vocabulary games with detailed metrics';


-- Name: vocabulary_sets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vocabulary_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    unit_id text,
    lesson_id text,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published boolean DEFAULT false
);


ALTER TABLE public.vocabulary_sets OWNER TO postgres;

-- Name: TABLE vocabulary_sets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.vocabulary_sets IS 'Collections of vocabulary terms grouped by physics unit/lesson';


-- Name: COLUMN vocabulary_sets.published; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.vocabulary_sets.published IS 'Whether the vocabulary set is visible to students (required for games)';


-- Name: vocabulary_terms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vocabulary_terms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vocabulary_set_id uuid NOT NULL,
    term text NOT NULL,
    definition text NOT NULL,
    category text,
    difficulty text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT vocabulary_terms_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])))
);


ALTER TABLE public.vocabulary_terms OWNER TO postgres;

-- Name: TABLE vocabulary_terms; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.vocabulary_terms IS 'Individual vocabulary terms within sets';


-- Name: vocabulary_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vocabulary_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vocabulary_set_id uuid NOT NULL,
    assignment_id text,
    question_id text,
    used_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.vocabulary_usage OWNER TO postgres;

-- Name: question_usage_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_usage_log ALTER COLUMN id SET DEFAULT nextval('public.question_usage_log_id_seq'::regclass);


-- Name: physics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.physics_id_seq', 1, false);


-- Name: question_usage_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_usage_log_id_seq', 1, false);


-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


-- Name: accounts accounts_provider_provider_account_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_provider_provider_account_id_key UNIQUE (provider, provider_account_id);


-- Name: admin_emails admin_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_emails
    ADD CONSTRAINT admin_emails_pkey PRIMARY KEY (email);


-- Name: assignment_analytics assignment_analytics_assignment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_analytics
    ADD CONSTRAINT assignment_analytics_assignment_id_key UNIQUE (assignment_id);


-- Name: assignment_analytics assignment_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_analytics
    ADD CONSTRAINT assignment_analytics_pkey PRIMARY KEY (id);


-- Name: assignment_assignments assignment_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_assignments
    ADD CONSTRAINT assignment_assignments_pkey PRIMARY KEY (id);


-- Name: assignment_comments assignment_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_comments
    ADD CONSTRAINT assignment_comments_pkey PRIMARY KEY (id);


-- Name: assignment_reminders assignment_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_reminders
    ADD CONSTRAINT assignment_reminders_pkey PRIMARY KEY (id);


-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


-- Name: assignment_tags assignment_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_tags
    ADD CONSTRAINT assignment_tags_pkey PRIMARY KEY (id);


-- Name: assignment_tags assignment_tags_unified_assignment_id_tag_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_tags
    ADD CONSTRAINT assignment_tags_unified_assignment_id_tag_name_key UNIQUE (unified_assignment_id, tag_name);


-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


-- Name: course_students course_students_course_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_students
    ADD CONSTRAINT course_students_course_id_student_id_key UNIQUE (course_id, student_id);


-- Name: course_students course_students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_students
    ADD CONSTRAINT course_students_pkey PRIMARY KEY (id);


-- Name: courses courses_google_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_google_course_id_key UNIQUE (google_course_id);


-- Name: courses courses_join_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_join_code_key UNIQUE (join_code);


-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


-- Name: gradebook_entries gradebook_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT gradebook_entries_pkey PRIMARY KEY (id);


-- Name: interactive_lesson_progress interactive_lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactive_lesson_progress
    ADD CONSTRAINT interactive_lesson_progress_pkey PRIMARY KEY (id);


-- Name: interactive_lesson_progress interactive_lesson_progress_student_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactive_lesson_progress
    ADD CONSTRAINT interactive_lesson_progress_student_id_lesson_id_key UNIQUE (student_id, lesson_id);


-- Name: interactive_lessons interactive_lessons_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactive_lessons
    ADD CONSTRAINT interactive_lessons_lesson_id_key UNIQUE (lesson_id);


-- Name: interactive_lessons interactive_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactive_lessons
    ADD CONSTRAINT interactive_lessons_pkey PRIMARY KEY (id);


-- Name: lesson_assignments lesson_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_assignments
    ADD CONSTRAINT lesson_assignments_pkey PRIMARY KEY (id);


-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


-- Name: lessons lessons_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_slug_key UNIQUE (slug);


-- Name: physics physics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.physics
    ADD CONSTRAINT physics_pkey PRIMARY KEY (id);


-- Name: question_bank question_bank_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_pkey PRIMARY KEY (id);


-- Name: question_usage_log question_usage_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_usage_log
    ADD CONSTRAINT question_usage_log_pkey PRIMARY KEY (id);


-- Name: rubric_assessments rubric_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rubric_assessments
    ADD CONSTRAINT rubric_assessments_pkey PRIMARY KEY (id);


-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


-- Name: sessions sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_session_token_key UNIQUE (session_token);


-- Name: simulation_activity simulation_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_activity
    ADD CONSTRAINT simulation_activity_pkey PRIMARY KEY (id);


-- Name: simulation_assignment_submissions simulation_assignment_submiss_assignment_id_student_id_atte_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_assignment_submissions
    ADD CONSTRAINT simulation_assignment_submiss_assignment_id_student_id_atte_key UNIQUE (assignment_id, student_id, attempt_number);


-- Name: simulation_assignment_submissions simulation_assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_assignment_submissions
    ADD CONSTRAINT simulation_assignment_submissions_pkey PRIMARY KEY (id);


-- Name: simulation_assignments simulation_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_assignments
    ADD CONSTRAINT simulation_assignments_pkey PRIMARY KEY (id);


-- Name: simulation_embedded_assignments simulation_embedded_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_embedded_assignments
    ADD CONSTRAINT simulation_embedded_assignments_pkey PRIMARY KEY (id);


-- Name: simulation_embedded_assignments simulation_embedded_assignments_simulation_slug_title_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_embedded_assignments
    ADD CONSTRAINT simulation_embedded_assignments_simulation_slug_title_key UNIQUE (simulation_slug, title);


-- Name: simulation_rubrics simulation_rubrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_rubrics
    ADD CONSTRAINT simulation_rubrics_pkey PRIMARY KEY (id);


-- Name: simulations simulations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulations
    ADD CONSTRAINT simulations_pkey PRIMARY KEY (id);


-- Name: simulations simulations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulations
    ADD CONSTRAINT simulations_slug_key UNIQUE (slug);


-- Name: student_activity student_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_activity
    ADD CONSTRAINT student_activity_pkey PRIMARY KEY (id);


-- Name: student_assignment_assignments student_assignment_assignment_assignment_assignment_id_stud_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_assignment_assignments
    ADD CONSTRAINT student_assignment_assignment_assignment_assignment_id_stud_key UNIQUE (assignment_assignment_id, student_id);


-- Name: student_assignment_assignments student_assignment_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_assignment_assignments
    ADD CONSTRAINT student_assignment_assignments_pkey PRIMARY KEY (id);


-- Name: student_assignment_progress student_assignment_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_assignment_progress
    ADD CONSTRAINT student_assignment_progress_pkey PRIMARY KEY (id);


-- Name: student_assignment_progress student_assignment_progress_unified_assignment_id_student_i_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_assignment_progress
    ADD CONSTRAINT student_assignment_progress_unified_assignment_id_student_i_key UNIQUE (unified_assignment_id, student_id, attempt_number);


-- Name: student_lesson_assignments student_lesson_assignments_lesson_assignment_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_lesson_assignments
    ADD CONSTRAINT student_lesson_assignments_lesson_assignment_id_student_id_key UNIQUE (lesson_assignment_id, student_id);


-- Name: student_lesson_assignments student_lesson_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_lesson_assignments
    ADD CONSTRAINT student_lesson_assignments_pkey PRIMARY KEY (id);


-- Name: student_simulation_assignments student_simulation_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_simulation_assignments
    ADD CONSTRAINT student_simulation_assignments_pkey PRIMARY KEY (id);


-- Name: students students_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_email_key UNIQUE (email);


-- Name: students students_google_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_google_user_id_key UNIQUE (google_user_id);


-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


-- Name: submissions submissions_assignment_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_user_id_key UNIQUE (assignment_id, user_id);


-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY (id);


-- Name: tools tools_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_slug_key UNIQUE (slug);


-- Name: unified_assignments unified_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unified_assignments
    ADD CONSTRAINT unified_assignments_pkey PRIMARY KEY (id);


-- Name: assignment_submissions unique_assignment_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT unique_assignment_user UNIQUE (assignment_id, user_id);


-- Name: lesson_progress unique_user_lesson; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT unique_user_lesson UNIQUE (user_id, lesson_id);


-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


-- Name: user_roles user_roles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_email_key UNIQUE (email);


-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


-- Name: user_security_status user_security_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_security_status
    ADD CONSTRAINT user_security_status_pkey PRIMARY KEY (email);


-- Name: user_tokens user_tokens_email_token_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tokens
    ADD CONSTRAINT user_tokens_email_token_type_key UNIQUE (email, token_type);


-- Name: user_tokens user_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tokens
    ADD CONSTRAINT user_tokens_pkey PRIMARY KEY (id);


-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token);


-- Name: verification_tokens verification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_token_key UNIQUE (token);


-- Name: video_question_responses video_question_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_question_responses
    ADD CONSTRAINT video_question_responses_pkey PRIMARY KEY (id);


-- Name: vocabulary_game_scores vocabulary_game_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vocabulary_game_scores
    ADD CONSTRAINT vocabulary_game_scores_pkey PRIMARY KEY (id);


-- Name: vocabulary_sets vocabulary_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vocabulary_sets
    ADD CONSTRAINT vocabulary_sets_pkey PRIMARY KEY (id);


-- Name: vocabulary_terms vocabulary_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vocabulary_terms
    ADD CONSTRAINT vocabulary_terms_pkey PRIMARY KEY (id);


-- Name: vocabulary_usage vocabulary_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vocabulary_usage
    ADD CONSTRAINT vocabulary_usage_pkey PRIMARY KEY (id);


-- Name: idx_accounts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_user_id ON public.accounts USING btree (user_id);


-- Name: idx_assignment_analytics_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_analytics_assignment_id ON public.assignment_analytics USING btree (assignment_id);


-- Name: idx_assignment_assignments_assigned_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_assignments_assigned_by ON public.assignment_assignments USING btree (assigned_by);


-- Name: idx_assignment_assignments_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_assignments_assignment_id ON public.assignment_assignments USING btree (assignment_id);


-- Name: idx_assignment_assignments_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_assignments_course_id ON public.assignment_assignments USING btree (course_id);


-- Name: idx_assignment_assignments_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_assignments_due_date ON public.assignment_assignments USING btree (due_date);


-- Name: idx_assignment_assignments_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_assignments_published ON public.assignment_assignments USING btree (published);


-- Name: idx_assignment_comments_progress; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_comments_progress ON public.assignment_comments USING btree (student_progress_id);


-- Name: idx_assignment_reminders_assignment_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_reminders_assignment_assignment_id ON public.assignment_reminders USING btree (assignment_assignment_id);


-- Name: idx_assignment_reminders_lesson_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_reminders_lesson_assignment_id ON public.assignment_reminders USING btree (lesson_assignment_id);


-- Name: idx_assignment_reminders_sent_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_reminders_sent_at ON public.assignment_reminders USING btree (sent_at);


-- Name: idx_assignment_reminders_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_reminders_student_id ON public.assignment_reminders USING btree (student_id);


-- Name: idx_assignment_submissions_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions USING btree (assignment_id);


-- Name: idx_assignment_submissions_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_submissions_score ON public.assignment_submissions USING btree (score);


-- Name: idx_assignment_submissions_submitted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_submissions_submitted_at ON public.assignment_submissions USING btree (time_submitted);


-- Name: idx_assignment_submissions_user_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_submissions_user_email ON public.assignment_submissions USING btree (user_email);


-- Name: idx_assignment_submissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_submissions_user_id ON public.assignment_submissions USING btree (user_id);


-- Name: idx_assignment_tags_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_tags_assignment ON public.assignment_tags USING btree (unified_assignment_id);


-- Name: idx_assignment_tags_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignment_tags_name ON public.assignment_tags USING btree (tag_name);


-- Name: idx_assignments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_created_at ON public.assignments USING btree (created_at DESC);


-- Name: idx_assignments_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_created_by ON public.assignments USING btree (created_by);


-- Name: idx_assignments_lesson_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_lesson_id ON public.assignments USING btree (lesson_id);


-- Name: idx_assignments_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_published ON public.assignments USING btree (published);


-- Name: idx_assignments_questions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_questions ON public.assignments USING gin (questions);


-- Name: idx_course_students_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_students_course ON public.course_students USING btree (course_id);


-- Name: idx_course_students_enrollment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_students_enrollment ON public.course_students USING btree (enrollment_state);


-- Name: idx_course_students_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_students_student ON public.course_students USING btree (student_id);


-- Name: idx_courses_course_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_course_state ON public.courses USING btree (course_state);


-- Name: idx_courses_google_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_google_course_id ON public.courses USING btree (google_course_id);


-- Name: idx_courses_join_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_join_code ON public.courses USING btree (join_code) WHERE ((join_code IS NOT NULL) AND (join_code_enabled = true));


-- Name: idx_courses_owner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_owner_id ON public.courses USING btree (owner_id);


-- Name: idx_courses_teacher_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_teacher_email ON public.courses USING btree (teacher_email);


-- Name: idx_gradebook_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gradebook_course ON public.gradebook_entries USING btree (course_id) WHERE (course_id IS NOT NULL);


-- Name: idx_gradebook_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gradebook_due_date ON public.gradebook_entries USING btree (due_date) WHERE (due_date IS NOT NULL);


-- Name: idx_gradebook_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gradebook_email ON public.gradebook_entries USING btree (user_email);


-- Name: idx_gradebook_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gradebook_status ON public.gradebook_entries USING btree (status) WHERE (status IS NOT NULL);


-- Name: idx_gradebook_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gradebook_type ON public.gradebook_entries USING btree (item_type);


-- Name: idx_gradebook_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gradebook_user ON public.gradebook_entries USING btree (user_id);


-- Name: idx_interactive_lessons_lesson_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interactive_lessons_lesson_id ON public.interactive_lessons USING btree (lesson_id);


-- Name: idx_interactive_progress_lesson; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interactive_progress_lesson ON public.interactive_lesson_progress USING btree (lesson_id);


-- Name: idx_interactive_progress_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interactive_progress_status ON public.interactive_lesson_progress USING btree (status);


-- Name: idx_interactive_progress_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interactive_progress_student ON public.interactive_lesson_progress USING btree (student_id);


-- Name: idx_interactive_progress_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interactive_progress_updated ON public.interactive_lesson_progress USING btree (updated_at DESC);


-- Name: idx_lesson_assignments_assigned_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_assignments_assigned_by ON public.lesson_assignments USING btree (assigned_by);


-- Name: idx_lesson_assignments_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_assignments_course_id ON public.lesson_assignments USING btree (course_id);


-- Name: idx_lesson_assignments_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_assignments_due_date ON public.lesson_assignments USING btree (due_date);


-- Name: idx_lesson_assignments_lesson_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_assignments_lesson_id ON public.lesson_assignments USING btree (lesson_id);


-- Name: idx_lesson_assignments_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_assignments_published ON public.lesson_assignments USING btree (published);


-- Name: idx_lesson_progress_completed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_progress_completed ON public.lesson_progress USING btree (completed_at DESC) WHERE (completed_at IS NOT NULL);


-- Name: idx_lesson_progress_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_progress_email ON public.lesson_progress USING btree (user_email);


-- Name: idx_lesson_progress_lesson; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress USING btree (lesson_id);


-- Name: idx_lesson_progress_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_progress_status ON public.lesson_progress USING btree (status);


-- Name: idx_lesson_progress_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress USING btree (user_id);


-- Name: idx_lessons_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_created_at ON public.lessons USING btree (created_at);


-- Name: idx_lessons_lesson_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_lesson_number ON public.lessons USING btree (lesson_number);


-- Name: idx_lessons_objectives; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_objectives ON public.lessons USING gin (objectives);


-- Name: idx_lessons_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_published ON public.lessons USING btree (published);


-- Name: idx_lessons_simulation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_simulation_id ON public.lessons USING btree (simulation_id);


-- Name: idx_lessons_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_slug ON public.lessons USING btree (slug);


-- Name: idx_lessons_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_type ON public.lessons USING btree (lesson_type);


-- Name: idx_lessons_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_unit ON public.lessons USING btree (unit);


-- Name: idx_lessons_unit_lesson_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_unit_lesson_number ON public.lessons USING btree (unit, lesson_number);


-- Name: idx_lessons_videos; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lessons_videos ON public.lessons USING gin (videos);


-- Name: idx_question_bank_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_bank_created_by ON public.question_bank USING btree (created_by);


-- Name: idx_question_bank_difficulty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_bank_difficulty ON public.question_bank USING btree (difficulty);


-- Name: idx_question_bank_lesson_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_bank_lesson_id ON public.question_bank USING btree (lesson_id);


-- Name: idx_question_bank_question_text; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_bank_question_text ON public.question_bank USING gin (to_tsvector('english'::regconfig, question_text));


-- Name: idx_question_bank_question_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_bank_question_type ON public.question_bank USING btree (question_type);


-- Name: idx_question_bank_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_bank_tags ON public.question_bank USING gin (tags);


-- Name: idx_question_bank_topics; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_bank_topics ON public.question_bank USING gin (topics);


-- Name: idx_question_bank_unit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_bank_unit_id ON public.question_bank USING btree (unit_id);


-- Name: idx_rubric_assessments_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rubric_assessments_assignment ON public.rubric_assessments USING btree (student_simulation_assignment_id);


-- Name: idx_rubric_assessments_rubric; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rubric_assessments_rubric ON public.rubric_assessments USING btree (rubric_id);


-- Name: idx_rubric_assessments_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rubric_assessments_student ON public.rubric_assessments USING btree (student_id);


-- Name: idx_security_events_processed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_security_events_processed ON public.security_events USING btree (processed_at DESC);


-- Name: idx_security_events_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_security_events_type ON public.security_events USING btree (event_type);


-- Name: idx_security_events_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_security_events_user ON public.security_events USING btree (user_identifier);


-- Name: idx_sessions_session_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_session_token ON public.sessions USING btree (session_token);


-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


-- Name: idx_sim_assignments_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sim_assignments_published ON public.simulation_embedded_assignments USING btree (published) WHERE (published = true);


-- Name: idx_sim_assignments_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sim_assignments_slug ON public.simulation_embedded_assignments USING btree (simulation_slug);


-- Name: idx_sim_submissions_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sim_submissions_assignment ON public.simulation_assignment_submissions USING btree (assignment_id);


-- Name: idx_sim_submissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sim_submissions_status ON public.simulation_assignment_submissions USING btree (status);


-- Name: idx_sim_submissions_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sim_submissions_student ON public.simulation_assignment_submissions USING btree (student_id);


-- Name: idx_simulation_activity_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_activity_created ON public.simulation_activity USING btree (created_at DESC);


-- Name: idx_simulation_activity_lesson; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_activity_lesson ON public.simulation_activity USING btree (lesson_id);


-- Name: idx_simulation_activity_simulation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_activity_simulation ON public.simulation_activity USING btree (simulation_id);


-- Name: idx_simulation_activity_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_activity_student ON public.simulation_activity USING btree (student_id);


-- Name: idx_simulation_assignments_assigned_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_assignments_assigned_by ON public.simulation_assignments USING btree (assigned_by);


-- Name: idx_simulation_assignments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_assignments_course ON public.simulation_assignments USING btree (course_id);


-- Name: idx_simulation_assignments_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_assignments_published ON public.simulation_assignments USING btree (published) WHERE (published = true);


-- Name: idx_simulation_assignments_simulation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_assignments_simulation ON public.simulation_assignments USING btree (simulation_id);


-- Name: idx_simulation_rubrics_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_rubrics_default ON public.simulation_rubrics USING btree (simulation_id, is_default) WHERE (is_default = true);


-- Name: idx_simulation_rubrics_simulation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulation_rubrics_simulation ON public.simulation_rubrics USING btree (simulation_id);


-- Name: idx_simulations_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulations_category ON public.simulations USING btree (category);


-- Name: idx_simulations_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulations_published ON public.simulations USING btree (published);


-- Name: idx_simulations_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulations_slug ON public.simulations USING btree (slug);


-- Name: idx_simulations_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulations_tags ON public.simulations USING gin (tags);


-- Name: idx_simulations_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_simulations_unit ON public.simulations USING btree (unit);


-- Name: idx_student_activity_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_activity_assignment_id ON public.student_activity USING btree (assignment_id);


-- Name: idx_student_activity_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_activity_created_at ON public.student_activity USING btree (created_at);


-- Name: idx_student_activity_lesson_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_activity_lesson_id ON public.student_activity USING btree (lesson_id);


-- Name: idx_student_activity_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_activity_type ON public.student_activity USING btree (activity_type);


-- Name: idx_student_activity_user_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_activity_user_email ON public.student_activity USING btree (user_email);


-- Name: idx_student_activity_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_activity_user_id ON public.student_activity USING btree (user_id);


-- Name: idx_student_assignment_assignments_assignment_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_assignment_assignments_assignment_assignment_id ON public.student_assignment_assignments USING btree (assignment_assignment_id);


-- Name: idx_student_assignment_assignments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_assignment_assignments_status ON public.student_assignment_assignments USING btree (status);


-- Name: idx_student_assignment_assignments_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_assignment_assignments_student_id ON public.student_assignment_assignments USING btree (student_id);


-- Name: idx_student_assignment_assignments_submitted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_assignment_assignments_submitted_at ON public.student_assignment_assignments USING btree (submitted_at);


-- Name: idx_student_lesson_assignments_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_lesson_assignments_due_date ON public.student_lesson_assignments USING btree (completed_at);


-- Name: idx_student_lesson_assignments_lesson_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_lesson_assignments_lesson_assignment_id ON public.student_lesson_assignments USING btree (lesson_assignment_id);


-- Name: idx_student_lesson_assignments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_lesson_assignments_status ON public.student_lesson_assignments USING btree (status);


-- Name: idx_student_lesson_assignments_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_lesson_assignments_student_id ON public.student_lesson_assignments USING btree (student_id);


-- Name: idx_student_progress_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_progress_assignment ON public.student_assignment_progress USING btree (unified_assignment_id);


-- Name: idx_student_progress_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_progress_email ON public.student_assignment_progress USING btree (student_email);


-- Name: idx_student_progress_needs_attention; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_progress_needs_attention ON public.student_assignment_progress USING btree (needs_attention) WHERE (needs_attention = true);


-- Name: idx_student_progress_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_progress_status ON public.student_assignment_progress USING btree (status);


-- Name: idx_student_progress_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_progress_student ON public.student_assignment_progress USING btree (student_id);


-- Name: idx_student_progress_submitted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_progress_submitted ON public.student_assignment_progress USING btree (submitted_at) WHERE (submitted_at IS NOT NULL);


-- Name: idx_student_sim_assignments_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_sim_assignments_assignment ON public.student_simulation_assignments USING btree (simulation_assignment_id);


-- Name: idx_student_sim_assignments_letter_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_sim_assignments_letter_grade ON public.student_simulation_assignments USING btree (letter_grade) WHERE (letter_grade IS NOT NULL);


-- Name: idx_student_sim_assignments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_sim_assignments_status ON public.student_simulation_assignments USING btree (status);


-- Name: idx_student_sim_assignments_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_sim_assignments_student ON public.student_simulation_assignments USING btree (student_id);


-- Name: idx_students_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_course_id ON public.students USING btree (course_id);


-- Name: idx_students_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_email ON public.students USING btree (email);


-- Name: idx_students_enrollment_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_enrollment_state ON public.students USING btree (enrollment_state);


-- Name: idx_students_google_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_google_user_id ON public.students USING btree (google_user_id);


-- Name: idx_students_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_is_active ON public.students USING btree (is_active);


-- Name: idx_students_last_synced; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_last_synced ON public.students USING btree (last_synced_at);


-- Name: idx_submissions_answers; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_answers ON public.submissions USING gin (answers);


-- Name: idx_submissions_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_assignment_id ON public.submissions USING btree (assignment_id);


-- Name: idx_submissions_rubric_grades; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_rubric_grades ON public.submissions USING gin (rubric_grades);


-- Name: idx_submissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_status ON public.submissions USING btree (status);


-- Name: idx_submissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_user_id ON public.submissions USING btree (user_id);


-- Name: idx_tools_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tools_category ON public.tools USING btree (category);


-- Name: idx_tools_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tools_published ON public.tools USING btree (published);


-- Name: idx_tools_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tools_slug ON public.tools USING btree (slug);


-- Name: idx_tools_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tools_type ON public.tools USING btree (tool_type);


-- Name: idx_unified_assignments_assigned_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unified_assignments_assigned_by ON public.unified_assignments USING btree (assigned_by);


-- Name: idx_unified_assignments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unified_assignments_course ON public.unified_assignments USING btree (course_id);


-- Name: idx_unified_assignments_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unified_assignments_due_date ON public.unified_assignments USING btree (due_date) WHERE (due_date IS NOT NULL);


-- Name: idx_unified_assignments_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unified_assignments_published ON public.unified_assignments USING btree (published) WHERE (published = true);


-- Name: idx_unified_assignments_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unified_assignments_reference ON public.unified_assignments USING btree (reference_id);


-- Name: idx_unified_assignments_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unified_assignments_type ON public.unified_assignments USING btree (assignment_type);


-- Name: idx_unified_assignments_unique_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_unified_assignments_unique_course ON public.unified_assignments USING btree (assignment_type, reference_id, course_id) WHERE (course_id IS NOT NULL);


-- Name: idx_user_tokens_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_tokens_email ON public.user_tokens USING btree (email);


-- Name: idx_video_responses_lesson; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_responses_lesson ON public.video_question_responses USING btree (lesson_id);


-- Name: idx_video_responses_question; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_responses_question ON public.video_question_responses USING btree (question_id);


-- Name: idx_video_responses_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_responses_user ON public.video_question_responses USING btree (user_id);


-- Name: idx_video_responses_video; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_responses_video ON public.video_question_responses USING btree (video_id);


-- Name: idx_vocab_scores_completed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocab_scores_completed ON public.vocabulary_game_scores USING btree (completed_at DESC);


-- Name: idx_vocab_scores_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocab_scores_email ON public.vocabulary_game_scores USING btree (user_email);


-- Name: idx_vocab_scores_game_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocab_scores_game_type ON public.vocabulary_game_scores USING btree (game_type);


-- Name: idx_vocab_scores_set; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocab_scores_set ON public.vocabulary_game_scores USING btree (vocabulary_set_id);


-- Name: idx_vocab_scores_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocab_scores_user ON public.vocabulary_game_scores USING btree (user_id);


-- Name: idx_vocabulary_sets_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_sets_created_by ON public.vocabulary_sets USING btree (created_by);


-- Name: idx_vocabulary_sets_lesson; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_sets_lesson ON public.vocabulary_sets USING btree (lesson_id);


-- Name: idx_vocabulary_sets_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_sets_published ON public.vocabulary_sets USING btree (published);


-- Name: idx_vocabulary_sets_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_sets_unit ON public.vocabulary_sets USING btree (unit_id);


-- Name: idx_vocabulary_terms_difficulty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_terms_difficulty ON public.vocabulary_terms USING btree (difficulty);


-- Name: idx_vocabulary_terms_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_terms_order ON public.vocabulary_terms USING btree (vocabulary_set_id, order_index);


-- Name: idx_vocabulary_terms_set; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_terms_set ON public.vocabulary_terms USING btree (vocabulary_set_id);


-- Name: idx_vocabulary_terms_set_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_terms_set_id ON public.vocabulary_terms USING btree (vocabulary_set_id);


-- Name: idx_vocabulary_usage_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_usage_assignment ON public.vocabulary_usage USING btree (assignment_id);


-- Name: idx_vocabulary_usage_set_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vocabulary_usage_set_id ON public.vocabulary_usage USING btree (vocabulary_set_id);


-- Name: interactive_lesson_progress calculate_progress_percentage; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER calculate_progress_percentage BEFORE INSERT OR UPDATE ON public.interactive_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_lesson_progress_percentage();


-- Name: unified_assignments trigger_create_student_records; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_create_student_records AFTER INSERT ON public.unified_assignments FOR EACH ROW WHEN ((new.published = true)) EXECUTE FUNCTION public.create_student_assignment_records();


-- Name: student_assignment_progress trigger_update_assignment_analytics; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_assignment_analytics AFTER INSERT OR UPDATE ON public.student_assignment_progress FOR EACH ROW EXECUTE FUNCTION public.update_assignment_analytics();


-- Name: student_assignment_assignments trigger_update_assignment_assignment_analytics; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_assignment_assignment_analytics AFTER INSERT OR UPDATE ON public.student_assignment_assignments FOR EACH ROW EXECUTE FUNCTION public.update_assignment_assignment_analytics();


-- Name: student_lesson_assignments trigger_update_lesson_assignment_analytics; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_lesson_assignment_analytics AFTER INSERT OR UPDATE ON public.student_lesson_assignments FOR EACH ROW EXECUTE FUNCTION public.update_lesson_assignment_analytics();


-- Name: rubric_assessments trigger_update_rubric_assessments_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_rubric_assessments_timestamp BEFORE UPDATE ON public.rubric_assessments FOR EACH ROW EXECUTE FUNCTION public.update_rubric_updated_at();


-- Name: student_simulation_assignments trigger_update_simulation_assignment_analytics; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_simulation_assignment_analytics AFTER INSERT OR UPDATE ON public.student_simulation_assignments FOR EACH ROW EXECUTE FUNCTION public.update_simulation_assignment_analytics();


-- Name: simulation_assignments trigger_update_simulation_assignments_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_simulation_assignments_timestamp BEFORE UPDATE ON public.simulation_assignments FOR EACH ROW EXECUTE FUNCTION public.update_simulation_assignment_timestamp();


-- Name: simulation_rubrics trigger_update_simulation_rubrics_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_simulation_rubrics_timestamp BEFORE UPDATE ON public.simulation_rubrics FOR EACH ROW EXECUTE FUNCTION public.update_rubric_updated_at();


-- Name: student_assignment_progress trigger_update_student_progress_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_student_progress_timestamp BEFORE UPDATE ON public.student_assignment_progress FOR EACH ROW EXECUTE FUNCTION public.update_assignment_timestamp();


-- Name: student_simulation_assignments trigger_update_student_simulation_assignments_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_student_simulation_assignments_timestamp BEFORE UPDATE ON public.student_simulation_assignments FOR EACH ROW EXECUTE FUNCTION public.update_simulation_assignment_timestamp();


-- Name: unified_assignments trigger_update_unified_assignments_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_unified_assignments_timestamp BEFORE UPDATE ON public.unified_assignments FOR EACH ROW EXECUTE FUNCTION public.update_assignment_timestamp();


-- Name: course_students update_course_students_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_course_students_updated_at BEFORE UPDATE ON public.course_students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Name: gradebook_entries update_gradebook_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_gradebook_updated_at BEFORE UPDATE ON public.gradebook_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Name: lesson_progress update_lesson_progress_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Name: simulation_assignment_submissions update_simulation_assignment_submissions_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_simulation_assignment_submissions_timestamp BEFORE UPDATE ON public.simulation_assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.update_simulation_assignment_timestamp();


-- Name: simulation_embedded_assignments update_simulation_embedded_assignments_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_simulation_embedded_assignments_timestamp BEFORE UPDATE ON public.simulation_embedded_assignments FOR EACH ROW EXECUTE FUNCTION public.update_simulation_assignment_timestamp();


-- Name: vocabulary_sets update_vocabulary_sets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vocabulary_sets_updated_at BEFORE UPDATE ON public.vocabulary_sets FOR EACH ROW EXECUTE FUNCTION public.update_vocabulary_updated_at();


-- Name: vocabulary_terms update_vocabulary_terms_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vocabulary_terms_updated_at BEFORE UPDATE ON public.vocabulary_terms FOR EACH ROW EXECUTE FUNCTION public.update_vocabulary_updated_at();


-- Name: assignment_comments assignment_comments_student_progress_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_comments
    ADD CONSTRAINT assignment_comments_student_progress_id_fkey FOREIGN KEY (student_progress_id) REFERENCES public.student_assignment_progress(id) ON DELETE CASCADE;


-- Name: assignment_reminders assignment_reminders_assignment_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_reminders
    ADD CONSTRAINT assignment_reminders_assignment_assignment_id_fkey FOREIGN KEY (assignment_assignment_id) REFERENCES public.assignment_assignments(id) ON DELETE CASCADE;


-- Name: assignment_reminders assignment_reminders_lesson_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_reminders
    ADD CONSTRAINT assignment_reminders_lesson_assignment_id_fkey FOREIGN KEY (lesson_assignment_id) REFERENCES public.lesson_assignments(id) ON DELETE CASCADE;


-- Name: assignment_reminders assignment_reminders_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_reminders
    ADD CONSTRAINT assignment_reminders_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


-- Name: assignment_tags assignment_tags_unified_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_tags
    ADD CONSTRAINT assignment_tags_unified_assignment_id_fkey FOREIGN KEY (unified_assignment_id) REFERENCES public.unified_assignments(id) ON DELETE CASCADE;


-- Name: assignments assignments_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


-- Name: CONSTRAINT assignments_lesson_id_fkey ON assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT assignments_lesson_id_fkey ON public.assignments IS 'Links assignments to their associated lesson for context and organization';


-- Name: course_students course_students_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_students
    ADD CONSTRAINT course_students_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


-- Name: course_students course_students_enrolled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_students
    ADD CONSTRAINT course_students_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES auth.users(id);


-- Name: course_students course_students_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_students
    ADD CONSTRAINT course_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


-- Name: accounts fk_accounts_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT fk_accounts_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Name: sessions fk_sessions_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Name: interactive_lesson_progress interactive_lesson_progress_interactive_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactive_lesson_progress
    ADD CONSTRAINT interactive_lesson_progress_interactive_lesson_id_fkey FOREIGN KEY (interactive_lesson_id) REFERENCES public.interactive_lessons(id) ON DELETE CASCADE;


-- Name: interactive_lesson_progress interactive_lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactive_lesson_progress
    ADD CONSTRAINT interactive_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


-- Name: interactive_lessons interactive_lessons_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactive_lessons
    ADD CONSTRAINT interactive_lessons_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


-- Name: lesson_assignments lesson_assignments_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_assignments
    ADD CONSTRAINT lesson_assignments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


-- Name: lessons lessons_simulation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_simulation_id_fkey FOREIGN KEY (simulation_id) REFERENCES public.simulations(id) ON DELETE SET NULL;


-- Name: question_bank question_bank_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


-- Name: question_bank question_bank_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


-- Name: question_usage_log question_usage_log_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_usage_log
    ADD CONSTRAINT question_usage_log_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.question_bank(id) ON DELETE CASCADE;


-- Name: rubric_assessments rubric_assessments_rubric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rubric_assessments
    ADD CONSTRAINT rubric_assessments_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES public.simulation_rubrics(id) ON DELETE CASCADE;


-- Name: simulation_activity simulation_activity_simulation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_activity
    ADD CONSTRAINT simulation_activity_simulation_id_fkey FOREIGN KEY (simulation_id) REFERENCES public.simulations(id) ON DELETE CASCADE;


-- Name: simulation_assignment_submissions simulation_assignment_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_assignment_submissions
    ADD CONSTRAINT simulation_assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.simulation_embedded_assignments(id) ON DELETE CASCADE;


-- Name: simulation_assignments simulation_assignments_rubric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_assignments
    ADD CONSTRAINT simulation_assignments_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES public.simulation_rubrics(id) ON DELETE SET NULL;


-- Name: simulation_assignments simulation_assignments_simulation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_assignments
    ADD CONSTRAINT simulation_assignments_simulation_id_fkey FOREIGN KEY (simulation_id) REFERENCES public.simulations(id) ON DELETE CASCADE;


-- Name: simulation_embedded_assignments simulation_embedded_assignments_simulation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_embedded_assignments
    ADD CONSTRAINT simulation_embedded_assignments_simulation_id_fkey FOREIGN KEY (simulation_id) REFERENCES public.simulations(id) ON DELETE CASCADE;


-- Name: simulation_rubrics simulation_rubrics_simulation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.simulation_rubrics
    ADD CONSTRAINT simulation_rubrics_simulation_id_fkey FOREIGN KEY (simulation_id) REFERENCES public.simulations(id) ON DELETE CASCADE;


-- Name: student_activity student_activity_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_activity
    ADD CONSTRAINT student_activity_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


-- Name: student_assignment_assignments student_assignment_assignments_assignment_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_assignment_assignments
    ADD CONSTRAINT student_assignment_assignments_assignment_assignment_id_fkey FOREIGN KEY (assignment_assignment_id) REFERENCES public.assignment_assignments(id) ON DELETE CASCADE;


-- Name: student_assignment_assignments student_assignment_assignments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_assignment_assignments
    ADD CONSTRAINT student_assignment_assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


-- Name: student_assignment_progress student_assignment_progress_unified_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_assignment_progress
    ADD CONSTRAINT student_assignment_progress_unified_assignment_id_fkey FOREIGN KEY (unified_assignment_id) REFERENCES public.unified_assignments(id) ON DELETE CASCADE;


-- Name: student_lesson_assignments student_lesson_assignments_lesson_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_lesson_assignments
    ADD CONSTRAINT student_lesson_assignments_lesson_assignment_id_fkey FOREIGN KEY (lesson_assignment_id) REFERENCES public.lesson_assignments(id) ON DELETE CASCADE;


-- Name: student_lesson_assignments student_lesson_assignments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_lesson_assignments
    ADD CONSTRAINT student_lesson_assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


-- Name: student_simulation_assignments student_simulation_assignments_simulation_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_simulation_assignments
    ADD CONSTRAINT student_simulation_assignments_simulation_assignment_id_fkey FOREIGN KEY (simulation_assignment_id) REFERENCES public.simulation_assignments(id) ON DELETE CASCADE;


-- Name: submissions submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


-- Name: vocabulary_terms vocabulary_terms_vocabulary_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vocabulary_terms
    ADD CONSTRAINT vocabulary_terms_vocabulary_set_id_fkey FOREIGN KEY (vocabulary_set_id) REFERENCES public.vocabulary_sets(id) ON DELETE CASCADE;


-- Name: vocabulary_usage vocabulary_usage_vocabulary_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vocabulary_usage
    ADD CONSTRAINT vocabulary_usage_vocabulary_set_id_fkey FOREIGN KEY (vocabulary_set_id) REFERENCES public.vocabulary_sets(id) ON DELETE CASCADE;


-- Name: security_events Admin users can view security events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin users can view security events" ON public.security_events FOR SELECT TO authenticated USING (((auth.jwt() ->> 'email'::text) IN ( SELECT admin_emails.email
   FROM public.admin_emails)));


-- Name: simulations Admins and teachers can manage simulations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and teachers can manage simulations" ON public.simulations USING (public.is_admin_or_teacher()) WITH CHECK (public.is_admin_or_teacher());


-- Name: assignment_tags Admins and teachers can manage tags; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and teachers can manage tags" ON public.assignment_tags TO authenticated USING (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['antoccic@fitchburg.k12.ma.us'::text, 'craigantocci@gmail.com'::text])));


-- Name: unified_assignments Admins and teachers can manage unified assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and teachers can manage unified assignments" ON public.unified_assignments TO authenticated USING (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['antoccic@fitchburg.k12.ma.us'::text, 'craigantocci@gmail.com'::text])));


-- Name: vocabulary_sets Admins and teachers can manage vocabulary sets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and teachers can manage vocabulary sets" ON public.vocabulary_sets TO authenticated USING ((((auth.jwt() ->> 'email'::text) IN ( SELECT admin_emails.email
   FROM public.admin_emails)) OR ((auth.jwt() ->> 'email'::text) IN ( SELECT user_roles.email
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['admin'::text, 'teacher'::text])))))) WITH CHECK ((((auth.jwt() ->> 'email'::text) IN ( SELECT admin_emails.email
   FROM public.admin_emails)) OR ((auth.jwt() ->> 'email'::text) IN ( SELECT user_roles.email
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['admin'::text, 'teacher'::text]))))));


-- Name: vocabulary_terms Admins and teachers can manage vocabulary terms; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and teachers can manage vocabulary terms" ON public.vocabulary_terms TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vocabulary_sets
  WHERE ((vocabulary_sets.id = vocabulary_terms.vocabulary_set_id) AND (((auth.jwt() ->> 'email'::text) IN ( SELECT admin_emails.email
           FROM public.admin_emails)) OR ((auth.jwt() ->> 'email'::text) IN ( SELECT user_roles.email
           FROM public.user_roles
          WHERE (user_roles.role = ANY (ARRAY['admin'::text, 'teacher'::text]))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.vocabulary_sets
  WHERE ((vocabulary_sets.id = vocabulary_terms.vocabulary_set_id) AND (((auth.jwt() ->> 'email'::text) IN ( SELECT admin_emails.email
           FROM public.admin_emails)) OR ((auth.jwt() ->> 'email'::text) IN ( SELECT user_roles.email
           FROM public.user_roles
          WHERE (user_roles.role = ANY (ARRAY['admin'::text, 'teacher'::text])))))))));


-- Name: student_assignment_progress Admins and teachers can update student progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and teachers can update student progress" ON public.student_assignment_progress FOR UPDATE TO authenticated USING (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['antoccic@fitchburg.k12.ma.us'::text, 'craigantocci@gmail.com'::text])));


-- Name: student_assignment_progress Admins and teachers can view all student progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins and teachers can view all student progress" ON public.student_assignment_progress FOR SELECT TO authenticated USING (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['antoccic@fitchburg.k12.ma.us'::text, 'craigantocci@gmail.com'::text])));


-- Name: assignment_comments Authenticated users can create comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create comments" ON public.assignment_comments FOR INSERT TO authenticated WITH CHECK ((commenter_email = (auth.jwt() ->> 'email'::text)));


-- Name: assignment_comments Authenticated users can view comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can view comments" ON public.assignment_comments FOR SELECT TO authenticated USING (true);


-- Name: simulations Everyone can view published simulations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Everyone can view published simulations" ON public.simulations FOR SELECT USING ((published = true));


-- Name: student_assignment_progress Students can update own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can update own progress" ON public.student_assignment_progress FOR UPDATE TO authenticated USING (((student_email = (auth.jwt() ->> 'email'::text)) AND (status = ANY (ARRAY['assigned'::text, 'started'::text, 'in_progress'::text]))));


-- Name: unified_assignments Students can view assigned assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can view assigned assignments" ON public.unified_assignments FOR SELECT TO authenticated USING (((published = true) AND (EXISTS ( SELECT 1
   FROM public.student_assignment_progress
  WHERE ((student_assignment_progress.unified_assignment_id = unified_assignments.id) AND (student_assignment_progress.student_email = (auth.jwt() ->> 'email'::text)))))));


-- Name: courses Students can view courses with active join codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can view courses with active join codes" ON public.courses FOR SELECT TO authenticated USING (((join_code_enabled = true) AND ((join_code_expires_at IS NULL) OR (join_code_expires_at > now()))));


-- Name: student_assignment_progress Students can view own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can view own progress" ON public.student_assignment_progress FOR SELECT TO authenticated USING ((student_email = (auth.jwt() ->> 'email'::text)));


-- Name: vocabulary_sets Students can view published vocabulary sets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can view published vocabulary sets" ON public.vocabulary_sets FOR SELECT TO authenticated USING ((published = true));


-- Name: vocabulary_terms Students can view terms from published sets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can view terms from published sets" ON public.vocabulary_terms FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.vocabulary_sets
  WHERE ((vocabulary_sets.id = vocabulary_terms.vocabulary_set_id) AND (vocabulary_sets.published = true)))));


-- Name: security_events System can insert security events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert security events" ON public.security_events FOR INSERT TO authenticated WITH CHECK (true);


-- Name: user_tokens System can manage tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can manage tokens" ON public.user_tokens TO authenticated USING (((auth.jwt() ->> 'email'::text) IN ( SELECT admin_emails.email
   FROM public.admin_emails)));


-- Name: user_security_status System can update security status; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can update security status" ON public.user_security_status TO authenticated USING (((auth.jwt() ->> 'email'::text) IN ( SELECT admin_emails.email
   FROM public.admin_emails)));


-- Name: user_security_status Users can view their own security status; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own security status" ON public.user_security_status FOR SELECT TO authenticated USING (((email = (auth.jwt() ->> 'email'::text)) OR ((auth.jwt() ->> 'email'::text) IN ( SELECT admin_emails.email
   FROM public.admin_emails))));


-- Name: user_tokens Users can view their own tokens; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own tokens" ON public.user_tokens FOR SELECT TO authenticated USING (((email = (auth.jwt() ->> 'email'::text)) OR ((auth.jwt() ->> 'email'::text) IN ( SELECT admin_emails.email
   FROM public.admin_emails))));


-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Name: assignment_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignment_analytics ENABLE ROW LEVEL SECURITY;

-- Name: assignment_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignment_assignments ENABLE ROW LEVEL SECURITY;

-- Name: assignment_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignment_comments ENABLE ROW LEVEL SECURITY;

-- Name: assignment_reminders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignment_reminders ENABLE ROW LEVEL SECURITY;

-- Name: assignment_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Name: assignment_submissions assignment_submissions_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY assignment_submissions_insert_policy ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (((user_id = public.get_auth_user_id_text()) OR (user_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: assignment_submissions assignment_submissions_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY assignment_submissions_select_policy ON public.assignment_submissions FOR SELECT TO authenticated USING (((user_id = public.get_auth_user_id_text()) OR (user_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: assignment_submissions assignment_submissions_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY assignment_submissions_update_policy ON public.assignment_submissions FOR UPDATE TO authenticated USING (((user_id = public.get_auth_user_id_text()) OR (user_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: assignment_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignment_tags ENABLE ROW LEVEL SECURITY;

-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Name: assignments assignments_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY assignments_delete_policy ON public.assignments FOR DELETE TO authenticated USING (public.is_admin_or_teacher());


-- Name: assignments assignments_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY assignments_insert_policy ON public.assignments FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_teacher());


-- Name: assignments assignments_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY assignments_select_policy ON public.assignments FOR SELECT TO authenticated USING (true);


-- Name: assignments assignments_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY assignments_update_policy ON public.assignments FOR UPDATE TO authenticated USING (public.is_admin_or_teacher());


-- Name: course_students; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.course_students ENABLE ROW LEVEL SECURITY;

-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Name: courses courses_manage_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY courses_manage_policy ON public.courses TO authenticated USING (public.is_admin_or_teacher());


-- Name: courses courses_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY courses_select_policy ON public.courses FOR SELECT TO authenticated USING (true);


-- Name: gradebook_entries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.gradebook_entries ENABLE ROW LEVEL SECURITY;

-- Name: interactive_lesson_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.interactive_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Name: interactive_lessons; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.interactive_lessons ENABLE ROW LEVEL SECURITY;

-- Name: lesson_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;

-- Name: lesson_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Name: lesson_progress lesson_progress_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lesson_progress_insert_policy ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (((user_id = public.get_auth_user_id_text()) OR (user_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: lesson_progress lesson_progress_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lesson_progress_select_policy ON public.lesson_progress FOR SELECT TO authenticated USING (((user_id = public.get_auth_user_id_text()) OR (user_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: lesson_progress lesson_progress_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lesson_progress_update_policy ON public.lesson_progress FOR UPDATE TO authenticated USING (((user_id = public.get_auth_user_id_text()) OR (user_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: lessons; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Name: lessons lessons_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lessons_delete_policy ON public.lessons FOR DELETE TO authenticated USING (public.is_admin_or_teacher());


-- Name: lessons lessons_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lessons_insert_policy ON public.lessons FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_teacher());


-- Name: lessons lessons_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lessons_select_policy ON public.lessons FOR SELECT TO authenticated USING (((published = true) OR public.is_admin_or_teacher()));


-- Name: lessons lessons_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lessons_update_policy ON public.lessons FOR UPDATE TO authenticated USING (public.is_admin_or_teacher());


-- Name: physics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.physics ENABLE ROW LEVEL SECURITY;

-- Name: question_bank; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- Name: question_bank question_bank_manage_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY question_bank_manage_policy ON public.question_bank TO authenticated USING (public.is_admin_or_teacher());


-- Name: question_bank question_bank_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY question_bank_select_policy ON public.question_bank FOR SELECT TO authenticated USING (public.is_admin_or_teacher());


-- Name: question_usage_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.question_usage_log ENABLE ROW LEVEL SECURITY;

-- Name: security_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Name: simulation_activity sim_activity_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_activity_insert_policy ON public.simulation_activity FOR INSERT TO authenticated WITH CHECK (((student_id = auth.uid()) OR public.is_admin_or_teacher()));


-- Name: simulation_activity sim_activity_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_activity_select_policy ON public.simulation_activity FOR SELECT TO authenticated USING (((student_id = auth.uid()) OR public.is_admin_or_teacher()));


-- Name: simulation_assignments sim_assignments_manage_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_assignments_manage_policy ON public.simulation_assignments TO authenticated USING (public.is_admin_or_teacher());


-- Name: simulation_assignments sim_assignments_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_assignments_select_policy ON public.simulation_assignments FOR SELECT TO authenticated USING (((published = true) OR public.is_admin_or_teacher()));


-- Name: simulation_embedded_assignments sim_embedded_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_embedded_delete_policy ON public.simulation_embedded_assignments FOR DELETE TO authenticated USING (public.is_admin_or_teacher());


-- Name: simulation_embedded_assignments sim_embedded_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_embedded_insert_policy ON public.simulation_embedded_assignments FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_teacher());


-- Name: simulation_embedded_assignments sim_embedded_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_embedded_select_policy ON public.simulation_embedded_assignments FOR SELECT TO authenticated USING (((published = true) OR public.is_admin_or_teacher()));


-- Name: simulation_embedded_assignments sim_embedded_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_embedded_update_policy ON public.simulation_embedded_assignments FOR UPDATE TO authenticated USING (public.is_admin_or_teacher());


-- Name: simulation_rubrics sim_rubrics_manage_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_rubrics_manage_policy ON public.simulation_rubrics TO authenticated USING (public.is_admin_or_teacher());


-- Name: simulation_rubrics sim_rubrics_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_rubrics_select_policy ON public.simulation_rubrics FOR SELECT TO authenticated USING (((published = true) OR public.is_admin_or_teacher()));


-- Name: simulation_assignment_submissions sim_submissions_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_submissions_insert_policy ON public.simulation_assignment_submissions FOR INSERT TO authenticated WITH CHECK (((student_id = public.get_auth_user_id_text()) OR (student_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: simulation_assignment_submissions sim_submissions_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_submissions_select_policy ON public.simulation_assignment_submissions FOR SELECT TO authenticated USING (((student_id = public.get_auth_user_id_text()) OR (student_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: simulation_assignment_submissions sim_submissions_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sim_submissions_update_policy ON public.simulation_assignment_submissions FOR UPDATE TO authenticated USING (((student_id = public.get_auth_user_id_text()) OR (student_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: simulation_activity; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.simulation_activity ENABLE ROW LEVEL SECURITY;

-- Name: simulation_assignment_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.simulation_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Name: simulation_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.simulation_assignments ENABLE ROW LEVEL SECURITY;

-- Name: simulation_embedded_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.simulation_embedded_assignments ENABLE ROW LEVEL SECURITY;

-- Name: simulation_rubrics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.simulation_rubrics ENABLE ROW LEVEL SECURITY;

-- Name: simulations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Name: simulations simulations_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY simulations_delete_policy ON public.simulations FOR DELETE TO authenticated USING (public.is_admin_or_teacher());


-- Name: simulations simulations_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY simulations_insert_policy ON public.simulations FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_teacher());


-- Name: simulations simulations_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY simulations_select_policy ON public.simulations FOR SELECT TO authenticated USING (true);


-- Name: simulations simulations_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY simulations_update_policy ON public.simulations FOR UPDATE TO authenticated USING (public.is_admin_or_teacher());


-- Name: student_activity; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;

-- Name: student_activity student_activity_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY student_activity_insert_policy ON public.student_activity FOR INSERT TO authenticated WITH CHECK (((user_id = public.get_auth_user_id_text()) OR (user_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: student_activity student_activity_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY student_activity_select_policy ON public.student_activity FOR SELECT TO authenticated USING (((user_id = public.get_auth_user_id_text()) OR (user_email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: student_assignment_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.student_assignment_assignments ENABLE ROW LEVEL SECURITY;

-- Name: student_assignment_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.student_assignment_progress ENABLE ROW LEVEL SECURITY;

-- Name: student_lesson_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.student_lesson_assignments ENABLE ROW LEVEL SECURITY;

-- Name: students; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Name: students students_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY students_delete_policy ON public.students FOR DELETE TO authenticated USING (public.is_admin_or_teacher());


-- Name: students students_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY students_insert_policy ON public.students FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_teacher());


-- Name: students students_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY students_select_policy ON public.students FOR SELECT TO authenticated USING (((email = public.get_auth_email_safe()) OR public.is_admin_or_teacher()));


-- Name: students students_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY students_update_policy ON public.students FOR UPDATE TO authenticated USING (public.is_admin_or_teacher());


-- Name: submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Name: submissions submissions_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY submissions_insert_policy ON public.submissions FOR INSERT TO authenticated WITH CHECK (((user_id = public.get_auth_user_id_text()) OR public.is_admin_or_teacher()));


-- Name: submissions submissions_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY submissions_select_policy ON public.submissions FOR SELECT TO authenticated USING (((user_id = public.get_auth_user_id_text()) OR public.is_admin_or_teacher()));


-- Name: submissions submissions_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY submissions_update_policy ON public.submissions FOR UPDATE TO authenticated USING (((user_id = public.get_auth_user_id_text()) OR public.is_admin_or_teacher()));


-- Name: tools; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Name: unified_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.unified_assignments ENABLE ROW LEVEL SECURITY;

-- Name: units; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Name: user_roles user_roles_manage_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_roles_manage_policy ON public.user_roles TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles user_roles_1
  WHERE ((user_roles_1.email = public.get_auth_email_safe()) AND (user_roles_1.role = 'admin'::text)))));


-- Name: user_roles user_roles_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_roles_select_policy ON public.user_roles FOR SELECT TO authenticated USING (true);


-- Name: user_security_status; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_security_status ENABLE ROW LEVEL SECURITY;

-- Name: user_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Name: verification_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Name: video_question_responses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.video_question_responses ENABLE ROW LEVEL SECURITY;

-- Name: vocabulary_game_scores; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.vocabulary_game_scores ENABLE ROW LEVEL SECURITY;

-- Name: vocabulary_sets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.vocabulary_sets ENABLE ROW LEVEL SECURITY;

-- Name: vocabulary_terms; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.vocabulary_terms ENABLE ROW LEVEL SECURITY;

-- Name: vocabulary_usage; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.vocabulary_usage ENABLE ROW LEVEL SECURITY;

-- Name: supabase_realtime physics; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.physics;


-- Name: FUNCTION assign_student_to_course(p_student_id uuid, p_course_id uuid, p_assigned_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.assign_student_to_course(p_student_id uuid, p_course_id uuid, p_assigned_by uuid) TO anon;
GRANT ALL ON FUNCTION public.assign_student_to_course(p_student_id uuid, p_course_id uuid, p_assigned_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.assign_student_to_course(p_student_id uuid, p_course_id uuid, p_assigned_by uuid) TO service_role;


-- Name: FUNCTION calculate_assignment_stats(assignment_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_assignment_stats(assignment_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.calculate_assignment_stats(assignment_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_assignment_stats(assignment_uuid uuid) TO service_role;


-- Name: FUNCTION calculate_letter_grade(p_total_score integer, p_rubric_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_letter_grade(p_total_score integer, p_rubric_id uuid) TO anon;
GRANT ALL ON FUNCTION public.calculate_letter_grade(p_total_score integer, p_rubric_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_letter_grade(p_total_score integer, p_rubric_id uuid) TO service_role;


-- Name: FUNCTION calculate_total_score(p_criterion_scores jsonb, p_rubric_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_total_score(p_criterion_scores jsonb, p_rubric_id uuid) TO anon;
GRANT ALL ON FUNCTION public.calculate_total_score(p_criterion_scores jsonb, p_rubric_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_total_score(p_criterion_scores jsonb, p_rubric_id uuid) TO service_role;


-- Name: FUNCTION check_simulation_assignment_overdue(p_student_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_simulation_assignment_overdue(p_student_id text) TO anon;
GRANT ALL ON FUNCTION public.check_simulation_assignment_overdue(p_student_id text) TO authenticated;
GRANT ALL ON FUNCTION public.check_simulation_assignment_overdue(p_student_id text) TO service_role;


-- Name: FUNCTION check_user_security_status(user_email text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_user_security_status(user_email text) TO anon;
GRANT ALL ON FUNCTION public.check_user_security_status(user_email text) TO authenticated;
GRANT ALL ON FUNCTION public.check_user_security_status(user_email text) TO service_role;


-- Name: FUNCTION cleanup_expired_tokens(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_expired_tokens() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_tokens() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_tokens() TO service_role;


-- Name: FUNCTION create_student_assignment_assignments(p_assignment_assignment_id uuid, p_student_ids uuid[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_student_assignment_assignments(p_assignment_assignment_id uuid, p_student_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.create_student_assignment_assignments(p_assignment_assignment_id uuid, p_student_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.create_student_assignment_assignments(p_assignment_assignment_id uuid, p_student_ids uuid[]) TO service_role;


-- Name: FUNCTION create_student_assignment_records(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_student_assignment_records() TO anon;
GRANT ALL ON FUNCTION public.create_student_assignment_records() TO authenticated;
GRANT ALL ON FUNCTION public.create_student_assignment_records() TO service_role;


-- Name: FUNCTION create_student_lesson_assignments(p_lesson_assignment_id uuid, p_student_ids uuid[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_student_lesson_assignments(p_lesson_assignment_id uuid, p_student_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.create_student_lesson_assignments(p_lesson_assignment_id uuid, p_student_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.create_student_lesson_assignments(p_lesson_assignment_id uuid, p_student_ids uuid[]) TO service_role;


-- Name: FUNCTION enroll_student_with_code(p_student_email text, p_join_code text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enroll_student_with_code(p_student_email text, p_join_code text) TO anon;
GRANT ALL ON FUNCTION public.enroll_student_with_code(p_student_email text, p_join_code text) TO authenticated;
GRANT ALL ON FUNCTION public.enroll_student_with_code(p_student_email text, p_join_code text) TO service_role;


-- Name: FUNCTION generate_join_code(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_join_code() TO anon;
GRANT ALL ON FUNCTION public.generate_join_code() TO authenticated;
GRANT ALL ON FUNCTION public.generate_join_code() TO service_role;


-- Name: FUNCTION get_assignment_overview(p_teacher_email text, p_course_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_assignment_overview(p_teacher_email text, p_course_id text) TO anon;
GRANT ALL ON FUNCTION public.get_assignment_overview(p_teacher_email text, p_course_id text) TO authenticated;
GRANT ALL ON FUNCTION public.get_assignment_overview(p_teacher_email text, p_course_id text) TO service_role;


-- Name: FUNCTION get_assignment_with_stats(assignment_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_assignment_with_stats(assignment_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_assignment_with_stats(assignment_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_assignment_with_stats(assignment_uuid uuid) TO service_role;


-- Name: FUNCTION get_auth_email_safe(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_auth_email_safe() TO anon;
GRANT ALL ON FUNCTION public.get_auth_email_safe() TO authenticated;
GRANT ALL ON FUNCTION public.get_auth_email_safe() TO service_role;


-- Name: FUNCTION get_auth_user_id_text(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_auth_user_id_text() TO anon;
GRANT ALL ON FUNCTION public.get_auth_user_id_text() TO authenticated;
GRANT ALL ON FUNCTION public.get_auth_user_id_text() TO service_role;


-- Name: FUNCTION get_course_students(p_course_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_course_students(p_course_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_course_students(p_course_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_course_students(p_course_id uuid) TO service_role;


-- Name: FUNCTION get_student_activity_summary(p_student_id uuid, p_user_email text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_student_activity_summary(p_student_id uuid, p_user_email text) TO anon;
GRANT ALL ON FUNCTION public.get_student_activity_summary(p_student_id uuid, p_user_email text) TO authenticated;
GRANT ALL ON FUNCTION public.get_student_activity_summary(p_student_id uuid, p_user_email text) TO service_role;


-- Name: FUNCTION get_student_assignments(p_student_id text, p_status_filter text, p_assignment_type_filter text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_student_assignments(p_student_id text, p_status_filter text, p_assignment_type_filter text) TO anon;
GRANT ALL ON FUNCTION public.get_student_assignments(p_student_id text, p_status_filter text, p_assignment_type_filter text) TO authenticated;
GRANT ALL ON FUNCTION public.get_student_assignments(p_student_id text, p_status_filter text, p_assignment_type_filter text) TO service_role;


-- Name: FUNCTION get_unassigned_students(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_unassigned_students() TO anon;
GRANT ALL ON FUNCTION public.get_unassigned_students() TO authenticated;
GRANT ALL ON FUNCTION public.get_unassigned_students() TO service_role;


-- Name: FUNCTION get_user_email(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_email() TO anon;
GRANT ALL ON FUNCTION public.get_user_email() TO authenticated;
GRANT ALL ON FUNCTION public.get_user_email() TO service_role;


-- Name: FUNCTION increment_question_usage(p_question_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_question_usage(p_question_id uuid) TO anon;
GRANT ALL ON FUNCTION public.increment_question_usage(p_question_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.increment_question_usage(p_question_id uuid) TO service_role;


-- Name: FUNCTION increment_simulation_views(simulation_slug text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_simulation_views(simulation_slug text) TO anon;
GRANT ALL ON FUNCTION public.increment_simulation_views(simulation_slug text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_simulation_views(simulation_slug text) TO service_role;


-- Name: FUNCTION increment_tool_uses(tool_slug text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_tool_uses(tool_slug text) TO anon;
GRANT ALL ON FUNCTION public.increment_tool_uses(tool_slug text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_tool_uses(tool_slug text) TO service_role;


-- Name: FUNCTION is_admin_or_teacher(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin_or_teacher() TO anon;
GRANT ALL ON FUNCTION public.is_admin_or_teacher() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin_or_teacher() TO service_role;


-- Name: FUNCTION is_admin_or_teacher(check_email text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin_or_teacher(check_email text) TO anon;
GRANT ALL ON FUNCTION public.is_admin_or_teacher(check_email text) TO authenticated;
GRANT ALL ON FUNCTION public.is_admin_or_teacher(check_email text) TO service_role;


-- Name: FUNCTION is_student(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_student() TO anon;
GRANT ALL ON FUNCTION public.is_student() TO authenticated;
GRANT ALL ON FUNCTION public.is_student() TO service_role;


-- Name: FUNCTION mark_overdue_assignments(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.mark_overdue_assignments() TO anon;
GRANT ALL ON FUNCTION public.mark_overdue_assignments() TO authenticated;
GRANT ALL ON FUNCTION public.mark_overdue_assignments() TO service_role;


-- Name: FUNCTION record_assignment_submission(p_assignment_id uuid, p_user_id text, p_user_email text, p_submission_data jsonb, p_score numeric, p_max_score numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.record_assignment_submission(p_assignment_id uuid, p_user_id text, p_user_email text, p_submission_data jsonb, p_score numeric, p_max_score numeric) TO anon;
GRANT ALL ON FUNCTION public.record_assignment_submission(p_assignment_id uuid, p_user_id text, p_user_email text, p_submission_data jsonb, p_score numeric, p_max_score numeric) TO authenticated;
GRANT ALL ON FUNCTION public.record_assignment_submission(p_assignment_id uuid, p_user_id text, p_user_email text, p_submission_data jsonb, p_score numeric, p_max_score numeric) TO service_role;


-- Name: FUNCTION record_lesson_view(p_user_id text, p_user_email text, p_user_name text, p_lesson_id uuid, p_lesson_slug text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.record_lesson_view(p_user_id text, p_user_email text, p_user_name text, p_lesson_id uuid, p_lesson_slug text) TO anon;
GRANT ALL ON FUNCTION public.record_lesson_view(p_user_id text, p_user_email text, p_user_name text, p_lesson_id uuid, p_lesson_slug text) TO authenticated;
GRANT ALL ON FUNCTION public.record_lesson_view(p_user_id text, p_user_email text, p_user_name text, p_lesson_id uuid, p_lesson_slug text) TO service_role;


-- Name: FUNCTION sync_course(p_google_course_id text, p_name text, p_section text, p_description text, p_room text, p_teacher_email text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_course(p_google_course_id text, p_name text, p_section text, p_description text, p_room text, p_teacher_email text) TO anon;
GRANT ALL ON FUNCTION public.sync_course(p_google_course_id text, p_name text, p_section text, p_description text, p_room text, p_teacher_email text) TO authenticated;
GRANT ALL ON FUNCTION public.sync_course(p_google_course_id text, p_name text, p_section text, p_description text, p_room text, p_teacher_email text) TO service_role;


-- Name: FUNCTION sync_student(p_google_user_id text, p_email text, p_name text, p_photo_url text, p_course_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_student(p_google_user_id text, p_email text, p_name text, p_photo_url text, p_course_id uuid) TO anon;
GRANT ALL ON FUNCTION public.sync_student(p_google_user_id text, p_email text, p_name text, p_photo_url text, p_course_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.sync_student(p_google_user_id text, p_email text, p_name text, p_photo_url text, p_course_id uuid) TO service_role;


-- Name: FUNCTION update_assignment_analytics(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_assignment_analytics() TO anon;
GRANT ALL ON FUNCTION public.update_assignment_analytics() TO authenticated;
GRANT ALL ON FUNCTION public.update_assignment_analytics() TO service_role;


-- Name: FUNCTION update_assignment_assignment_analytics(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_assignment_assignment_analytics() TO anon;
GRANT ALL ON FUNCTION public.update_assignment_assignment_analytics() TO authenticated;
GRANT ALL ON FUNCTION public.update_assignment_assignment_analytics() TO service_role;


-- Name: FUNCTION update_assignment_timestamp(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_assignment_timestamp() TO anon;
GRANT ALL ON FUNCTION public.update_assignment_timestamp() TO authenticated;
GRANT ALL ON FUNCTION public.update_assignment_timestamp() TO service_role;


-- Name: FUNCTION update_course_student_counts(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_course_student_counts() TO anon;
GRANT ALL ON FUNCTION public.update_course_student_counts() TO authenticated;
GRANT ALL ON FUNCTION public.update_course_student_counts() TO service_role;


-- Name: FUNCTION update_lesson_assignment_analytics(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_lesson_assignment_analytics() TO anon;
GRANT ALL ON FUNCTION public.update_lesson_assignment_analytics() TO authenticated;
GRANT ALL ON FUNCTION public.update_lesson_assignment_analytics() TO service_role;


-- Name: FUNCTION update_lesson_progress_percentage(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_lesson_progress_percentage() TO anon;
GRANT ALL ON FUNCTION public.update_lesson_progress_percentage() TO authenticated;
GRANT ALL ON FUNCTION public.update_lesson_progress_percentage() TO service_role;


-- Name: FUNCTION update_rubric_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_rubric_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_rubric_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_rubric_updated_at() TO service_role;


-- Name: FUNCTION update_simulation_assignment_analytics(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_simulation_assignment_analytics() TO anon;
GRANT ALL ON FUNCTION public.update_simulation_assignment_analytics() TO authenticated;
GRANT ALL ON FUNCTION public.update_simulation_assignment_analytics() TO service_role;


-- Name: FUNCTION update_simulation_assignment_timestamp(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_simulation_assignment_timestamp() TO anon;
GRANT ALL ON FUNCTION public.update_simulation_assignment_timestamp() TO authenticated;
GRANT ALL ON FUNCTION public.update_simulation_assignment_timestamp() TO service_role;


-- Name: FUNCTION update_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at() TO service_role;


-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


-- Name: FUNCTION update_vocabulary_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_vocabulary_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_vocabulary_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_vocabulary_updated_at() TO service_role;


-- Name: FUNCTION validate_lesson_videos(lesson_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_lesson_videos(lesson_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.validate_lesson_videos(lesson_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.validate_lesson_videos(lesson_uuid uuid) TO service_role;


-- Name: TABLE accounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.accounts TO anon;
GRANT ALL ON TABLE public.accounts TO authenticated;
GRANT ALL ON TABLE public.accounts TO service_role;


-- Name: TABLE admin_emails; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_emails TO anon;
GRANT ALL ON TABLE public.admin_emails TO authenticated;
GRANT ALL ON TABLE public.admin_emails TO service_role;


-- Name: TABLE assignment_analytics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_analytics TO anon;
GRANT ALL ON TABLE public.assignment_analytics TO authenticated;
GRANT ALL ON TABLE public.assignment_analytics TO service_role;


-- Name: TABLE assignment_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_assignments TO anon;
GRANT ALL ON TABLE public.assignment_assignments TO authenticated;
GRANT ALL ON TABLE public.assignment_assignments TO service_role;


-- Name: TABLE assignment_comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_comments TO anon;
GRANT ALL ON TABLE public.assignment_comments TO authenticated;
GRANT ALL ON TABLE public.assignment_comments TO service_role;


-- Name: TABLE assignment_reminders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_reminders TO anon;
GRANT ALL ON TABLE public.assignment_reminders TO authenticated;
GRANT ALL ON TABLE public.assignment_reminders TO service_role;


-- Name: TABLE assignment_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_submissions TO anon;
GRANT ALL ON TABLE public.assignment_submissions TO authenticated;
GRANT ALL ON TABLE public.assignment_submissions TO service_role;


-- Name: TABLE assignment_tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_tags TO anon;
GRANT ALL ON TABLE public.assignment_tags TO authenticated;
GRANT ALL ON TABLE public.assignment_tags TO service_role;


-- Name: TABLE assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignments TO anon;
GRANT ALL ON TABLE public.assignments TO authenticated;
GRANT ALL ON TABLE public.assignments TO service_role;


-- Name: TABLE course_students; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_students TO anon;
GRANT ALL ON TABLE public.course_students TO authenticated;
GRANT ALL ON TABLE public.course_students TO service_role;


-- Name: TABLE courses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.courses TO anon;
GRANT ALL ON TABLE public.courses TO authenticated;
GRANT ALL ON TABLE public.courses TO service_role;


-- Name: TABLE gradebook_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.gradebook_entries TO anon;
GRANT ALL ON TABLE public.gradebook_entries TO authenticated;
GRANT ALL ON TABLE public.gradebook_entries TO service_role;


-- Name: TABLE interactive_lesson_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.interactive_lesson_progress TO anon;
GRANT ALL ON TABLE public.interactive_lesson_progress TO authenticated;
GRANT ALL ON TABLE public.interactive_lesson_progress TO service_role;


-- Name: TABLE interactive_lessons; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.interactive_lessons TO anon;
GRANT ALL ON TABLE public.interactive_lessons TO authenticated;
GRANT ALL ON TABLE public.interactive_lessons TO service_role;


-- Name: TABLE lesson_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lesson_assignments TO anon;
GRANT ALL ON TABLE public.lesson_assignments TO authenticated;
GRANT ALL ON TABLE public.lesson_assignments TO service_role;


-- Name: TABLE lesson_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lesson_progress TO anon;
GRANT ALL ON TABLE public.lesson_progress TO authenticated;
GRANT ALL ON TABLE public.lesson_progress TO service_role;


-- Name: TABLE lessons; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lessons TO anon;
GRANT ALL ON TABLE public.lessons TO authenticated;
GRANT ALL ON TABLE public.lessons TO service_role;


-- Name: TABLE physics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.physics TO anon;
GRANT ALL ON TABLE public.physics TO authenticated;
GRANT ALL ON TABLE public.physics TO service_role;


-- Name: SEQUENCE physics_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.physics_id_seq TO anon;
GRANT ALL ON SEQUENCE public.physics_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.physics_id_seq TO service_role;


-- Name: TABLE question_bank; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.question_bank TO anon;
GRANT ALL ON TABLE public.question_bank TO authenticated;
GRANT ALL ON TABLE public.question_bank TO service_role;


-- Name: TABLE question_usage_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.question_usage_log TO anon;
GRANT ALL ON TABLE public.question_usage_log TO authenticated;
GRANT ALL ON TABLE public.question_usage_log TO service_role;


-- Name: SEQUENCE question_usage_log_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.question_usage_log_id_seq TO anon;
GRANT ALL ON SEQUENCE public.question_usage_log_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.question_usage_log_id_seq TO service_role;


-- Name: TABLE rubric_assessments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rubric_assessments TO anon;
GRANT ALL ON TABLE public.rubric_assessments TO authenticated;
GRANT ALL ON TABLE public.rubric_assessments TO service_role;


-- Name: TABLE security_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.security_events TO anon;
GRANT ALL ON TABLE public.security_events TO authenticated;
GRANT ALL ON TABLE public.security_events TO service_role;


-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sessions TO anon;
GRANT ALL ON TABLE public.sessions TO authenticated;
GRANT ALL ON TABLE public.sessions TO service_role;


-- Name: TABLE simulation_activity; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.simulation_activity TO anon;
GRANT ALL ON TABLE public.simulation_activity TO authenticated;
GRANT ALL ON TABLE public.simulation_activity TO service_role;


-- Name: TABLE simulation_assignment_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.simulation_assignment_submissions TO anon;
GRANT ALL ON TABLE public.simulation_assignment_submissions TO authenticated;
GRANT ALL ON TABLE public.simulation_assignment_submissions TO service_role;


-- Name: TABLE simulation_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.simulation_assignments TO anon;
GRANT ALL ON TABLE public.simulation_assignments TO authenticated;
GRANT ALL ON TABLE public.simulation_assignments TO service_role;


-- Name: TABLE unified_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.unified_assignments TO anon;
GRANT ALL ON TABLE public.unified_assignments TO authenticated;
GRANT ALL ON TABLE public.unified_assignments TO service_role;


-- Name: TABLE simulation_assignments_unified; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.simulation_assignments_unified TO anon;
GRANT ALL ON TABLE public.simulation_assignments_unified TO authenticated;
GRANT ALL ON TABLE public.simulation_assignments_unified TO service_role;


-- Name: TABLE simulation_embedded_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.simulation_embedded_assignments TO anon;
GRANT ALL ON TABLE public.simulation_embedded_assignments TO authenticated;
GRANT ALL ON TABLE public.simulation_embedded_assignments TO service_role;


-- Name: TABLE simulation_rubrics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.simulation_rubrics TO anon;
GRANT ALL ON TABLE public.simulation_rubrics TO authenticated;
GRANT ALL ON TABLE public.simulation_rubrics TO service_role;


-- Name: TABLE simulations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.simulations TO anon;
GRANT ALL ON TABLE public.simulations TO authenticated;
GRANT ALL ON TABLE public.simulations TO service_role;


-- Name: TABLE student_activity; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_activity TO anon;
GRANT ALL ON TABLE public.student_activity TO authenticated;
GRANT ALL ON TABLE public.student_activity TO service_role;


-- Name: TABLE student_assignment_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_assignment_assignments TO anon;
GRANT ALL ON TABLE public.student_assignment_assignments TO authenticated;
GRANT ALL ON TABLE public.student_assignment_assignments TO service_role;


-- Name: TABLE student_assignment_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_assignment_progress TO anon;
GRANT ALL ON TABLE public.student_assignment_progress TO authenticated;
GRANT ALL ON TABLE public.student_assignment_progress TO service_role;


-- Name: TABLE student_lesson_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_lesson_assignments TO anon;
GRANT ALL ON TABLE public.student_lesson_assignments TO authenticated;
GRANT ALL ON TABLE public.student_lesson_assignments TO service_role;


-- Name: TABLE student_simulation_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_simulation_assignments TO anon;
GRANT ALL ON TABLE public.student_simulation_assignments TO authenticated;
GRANT ALL ON TABLE public.student_simulation_assignments TO service_role;


-- Name: TABLE students; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.students TO anon;
GRANT ALL ON TABLE public.students TO authenticated;
GRANT ALL ON TABLE public.students TO service_role;


-- Name: TABLE submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.submissions TO anon;
GRANT ALL ON TABLE public.submissions TO authenticated;
GRANT ALL ON TABLE public.submissions TO service_role;


-- Name: TABLE tools; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tools TO anon;
GRANT ALL ON TABLE public.tools TO authenticated;
GRANT ALL ON TABLE public.tools TO service_role;


-- Name: TABLE units; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.units TO anon;
GRANT ALL ON TABLE public.units TO authenticated;
GRANT ALL ON TABLE public.units TO service_role;


-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;


-- Name: TABLE user_security_status; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_security_status TO anon;
GRANT ALL ON TABLE public.user_security_status TO authenticated;
GRANT ALL ON TABLE public.user_security_status TO service_role;


-- Name: TABLE user_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_tokens TO anon;
GRANT ALL ON TABLE public.user_tokens TO authenticated;
GRANT ALL ON TABLE public.user_tokens TO service_role;


-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


-- Name: TABLE verification_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.verification_tokens TO anon;
GRANT ALL ON TABLE public.verification_tokens TO authenticated;
GRANT ALL ON TABLE public.verification_tokens TO service_role;


-- Name: TABLE video_question_responses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.video_question_responses TO anon;
GRANT ALL ON TABLE public.video_question_responses TO authenticated;
GRANT ALL ON TABLE public.video_question_responses TO service_role;


-- Name: TABLE vocabulary_game_scores; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.vocabulary_game_scores TO anon;
GRANT ALL ON TABLE public.vocabulary_game_scores TO authenticated;
GRANT ALL ON TABLE public.vocabulary_game_scores TO service_role;


-- Name: TABLE vocabulary_sets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.vocabulary_sets TO anon;
GRANT ALL ON TABLE public.vocabulary_sets TO authenticated;
GRANT ALL ON TABLE public.vocabulary_sets TO service_role;


-- Name: TABLE vocabulary_terms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.vocabulary_terms TO anon;
GRANT ALL ON TABLE public.vocabulary_terms TO authenticated;
GRANT ALL ON TABLE public.vocabulary_terms TO service_role;


-- Name: TABLE vocabulary_usage; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.vocabulary_usage TO anon;
GRANT ALL ON TABLE public.vocabulary_usage TO authenticated;
GRANT ALL ON TABLE public.vocabulary_usage TO service_role;


-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


