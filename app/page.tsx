'use client'

import { useState, useMemo } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { LISTINGS, CHIP_TYPES, SITES } from '@/lib/inventory'
import type { Listing } from '@/lib/inventory'
import Sidebar from '@/components/Sidebar'
import type { Filters } from '@/components/Sidebar'
import ComputeCard from '@/components/ComputeCard'
import LOIModal from '@/components/LOIModal'

type Sort = 'alloc' | 'power' | 'qty'
type Density = 'comfortable' | 'compact'

const DEFAULT_FILTERS: Filters = { q: '', status: [], chip: [], site: [] }

const Arrow = () => (
  <svg width={12} height={12} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function MarketplacePage() {
  const { isSignedIn, user } = useUser()
  const { signOut, openSignIn } = useClerk()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sort, setSort]       = useState<Sort>('alloc')
  const [density, setDensity] = useState<Density>('comfortable')
  const [active, setActive]   = useState<Listing | null>(null)
  const profile = user?.publicMetadata as { companyName?: string } | undefined

  const filtered = useMemo(() => {
    let list = LISTINGS.slice()
    if (filters.q) {
      const q = filters.q.toLowerCase()
      list = list.filter(l =>
        l.chip.toLowerCase().includes(q) ||
        l.site.toLowerCase().includes(q) ||
        l.siteCode.toLowerCase().includes(q)
      )
    }
    if (filters.status.length) list = list.filter(l => filters.status.includes(l.status))
    if (filters.chip.length)   list = list.filter(l => filters.chip.includes(l.chip))
    if (filters.site.length)   list = list.filter(l => filters.site.includes(l.siteCode))

    if (sort === 'alloc') list.sort((a, b) => b.allocated - a.allocated)
    if (sort === 'power') {
      const mw = (s: string) => parseInt(s.replace(/[^\d]/g, ''), 10)
      list.sort((a, b) => mw(b.power) - mw(a.power))
    }
    if (sort === 'qty') list.sort((a, b) => b.qty - a.qty)
    return list
  }, [filters, sort])

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">OneVibe</span>
            <span className="brand-sep">/</span>
            <span className="brand-product">Compute Marketplace</span>
          </div>
          <nav className="top-nav">
            <a href="#inventory" className="top-link">Inventory</a>
            <a href="#sites" className="top-link">Sites</a>
            <a href="#pricing" className="top-link">Pricing</a>
            <a href="#docs" className="top-link">Specs &amp; docs</a>
            <span className="top-divider" />
            <span className="status-pill">
              <span className="dot dot-live" aria-hidden="true" />
              <span className="pill-full">1 site live · 4 pre-order</span>
              <span className="pill-short">1 live · 4 pre</span>
            </span>
            <a href="mailto:compute@onevibemg.com" className="contact">
              compute@onevibemg.com
            </a>
            <span className="top-divider" />
            {isSignedIn ? (
              <button
                className="nav-user-btn"
                onClick={() => signOut({ redirectUrl: '/' })}
                title="Sign out"
              >
                <svg width={12} height={12} viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <span>{profile?.companyName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Account'}</span>
              </button>
            ) : (
              <button className="nav-sign-in" onClick={() => openSignIn()}>
                Sign in
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="page">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="kicker">Q3 2026 · Public catalog</span>
            <span className="kicker-sep" />
            <span className="kicker-muted">Fixed 3-year rates · LOI on reservation · No payment to reserve</span>
          </div>
          <h1 className="hero-title">
            Reserve <em>frontier</em> compute,<br />
            priced like infrastructure.
          </h1>
          <p className="hero-lede">
            Six listings across five sites.{' '}
            <span className="em">5.9&nbsp;GW</span> of contracted capacity, with{' '}
            <span className="em">1.0&nbsp;GW</span> energized today. Public pricing,
            fixed contracts, and a single page to compare every chip we operate.
          </p>
        </section>

        {/* ── Stats strip ───────────────────────────────────────────── */}
        <section className="stats" aria-label="Portfolio overview">
          <div className="stats-row">
            {[
              { label: 'Portfolio capacity', value: '5.9', unit: 'GW' },
              { label: 'Live now',           value: '1.0', unit: 'GW', live: true },
              { label: 'Live GSPs',          value: '7,480,512' },
              { label: 'Live GPUs',          value: '277,056' },
              { label: 'Sites',              value: '5' },
            ].map(s => (
              <div key={s.label} className={`stat ${s.live ? 'stat-live' : ''}`}>
                <div className="stat-value">
                  {s.value}
                  {s.unit && <span className="stat-unit"> {s.unit}</span>}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
            <div className="stat-spacer" />
            <div className="price-chip">
              <div className="price-chip-name">Blaize QOS GSP</div>
              <div className="price-chip-price">
                <span className="serif-num">$12.00</span>
                <span className="price-chip-unit">/ GSP-hr</span>
              </div>
            </div>
            <div className="price-chip">
              <div className="price-chip-name">RTX Pro 6000 Blackwell</div>
              <div className="price-chip-price">
                <span className="serif-num">$3.18</span>
                <span className="price-chip-unit">/ GPU-hr</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Catalog ───────────────────────────────────────────────── */}
        <section className="catalog" id="inventory">
          <div className="catalog-inner">
            <Sidebar filters={filters} setFilters={setFilters} />

            <div className="grid-wrap">
              {/* Toolbar */}
              <div className="grid-toolbar">
                <div className="result-count">
                  <span className="serif-num">{filtered.length}</span>
                  <span style={{ color: 'var(--text-3)' }}> of {LISTINGS.length} listings</span>
                </div>
                <div className="toolbar-controls">
                  <div className="seg">
                    {(['alloc', 'power', 'qty'] as Sort[]).map(s => (
                      <button
                        key={s}
                        className={sort === s ? 'is-on' : ''}
                        onClick={() => setSort(s)}
                      >
                        {s === 'alloc' ? 'Most allocated' : s === 'power' ? 'Largest power' : 'Most units'}
                      </button>
                    ))}
                  </div>
                  <div className="seg seg-sm" aria-label="Density">
                    <button
                      className={density === 'comfortable' ? 'is-on' : ''}
                      onClick={() => setDensity('comfortable')}
                      title="Comfortable"
                    >
                      <svg width={14} height={14} viewBox="0 0 14 14">
                        <rect x="1.5" y="2" width="11" height="3" rx="1" fill="currentColor" />
                        <rect x="1.5" y="9" width="11" height="3" rx="1" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      className={density === 'compact' ? 'is-on' : ''}
                      onClick={() => setDensity('compact')}
                      title="Compact"
                    >
                      <svg width={14} height={14} viewBox="0 0 14 14">
                        <rect x="1.5" y="1.5" width="11" height="2" rx="1" fill="currentColor" />
                        <rect x="1.5" y="6" width="11" height="2" rx="1" fill="currentColor" />
                        <rect x="1.5" y="10.5" width="11" height="2" rx="1" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card grid */}
              <div className="grid">
                {filtered.map(l => (
                  <ComputeCard key={l.id} listing={l} onReserve={setActive} density={density} />
                ))}
                {filtered.length === 0 && (
                  <div className="empty">
                    <div className="empty-title">No listings match those filters.</div>
                    <div className="empty-body">
                      Reach out — we may have inventory we haven't catalogued yet.
                    </div>
                    <a className="foot-link" href="mailto:compute@onevibemg.com">
                      Email the capacity desk <Arrow />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <footer className="page-foot">
          <div className="foot-grid">
            <div>
              <div className="foot-mark">
                OneVibe <span style={{ color: 'var(--text-3)' }}>/ Compute Marketplace</span>
              </div>
              <div className="foot-fine">
                Operated by OneVibe Mission Group. Sites located in Louisiana, North Carolina,
                and dispersed DCIB edge pods. Tier III equivalent or better. All listings backed
                by LOIs on power and equipment.
              </div>
            </div>
            <div className="foot-col">
              <div className="foot-h">Catalog</div>
              <a href="#inventory">Live inventory</a>
              <a href="#inventory">Pre-order book</a>
              <a href="#inventory">Energize calendar</a>
            </div>
            <div className="foot-col">
              <div className="foot-h">Buyers</div>
              <a href="mailto:compute@onevibemg.com">How LOIs work</a>
              <a href="mailto:compute@onevibemg.com">Master service agreement</a>
              <a href="mailto:compute@onevibemg.com">Capacity desk</a>
            </div>
            <div className="foot-col">
              <div className="foot-h">Contact</div>
              <a href="mailto:compute@onevibemg.com">compute@onevibemg.com</a>
              <div style={{ color: 'var(--text-3)', fontSize: '12.5px' }}>
                Replies within 1 business day.
              </div>
            </div>
          </div>
          <div className="foot-base">
            <span>© 2026 OneVibe Mission Group, LLC</span>
            <span style={{ color: 'var(--text-4)' }}>
              Public listings · No gated walls · No payment to reserve
            </span>
          </div>
        </footer>
      </main>

      {/* ── LOI Modal ─────────────────────────────────────────────── */}
      {active && (
        <LOIModal listing={active} onClose={() => setActive(null)} />
      )}
    </>
  )
}
