# PRD v4 — Iron Crown, 2.5D Isometric

Tanggal: 2026-10-02. Keputusan terbaru pengguna mengalahkan persyaratan renderer 3D dalam PRD v3.

## Tujuan visual
Mendekati kepadatan detail contoh RTS isometrik yang diberikan pengguna: arsitektur batu dan genteng, hutan berlapis, lahan pertanian aktif, manusia proporsional, kavaleri, siege, kota bertembok. Romawi dan Persia menjadi prioritas. Semua aset untuk tahap ini gratis/orisinal. Gambar referensi dipakai sebagai arahan visual; bukan file game atau izin penggunaan aset komersial milik game referensi.

## Kontrak renderer
- Canvas 2D, proyeksi isometrik tetap, tanpa geometri WebGL di runtime aktif.
- Objek dunia tetap memiliki koordinat, HP, pemilik, pesanan dan collider simulasi.
- Sprite disusun berdasarkan kedalaman x+z; seleksi, seret, zoom, pan, pembangunan, proyektil, fog dan minimap memakai proyeksi yang sama.
- Bangunan dan vegetasi bertekstur rinci melalui sprite transparan. Terrain, jalan dan fog adalah lapisan terpisah.
- Kamera tidak berputar. Rotasi bebas membutuhkan arah sprite tambahan dan bukan bagian renderer ini.
- Seni final wajib konsisten sudut kamera, skala manusia, cahaya kiri atas, titik kaki, bayangan dan palet peradaban.

## Produksi sprite final yang masih diperlukan
1. Setiap keluarga bangunan: utuh, konstruksi, rusak, runtuh; empat perkembangan era; tiga tingkat benteng yang terbaca.
2. Dinding tersambung dan gerbang pada dua sumbu isometrik; pintu terbuka/tertutup harus tampak berbeda.
3. Masing-masing tipe manusia: 8 arah, idle 6–8 frame, walk 8–12 frame, attack 8–12 frame, hit, death; pemanah punya draw/release/reload, tombak thrust, perisai block.
4. Pekerja: chop/mine/harvest/build/repair/carry/deposit per arah; alat dan barang benar-benar sesuai pekerjaannya.
5. Kuda, unta, gajah dan kereta: sprite spesifik, siklus gait, rider dan kematian yang sesuai. Jangan memakai gambar kuda untuk semua mount pada versi final.
6. Siege: ram impact, ballista release, artillery reload/deploy; semua event visual terhubung dengan waktu dampak simulasi.
7. Delapan arah tidak boleh digantikan sekadar membalik satu gambar pada final art. Frame dari generator harus diperiksa kontinuitasnya sebelum disebut animasi selesai.
8. Pohon: beberapa spesies/ukuran, tebang dan stump; tambang depleted; pertanian beberapa tahap.
9. Air, pantai, pelabuhan dan armada memerlukan navigasi terpisah; belum dianggap selesai hanya karena sprite kapal tersedia.

## Tanda selesai
- Tidak ada unit/bangunan berbeda fungsi yang memakai sprite pengganti pada roster final.
- Tidak ada pecahan aset tetangga dari atlas, clipping senjata, perubahan ukuran antarframe, kaki melayang atau slide pada siklus langkah.
- Landmark, rumah, barracks, stable, range, workshop dan pasar dapat dikenali tanpa label.
- Ekonomi tetap gather → carry → deposit; stok tidak bertambah hanya karena gambar orang bergerak.
- Screenshot hasil permainan dan rekaman gerak harus dibandingkan dengan acuan; gambar promosi tidak menjadi bukti gameplay.
- Angka performa harus diukur pada model MacBook/browser yang disebutkan sebelum dipublikasikan sebagai target tercapai.

## Status implementasi 0.6 — 2026-10-03
Sembilan atlas orisinal terpasang. Medan 256 × 256 memiliki permukaan bertingkat, lereng curam yang memblokir jalan, akses landai dan jalan mengikuti rute. Enam keluarga berjalan memiliki delapan arah; warga punya lima jenis aksi kerja dengan empat tampilan hasil dua sumber dan mirror. Ladang tumbuh selama 42 detik simulasi sebelum dipanen, panen mengosongkan sebagian permukaan, dan tanam ulang menghabiskan 55 kayu. Pohon perlu fase tebang sebelum tumbang, kayunya dikumpulkan setelah tumbang, kemudian menyisakan tunggul. Batu/emas dan buah punya perubahan gambar sesuai stok. Rumah dapat menampung empat penghuni dan transisi masuk terlihat. Aksi ram/mangonel/ballista mengikuti waktu serangan.

Kriteria art final di atas **tetap berlaku dan belum terpenuhi semuanya**. Pose menyerang baru terbatas dua arah mirror, pose kerja bukan delapan arah mandiri, belum ada animasi menanam/carry/death lengkap atau art unik seluruh roster. Tebing memakai heightfield tetap, bukan generator lanskap lengkap. Lihat IMPLEMENTATION-STATUS.md untuk batasan yang masih ada; hasil generasi gambar bukan bukti bahwa gerakan sudah natural atau setara referensi.

## Tambahan kebutuhan dan implementasi 0.7 — 2026-10-03
- Serangan mengikuti sasaran dan tahap windup/release/recovery; tujuh keluarga memiliki empat sampel aksi per baris arah. Sudut hasil generasi belum semuanya presisi dan dua tampilan infantry memakai mirror. Kriteria kontinuitas art final tetap belum lulus.
- Jalan adalah bangunan kerja warga: 2 kayu + 1 batu per ruas, waktu 4 detik per pekerja, drag untuk rute dan Shift untuk antrean. Jalan selesai memberi kecepatan +18%; tidak boleh melintasi air atau lereng yang diblokir.
- Kegiatan kandang, barak dan tempat latihan panah mengikuti antrean rekrutmen. Aktivitas tempat produksi mengikuti pengiriman bahan, riset atau perbaikan alat. Figuran latihan tidak menambah jumlah penduduk dan tidak memberikan resource.
- Kincir memiliki rotor terpisah yang berputar; tambang punya gerobak/pekerja, forge punya hammering/percikan. Ini belum rantai komoditas gandum–tepung atau bijih–ingot.
- Dewan Pemerintahan: bangunan dan riset administrasi; Universitas: arsitektur dan balistik; Kuil/Infirmary: pemulihan unit; Bengkel: riset perlengkapan dan perbaikan kondisi alat warga.
- Bangunan institusi memakai aset tersendiri untuk Romawi/Persia. Ruang interior, pemerintahan politik/parlemen simulatif, kapal, kampanye naratif dan art seluruh unit tetap belum selesai.

## Riset identitas sejarah
Roster contoh menggabungkan beberapa periode. Empat nama era dipertahankan sebagai jenjang gameplay; build ini adalah historical sandbox, belum rekonstruksi satu tahun sejarah. Referensi primer untuk iterasi perlengkapan dan arsitektur:
- British Museum, Legion: https://www.britishmuseum.org/exhibitions/legion-life-roman-army/large-print-guide — scutum, persenjataan dan perlengkapan legionary.
- Metropolitan Museum, relief Achaemenid: https://www.metmuseum.org/art/collection/search/323723 — ruang upacara dan kolom Persepolis.
