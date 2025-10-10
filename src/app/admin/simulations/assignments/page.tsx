"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SimulationAssignmentEditor from '@/components/simulations/SimulationAssignmentEditor'
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users,
  BarChart,
  Copy,
  Filter
} from 'lucide-react'

// Map of simulation slugs to friendly names
const SIMULATION_NAMES: Record<string, string> = {
  'constant-velocity': 'Constant Velocity Motion Lab',
  'uniformly-accelerated-motion': 'Uniformly Accelerated Motion',
  'freefall-cliff': 'Freefall Cliff Lab',
  'projectile-motion': 'Projectile Motion Lab',
  'measurement-precision': 'Measurement, Precision & Accuracy',
  'area-under-curve': 'Area Under the Curve',
  'distance-displacement': 'Distance vs Displacement',
  'slope-calculator': 'Slope Calculator'
}

interface SimulationAssignment {
  id: string
  simulation_slug: string
  title: string
  description?: string
  questions: any[]
  total_points: number
  show_on_start: boolean
  show_on_complete: boolean
  allow_skip: boolean
  required_for_progress: boolean
  time_limit?: number
  available_after: number
  max_attempts: number
  allow_late_submission: boolean
  published: boolean
  created_at: string
  created_by: string
}

export default function SimulationAssignmentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userRole = getUserRole(session?.user?.email)
  const [assignments, setAssignments] = useState<SimulationAssignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<SimulationAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSimulation, setFilterSimulation] = useState('all')
  const [showEditor, setShowEditor] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<SimulationAssignment | null>(null)
  const [selectedSimulation, setSelectedSimulation] = useState<string>('')

  // Check permissions
  useEffect(() => {
    if (userRole === 'student') {
      router.push('/dashboard')
    }
  }, [userRole, router])

  // Load assignments
  useEffect(() => {
    loadAssignments()
  }, [])

  // Filter assignments
  useEffect(() => {
    let filtered = assignments

    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.simulation_slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterSimulation !== 'all') {
      filtered = filtered.filter(a => a.simulation_slug === filterSimulation)
    }

    setFilteredAssignments(filtered)
  }, [assignments, searchQuery, filterSimulation])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/simulations/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePublished = async (assignment: SimulationAssignment) => {
    try {
      const response = await fetch('/api/simulations/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assignment.id,
          published: !assignment.published
        })
      })

      if (response.ok) {
        loadAssignments()
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
    }
  }

  const deleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/simulations/assignments?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadAssignments()
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
    }
  }

  const duplicateAssignment = async (assignment: SimulationAssignment) => {
    try {
      const response = await fetch('/api/simulations/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assignment,
          id: undefined,
          title: `${assignment.title} (Copy)`,
          published: false,
          created_at: undefined,
          created_by: session?.user?.email
        })
      })

      if (response.ok) {
        loadAssignments()
      }
    } catch (error) {
      console.error('Error duplicating assignment:', error)
    }
  }

  // Get unique simulations from assignments
  const uniqueSimulations = Array.from(new Set(assignments.map(a => a.simulation_slug)))

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Simulation Assignments</h1>
            <p className="text-muted-foreground">
              Manage embedded assignments for physics simulations
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingAssignment(null)
              setSelectedSimulation('')
              setShowEditor(true)
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">Across all simulations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.filter(a => a.published).length}
            </div>
            <p className="text-xs text-muted-foreground">Visible to students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <BarChart className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.reduce((sum, a) => sum + a.questions.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Simulations</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSimulations.length}</div>
            <p className="text-xs text-muted-foreground">With assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              {filterSimulation === 'all' ? 'All Simulations' : SIMULATION_NAMES[filterSimulation] || filterSimulation}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[250px]">
            <DropdownMenuItem onClick={() => setFilterSimulation('all')}>
              All Simulations
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {uniqueSimulations.map(sim => (
              <DropdownMenuItem key={sim} onClick={() => setFilterSimulation(sim)}>
                {SIMULATION_NAMES[sim] || sim}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Assignments Table */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || filterSimulation !== 'all' 
                ? 'No assignments found' 
                : 'No assignments yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterSimulation !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first simulation assignment to get started'}
            </p>
            {!searchQuery && filterSimulation === 'all' && (
              <Button
                onClick={() => {
                  setEditingAssignment(null)
                  setSelectedSimulation('')
                  setShowEditor(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Simulation</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Display</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {SIMULATION_NAMES[assignment.simulation_slug] || assignment.simulation_slug}
                    </Badge>
                  </TableCell>
                  <TableCell>{assignment.questions.length}</TableCell>
                  <TableCell>{assignment.total_points}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {assignment.show_on_start && (
                        <Badge variant="secondary" className="text-xs">
                          On Start
                        </Badge>
                      )}
                      {assignment.show_on_complete && (
                        <Badge variant="secondary" className="text-xs">
                          On Complete
                        </Badge>
                      )}
                      {assignment.available_after > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          After {assignment.available_after}s
                        </Badge>
                      )}
                      {assignment.required_for_progress && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={assignment.published ? 'default' : 'outline'}>
                      {assignment.published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setEditingAssignment(assignment)
                            setSelectedSimulation(assignment.simulation_slug)
                            setShowEditor(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateAssignment(assignment)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublished(assignment)}>
                          {assignment.published ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteAssignment(assignment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Assignment Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          {!selectedSimulation && !editingAssignment ? (
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Select Simulation</CardTitle>
                <CardDescription>
                  Choose which simulation this assignment will be embedded in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(SIMULATION_NAMES).map(([slug, name]) => (
                    <Button
                      key={slug}
                      variant="outline"
                      className="justify-start"
                      onClick={() => setSelectedSimulation(slug)}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4"
                  onClick={() => {
                    setShowEditor(false)
                    setSelectedSimulation('')
                  }}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <SimulationAssignmentEditor
              isOpen={true}
              onClose={() => {
                setShowEditor(false)
                setEditingAssignment(null)
                setSelectedSimulation('')
              }}
              simulationSlug={editingAssignment?.simulation_slug || selectedSimulation}
              assignment={editingAssignment || undefined}
              onSave={() => {
                loadAssignments()
                setShowEditor(false)
                setEditingAssignment(null)
                setSelectedSimulation('')
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
