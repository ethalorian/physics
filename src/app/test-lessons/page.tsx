"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Lesson {
  id: string
  title: string
  slug: string
  unit: string
  lesson_number: number
  published: boolean
  created_at: string
}

export default function TestLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rawResponse, setRawResponse] = useState<unknown>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Testing Supabase connection...')
      
      // Test 1: Basic connection
      const { data, error: fetchError, status, statusText } = await supabase
        .from('lessons')
        .select('*')
      
      console.log('Response:', { data, error: fetchError, status, statusText })
      setRawResponse({ data, error: fetchError, status, statusText })
      
      if (fetchError) {
        setError(`Fetch Error: ${fetchError.message}`)
        console.error('Detailed error:', fetchError)
      } else {
        setLessons(data || [])
        console.log('Lessons fetched:', data)
      }
    } catch (err) {
      console.error('Caught error:', err)
      setError(`Caught Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testPublishedLessons = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Testing published lessons query...')
      
      const { data, error: fetchError } = await supabase
        .from('lessons')
        .select('*')
        .eq('published', true)
        .order('lesson_number', { ascending: true })
      
      console.log('Published lessons:', { data, error: fetchError })
      setRawResponse({ data, error: fetchError })
      
      if (fetchError) {
        setError(`Fetch Error: ${fetchError.message}`)
      } else {
        setLessons(data || [])
      }
    } catch (err) {
      setError(`Caught Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const createSampleLesson = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Creating sample lesson...')
      
      const { data, error: insertError } = await supabase
        .from('lessons')
        .insert([{
          title: 'Test Unit Conversions',
          slug: 'test-unit-conversions',
          description: 'Test lesson for unit conversions',
          content: '# Test Lesson\n\nThis is a test lesson with train tracks method.',
          unit: 'Unit 0 - Test',
          lesson_number: 1,
          published: true
        }])
        .select()
      
      console.log('Insert result:', { data, error: insertError })
      setRawResponse({ data, error: insertError })
      
      if (insertError) {
        setError(`Insert Error: ${insertError.message}`)
      } else {
        alert('Sample lesson created!')
        testConnection()
      }
    } catch (err) {
      setError(`Caught Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Database Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Connection Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={testConnection} disabled={loading}>
            Test All Lessons
          </Button>
          <Button onClick={testPublishedLessons} disabled={loading} className="ml-2">
            Test Published Lessons
          </Button>
          <Button onClick={createSampleLesson} disabled={loading} className="ml-2">
            Create Sample Lesson
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Raw Response</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lessons ({lessons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : lessons.length === 0 ? (
            <p className="text-gray-500">No lessons found</p>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="border p-4 rounded">
                  <h3 className="font-bold">{lesson.title}</h3>
                  <p className="text-sm text-gray-600">ID: {lesson.id}</p>
                  <p className="text-sm text-gray-600">Slug: {lesson.slug}</p>
                  <p className="text-sm text-gray-600">Unit: {lesson.unit}</p>
                  <p className="text-sm text-gray-600">Lesson #: {lesson.lesson_number}</p>
                  <p className="text-sm text-gray-600">Published: {lesson.published ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-600">Created: {new Date(lesson.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
