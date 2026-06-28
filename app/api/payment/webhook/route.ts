import { NextResponse } from 'next/server'

/**
 * Stripe webhook handler.
 * Verifies the signature and reacts to checkout.session.completed to mark the
 * deposit as paid. Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: Record<string, string> }
      const ref = session.metadata?.refId
      console.log(`Deposit paid for reservation ${ref}`)
      // TODO: mark the Airtable reservation as "Deposit paid" here.
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
}
