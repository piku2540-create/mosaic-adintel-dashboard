import { Card, CardContent } from '@/components/ui/Card';
import { BrandSelector } from '@/components/BrandSelector';
import { AD_CREATIVE_TYPES, AD_TYPE_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';

const MOSAIC_BRAND_CATEGORIES = ['All', 'Man Matters', 'BeBodywise', 'Little Joys'] as const;
export type MosaicBrandCategory = (typeof MOSAIC_BRAND_CATEGORIES)[number];

export interface FilterState {
  brands: string[];
  adTypes: string[];
  messageThemes: string[];
  adTypeFilter: string[];
  dateFrom: string;
  dateTo: string;
  mosaicBrandCategory: MosaicBrandCategory;
}

interface FiltersBarProps {
  availableBrands: string[];
  availableMessageThemes: string[];
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  className?: string;
}

export function FiltersBar({
  availableBrands,
  availableMessageThemes,
  filters,
  onFiltersChange,
  className,
}: FiltersBarProps) {
  const setMosaicBrandCategory = (mosaicBrandCategory: MosaicBrandCategory) => {
    onFiltersChange({
      ...filters,
      mosaicBrandCategory,
      brands: [],
      messageThemes: [],
    });
  };

  const setBrands = (brands: string[]) => onFiltersChange({ ...filters, brands });
  const setAdTypes = (adTypes: string[]) => onFiltersChange({ ...filters, adTypes });
  const setMessageThemes = (messageThemes: string[]) => onFiltersChange({ ...filters, messageThemes });
  const setAdTypeFilter = (adTypeFilter: string[]) => onFiltersChange({ ...filters, adTypeFilter });
  const setDateFrom = (dateFrom: string) => onFiltersChange({ ...filters, dateFrom });
  const setDateTo = (dateTo: string) => onFiltersChange({ ...filters, dateTo });

  return (
    <Card
      className={cn(
        'relative z-50 rounded-2xl border border-emerald-100 bg-white/70 backdrop-blur-lg shadow-md',
        className
      )}
    >
      <CardContent className="flex flex-wrap items-end gap-5 py-5">
        <div className="w-full min-w-[160px] sm:w-44">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Mosaic brand</label>
          <select
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            value={filters.mosaicBrandCategory}
            onChange={(e) => setMosaicBrandCategory(e.target.value as MosaicBrandCategory)}
          >
            {MOSAIC_BRAND_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full min-w-[200px] sm:w-56">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Brands</label>
          <BrandSelector
            brands={availableBrands}
            selected={filters.brands}
            onSelectionChange={setBrands}
            maxSelect={10}
          />
        </div>
        <div className="w-full min-w-[140px] sm:w-36">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Ad format</label>
          <select
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            value={filters.adTypes[0] ?? ''}
            onChange={(e) => setAdTypes(e.target.value ? [e.target.value] : [])}
          >
            <option value="">All</option>
            {AD_CREATIVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full min-w-[140px] sm:w-36">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Ad type</label>
          <select
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            value={filters.adTypeFilter[0] ?? ''}
            onChange={(e) => setAdTypeFilter(e.target.value ? [e.target.value] : [])}
          >
            <option value="">All</option>
            {AD_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full min-w-[180px] sm:w-48">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Message theme</label>
          <select
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            value={filters.messageThemes[0] ?? ''}
            onChange={(e) => setMessageThemes(e.target.value ? [e.target.value] : [])}
          >
            <option value="">All</option>
            {availableMessageThemes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
            <input
              type="date"
              className="flex h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              value={filters.dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
            <input
              type="date"
              className="flex h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              value={filters.dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
