'use client'

import type { Listing } from '@/lib/inventory'
import { fmt, utilTone, utilLabel } from '@/lib/inventory'

interface Props {
  listing: Listing
  onReserve: (l: Listing) => void
  density: 'comfortable' | 'compact'
}

const Arrow = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function ComputeCard({ listing, onReserve, density }: Props) {
  const tone = utilTone(listing.allocated)
  const isLive = listing.status === 'LIVE'

  return (
    <article className={`card density-${density}`}>
      {/* Head */}
      <header className="card-head">
        <div className="card-head-left">
          <span className={`status-tag ${isLive ? 'live' : 'preorder'}`}>
            <span className={`dot dot-${isLive ? 'live' : 'preorder'}`} aria-hidden="true" />
            <span>{isLive ? 'Live' : 'Pre-order'}</span>
          </span>
          <span className="site-tag">{listing.siteCode}</span>
        </div>
        <span className="card-id">#{listing.id.toUpperCase()}</span>
      </header>

      {/* Title */}
      <div className="card-title-row">
        <h3 className="card-title">{listing.chip}</h3>
        <div className="card-sub">
          <span>{listing.site}</span>
          <span className="dot-sep">·</span>
          <span>{listing.power} {listing.powerLabel}</span>
        </div>
      </div>

      {/* Specs */}
      <dl className="specs">
        {listing.specs.map(s => (
          <div key={s.k} className="spec-row">
            <dt>{s.k}</dt>
            <dd>{s.v}</dd>
          </div>
        ))}
        <div className="spec-row spec-row-highlight">
          <dt>{listing.qtyLabel}</dt>
          <dd>{fmt(listing.qty)} <span className="spec-muted">total</span></dd>
        </div>
      </dl>

      {/* Utilization */}
      <div className={`util util-${tone}`}>
        <div className="util-head">
          <span className="util-label">{utilLabel(listing.allocated)}</span>
          <span className="util-pct">
            <span className="serif-num">{listing.allocated}%</span> allocated
          </span>
        </div>
        <div className="util-track">
          <div className="util-fill" style={{ width: `${listing.allocated}%` }} />
        </div>
        <div className="util-foot">{100 - listing.allocated}% remaining</div>
      </div>

      {/* Badges */}
      <div className="badges">
        {listing.badges.map(b => (
          <span key={b} className="badge">{b}</span>
        ))}
      </div>

      {/* Footer */}
      <footer className="card-foot">
        <div className="price-block">
          <div className="price-main">
            <span className="serif-num price-num">${listing.price.toFixed(2)}</span>
            <span className="price-unit">/ {listing.unit}-hr</span>
          </div>
          <div className="price-fine">Fixed-rate 3-year · Billed monthly · No setup fee</div>
        </div>
        <button
          className={`cta ${isLive ? 'cta-live' : 'cta-preorder'}`}
          onClick={() => onReserve(listing)}
        >
          <span>{isLive ? 'Buy Now' : 'Pre-order'}</span>
          <Arrow />
        </button>
      </footer>
    </article>
  )
}
