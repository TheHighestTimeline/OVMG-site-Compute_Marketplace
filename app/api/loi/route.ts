import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

/**
 * Lightweight LOI status endpoint (protected by middleware).
 * The primary submission path is /api/reserve; this exists for compatibility
 * and to expose a simple authenticated health check for the LOI flow.
 */
export async function GET() {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, userId })
}
