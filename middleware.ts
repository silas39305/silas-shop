import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_ADMIN, tokenValide } from '@/lib/admin-token'

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next()
  if (await tokenValide(req.cookies.get(COOKIE_ADMIN)?.value)) return NextResponse.next()
  return NextResponse.redirect(new URL('/admin/login', req.url))
}

export const config = { matcher: ['/admin/:path*'] }
