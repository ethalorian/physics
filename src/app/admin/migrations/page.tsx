'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Copy, ExternalLink, Database, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function MigrationsPage() {
  const [copied, setCopied] = useState(false)

  const migrationSQL = `-- Simulation Tool System Migration
-- Safe to run - uses IF NOT EXISTS

CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'kinematics', 'forces', 'energy', 'momentum', 'waves',
    'electricity', 'magnetism', 'optics', 'thermodynamics',
    'modern-physics', 'lab-skills'
  )),
  unit TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  component_path TEXT NOT NULL,
  estimated_time INTEGER,
  objectives TEXT[] DEFAULT '{}',
  key_concepts TEXT[] DEFAULT '{}',
  prerequisite_knowledge TEXT[] DEFAULT '{}',
  can_embed BOOLEAN DEFAULT TRUE,
  has_ai_guide BOOLEAN DEFAULT FALSE,
  supported_question_types TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  embed_count INTEGER DEFAULT 0
);

-- See full migration file at:
-- supabase/migrations/create_simulation_tool_system.sql`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(migrationSQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Migrations</h1>
        <p className="text-muted-foreground">
          Run database migrations to add new features
        </p>
      </div>

      <div className="space-y-6">
        {/* Simulation Tool System Migration */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Simulation & Tool Infrastructure
              </CardTitle>
              <Badge variant="outline" className="bg-blue-50">
                Required for Phase 1
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Creates tables for simulations, tools, interactive lessons, and progress tracking.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <strong>Safe Migration:</strong> Uses IF NOT EXISTS - won&apos;t break anything if run multiple times
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-900 space-y-2">
                <div className="font-semibold mb-2">Creates these tables:</div>
                <div className="space-y-1 ml-4">
                  <div>• <code className="text-xs">simulations</code> - Interactive physics simulations</div>
                  <div>• <code className="text-xs">tools</code> - Measurement and calculation tools</div>
                  <div>• <code className="text-xs">interactive_lessons</code> - Multi-step guided lessons</div>
                  <div>• <code className="text-xs">simulation_activity</code> - Student progress tracking</div>
                  <div>• <code className="text-xs">interactive_lesson_progress</code> - Lesson completion</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">How to Run:</h4>
              
              <div className="space-y-3">
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      1
                    </div>
                    <div>
                      <div className="font-medium mb-1">Open Supabase SQL Editor</div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a 
                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/project/_/sql`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Open SQL Editor
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-2">Copy Migration SQL</div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 mr-2 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-2" />
                              Copy SQL
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a 
                            href="/supabase/migrations/create_simulation_tool_system.sql"
                            target="_blank"
                          >
                            View Full File
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      3
                    </div>
                    <div>
                      <div className="font-medium mb-1">Paste and Run</div>
                      <p className="text-sm text-gray-600">
                        Paste the SQL into the editor and click &quot;Run&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900">
                  <strong>Alternative:</strong> You can copy the full migration from{' '}
                  <code className="text-xs bg-yellow-100 px-1 py-0.5 rounded">
                    supabase/migrations/create_simulation_tool_system.sql
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Check */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verify Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-4">
              After running the migration, check that these tables exist in your Supabase dashboard:
            </p>
            <div className="grid md:grid-cols-2 gap-2 mb-4">
              {['simulations', 'tools', 'interactive_lessons', 'simulation_activity', 'interactive_lesson_progress'].map(table => (
                <div key={table} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <code>{table}</code>
                </div>
              ))}
            </div>
            
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/migrations/check">
                <AlertCircle className="h-4 w-4 mr-2" />
                Check Migration Status
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-900">After Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 mb-3">
              Once the migration runs successfully, your simulations infrastructure will be ready!
            </p>
            <div className="text-sm text-green-900 space-y-2">
              <div>✓ Database tables created</div>
              <div>✓ Your 3 existing simulations automatically seeded</div>
              <div>✓ Ready for API routes and context provider</div>
              <div>✓ Ready for progress tracking</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
