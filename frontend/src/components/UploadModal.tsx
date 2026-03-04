import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { uploadCSV } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (brands: string[]) => void;
}

export function UploadModal({ open, onOpenChange, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) setFile(f);
    else setError('Please upload a CSV file.');
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError(null);
    if (f?.name.endsWith('.csv')) setFile(f);
    else if (f) setError('Please upload a CSV file.');
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await uploadCSV(file);
      onSuccess(res.brands);
      onOpenChange(false);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }, [file, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload competitor ad data</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: Brand, Competitor Brand, Brand Type, Type of Competitor, Target Audience;
            Platform, Ad Format (Video/Image/Carousel), Duration, Ad Type (UGC/Founder/Testimonial/Explainer/Scientific), Date;
            Message Theme, Hook Type, Hook Text, Primary Pain Point, Emotional Trigger, Tone; CTA, Landing Page Type.
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            'mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            drag ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            file && 'border-primary bg-primary/5'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="csv-upload"
            onChange={handleFileInput}
          />
          <label htmlFor="csv-upload" className="cursor-pointer text-center">
            {file ? (
              <>
                <FileSpreadsheet className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-2 font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">Click or drop again to replace</p>
              </>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Drop your CSV here or click to browse</p>
              </>
            )}
          </label>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
