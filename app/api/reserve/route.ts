import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { LISTINGS } from '@/lib/inventory'

/**
 * LOI submission endpoint.
 * Creates a reference ID, records the reservation in Airtable (if configured),
 * and emails confirmations via Resend (if configured). Soft-fails on missing
 * integrations so a reservation is always acknowledged to the buyer.
 */
export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: {
    listingId?: string
    units?: string
    notes?: string
    paymentMethod?: string
    intendedUse?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const listing = LISTINGS.find(l => l.id === body.listingId)
  if (!listing) {
    return NextResponse.json({ error: 'Unknown listing' }, { status: 404 })
  }

  const referenceId = `LOI-${Date.now().toString(36).toUpperCase()}`

  // Buyer details from Clerk
  let buyerEmail = ''
  let companyName = ''
  let legalName = ''
  try {
    const user = await clerkClient().users.getUser(userId)
    buyerEmail = user.primaryEmailAddress?.emailAddress || ''
    const p = user.publicMetadata as Record<string, string> | undefined
    companyName = p?.companyName || ''
    legalName = p?.legalName || ''
  } catch {
    /* non-fatal */
  }

  // ── Record in Airtable ──────────────────────────────────────────
  if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
    try {
      const Airtable = (await import('airtable')).default
      const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
        process.env.AIRTABLE_BASE_ID
      )
      await base('Reservations').create([
        {
          fields: {
            Reference: referenceId,
            Listing: listing.chip,
            Site: listing.site,
            'Listed Rate': listing.price,
            Units: body.units || '',
            'Intended Use': body.intendedUse || '',
            'Payment Method': body.paymentMethod || '',
            Notes: body.notes || '',
            Company: companyName,
            'Buyer Name': legalName,
            'Buyer Email': buyerEmail,
            Status: 'New',
          },
        },
      ])
    } catch (err) {
      console.error('Airtable record failed:', err)
    }
  }

  // ── Email via Resend ────────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const summary = `
        Reference: ${referenceId}
        Listing: ${listing.chip} (${listing.site})
        Listed rate: $${listing.price.toFixed(2)} / ${listing.unit}-hr
        Units: ${body.units || 'n/a'}
        Intended use: ${body.intendedUse || 'n/a'}
        Payment method: ${body.paymentMethod || 'n/a'}
        Notes: ${body.notes || 'n/a'}
        Company: ${companyName}
        Buyer: ${legalName} <${buyerEmail}>
      `.trim()

      // Internal notification
      await resend.emails.send({
        from: 'OneVibe Compute <compute@onevibemg.com>',
        to: 'compute@onevibemg.com',
        subject: `New LOI ${referenceId} — ${listing.chip}`,
        text: summary,
      })

      // Buyer confirmation
      if (buyerEmail) {
        await resend.emails.send({
          from: 'OneVibe Compute <compute@onevibemg.com>',
          to: buyerEmail,
          subject: `We received your LOI (${referenceId})`,
          text: `Thanks${legalName ? ' ' + legalName : ''} — we've held ${listing.chip} at ${listing.site} for 14 days. A OneVibe rep will reach out within one business day.\n\nReference: ${referenceId}`,
        })
      }
    } catch (err) {
      console.error('Resend email failed:', err)
    }
  }

  return NextResponse.json({ ok: true, referenceId })
}
