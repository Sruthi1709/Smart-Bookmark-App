import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AddBookmark from './components/AddBookmark'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // In your page.tsx
return (
  <div className="min-h-screen bg-red-200 flex items-center justify-center py-10">
    <div className="max-w-2xl w-full mx-auto px-4">
      {/* ADD: h-[80vh] and flex flex-col to fix the card size */}
      <div className="bg-white rounded-xl shadow-lg p-8 h-[70vh] flex flex-col">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">My Bookmarks</h1>
        <AddBookmark initialBookmarks={bookmarks || []} />
      </div>
    </div>
  </div>
)
}
