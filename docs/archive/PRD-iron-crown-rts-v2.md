# PRD — Iron Crown: Realms at War

**Versi:** 2.0 — 3D penuh, historis, browser desktop  
**Status:** Draft produk untuk dasar vertical slice  
**Platform awal:** Browser desktop MacBook, WebGL2  
**Genre:** Real-time strategy (RTS) historis

> “Iron Crown” nama kerja. Game mengambil inspirasi dari genre RTS sejarah. Seluruh nama, cerita, tokoh, faksi, peta, model, tekstur, animasi, suara, UI, dan kode harus orisinal atau berlisensi. Jangan memakai atau mengekstrak aset Age of Empires.

## 1. Ringkasan

RTS real-time 3D berlatar kerajaan-kerajaan abad pertengahan. Pemain mengembangkan ekonomi, membangun permukiman, merekrut pasukan, meneliti teknologi, lalu bertempur untuk menguasai wilayah. Perkembangan gameplay mencakup Zaman Kelam, Feodal, Kastel, dan Imperial. Detail kronologi dan faksi mengikuti riset sejarah; tidak semua wilayah dipaksa mengikuti satu garis waktu.

Game berjalan di browser desktop supaya bisa dimainkan di MacBook tanpa installer native. Target 3D penuh harus divalidasi lewat prototype pada perangkat nyata. Keterbatasan browser berarti skala peta, jumlah unit, shader, tekstur, dan efek ditentukan berdasarkan profiling.

**Tidak ada tutorial wajib.** Pemain langsung ke menu dan dapat memulai skirmish. Bantuan kontrol opsional tersedia di menu jeda/pengaturan.

## 2. Visi, sasaran, dan batas awal

### Visi

RTS sejarah 3D yang imersif dan mudah dimainkan, dengan ekonomi bermakna, pertempuran terbaca, dan dunia abad pertengahan yang terasa hidup.

### Sasaran
- Skirmish melawan AI berdurasi sekitar 25–45 menit; kecepatan permainan dapat diatur.
- Pemain mengelola warga, ekonomi, konstruksi, riset, dan pasukan secara real-time.
- Empat era membuka teknologi, struktur, dan taktik secara bertahap.
- Faksi berbeda melalui geografi, ekonomi, organisasi militer, arsitektur, dan roster yang diriset.
- Dibuka langsung di browser MacBook modern; skirmish lokal tidak butuh akun.

### Di luar fase awal
- Multiplayer online real-time, akun/cloud, campaign bercabang panjang, editor map, workshop/mod support, browser mobile/touch.

## 3. Pemain dan pengalaman

Pemain utama adalah penggemar RTS sejarah yang ingin membangun basis, mengelola sumber daya, mengatur unit, dan memimpin pertempuran.

Alur masuk: buka URL → menu utama → pilih skirmish → pilih faksi/map/AI → main. Kamera menampilkan dunia 3D penuh dari sudut tinggi dengan proyeksi ortografik atau perspektif lemah. Kamera bisa pan dan zoom; rotasi opsional jika orientasi map tetap mudah dibaca.

Target browser awal Safari dan Chrome desktop dengan WebGL2. Minimum MacBook dan preset kualitas ditetapkan setelah profiling perangkat fisik; catat model chip, RAM, browser, dan resolusi uji.

## 4. Pilar desain
1. Kerajaan tumbuh nyata di depan pemain melalui pembangunan dan kemajuan era.
2. Ekonomi, jalur suplai, wilayah, dan komposisi pasukan memberi pilihan strategis.
3. Pertempuran terbaca dari kamera tinggi: siluet, kelas unit, formasi, dan efek tidak menutupi peta.
4. Material, arsitektur, perlengkapan, nama, dan unit sesuai riset periode.
5. Kualitas visual beradaptasi dengan kemampuan GPU supaya permainan tetap responsif.

## 5. Core loop
1. Mulai dengan pusat komando, pekerja, pengintai, dan sumber daya awal.
2. Alokasikan pekerja ke pangan, kayu, batu, besi, dan konstruksi.
3. Jelajahi peta dan temukan sumber daya/lawan.
4. Perluas permukiman, bangun pertahanan dan fasilitas produksi.
5. Penuhi syarat serta biaya untuk naik era.
6. Riset teknologi dan pilih komposisi pasukan.
7. Rebut sumber daya/titik strategis; serang atau bertahan.
8. Hancurkan pusat komando lawan atau penuhi objektif skenario.

## 6. Era
| Era | Tema | Unlock utama | Fungsi strategis |
|---|---|---|---|
| Zaman Kelam | Desa, manor awal, palisade, levy | Pekerja, milisi, pengintai, ekonomi dasar | Ekspansi, scouting, pertahanan ringan |
| Feodal | Kerajaan lokal, manor, pasar, barak | Infanteri, tombak, pemanah, kavaleri ringan | Perebutan map dan tekanan awal |
| Kastel | Benteng batu, organisasi militer | Kastel, unit elit, bengkel dan mesin kepung | Pertahanan kuat dan pengepungan |
| Imperial | Pemerintahan dan tentara profesional | Upgrade lanjutan, struktur pemerintahan, artileri sesuai konteks | Keunggulan teknologi dan akhir match |

Era merupakan struktur gameplay. Tetapkan periode/geografi tiap campaign. Ganti nama struktur atau unit bila istilahnya tidak sesuai dengan konteks sejarah faksi.

## 7. Faksi awal
Daftar final ditentukan setelah ruang lingkup wilayah dan periode disetujui. Kandidat konsep:
- Kerajaan Inggris abad pertengahan: pertahanan dan pemanah, sesuai batas periode yang diriset.
- Kerajaan Prancis abad pertengahan: ekonomi agraris, kavaleri bangsawan, pusat kekuasaan.
- Kerajaan Kastilia/León: benteng perbatasan, pasukan gabungan, konteks Iberia.
- Kesultanan Ayyubiyah atau Mamluk (pilih satu periode): organisasi dan mobilitas kavaleri sesuai wilayah/periode.

Nama, unit, simbol, dan arsitektur perlu ditinjau peneliti sejarah/konsultan budaya. Hindari mencampur abad, wilayah, dan dinasti demi kemudahan roster.

Setiap faksi memiliki aksen ekonomi, keunggulan unit/teknologi, dan kelemahan yang dapat dijawab lawan. Tidak ada unit khas tanpa counter.

## 8. Ekonomi dan bangunan

### Sumber daya
- Pangan: pekerja, levy, unit dasar.
- Kayu: bangunan, busur, kapal bila relevan, mesin kepung.
- Batu: dinding, menara, kastel.
- Besi: senjata, armor, unit berat dan siege.
- Koin: perdagangan/teknologi; dipakai bila pacing dan UI tervalidasi.

Pekerja dapat mengumpulkan, membangun, memperbaiki, mengantar sumber daya, dan berlindung. Ketersediaan sumber daya diatur per map. Pasar dapat menukar sumber daya dengan kurs terkendali.

### Bangunan
Pusat komando, rumah/manor, lumbung/padang, kamp penebang, tambang, barak, lapangan panah, kandang, pandai besi, pasar, menara, dinding/gerbang, kastel, bengkel kepung, dan dermaga pada map yang sesuai.

Setiap bangunan memiliki footprint, biaya, waktu konstruksi, tahap visual konstruksi, HP/armor, material, aturan serangan, dan damage state. Ghost preview menunjukkan lokasi valid/tidak valid sebelum penempatan.

## 9. Unit dan pertempuran

### Kelas unit
- Pekerja: ekonomi/konstruksi, lemah dalam perang.
- Pengintai: visi dan kecepatan, serangan rendah.
- Infanteri pedang/kapak: kelas umum jarak dekat.
- Tombak: counter kavaleri, rentan serangan jarak jauh.
- Pemanah: serangan jarak jauh, lemah saat dikejar atau diserang dekat.
- Kavaleri ringan: flanking, scouting, mengejar.
- Kavaleri berat: charge dan daya tahan, mahal serta rentan tombak.
- Pasukan jarak jauh berkuda: gangguan, mobilitas, damage terbatas.
- Mesin kepung: kuat melawan struktur, lambat dan perlu pengawalan.

Stat unit: HP, tipe armor, damage per tipe, range, laju serangan, kecepatan, sight, biaya, waktu produksi, populasi, radius tabrakan, kelas target.

### Aturan combat
- Fog of war membedakan area belum dijelajahi dan area yang terlihat.
- Target otomatis dapat diganti dengan perintah prioritas.
- Formasi awal: bebas, garis, rapat/perisai, wedge kavaleri.
- Medan memberi modifikasi terbatas dan terbaca: dataran tinggi, hutan, sungai.
- Dinding membutuhkan siege atau taktik khusus.
- Stagger/knockback secukupnya; hindari ragdoll berat yang mengganggu pembacaan dan performa.

### Kontrol
Klik pilih, drag multi-select, klik kanan perintah kontekstual. Hotkey untuk membangun, produksi, serang, tahan posisi, mundur, patrol, garrison, formasi. Grup kontrol, rally point, antrean produksi, minimap, ping, dan notifikasi ancaman. Key binding dapat diubah.

## 10. Mode, AI, dan kemenangan

**Skirmish MVP:** pemain melawan AI, map kecil/menengah, 1v1. Pilihan faksi, AI, ukuran map, kondisi kemenangan, dan kecepatan permainan.

**Kemenangan standar:** hancurkan pusat komando utama lawan. Skenario dapat memakai eliminasi struktur strategis atau objektif wilayah.

AI mengelola ekonomi, scouting, ekspansi, pertahanan, komposisi tentara, serangan, dan siege. Kesulitan mengubah keputusan serta kecepatan respons, bukan bonus sumber daya tersembunyi di mode standar.

Campaign menjadi fase setelah skirmish tervalidasi: sasaran awal 8–10 misi dengan karakter/konflik historis yang diverifikasi, briefing, objektif sampingan, dan save. Slice awal dapat memakai satu skenario tanpa tutorial paksa.

## 11. Arah visual 3D dan aset

### Gaya
Realisme historis bergaya sinematik: material batu, kayu, kain, logam yang meyakinkan; anatomi dan perlengkapan sesuai konteks; pencahayaan atmosferik; skala bangunan terasa monumental. Detail mikro turun ketika kamera zoom-out sementara bentuk dan warna tetap terbaca.

### Aset 3D
- **Karakter/rig:** pekerja dengan variasi kostum; tiap kelas prajurit; kuda dan perlengkapan; awak mesin kepung; pemimpin untuk skenario. Armor modular untuk variasi tanpa mesh unik berlebihan.
- **Bangunan:** pusat komando per faksi/era, rumah, lumbung, kamp kerja, tambang, barak, lapangan panah, kandang, pandai besi, pasar, menara, kastel, bengkel kepung, dinding/gerbang, dermaga bila sesuai.
- **Props:** senjata, perisai, busur, anak panah, armor, panji, meja kerja, gerobak, alat panen, tungku, peti/tong, pagar, siege engine.
- **Lingkungan:** terrain heightmap, rumput/tanah/lumpur/salju/pasir/batu, pohon spesifik, hutan, semak, batu/mineral, kebun, sungai/danau/pesisir, jalan, jembatan, reruntuhan, props desa, objek skenario.
- **VFX:** debu langkah, ayunan/benturan, lintasan panah, impact, asap/api, konstruksi, panen, pohon tumbang, ledakan siege, runtuh bangunan, cuaca ringan.

### Animasi
- Unit: idle variasi, jalan/lari, putar, start/stop, serangan, membidik/menembak, reload, reaksi terkena, mati, gather/chop/mine, build/repair, carry, mount/dismount, garrison/exit, victory.
- Kuda: idle, walk/trot/canter/gallop, putar, stop, charge; rider disinkronkan tanpa clipping utama.
- Bangunan: 3–5 tahap konstruksi, loop produksi, ornamen ambient, gerbang, damage states, terbakar, runtuh.
- Lingkungan: gerak pohon/rumput oleh angin, air, obor/api, partikel cuaca.

### UI dan audio
Ikon resource/unit/bangunan/teknologi, portrait faksi/karakter, kursor, HUD, minimap, indikator seleksi/HP/placement, fog mask, peta campaign, menu/pause/opsi/hasil pertandingan.

Musik orisinal berlapis untuk eksplorasi/ancaman/pertempuran; ambience biome; SFX UI, kerja, konstruksi, produksi, keluarga senjata, siege, alarm, victory/defeat; voice command pendek dengan casting dan aksen yang ditetapkan melalui riset. Hak aset dicatat.

Semua aset punya ID, pembuat, sumber, lisensi, hak modifikasi/komersial, versi, dan status pemeriksaan. Placeholder diberi label. Jangan ekstrak, tracing, atau merekonstruksi aset khas dari game lain.

## 12. Teknologi web dan performa MacBook

Keputusan final sesudah prototype teknis kecil:
- Renderer WebGL2 memakai Three.js atau Babylon.js; spike membandingkan instancing, animasi skeletal, terrain, dan ukuran build.
- TypeScript untuk simulasi, UI, data faksi, dan tooling.
- glTF/GLB, kompresi mesh/tekstur sesuai dukungan browser, mipmap dan LOD.
- Terrain chunking, frustum/occlusion culling, instancing props, batas material.
- Animation LOD; skeletal update hanya untuk unit terlihat/aktif; crowd animation sederhana saat jauh; object pooling untuk proyektil/VFX.
- Fixed timestep simulasi terpisah dari render; pathfinding hierarchical atau flow-field per grup setelah benchmark.
- Preset low/medium/high; kurangi bayangan, vegetasi, crowd density, efek, atau resolusi render secara adaptif.
- Loading dengan progres; muat map/faksi sesuai kebutuhan.
- Save lokal melalui IndexedDB atau file export; PWA caching/offline dievaluasi.
- Safari dan Chrome desktop Mac ditargetkan; tampilkan penjelasan bila WebGL2/GPU tidak didukung.

**Sasaran ukur awal, belum jaminan:** 60 FPS pada MacBook target dengan preset medium, minimum 30 FPS pada pertempuran besar; 150 unit total sebagai titik ukur MVP. Revisi setelah benchmark di perangkat fisik dan catat chip, memori, browser, resolusi, map, jumlah unit. Jangan mengklaim semua MacBook kompatibel sebelum uji.

## 13. MVP dan fase

### A — Prototype teknis
Scene WebGL, terrain kecil, kamera, selection, movement/pathfinding dasar, 20–40 unit placeholder; ukur FPS, panas, memori, dan loading di MacBook nyata.

### B — Slice gameplay
Ekonomi, worker, konstruksi, produksi, combat, fog of war, AI dasar; dua faksi blockout, satu map, empat era minimal.

### C — Vertical slice visual
Satu map polished, dua faksi representatif, 8–12 unit, 10–12 bangunan, pencahayaan, animasi, audio inti, satu skenario, save/load lokal, menu, opsi kualitas, hasil match.

Setelah validasi: tambah dua faksi, map, roster, campaign, aksesibilitas. Multiplayer baru dinilai setelah desain sinkronisasi/server dan biaya operasional jelas.

## 14. Aksesibilitas dan non-functional
- Ukur FPS, frame time, memori, loading, crash per perangkat/map/jumlah unit.
- Mouse/keyboard utama; semua hotkey remappable.
- UI scale, subtitles, warna tim ramah buta warna, matikan edge scroll/screen shake.
- Save lokal tanpa login; jelaskan lokasi/kompatibilitas.
- Bahasa awal Indonesia dan Inggris; dukungan Unicode dan teks panjang.
- Telemetry non-esensial opt-in, minim data pribadi.

## 15. Metrik keberhasilan
- Boot dan skirmish berfungsi pada browser/perangkat minimum yang disepakati.
- FPS, memori, waktu load, crash memenuhi batas hasil benchmark.
- Kontrol dasar dapat ditemukan tanpa tutorial wajib.
- Pemain memakai lebih dari satu kelas unit dan strategi ekonomi.
- Tidak ada unit tersangkut permanen di map standar.
- Tidak ada faksi dominan tanpa counter setelah playtest.

## 16. Risiko
- Browser 3D berat: mulai dari prototype, ukur MacBook, kendalikan skala dunia/unit.
- Pathfinding/AI mahal: uji grup dan jumlah unit sebelum membuat aset final.
- Realisme mengaburkan informasi: silhouette, warna tim, seleksi kontras, LOD.
- Produksi konten 3D mahal: kit modular, material bersama, LOD.
- Akurasi sejarah: tetapkan wilayah/periode, gunakan sumber dan review ahli.
- IP: identitas dan aset dari nol, provenance serta lisensi terdokumentasi.
- Scope terlalu besar: fase awal hanya skirmish browser; jumlah faksi/kualitas akhir mengikuti tim dan budget.

## 17. Keputusan lanjutan
- Wilayah/periode campaign pertama?
- MacBook minimum: Intel lama didukung atau Apple Silicon saja?
- Safari dan Chrome diprioritaskan sama atau Chrome dahulu?
- Kamera dapat diputar atau orientasi tetap?
- Renderer final setelah spike: Three.js atau Babylon.js?
- Prototipe lokal dahulu atau langsung dipublikasikan?

## 18. Kriteria penerimaan vertical slice
- Skirmish bisa dimainkan dari menu sampai hasil match tanpa tutorial wajib.
- Ekonomi, bangun, produksi, naik era, scouting, combat, dan kemenangan berjalan.
- Dua komposisi pasukan dapat menang melawan AI normal.
- Profil performa dicatat dan memenuhi target perangkat uji yang disepakati.
- UI terbaca pada resolusi target dan skema warna buta warna utama.
- Aset slice memiliki provenance dan hak penggunaan tercatat.
