# Rancangan animasi laut dan cuaca ringan

Status: panduan pemasangan, belum diimplementasikan atau diukur performanya.

## Laut

Pisahkan air map, ikan/paus, dan splash. Jangan memindahkan bidang air yang menempel pada gambar bersama paus. Ikan di bawah air mendapat warna kebiruan dan transparansi sesuai kedalaman, kemudian permukaan air digambar di atasnya. Pakai satu kawanan teri sebagai satu objek gerak; hindari AI setiap ikan.

Lompatan: diam di bawah air → muncul → naik → puncak → turun → masuk air → splash mengembang → splash hilang. Empat gambar sumber saat ini belum mencakup seluruh tahap; perlu gambar antara dan registrasi ukuran/anchor.

Pengejaran: paus mendekat → kawanan menyebar → paus mengejar satu arah → membuka mulut → teri tersisa menjauh → paus menyelam. Gunakan kurva gerak halus untuk perpindahan, bukan mengganti arah seketika.

## Cuaca

Hujan memakai lapisan garis hujan dan ripple kecil berulang, perubahan warna tanah serta suara. Kemarau memakai perubahan warna rumput, mask tanah retak dan penurunan air bertahap. Pertahankan lokasi batu dan akar. Gambar referensi bukan tile atau animasi cuaca siap pakai.

## Anggaran awal untuk implementasi

Usulan awal, wajib diukur di MacBook target: batasi 1 paus aktif dan 4 kawanan terlihat; animasi sprite 8–12 pergantian gambar per detik sementara perpindahan mengikuti waktu frame; hentikan animasi objek di luar layar; gunakan ulang splash dan ripple. Sediakan pengaturan cuaca rendah/sedang. Jangan klaim ringan sebelum pengukuran waktu frame dan memori setelah pemasangan.
