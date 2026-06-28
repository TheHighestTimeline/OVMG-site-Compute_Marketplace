import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

/**
 * Business verification endpoint.
 * Collects the company profile, optionally checks the EIN against Middesk,
 * and writes the verified profile into the user's Clerk publicMetadata so the
 * marketplace knows the account is onboarded.
 */
export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    legalName, title, companyName, companyState,
    companyAddress, companyCity, companyZip, ein,
  } = body

  if (!legalName || !companyName || !ein) {
    return NextResponse.json(
      { error: 'Legal name, company name, and EIN are required.' },
      { status: 400 }
    )
  }

  // Optional Middesk EIN verification (skipped if no key configured)
  let verified = false
  if (process.env.MIDDESK_API_KEY) {
    try {
      const mdRes = await fetch('https://api.middesk.com/v1/businesses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MIDDESK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
          tin: { tin: ein.replace(/[^0-9]/g, '') },
          addresses: companyAddress
            ? [{
                address_line1: companyAddress,
                city: companyCity,
                state: companyState,
                postal_code: companyZip,
              }]
            : undefined,
        }),
      })
      verified = mdRes.ok
    } catch {
      // Soft-fail verification; still onboard so the buyer is not blocked.
      verified = false
    }
  }

  try {
    await clerkClient().users.updateUser(userId, {
      publicMetadata: {
        onboarded: true,
        verified,
        legalName,
        title,
        companyName,
        companyState,
        companyAddress,
        companyCity,
        companyZip,
      },
    })
  } catch (err) {
    console.error('Failed to update Clerk metadata:', err)
    return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, verified })
}
