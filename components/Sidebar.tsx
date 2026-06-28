'use client'

import { CHIP_TYPES, SITES, LISTINGS } from '@/lib/inventory'

export interface Filters {
  q: string
  status: string[]
  chip: string[]
  site: string[]
}

interface Props {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
}

const Arrow = () => (
  <svg width={12} height={12} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Static full-catalog counts
const counts = (() => {
  const c: { status: Record<string, number>; chip: Record<string, number>; site: Record<string, number> } =
    { status: {}, chip: {}, site: {} }
  LISTINGS.forEach(l => {
    c.status[l.status] = (c.status[l.status] || 0) + 1
    c.chip[l.chip]     = (c.chip[l.chip] || 0) + 1
    c.site[l.siteCode] = (c.site[l.siteCode] || 0) + 1
  })
  return c
})()

export default function Sidebar({ filters, setFilters }: Props) {
  const toggle = (key: keyof Omit<Filters, 'q'>, value: string) => {
    setFilters(f => {
      const cur = new Set(f[key])
      cur.has(value) ? cur.delete(value) : cur.add(value)
      return { ...f, [key]: Array.from(cur) }
    })
  }
  const clearAll = () => setFilters({ q: '', status: [], chip: [], site: [] })

  const activeCount =
    filters.status.length + filters.chip.length + filters.site.length + (filters.q ? 1 : 0)

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <span className="side-label">Filters</span>
        {activeCount > 0 && (
          <button className="clear-btn" onClick={clearAll}>Clear · {activeCount}</button>
        )}
      </div>

      {/* Search */}
      <div className="search-wrap">
        <svg width={14} height={14} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          placeholder="Search chips, sites…"
          className="search-input"
        />
      </div>

      {/* Status */}
      <div className="filter-group">
        <div className="filter-title">Status</div>
        <div className="filter-list">
          {[
            { id: 'LIVE',      label: 'Live',      tone: 'live' },
            { id: 'PRE-ORDER', label: 'Pre-order', tone: 'preorder' },
          ].map(s => (
            <button
              key={s.id}
              className={`filter-row ${filters.status.includes(s.id) ? 'is-active' : ''}`}
              onClick={() => toggle('status', s.id)}
            >
              <span className="filter-row-left">
                <span className={`dot dot-${s.tone}`} aria-hidden="true" />
                <span>{s.label}</span>
              </span>
              <span className="filter-count">{counts.status[s.id] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chip type */}
      <div className="filter-group">
        <div className="filter-title">Chip type</div>
        <div className="filter-list">
          {CHIP_TYPES.map(c => (
            <button
              key={c}
              className={`filter-row ${filters.chip.includes(c) ? 'is-active' : ''}`}
              onClick={() => toggle('chip', c)}
            >
              <span className="filter-row-left">
                <span className="chip-glyph">{c.startsWith('Blaize') ? 'QOS' : 'RTX'}</span>
                <span>{c}</span>
              </span>
              <span className="filter-count">{counts.chip[c] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Site */}
      <div className="filter-group">
        <div className="filter-title">Site</div>
        <div className="filter-list">
          {SITES.map(s => (
            <button
              key={s.code}
              className={`filter-row ${filters.site.includes(s.code) ? 'is-active' : ''}`}
              onClick={() => toggle('site', s.code)}
            >
              <span className="filter-row-left">
                <span className="site-code">{s.code}</span>
                <span>{s.name}</span>
              </span>
              <span className="filter-count">{counts.site[s.code] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="sidebar-foot">
        <div className="foot-title">Need a custom block?</div>
        <div className="foot-body">
          Multi-site allocations &gt; 10 MW route through capital markets. Direct line, no portal.
        </div>
        <a href="mailto:compute@onevibemg.com" className="foot-link">
          Talk to capacity desk <Arrow />
        </a>
      </div>
    </aside>
  )
}
