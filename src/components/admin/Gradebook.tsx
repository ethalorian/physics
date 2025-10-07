"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  BookOpen, 
  Trophy, 
  FileText, 
  Search, 
  Filter,
  MoreVertical,
  Download,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react'
import { format } from 'date-fns'

interface GradebookEntry {
  id: string
  user_id: string
  user_email: string
  student_name?: string
  item_type: 'assignment' | 'lesson' | 'vocabulary_game'
  item_id: string
  item_title: string
  course_id?: string
  score?: number
  max_score?: number
  percentage?: number
  status: string
  due_date?: string
  submitted_at?: string
  graded_at?: string
  synced_to_classroom: boolean
  last_synced_at?: string
  created_at: string
}

export default function Gradebook() {
  const [entries, setEntries] = useState<GradebookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchGradebook()
  }, [])

  const fetchGradebook = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gradebook')
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching gradebook:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEntries = useMemo(() => {
    let filtered = entries

    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.item_title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.item_type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter)
    }

    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [entries, searchQuery, typeFilter, statusFilter])

  const stats = useMemo(() => {
    return {
      totalEntries: entries.length,
      graded: entries.filter(e => e.status === 'graded').length,
      pending: entries.filter(e => e.status === 'submitted').length,
      synced: entries.filter(e => e.synced_to_classroom).length,
      averageScore: entries.filter(e => e.percentage).length > 0
        ? Math.round(entries.filter(e => e.percentage).reduce((sum, e) => sum + (e.percentage || 0), 0) / entries.filter(e => e.percentage).length)
        : 0
    }
  }, [entries])

  const handleSyncToClassroom = async () => {
    if (selectedEntries.size === 0) {
      alert('Please select entries to sync')
      return
    }

    if (!confirm(`Sync ${selectedEntries.size} grade(s) to Google Classroom?`)) {
      return
    }

    setSyncing(true)
    try {
      const res = await fetch('/api/gradebook/sync-to-classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradebook_entry_ids: Array.from(selectedEntries),
          course_id: '' // Add course selection if needed
        })
      })

      if (res.ok) {
        const result = await res.json()
        alert(`Successfully synced ${result.synced} grades!\n${result.failed > 0 ? `Failed: ${result.failed}` : ''}`)
        fetchGradebook() // Refresh
        setSelectedEntries(new Set())
      } else {
        throw new Error('Failed to sync')
      }
    } catch (error) {
      console.error('Error syncing to classroom:', error)
      alert('Error syncing to Google Classroom')
    } finally {
      setSyncing(false)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const exportToCSV = () => {
    const csv = [
      ['Student Name', 'Email', 'Type', 'Item', 'Score', 'Max Score', '%', 'Status', 'Date'].join(','),
      ...filteredEntries.map(e => [
        e.student_name || '',
        e.user_email,
        e.item_type,
        e.item_title,
        e.score || '',
        e.max_score || '',
        e.percentage?.toFixed(1) || '',
        e.status,
        e.graded_at ? format(new Date(e.graded_at), 'MM/dd/yyyy') : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gradebook-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gradebook</h2>
          <p className="text-muted-foreground">View and manage all student grades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={handleSyncToClassroom}
            disabled={selectedEntries.size === 0 || syncing}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Upload className="h-4 w-4 mr-2" />
            {syncing ? 'Syncing...' : `Sync to Classroom (${selectedEntries.size})`}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalEntries}</div>
                <div className="text-xs text-muted-foreground">Total Entries</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.graded}</div>
                <div className="text-xs text-muted-foreground">Graded</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.averageScore}%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="assignment">Assignments</SelectItem>
              <SelectItem value="lesson">Lessons</SelectItem>
              <SelectItem value="vocabulary_game">Games</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Gradebook Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEntries(new Set(filteredEntries.map(entry => entry.id)))
                        } else {
                          setSelectedEntries(new Set())
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Synced</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No gradebook entries found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry.id)}
                          onChange={() => toggleSelection(entry.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.student_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{entry.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {entry.item_type === 'vocabulary_game' ? (
                            <><Trophy className="h-3 w-3 mr-1" />Game</>
                          ) : entry.item_type === 'lesson' ? (
                            <><BookOpen className="h-3 w-3 mr-1" />Lesson</>
                          ) : (
                            <><FileText className="h-3 w-3 mr-1" />Assignment</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{entry.item_title}</TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.score !== null && entry.score !== undefined ? (
                          <span>{entry.score}/{entry.max_score}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {entry.percentage !== null && entry.percentage !== undefined ? (
                          <span className={
                            entry.percentage >= 90 ? 'text-green-600' :
                            entry.percentage >= 80 ? 'text-blue-600' :
                            entry.percentage >= 70 ? 'text-orange-600' :
                            'text-red-600'
                          }>
                            {entry.percentage.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          entry.status === 'graded' ? 'default' :
                          entry.status === 'submitted' ? 'secondary' :
                          'outline'
                        } className="text-xs">
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.graded_at ? format(new Date(entry.graded_at), 'MMM d') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.synced_to_classroom ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleSelection(entry.id)}>
                              Select for Sync
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Grade</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
