'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const Arrow = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function OnboardingPage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()

  const [legalName, setLegalName] = useState('')
  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyState, setCompanyState] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyCity, setCompanyCity] = useState('')
  const [companyZip, setCompanyZip] = useState('')
  const [ein, setEin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Redirect unauthenticated users to sign in
  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/sign-in')
  }, [isLoaded, isSignedIn, router])

  // Prefill from existing metadata
  useEffect(() => {
    if (!user) return
    const p = user.publicMetadata as Record<string, string> | undefined
    if (!p) return
    setLegalName(p.legalName || '')
    setTitle(p.title || '')
    setCompanyName(p.companyName || '')
    setCompanyState(p.companyState || '')
    setCompanyAddress(p.companyAddress || '')
    setCompanyCity(p.companyCity || '')
    setCompanyZip(p.companyZip || '')
  }, [user])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/verify-ein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName, title, companyName, companyState,
          companyAddress, companyCity, companyZip, ein,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Verification failed. Please check your details.')
        setSubmitting(false)
        return
      }
      // Reload so Clerk picks up updated publicMetadata, then return home
      window.location.href = '/'
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <main className="onb-wrap">
        <p style={{ color: 'var(--text-3)' }}>Loading…</p>
      </main>
    )
  }

  return (
    <main className="onb-wrap">
      <div className="onb-card">
        <div className="onb-head">
          <span className="brand-mark">OneVibe</span>
          <span className="brand-sep">/</span>
          <span className="brand-product">Business verification</span>
        </div>

        <h1 className="onb-title">Verify your business</h1>
        <p className="onb-lede">
          Complete your company profile before submitting an LOI. This information appears
          on your letter of intent and master service agreement.
        </p>

        <form className="form" onSubmit={submit}>
          <div className="form-row">
            <label className="field">
              <span>Your legal name</span>
              <input value={legalName} onChange={e => setLegalName(e.target.value)} required placeholder="Jane A. Doe" />
            </label>
            <label className="field">
              <span>Title</span>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="VP, Infrastructure" />
            </label>
          </div>

          <label className="field">
            <span>Company legal name</span>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Acme AI, Inc." />
          </label>

          <div className="form-row">
            <label className="field">
              <span>State of incorporation</span>
              <input value={companyState} onChange={e => setCompanyState(e.target.value)} placeholder="Delaware" />
            </label>
            <label className="field">
              <span>EIN</span>
              <input value={ein} onChange={e => setEin(e.target.value)} required placeholder="12-3456789" />
            </label>
          </div>

          <label className="field">
            <span>Business address</span>
            <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="500 Market St, Suite 400" />
          </label>

          <div className="form-row">
            <label className="field">
              <span>City</span>
              <input value={companyCity} onChange={e => setCompanyCity(e.target.value)} placeholder="San Francisco" />
            </label>
            <label className="field">
              <span>ZIP</span>
              <input value={companyZip} onChange={e => setCompanyZip(e.target.value)} placeholder="94105" />
            </label>
          </div>

          {error && (
            <div style={{
              background: 'oklch(0.72 0.17 28 / 0.08)',
              border: '1px solid oklch(0.72 0.17 28 / 0.3)',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 12.5, color: 'oklch(0.72 0.17 28)',
            }}>
              {error}
            </div>
          )}

          <div className="form-foot">
            <div className="form-fine">
              We verify your EIN against public business records. No documents required to start.
            </div>
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => router.push('/')}>Cancel</button>
              <button type="submit" className="cta cta-live" disabled={submitting}>
                <span>{submitting ? 'Verifying…' : 'Complete verification'}</span>
                {!submitting && <Arrow />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
