'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import type { Listing } from '@/lib/inventory'
import { fmt } from '@/lib/inventory'

interface Props {
  listing: Listing
  onClose: () => void
}

type Step = 'auth_wall' | 'onboard_wall' | 'form' | 'checkout' | 'review_pending' | 'submitted'

const DEPOSIT_PCT  = 0.10
const MIN_DEPOSIT  = 5_000
const MAX_DEPOSIT  = 100_000
const HOURS_PER_MO = 24 * 30

const Arrow = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function LOIModal({ listing, onClose }: Props) {
  const { isSignedIn, user, isLoaded } = useUser()
  const { openSignUp, openSignIn } = useClerk()

  const profile = user?.publicMetadata as {
    onboarded?: boolean
    legalName?: string
    title?: string
    companyName?: string
    companyState?: string
    companyAddress?: string
    companyCity?: string
    companyZip?: string
  } | undefined

  // Determine initial step based on auth state
  const getInitialStep = (): Step => {
    if (!isLoaded) return 'form' // loading — will update
    if (!isSignedIn) return 'auth_wall'
    if (!profile?.onboarded) return 'onboard_wall'
    return 'form'
  }

  const [step, setStep] = useState<Step>(getInitialStep)
  const [units, setUnits] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Wire transfer')
  const [intendedUse, setIntendedUse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [refId, setRefId] = useState('')
  const firstRef = useRef<HTMLInputElement>(null)
  const isLive = listing.status === 'LIVE'

  // Re-evaluate auth step when user loads
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setStep('auth_wall'); return }
    if (!profile?.onboarded) { setStep('onboard_wall'); return }
    if (step === 'auth_wall' || step === 'onboard_wall') setStep('form')
  }, [isLoaded, isSignedIn, profile?.onboarded])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => firstRef.current?.focus(), 60)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t) }
  }, [onClose])

  const numUnits = parseInt(units.replace(/,/g, ''), 10) || 1
  const isLargeReservation = numUnits > 500

  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          units,
          notes,
          paymentMethod,
          intendedUse,
        }),
      })
      const data = await res.json()
      const id = data.referenceId || `LOI-${Date.now().toString().slice(-6)}`
      setRefId(id)
      // Large reservations go to manual review; others go to deposit checkout
      setStep(isLargeReservation ? 'review_pending' : 'submitted')
    } catch {
      const id = `LOI-${Date.now().toString().slice(-6)}`
      setRefId(id)
      setStep(isLargeReservation ? 'review_pending' : 'submitted')
    } finally {
      setSubmitting(false)
    }
  }

  const payDeposit = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, units, refId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned', data)
        setCheckoutLoading(false)
      }
    } catch (err) {
      console.error('payDeposit error:', err)
      setCheckoutLoading(false)
    }
  }

  // Compute deposit amount for display
  const depositAmt = (() => {
    const firstMonth = numUnits * listing.price * HOURS_PER_MO
    const raw = firstMonth * DEPOSIT_PCT
    return Math.max(MIN_DEPOSIT, Math.min(MAX_DEPOSIT, raw))
  })()

  const holdExpires = new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  // ── Helpers ──────────────────────────────────────────────────────────────
  const buyerAddress = [
    profile?.companyAddress,
    profile?.companyCity,
    profile?.companyState,
    profile?.companyZip,
  ].filter(Boolean).join(', ')

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {/* ── Auth wall ─────────────────────────────────────────────── */}
        {step === 'auth_wall' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--bg-elev)', border: '1px solid var(--border-strong)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="modal-title" style={{ marginBottom: 10 }}>
              Sign in to {isLive ? 'reserve' : 'pre-order'}
            </h2>
            <p className="modal-lede" style={{ maxWidth: '38ch', margin: '0 auto 28px' }}>
              A verified business account is required to submit an LOI for{' '}
              <em>{listing.chip}</em> at {listing.site}.
              Business email only — personal addresses are not accepted.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="cta cta-live"
                onClick={() => openSignUp({ afterSignUpUrl: window.location.href })}
              >
                Create account <Arrow />
              </button>
              <button
                className="btn-ghost"
                onClick={() => openSignIn({ afterSignInUrl: window.location.href })}
              >
                Sign in
              </button>
            </div>
            <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-4)' }}>
              No credit card required. No payment to reserve.
            </p>
          </div>
        )}

        {/* ── Onboarding wall ───────────────────────────────────────── */}
        {step === 'onboard_wall' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--live-soft)', border: '1px solid var(--live-edge)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h2 className="modal-title" style={{ marginBottom: 10 }}>
              Verify your business
            </h2>
            <p className="modal-lede" style={{ maxWidth: '40ch', margin: '0 auto 28px' }}>
              Complete your company profile — legal name, address, and EIN — before
              your LOI can be generated. Takes about 2 minutes.
            </p>
            <button
              className="cta cta-live"
              onClick={() => window.location.href = '/onboarding'}
            >
              Complete verification <Arrow />
            </button>
          </div>
        )}

        {/* ── LOI Form ──────────────────────────────────────────────── */}
        {step === 'form' && (
          <>
            <div className="modal-eyebrow">
              <span className={`status-tag ${isLive ? 'live' : 'preorder'}`}>
                <span className={`dot dot-${isLive ? 'live' : 'preorder'}`} aria-hidden="true" />
                <span>{isLive ? 'Live · ready to allocate' : 'Pre-order · LOI binding'}</span>
              </span>
              <span className="modal-site">{listing.siteCode} · {listing.site}</span>
            </div>

            <h2 className="modal-title">
              {isLive ? 'Reserve' : 'Pre-order'} <em>{listing.chip}</em>
            </h2>

            <p className="modal-lede" style={{ marginBottom: 16 }}>
              Submitting as{' '}
              <span className="em">{profile?.legalName}</span>
              {' '}·{' '}
              <span style={{ color: 'var(--text-3)' }}>{profile?.companyName}</span>
            </p>

            {/* Company block preview */}
            <div style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6,
            }}>
              <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{profile?.companyName}</span>
              {profile?.companyState && `, a ${profile.companyState} corporation`}
              {buyerAddress && ` · ${buyerAddress}`}
            </div>

            <form className="form" onSubmit={submit}>
              <label className="field">
                <span>Intended use <span className="opt">(optional)</span></span>
                <input
                  ref={firstRef}
                  value={intendedUse}
                  onChange={e => setIntendedUse(e.target.value)}
                  placeholder="e.g. AI model training, inference, cloud computing"
                />
              </label>

              <div className="form-row">
                <label className="field">
                  <span>Approximate {listing.unit} count <span className="opt">(optional)</span></span>
                  <input
                    value={units}
                    onChange={e => setUnits(e.target.value)}
                    placeholder={`e.g. ${fmt(Math.round(listing.qty * 0.05))}`}
                  />
                </label>
                <label className="field">
                  <span>Payment method <span className="opt">(subject to agreement)</span></span>
                  <input
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    placeholder="Wire transfer"
                  />
                </label>
              </div>

              <label className="field">
                <span>Workload notes <span className="opt">(optional)</span></span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Training run profile, networking needs, target energize date…"
                />
              </label>

              {isLargeReservation && (
                <div style={{
                  background: 'oklch(0.82 0.14 75 / 0.08)',
                  border: '1px solid oklch(0.82 0.14 75 / 0.3)',
                  borderRadius: 8, padding: '10px 14px',
                  fontSize: 12.5, color: 'oklch(0.82 0.14 75)',
                  lineHeight: 1.5,
                }}>
                  <strong>Large reservation</strong> — reservations over 500 units require
                  a brief manual review (typically same business day) before your LOI is finalized.
                </div>
              )}

              <div className="form-foot">
                <div className="form-fine">
                  By submitting, you confirm intent to contract at the listed rate.
                  Capacity is held for 14 days pending paperwork. No payment required.
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                  <button
                    type="submit"
                    className={`cta ${isLive ? 'cta-live' : 'cta-preorder'}`}
                    disabled={submitting}
                  >
                    <span>{submitting ? 'Sending…' : 'Submit LOI'}</span>
                    {!submitting && <Arrow />}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {/* ── Pending manual review ─────────────────────────────────── */}
        {step === 'review_pending' && (
          <div>
            <div className="check" style={{ background: 'oklch(0.82 0.14 75 / 0.12)', color: 'oklch(0.82 0.14 75)', border: '1px solid oklch(0.82 0.14 75 / 0.3)' }}>
              <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                <path d="M11 6v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="modal-title">Under review.</h2>
            <p className="modal-lede">
              Your reservation of <em>{listing.chip}</em> at{' '}
              <span className="em">{listing.site}</span> is in our queue for manual review — large
              reservations require a brief capacity confirmation, typically same business day.
              We'll email <span className="em">{user?.primaryEmailAddress?.emailAddress}</span> once approved.
            </p>
            <div className="receipt">
              <div className="receipt-row">
                <span>Reference</span>
                <span className="serif-num">{refId}</span>
              </div>
              <div className="receipt-row">
                <span>Status</span>
                <span style={{ color: 'oklch(0.82 0.14 75)' }}>Pending review</span>
              </div>
              <div className="receipt-row">
                <span>Expected</span>
                <span>Same business day</span>
              </div>
            </div>
            <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="cta cta-preorder" onClick={onClose}>
                <span>Back to marketplace</span>
                <Arrow />
              </button>
            </div>
          </div>
        )}

        {/* ── Checkout (deposit) ────────────────────────────────────── */}
        {step === 'checkout' && (
          <div>
            <div className="check" style={{ background: 'var(--live-soft)', borderColor: 'var(--live-edge)' }}>
              <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" stroke="var(--live)" strokeWidth="1.5" opacity="0.4" />
                <path d="m6 11.5 3.5 3L16 8" stroke="var(--live)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="modal-title">LOI submitted.</h2>
            <p className="modal-lede" style={{ marginBottom: 20 }}>
              Your LOI for <em>{listing.chip}</em> at{' '}
              <span className="em">{listing.site}</span> is on file.
              Secure your allocation now with an ACH deposit — 0.8%, capped at $5.
            </p>

            {/* Deposit summary */}
            <div style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '14px 16px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Ref</span>
                <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)' }}>{refId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Deposit (10% of first month)</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                  ${depositAmt.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Processing fee (ACH)</span>
                <span style={{ fontSize: 13, color: 'var(--live)' }}>≤ $5.00</span>
              </div>
            </div>

            <div className="form-actions" style={{ flexDirection: 'column', gap: 10 }}>
              <button
                className="cta cta-live"
                style={{ width: '100%', justifyContent: 'center', opacity: checkoutLoading ? 0.6 : 1 }}
                onClick={payDeposit}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Redirecting to Stripe…' : <>Pay deposit via ACH <Arrow /></>}
              </button>
              <button
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setStep('submitted')}
              >
                Skip — I'll pay by wire transfer
              </button>
            </div>

            <p style={{ marginTop: 14, fontSize: 12, color: 'var(--text-4)', textAlign: 'center' }}>
              ACH via Stripe. Bank details collected securely — deposit applied toward contract value.
            </p>
          </div>
        )}

        {/* ── Submitted ─────────────────────────────────────────────── */}
        {step === 'submitted' && (
          <div>
            <div className="check">
              <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                <path d="m6 11.5 3.5 3L16 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="modal-title">LOI received.</h2>
            <p className="modal-lede">
              We've held <em>{listing.chip}</em> at{' '}
              <span className="em">{listing.site}</span> for {profile?.companyName} for 14 days.
              A OneVibe rep will reach out to <span className="em">{user?.primaryEmailAddress?.emailAddress}</span> within one business day.
            </p>
            <div style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '11px 14px', marginBottom: 16,
              fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6,
            }}>
              💳 Our payment portal is on the way — in the meantime we'll handle payment
              directly via wire or ACH when we reach out.
            </div>
            <div className="receipt">
              <div className="receipt-row">
                <span>Reference</span>
                <span className="serif-num">{refId}</span>
              </div>
              <div className="receipt-row">
                <span>Listed rate</span>
                <span>${listing.price.toFixed(2)} / {listing.unit}-hr</span>
              </div>
              <div className="receipt-row">
                <span>Hold expires</span>
                <span>{holdExpires}</span>
              </div>
            </div>
            <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="cta cta-live" onClick={onClose}>
                <span>Back to marketplace</span>
                <Arrow />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
