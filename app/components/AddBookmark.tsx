'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Bookmark {
  id: string
  title: string
  url: string
  user_id: string
}

interface AddBookmarkProps {
  initialBookmarks: Bookmark[]
}

export default function AddBookmark({ initialBookmarks = [] }: AddBookmarkProps) {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  // User info for multi-user testing
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // States for Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    const startSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Set user email for the welcome message
      setUserEmail(user.email ?? 'User')

      channel = supabase
        .channel(`sync-channel-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookmarks', 
          filter: `user_id=eq.${user.id}` 
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newB = payload.new as Bookmark
            setBookmarks(prev => prev.some(b => b.id === newB.id) ? prev : [newB, ...prev])
          } 
          else if (payload.eventType === 'DELETE') {
            setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
          } 
          else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Bookmark
            setBookmarks(prev => prev.map(b => b.id === updated.id ? updated : b))
          }
        })
        .subscribe()
    }

    startSubscription()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Basic Validation
    if (!title.trim() || !url.trim()) {
      setMessage({ text: 'Fill in Title and URL', type: 'error' })
      return
    }
    const normalizedUrl = url.trim().toLowerCase();
    const existingBookmark = bookmarks.find(
      (b) => b.url.toLowerCase() === normalizedUrl
    );

    if (existingBookmark) {
      setMessage({ 
        text: `URL already exists as: "${existingBookmark.title}"`, 
        type: 'error' 
      })
      return
    }
    

    // 2. Duplicate Title Check
    const normalizedTitle = title.trim().toLowerCase()
    if (bookmarks.some(b => b.title.toLowerCase() === normalizedTitle)) {
      setMessage({ text: 'Bookmark already exists, choose another name', type: 'error' })
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{ title, url, user_id: user?.id }])
      .select().single()

    if (error) {
      setMessage({ text: 'Failed to add', type: 'error' })
    } else {
      if (data) setBookmarks(prev => [data as Bookmark, ...prev])
      setMessage({ text: 'Bookmark added!', type: 'success' })
      setTitle('')
      setUrl('')
    }
    setLoading(false)
  }

  const handleDeleteByInput = async () => {
    if (!title.trim() && !url.trim()) {
      setMessage({ text: 'Enter Title or URL to delete', type: 'error' })
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: matches } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user?.id)
      .or(`title.eq."${title}",url.eq."${url}"`)

    if (!matches || matches.length === 0) {
      setMessage({ text: 'No match found', type: 'error' })
    } else {
      const ids = matches.map(m => m.id)
      const { error } = await supabase.from('bookmarks').delete().in('id', ids)
      if (!error) {
        setBookmarks(prev => prev.filter(b => !ids.includes(b.id)))
        setMessage({ text: 'Bookmark deleted!', type: 'success' })
        setTitle(''); setUrl('')
      }
    }
    setLoading(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim() || !editUrl.trim()) {
      setEditError("Fields cannot be empty")
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('bookmarks').update({ title: editTitle, url: editUrl }).eq('id', id)
    if (!error) {
      setMessage({ text: 'Updated!', type: 'success' })
      setEditingId(null)
      setEditError(null)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden text-black">
      
      {/* 1. TOP ROW: WELCOME/MESSAGES (LEFT) AND SIGN OUT (RIGHT) */}
      <div className="flex-none h-8 flex justify-between items-center mb-2 px-1">
        <div className="flex-1">
          {message ? (
            <span className={`text-sm font-bold ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          ) : (
            userEmail && (
              <span className="text-sm font-medium text-gray-600">
                Welcome, <span className="font-bold text-blue-600">{userEmail}</span>
              </span>
            )
          )}
        </div>
        <button onClick={handleSignOut} className="text-sm font-bold text-red-600 hover:underline ml-4">
          Sign Out
        </button>
      </div>

      {/* 2. FORM SECTION */}
      <div className="flex-none space-y-4 mb-6">
        <div className="space-y-4">
          <input 
            placeholder="Title" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="w-full p-3 border rounded-lg text-black text-sm outline-none border-gray-300 focus:ring-2 focus:ring-blue-400" 
          />
          <input 
            placeholder="URL" 
            value={url} 
            onChange={e => setUrl(e.target.value)} 
            className="w-full p-3 border rounded-lg text-black text-sm outline-none border-gray-300 focus:ring-2 focus:ring-blue-400" 
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading} className="flex-1 bg-blue-600 text-white p-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:bg-gray-400">
              Add Bookmark
            </button>
            <button onClick={handleDeleteByInput} disabled={loading} className="flex-1 bg-red-600 text-white p-2 rounded-lg text-sm font-bold hover:bg-red-700 transition disabled:bg-gray-400">
              Delete Bookmark
            </button>
          </div>
        </div>
      </div>

      {/* 3. SCROLLABLE LIST SECTION */}
      <div className="flex-1 flex flex-col min-h-0 pt-4 border-t border-gray-300">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Your Saved Links</h2>
        
        <div className={`flex-1 pr-2 space-y-3 custom-scrollbar ${bookmarks.length > 0 ?"overflow-y-auto" : ""
        }`}>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-10">No bookmarks found.</p>
          ) : (
            bookmarks.map(b => (
              <div key={b.id} className="p-4 border rounded-xl bg-gray-50 flex flex-col gap-2 border-gray-200 shadow-sm">
                {editingId === b.id ? (
                  <div className="space-y-2">
                   <input
                      aria-label="Edit bookmark title"
                      value={editTitle}
                      onChange={(e) => {
                        setEditTitle(e.target.value)
                        setEditError(null)
                    }}
                    className="w-full p-2 border rounded text-xs text-black"
                    />

                    <input
                      aria-label="Edit bookmark URL"
                      value={editUrl}
                      onChange={(e) => {
                          setEditUrl(e.target.value)
                          setEditError(null)
                    }}
                    className="w-full p-2 border rounded text-xs text-black"
                    />
                    
                    {editError && (
                      <p className="text-[10px] font-bold text-red-500">{editError}</p>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(b.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold">Save</button>
                      <button onClick={() => { setEditingId(null); setEditError(null); }} className="bg-gray-400 text-white px-3 py-1 rounded-lg text-xs font-bold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="truncate pr-4">
                      <p className="font-bold text-gray-900 truncate text-sm">{b.title}</p>
                      <p className="text-xs text-blue-500 truncate font-medium">{b.url}</p>
                    </div>
                    <button onClick={() => { setEditingId(b.id); setEditTitle(b.title); setEditUrl(b.url); setEditError(null); }} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-yellow-200 transition">
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  )
}