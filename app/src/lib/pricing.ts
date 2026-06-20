/**
 * lib/pricing.ts — service/tier → price lookup from dim_pricing.csv (embedded).
 * Sourced from warehouse/dim_pricing.csv at build time.
 */

export interface PricingRow {
  pricingRef: string;
  branch: string;
  serviceLine: string;
  item: string;
  tier: string;
  basePriceDa: number;
  recurringDa: number;
  recurringPeriod: string;
  revenueModel: string;
}

/** Static embed of warehouse/dim_pricing.csv (real data). */
export const PRICING_TABLE: PricingRow[] = [
  { pricingRef:'PR001', branch:'COM', serviceLine:'com_branding', item:'Branding pack', tier:'Basic', basePriceDa:73000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR002', branch:'COM', serviceLine:'com_branding', item:'Branding pack', tier:'Pro', basePriceDa:113000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR003', branch:'COM', serviceLine:'com_branding', item:'Branding pack', tier:'Entreprise', basePriceDa:183000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR004', branch:'COM', serviceLine:'com_digital', item:'Stratégie Marketing (6 mois)', tier:'Standard', basePriceDa:119000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR005', branch:'COM', serviceLine:'com_web_dev', item:'Single-service / Landing site', tier:'Basic', basePriceDa:28000, recurringDa:8000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR006', branch:'COM', serviceLine:'com_web_dev', item:'Single-service / Landing site', tier:'Pro', basePriceDa:35000, recurringDa:10000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR007', branch:'COM', serviceLine:'com_web_dev', item:'Single-service / Landing site', tier:'Enterprise', basePriceDa:42000, recurringDa:14000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR008', branch:'COM', serviceLine:'com_web_dev', item:'Multi-page business site', tier:'Basic', basePriceDa:40000, recurringDa:8000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR009', branch:'COM', serviceLine:'com_web_dev', item:'Multi-page business site', tier:'Pro', basePriceDa:56000, recurringDa:10000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR010', branch:'COM', serviceLine:'com_web_dev', item:'Multi-page business site', tier:'Enterprise', basePriceDa:64000, recurringDa:14000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR011', branch:'COM', serviceLine:'com_web_dev', item:'Corporate website', tier:'Basic', basePriceDa:80000, recurringDa:8000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR012', branch:'COM', serviceLine:'com_web_dev', item:'Corporate website', tier:'Pro', basePriceDa:100000, recurringDa:10000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR013', branch:'COM', serviceLine:'com_web_dev', item:'Corporate website', tier:'Enterprise', basePriceDa:160000, recurringDa:14000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR014', branch:'COM', serviceLine:'com_web_dev', item:'Portfolio site', tier:'Basic', basePriceDa:35000, recurringDa:8000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR015', branch:'COM', serviceLine:'com_web_dev', item:'Portfolio site', tier:'Pro', basePriceDa:47000, recurringDa:10000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR016', branch:'COM', serviceLine:'com_web_dev', item:'Portfolio site', tier:'Enterprise', basePriceDa:100000, recurringDa:14000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR017', branch:'COM', serviceLine:'com_web_dev', item:'E-commerce store', tier:'Basic', basePriceDa:120000, recurringDa:8000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR018', branch:'COM', serviceLine:'com_web_dev', item:'E-commerce store', tier:'Pro', basePriceDa:160000, recurringDa:10000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR019', branch:'COM', serviceLine:'com_web_dev', item:'E-commerce store', tier:'Enterprise', basePriceDa:190000, recurringDa:14000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR020', branch:'COM', serviceLine:'com_web_dev', item:'Mobile app (appointment)', tier:'Basic', basePriceDa:200000, recurringDa:25000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR021', branch:'COM', serviceLine:'com_web_dev', item:'Mobile app (appointment)', tier:'Pro', basePriceDa:280000, recurringDa:25000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR022', branch:'COM', serviceLine:'com_web_dev', item:'Mobile app (appointment)', tier:'Enterprise', basePriceDa:320000, recurringDa:25000, recurringPeriod:'yearly', revenueModel:'one_time' },
  { pricingRef:'PR023', branch:'COM', serviceLine:'com_web_dev', item:'Maintenance plan', tier:'Basic', basePriceDa:0, recurringDa:30000, recurringPeriod:'yearly', revenueModel:'recurring_monthly' },
  { pricingRef:'PR024', branch:'COM', serviceLine:'com_web_dev', item:'Maintenance plan', tier:'Standard', basePriceDa:0, recurringDa:60000, recurringPeriod:'yearly', revenueModel:'recurring_monthly' },
  { pricingRef:'PR025', branch:'COM', serviceLine:'com_web_dev', item:'Maintenance plan', tier:'Premium', basePriceDa:0, recurringDa:120000, recurringPeriod:'yearly', revenueModel:'recurring_monthly' },
  { pricingRef:'PR026', branch:'COM', serviceLine:'com_web_dev', item:'Custom solution', tier:'Basic', basePriceDa:300000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR027', branch:'COM', serviceLine:'com_web_dev', item:'Custom solution', tier:'Pro', basePriceDa:400000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR028', branch:'COM', serviceLine:'com_web_dev', item:'Custom solution', tier:'Enterprise', basePriceDa:600000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR029', branch:'CONSULTING', serviceLine:'consulting_package', item:'Technical consulting', tier:'Quick review', basePriceDa:10000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR030', branch:'CONSULTING', serviceLine:'consulting_package', item:'Technical consulting', tier:'Half-day', basePriceDa:25000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR031', branch:'CONSULTING', serviceLine:'consulting_package', item:'Technical consulting', tier:'Full-day', basePriceDa:45000, recurringDa:0, recurringPeriod:'', revenueModel:'one_time' },
  { pricingRef:'PR032', branch:'CONSULTING', serviceLine:'consulting_hourly', item:'Consulting (horaire)', tier:'Junior', basePriceDa:3000, recurringDa:0, recurringPeriod:'', revenueModel:'service_fee' },
  { pricingRef:'PR033', branch:'CONSULTING', serviceLine:'consulting_hourly', item:'Consulting (horaire)', tier:'Senior', basePriceDa:5000, recurringDa:0, recurringPeriod:'', revenueModel:'service_fee' },
  { pricingRef:'PR034', branch:'CONSULTING', serviceLine:'consulting_hourly', item:'Consulting (horaire)', tier:'Expert', basePriceDa:8000, recurringDa:0, recurringPeriod:'', revenueModel:'service_fee' },
  { pricingRef:'PR035', branch:'COMPTA', serviceLine:'rentabilite_commission', item:'Rentabilité commission', tier:'Standard', basePriceDa:0, recurringDa:0, recurringPeriod:'', revenueModel:'commission' },
  { pricingRef:'PR036', branch:'COMPTA', serviceLine:'compta_admin', item:'Admin comptable', tier:'Mensuel', basePriceDa:15000, recurringDa:15000, recurringPeriod:'monthly', revenueModel:'subscription' },
  { pricingRef:'PR037', branch:'FORMATION', serviceLine:'academy', item:'Formation présentielle', tier:'Standard', basePriceDa:25000, recurringDa:0, recurringPeriod:'', revenueModel:'service_fee' },
  { pricingRef:'PR038', branch:'FORMATION', serviceLine:'academy', item:'Formation en ligne', tier:'Standard', basePriceDa:12000, recurringDa:0, recurringPeriod:'', revenueModel:'service_fee' },
  { pricingRef:'PR039', branch:'IDARATI', serviceLine:'idarati_admin', item:'Admin Idarati', tier:'Mensuel', basePriceDa:20000, recurringDa:20000, recurringPeriod:'monthly', revenueModel:'subscription' },
];

/** Lookup pricing rows for a service line (all tiers). */
export function getPricingForService(serviceLine: string): PricingRow[] {
  return PRICING_TABLE.filter((r) => r.serviceLine === serviceLine);
}

/** Lookup a single pricing row by ref. */
export function getPricingByRef(ref: string): PricingRow | undefined {
  return PRICING_TABLE.find((r) => r.pricingRef === ref);
}

/** Get suggested price for a service line + tier (or lowest tier). */
export function suggestPrice(serviceLine: string, tier?: string): number {
  const rows = getPricingForService(serviceLine);
  if (!rows.length) return 0;
  const match = tier ? rows.find((r) => r.tier.toLowerCase() === tier.toLowerCase()) : rows[0];
  return (match ?? rows[0]).basePriceDa;
}
