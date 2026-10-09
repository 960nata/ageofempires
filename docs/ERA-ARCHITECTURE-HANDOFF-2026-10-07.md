# Arsitektur, era, dan upgrade — paket aset untuk Claude

Permintaan pengguna: tiap peradaban punya arsitektur tersendiri dari Dark, Feudal, Castle sampai Imperial. Peningkatan era/bangunan melalui Town Center; riset peningkatan tembok melalui University. Dokumen ini spesifikasi untuk implementasi, bukan laporan bahwa gameplay telah dipasang.

## Progres era

| Era | Bangunan | Pertahanan | Fungsi |
|---|---|---|---|
| Dark | struktur vernacular sederhana | palisade kayu | ekonomi awal, pengintaian, pertahanan murah |
| Feudal | bahan dan struktur lebih berkembang | batu tingkat 1 | produksi pasukan dasar dan riset awal |
| Castle | kompleks masonry dan fasilitas lengkap | batu tingkat 2 | pasukan khusus, pertahanan dan perdagangan berkembang |
| Imperial | arsitektur matang dengan struktur lebih rumit | batu tingkat 3 | teknologi akhir dan pertahanan paling kuat |

Town Center meneliti era berikutnya. Selesainya era membuka bentuk bangunan berikutnya; bangunan yang sudah ada menjalani renovasi lokal sebelum bentuk baru muncul. Tapak, pintu masuk, jalur dan pivot tidak berubah mendadak. Biaya upgrade era dibayar sekali; jangan tagih biaya bangunan lagi untuk pergantian fasad yang bersifat global. Upgrade struktur individual tambahan harus punya biaya dan antrean sendiri.

University harus tersedia mulai Feudal untuk mendukung permintaan upgrade tembok tingkat 1. Riset tingkat 2 memerlukan Castle; tingkat 3 memerlukan Imperial. Perubahan palisade ke masonry menampilkan renovasi, bukan sprite mendadak diganti. Gerbang mengikuti tingkat tembok, akses dan animasi buka/tutup tetap dipertahankan selama renovasi.

## Angka awal, perlu pengujian gameplay

| Pertahanan | HP awal | Biaya per segmen | Waktu bangun |
|---|---:|---|---:|
| Palisade | 180 | 5 kayu | 12 detik |
| Batu 1 | 450 | 8 batu | 20 detik |
| Batu 2 | 850 | 12 batu | 28 detik |
| Batu 3 | 1300 | 18 batu | 36 detik |

Riset University: tingkat 1 100 makanan + 100 batu / 60 detik; tingkat 2 200 makanan + 150 emas / 90 detik; tingkat 3 350 makanan + 250 emas / 120 detik. Ini baseline desain yang perlu diselaraskan dengan ekonomi game saat ini. Jangan anggap angka ini sudah seimbang hanya karena besarnya seragam.

## Karakteristik peradaban dan batas bonus

| Peradaban | Kekuatan usulan | Pengimbang usulan |
|---|---|---|
| Romawi | latihan infanteri 7% lebih cepat | biaya kavaleri +5% |
| Persia | pembangunan ekonomi 7% lebih cepat | latihan infanteri 5% lebih lambat |
| Inggris | panen pertanian +7% | biaya pasukan berkuda +5% |
| Prancis | latihan kavaleri 7% lebih cepat | riset jarak jauh 5% lebih mahal |
| Saracen | pendapatan caravan +7% | peningkatan pertanian 5% lebih mahal |
| Mongol | kecepatan pasukan berkuda +5% | pembangunan pertahanan 7% lebih lambat |
| China | riset ekonomi 7% lebih cepat | latihan kavaleri 5% lebih lambat |
| Jepang | cooldown infanteri 5% lebih pendek | biaya siege +5% |
| Khmer | kapasitas angkut pekerja +7% | latihan pemanah 5% lebih lambat |
| Castile | biaya tembok batu -7% | riset ekonomi 5% lebih lambat |

Bonus ini menggantikan bonus lama yang relevan, bukan ditumpuk tanpa batas. Unit khusus wajib punya counter, biaya populasi dan waktu latihan yang sebanding; gajah tidak boleh diukur hanya dari damage. Target pengujian: win rate 45–55% dalam matchup dua arah, beberapa peta, ekonomi dan tingkat AI; ukur power spike setiap era. Uji komposisi infanteri, ranged, cavalry dan siege dengan anggaran resource/populasi yang sama. Belum ada hasil pengujian balance dalam paket aset ini.

## Siklus konstruksi dan kerusakan

Urutan aset wall/town: pondasi → 25% scaffolding → 50% dinding → 75% rangka atap → selesai → rusak → terbakar → puing. Renovasi memperlihatkan bangunan lama dengan scaffolding sebelum fasad baru. Bangunan dihancurkan memakai transisi beberapa frame dan debris; sprite terbakar tunggal bukan animasi api yang lengkap. Api/asap harus bergerak sebagai efek terpisah; bangunan batu terbakar pada kayu/atap/peralatan, bukan seluruh batu berubah menjadi kayu.

## Isi dan batas paket

- Wall lifecycle per peradaban: target grid 8 kolom × 4 era, satu arah kamera.
- Town Center lifecycle per peradaban: target grid 8 kolom × 4 era, satu arah kamera.
- Settlement facade per peradaban: target grid 12 jenis bangunan × 4 era; gambar bangunan jadi.
- Settlement kolom: rumah, mill/granary, lumber camp, mining camp, barracks, range, stable, smithy, market, religious building, university, government.
- Ukur grid dan batas alpha aktual sebelum slicing. Hasil generasi tidak menjamin identitas, pivot dan tepi konsisten antarsel; beberapa memiliki fringe warna yang memerlukan perapian.
- Paket belum memberi frame konstruksi/roboh terpisah untuk setiap bangunan settlement, semua arah putaran, gerbang baru lengkap, semua tower, dock, siege workshop atau kastel tersendiri.
- Seni ini interpretasi game yang terinspirasi sejarah. Label empat era merupakan progres gameplay lintas peradaban, bukan bukti periodisasi sejarah yang sama untuk semua budaya.

PNG orisinal dibuat dengan built-in imagegen. Prompt dan lokasi sumber tersimpan dalam ERA-ARCHITECTURE-ASSETS-2026-10-07.json. Pemasangan game dikerjakan Claude sesuai pembagian kerja pengguna.
