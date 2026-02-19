import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirect URL, otherwise use home page
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ✅ Use "origin" to ensure it redirects to the Vercel link, not localhost
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's an error, send them back to the login/home page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
