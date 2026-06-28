import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { LISTINGS } from '@/lib/inventory'

const DEPOSIT_PCT = 0.1
const MIN_DEPOSIT = 5_000
const MAX_DEPOSIT = 100_000
const HOURS_PER_MO = 24 * 30

/**
 * Creates a Stripe Checkout session for the reservation deposit (ACH).
 * Returns { url } for the client to redirect to.
 */
export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Payments are not configured.' },
      { status: 503 }
    )
  }

  let body: { listingId?: string; units?: string; refId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const listing = LISTINGS.find(l => l.id === body.listingId)
  if (!listing) {
    return NextResponse.json({ error: 'Unknown listing' }, { status: 404 })
  }

  const numUnits = parseInt((body.units || '').replace(/,/g, ''), 10) || 1
  const firstMonth = numUnits * listing.price * HOURS_PER_MO
  const depositAmt = Math.max(
    MIN_DEPOSIT,
    Math.min(MAX_DEPOSIT, firstMonth * DEPOSIT_PCT)
  )

  const origin =
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['us_bank_account'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(depositAmt * 100),
            product_data: {
              name: `Reservation deposit — ${listing.chip} (${listing.site})`,
              description: `Ref ${body.refId || ''} · applied toward contract value`,
            },
          },
        },
      ],
      metadata: {
        listingId: listing.id,
        units: body.units || '',
        refId: body.refId || '',
        userId,
      },
      success_url: `${origin}/?deposit=success&ref=${encodeURIComponent(body.refId || '')}`,
      cancel_url: `${origin}/?deposit=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Could not create checkout session.' }, { status: 500 })
  }
}
