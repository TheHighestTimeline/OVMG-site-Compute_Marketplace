export type ListingStatus = 'LIVE' | 'PRE-ORDER'

export interface Listing {
  id: string
  chip: string
  site: string
  siteCode: string
  status: ListingStatus
  price: number
  unit: 'GSP' | 'GPU'
  qty: number
  qtyLabel: 'GSPs' | 'GPUs'
  power: string
  powerLabel: 'facility' | 'deployable'
  allocated: number
  specs: { k: string; v: string }[]
  badges: string[]
}

export const LISTINGS: Listing[] = [
  {
    id: 'br-gsp',
    chip: 'Blaize QOS GSP',
    site: 'Baton Rouge, LA',
    siteCode: 'BR',
    status: 'LIVE',
    price: 12.0,
    unit: 'GSP',
    qty: 7_480_512,
    qtyLabel: 'GSPs',
    power: '1,000 MW',
    powerLabel: 'facility',
    allocated: 91,
    specs: [
      { k: 'Chip',       v: 'Blaize BZAI GSP-2000' },
      { k: 'Racks',      v: '9 QOS / 4-pack unit' },
      { k: 'Network',    v: '100GbE backbone' },
      { k: 'Site class', v: 'Tier III, hyperscale' },
    ],
    badges: ['Power Secured', 'Live', 'LOI on order', '3yr fixed'],
  },
  {
    id: 'br-rtx',
    chip: 'RTX Pro 6000 Blackwell',
    site: 'Baton Rouge, LA',
    siteCode: 'BR',
    status: 'LIVE',
    price: 3.18,
    unit: 'GPU',
    qty: 277_056,
    qtyLabel: 'GPUs',
    power: '1,000 MW',
    powerLabel: 'facility',
    allocated: 88,
    specs: [
      { k: 'GPU',        v: 'RTX Pro 6000 Server Ed.' },
      { k: 'VRAM',       v: '96 GB per card' },
      { k: 'Network',    v: '100GbE backbone' },
      { k: 'Site class', v: 'Tier III, hyperscale' },
    ],
    badges: ['Power Secured', 'Live', 'LOI on order', '3yr fixed'],
  },
  {
    id: 'kgb-gsp',
    chip: 'Blaize QOS GSP',
    site: 'Kingsboro',
    siteCode: 'KGB',
    status: 'PRE-ORDER',
    price: 12.0,
    unit: 'GSP',
    qty: 6_731_904,
    qtyLabel: 'GSPs',
    power: '900 MW',
    powerLabel: 'facility',
    allocated: 64,
    specs: [
      { k: 'Chip',     v: 'Blaize BZAI GSP-2000' },
      { k: 'Racks',    v: '9 QOS / 4-pack unit' },
      { k: 'Delivery', v: 'Pre-order — fixed rate' },
      { k: 'Energize', v: 'Q2 2027 target' },
    ],
    badges: ['Power Secured', 'LOI on order', '3yr fixed', 'Pre-sale'],
  },
  {
    id: 'bnv-gsp',
    chip: 'Blaize QOS GSP',
    site: 'Bennetsville',
    siteCode: 'BNV',
    status: 'PRE-ORDER',
    price: 12.0,
    unit: 'GSP',
    qty: 22_439_616,
    qtyLabel: 'GSPs',
    power: '3,000 MW',
    powerLabel: 'facility',
    allocated: 43,
    specs: [
      { k: 'Chip',     v: 'Blaize BZAI GSP-2000' },
      { k: 'Racks',    v: '9 QOS / 4-pack unit' },
      { k: 'Delivery', v: 'Pre-order — fixed rate' },
      { k: 'Energize', v: 'Q4 2027 target' },
    ],
    badges: ['Power Secured', 'LOI on order', '3yr fixed', 'Pre-sale'],
  },
  {
    id: 'dcib-a',
    chip: 'Blaize QOS GSP',
    site: 'DCIB Alpha',
    siteCode: 'DCIB-A',
    status: 'PRE-ORDER',
    price: 12.0,
    unit: 'GSP',
    qty: 1_728,
    qtyLabel: 'GSPs',
    power: '1 MW',
    powerLabel: 'deployable',
    allocated: 78,
    specs: [
      { k: 'Chip',      v: 'Blaize BZAI GSP-2000' },
      { k: 'Form',      v: 'Containerized edge pod' },
      { k: 'Delivery',  v: 'Pre-order — fixed rate' },
      { k: 'Lead time', v: '12 weeks' },
    ],
    badges: ['Power Secured', 'LOI on order', '3yr fixed', 'Pre-sale'],
  },
  {
    id: 'dcib-b',
    chip: 'Blaize QOS GSP',
    site: 'DCIB Beta',
    siteCode: 'DCIB-B',
    status: 'PRE-ORDER',
    price: 12.0,
    unit: 'GSP',
    qty: 1_728,
    qtyLabel: 'GSPs',
    power: '1 MW',
    powerLabel: 'deployable',
    allocated: 55,
    specs: [
      { k: 'Chip',      v: 'Blaize BZAI GSP-2000' },
      { k: 'Form',      v: 'Containerized edge pod' },
      { k: 'Delivery',  v: 'Pre-order — fixed rate' },
      { k: 'Lead time', v: '12 weeks' },
    ],
    badges: ['Power Secured', 'LOI on order', '3yr fixed', 'Pre-sale'],
  },
]

export const CHIP_TYPES = ['Blaize QOS GSP', 'RTX Pro 6000 Blackwell'] as const

export const SITES = [
  { code: 'BR',     name: 'Baton Rouge, LA' },
  { code: 'KGB',    name: 'Kingsboro' },
  { code: 'BNV',    name: 'Bennetsville' },
  { code: 'DCIB-A', name: 'DCIB Alpha' },
  { code: 'DCIB-B', name: 'DCIB Beta' },
] as const

export const fmt = (n: number) => n.toLocaleString('en-US')

export const utilTone = (pct: number) => pct >= 80 ? 'high' : pct >= 40 ? 'mid' : 'low'

export const utilLabel = (pct: number) =>
  pct >= 80 ? 'Filling fast' :
  pct >= 60 ? 'Active demand' :
  pct >= 40 ? 'Open allocation' :
  'Just listed'
