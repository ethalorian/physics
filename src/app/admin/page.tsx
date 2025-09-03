"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

export default function AdminPage() {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    order_index: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('lessons')
      .insert([{ ...formData, published: true }])
    
    if (error) {
      console.error('Error:', error)
    } else {
      alert('Lesson added successfully!')
      setFormData({ title: '', slug: '', description: '', content: '', order_index: 0 })
    }
  }

  if (!session) {
    return <div>Please sign in to access admin features.</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Add New Lesson</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        
        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">
            Slug (URL path)
          </label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="forces-and-motion"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Content (Markdown)
          </label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={20}
            placeholder="Paste your markdown content here..."
            required
          />
        </div>
        
        <Button type="submit" className="w-full">
          Add Lesson
        </Button>
      </form>
    </div>
  )
}
