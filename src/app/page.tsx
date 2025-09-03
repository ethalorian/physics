import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-12 max-w-4xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-[#4A1A4A] via-[#6A4C93] to-[#9A8AC0] bg-clip-text text-transparent leading-tight">
            Physics Classroom
          </h1>
          <p className="text-2xl text-[#6A4C93] max-w-3xl mx-auto leading-relaxed">
            Master the fundamental laws of physics through interactive lessons, 
            engaging content, and hands-on learning experiences.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/lessons">
            <Button className="apple-button text-lg px-8 py-4">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Explore Lessons
            </Button>
          </Link>
          <Link href="/assignments">
            <Button className="apple-button-secondary text-lg px-8 py-4">
              View Assignments
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="apple-card p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] flex items-center justify-center apple-shadow">
              <svg className="w-8 h-8 text-[#F7F5F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#4A1A4A] mb-2">Interactive Learning</h3>
            <p className="text-[#6A4C93]">Engage with physics concepts through interactive simulations and visual demonstrations.</p>
          </div>
          
          <div className="apple-card p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#9A8AC0] to-[#6A4C93] flex items-center justify-center apple-shadow">
              <svg className="w-8 h-8 text-[#F7F5F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#4A1A4A] mb-2">Progress Tracking</h3>
            <p className="text-[#6A4C93]">Monitor your learning journey with detailed progress tracking and performance analytics.</p>
          </div>
          
          <div className="apple-card p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#B19CD9] to-[#9A8AC0] flex items-center justify-center apple-shadow">
              <svg className="w-8 h-8 text-[#4A1A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#4A1A4A] mb-2">Real-World Applications</h3>
            <p className="text-[#6A4C93]">Connect physics principles to everyday phenomena and cutting-edge technology.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
