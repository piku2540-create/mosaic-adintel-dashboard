import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export interface BrandSelectorProps {
  brands: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  maxSelect?: number;
  className?: string;
}

export function BrandSelector({ brands, selected, onSelectionChange, maxSelect = 10, className }: BrandSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const toggle = (brand: string) => {
    if (selected.includes(brand)) {
      onSelectionChange(selected.filter((b) => b !== brand));
    } else if (selected.length < maxSelect) {
      onSelectionChange([...selected, brand].sort());
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {selected.length === 0 ? 'Select brands (max 10)' : `${selected.length} brand(s): ${selected.slice(0, 3).join(', ')}${selected.length > 3 ? '…' : ''}`}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && (
        <>
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md" style={{ backgroundColor: 'hsl(var(--card))' }}>
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  selected.includes(brand) && 'bg-accent/50'
                )}
                onClick={() => toggle(brand)}
              >
                <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                  {selected.includes(brand) ? <Check className="h-4 w-4" /> : null}
                </span>
                {brand}
              </button>
            ))}
          </div>
          <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} aria-hidden />
        </>
      )}
    </div>
  );
}
