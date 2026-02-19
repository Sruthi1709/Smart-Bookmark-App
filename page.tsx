"use client"
import { createClient } from '@/utils/supabase/client'
export default function LoginPage() {
  // This function will only run on the client
  const signInWithGoogle = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
    if (error) {
      console.error('Error signing in:', error)
    } else if (data?.url) {
      window.location.href = data.url
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <button
          className="mt-8 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={signInWithGoogle}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}