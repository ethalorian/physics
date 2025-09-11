"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { usePermissions } from '@/hooks/usePermissions'

export default function AdminPage() {
  const { isAuthenticated, canAccessAdmin, canCreateLessons, userRole } = usePermissions()
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    unit: '',
    lesson_number: 1
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      console.log('Submitting lesson data:', formData)
      
      const { data, error } = await supabase
        .from('lessons')
        .insert([{ ...formData, published: true }])
        .select()
      
      if (error) {
        console.error('Supabase error:', error)
        alert(`Error creating lesson: ${error.message}`)
      } else {
        console.log('Lesson created successfully:', data)
        alert('Lesson added successfully!')
        setFormData({ title: '', slug: '', description: '', content: '', unit: '', lesson_number: 1 })
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <h2 className="text-2xl font-bold text-[#4A1A4A] mb-4">Admin Access Required</h2>
          <p className="text-[#6A4C93] mb-6">Please sign in to access admin features.</p>
        </div>
      </div>
    )
  }

  if (!canAccessAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#B19CD9] to-[#9A8AC0] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#4A1A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#4A1A4A] mb-4">Access Denied</h2>
          <p className="text-[#6A4C93] mb-2">You don&apos;t have permission to access the admin panel.</p>
          <p className="text-sm text-[#9A8AC0]">Your current role: {userRole}</p>
          <p className="text-xs text-[#9A8AC0] mt-1">Only admins can access this page.</p>
        </div>
      </div>
    )
  }

  if (!canCreateLessons) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="apple-card p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#B19CD9] to-[#9A8AC0] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#4A1A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#4A1A4A] mb-4">Insufficient Permissions</h2>
          <p className="text-[#6A4C93] mb-2">You don&apos;t have permission to create lessons.</p>
          <p className="text-sm text-[#9A8AC0]">Your current role: {userRole}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-[#4A1A4A] dark:text-[#FFFFFF] relative">
          Create New Lesson
          <div className="absolute -bottom-2 left-0 w-28 h-1 bg-gradient-to-r from-[#D4AF37] to-[#6A4C93] rounded-full" />
        </h1>
        <p className="text-lg text-[#6A4C93] dark:text-[#E8DDFF]">
          Add a new physics lesson to your curriculum
        </p>
      </div>
      
      <div className="apple-card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label htmlFor="unit" className="block text-sm font-semibold text-[#4A1A4A]">
                Unit
              </label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="apple-input border-0 bg-gray-50/80 focus:bg-white/90"
                placeholder="Mechanics"
                required
              />
            </div>
            
            <div className="space-y-3">
              <label htmlFor="lesson_number" className="block text-sm font-semibold text-[#4A1A4A]">
                Lesson Number
              </label>
              <Input
                id="lesson_number"
                type="number"
                min="1"
                value={formData.lesson_number}
                onChange={(e) => setFormData({ ...formData, lesson_number: parseInt(e.target.value) || 1 })}
                className="apple-input border-0 bg-gray-50/80 focus:bg-white/90"
                required
              />
            </div>
            
            <div className="space-y-3">
              <label htmlFor="slug" className="block text-sm font-semibold text-[#4A1A4A]">
                URL Slug
              </label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="apple-input border-0 bg-gray-50/80 focus:bg-white/90"
                placeholder="introduction-to-forces"
                required
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="title" className="block text-sm font-semibold text-[#4A1A4A]">
              Lesson Title
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="apple-input border-0 bg-gray-50/80 focus:bg-white/90"
              placeholder="Introduction to Forces"
              required
            />
          </div>
          
          <div className="space-y-3">
            <label htmlFor="description" className="block text-sm font-semibold text-[#4A1A4A]">
              Description
              <span className="text-[#9A8AC0] font-normal ml-2">(Optional)</span>
            </label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="apple-input border-0 bg-gray-50/80 focus:bg-white/90"
              placeholder="A brief overview of what students will learn..."
            />
          </div>
          
          <div className="space-y-3">
            <label htmlFor="content" className="block text-sm font-semibold text-[#4A1A4A]">
              Lesson Content
              <span className="text-[#9A8AC0] font-normal ml-2">(Markdown supported)</span>
            </label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={24}
              className="apple-textarea border-0 bg-gray-50/80 focus:bg-white/90 font-mono text-sm"
              placeholder="# Lesson Title

## Introduction
Start your lesson content here...

## Key Concepts
- Force is a vector quantity
- Newton's laws of motion

## Examples
..."
              required
            />
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              className="apple-button w-full md:w-auto md:px-12 text-lg py-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Lesson
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
