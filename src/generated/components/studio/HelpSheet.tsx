import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@components/ui/sheet';
import { useHotkey } from '@generated/hooks/useHotkey';
import { MONO } from '@generated/components/studio/parts';
import { cn } from '@lib/utils';

const STEPS = [
  ['01 Ornamen', 'Import satu atau banyak SVG sekaligus, atau ambil dari Galeri motif bawaan yang dikelompokkan per kategori. Bentuk di dalam <use>, <symbol>, dan gradasi sederhana ikut terbaca. Semua tetap vektor sampai 8K.'],
  ['02 Kanvas', 'Pilih A4, A3, 500 mm, atau ukuran bebas dalam milimeter. Tombol putar menukar lebar dan tinggi.'],
  ['03 Susunan', 'Atur jumlah, ukuran, jarak minimum, rotasi, dan ukuran acak. Seed menyimpan susunan; "Acak ulang" memberi variasi baru.'],
  ['04 Warna', 'Import palet hasil download lalu pilih "Pakai palet" agar setiap ornamen mengambil warna dari palet. Klik swatch untuk warna latar.'],
  ['05 Variasi', 'Angka kemiripan membandingkan susunan aktif dengan semua berkas yang pernah diekspor di perangkat ini. "Buat variasi baru" mengganti campuran motif, warna, kepadatan, dan rotasi sekaligus sampai angkanya turun di bawah batas.'],
  ['06 Export', 'Satu nama berkas dipakai untuk EPS dan JPG. Sebelum turun, EPS diperiksa strukturnya; setelah tersimpan nomor nama berkas naik sendiri.'],
];

const KEYS = [
  ['L', 'buka galeri motif'],
  ['R', 'acak seed susunan'],
  ['V', 'buat variasi baru'],
  ['E', 'export EPS + JPG'],
  ['1 2 3', 'ulangan 1×, 2×2, 3×3'],
  ['G', 'garis sambungan'],
  ['?', 'buka panduan ini'],
];

export function HelpSheet() {
  const [open, setOpen] = useState(false);
  useHotkey('?,/', () => setOpen(true), !open);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="xs" variant="ghost">
          <BookOpen />
          Panduan
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-base font-normal">Alur kerja</SheetTitle>
          <SheetDescription className="text-xs">
            Dari ornamen sampai berkas siap unggah, tanpa koneksi internet.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-8">
          {STEPS.map(([title, body]) => (
            <div key={title} className="space-y-1.5">
              <h3 className={cn(MONO, 'text-[11px] tracking-wide text-primary uppercase')}>{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}

          <div className="space-y-2 border-t border-border pt-5">
            <h3 className={cn(MONO, 'text-[11px] tracking-wide text-primary uppercase')}>Pintasan papan tombol</h3>
            <dl className="space-y-1.5">
              {KEYS.map(([key, what]) => (
                <div key={key} className="flex items-center gap-3">
                  <dt
                    className={cn(
                      MONO,
                      'w-16 shrink-0 border border-border bg-[hsl(var(--surface-2))] px-1.5 py-0.5 text-center text-[10px]',
                    )}
                  >
                    {key}
                  </dt>
                  <dd className="min-w-0 text-xs text-muted-foreground">{what}</dd>
                </div>
              ))}
            </dl>
            <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
              Pintasan mati saat kursor berada di kolom isian. Judul tiap panel bisa diklik untuk melipat bagiannya.
            </p>
          </div>

          <div className="space-y-2 border-t border-border pt-5">
            <h3 className={cn(MONO, 'text-[11px] tracking-wide text-primary uppercase')}>Catatan microstock</h3>
            <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <li>EPS ditulis sebagai PostScript Level 2 murni dengan artboard sisi terpanjang 4096 px.</li>
              <li>Potongan ornamen di tepi digambar ulang di sisi berlawanan, jadi tile bisa diulang tanpa garis sambungan.</li>
              <li>Efek gradasi di dalam SVG asli diambil warna stop pertamanya; bitmap dan filter tidak terbaca.</li>
              <li>Pratinjau 2×2 dan 3×3 dengan garis sambungan memudahkan cek cacat sebelum ekspor.</li>
              <li>Untuk satu set kiriman, ganti minimal dua hal antar berkas: campuran motif dan palet warna. Seed saja tidak cukup untuk lolos pemeriksaan konten mirip.</li>
              <li>Buka EPS hasil ekspor di Illustrator sekali untuk tiap ukuran kanvas baru: pastikan artboard 4096 px, semua objek vektor, dan tidak ada objek di luar artboard.</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
