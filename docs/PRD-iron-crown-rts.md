> **Perubahan keputusan produk 2026-10-02:** pengguna mengganti arah dari 3D realtime ke 2,5D isometrik berbasis sprite. Ketentuan rendering/aset yang bertentangan dalam dokumen ini digantikan oleh [PRD v4 — Isometric](PRD-v4-isometric.md). Simulasi ekonomi/pertempuran tetap berlaku.

# PRD v3 — Iron Crown: Realms at War

**Tanggal:** 2 Oktober 2026 · **Bahasa:** Indonesia · **Status:** Spesifikasi target, belum terimplementasi penuh.

**Pemilik produk:** pemilik proyek ini. **Platform:** game web desktop, mouse/keyboard/trackpad MacBook. **Genre:** RTS sejarah 3D. **Arah visual wajib:** manusia, hewan, perlengkapan, dan bangunan realistis; model balok/bola/kapsul hanya alat pengembangan internal. **Pengalaman:** ekonomi warga, empat era, pasukan beragam, pertahanan, pengepungan, peradaban berbeda dan campaign. Tanpa tutorial wajib.

Dokumen ini menggantikan keputusan produk yang bertentangan di PRD v2. Katalog TypeScript, model manifest, pipeline seni dan UI lama belum otomatis mengikuti perubahan ini. Semua angka balance dan performa di bawah adalah **target rancangan awal** yang harus diuji; bukan hasil benchmark, fakta sejarah, atau statistik yang disalin dari game lain.

## 1. Hasil yang harus dirasakan pemain

Pemain melihat desa yang bekerja: warga berjalan menuju hutan, mengayunkan kapak, membawa kayu, menyetor ke kamp, lalu kembali bekerja. Pengeluaran kayu memulai konstruksi bertahap, bukan memunculkan bangunan seketika. Rumah menambah kapasitas penduduk; barak menghasilkan tentara setelah waktu pelatihan. Tentara memiliki anatomi, senjata, pelindung, rig dan animasi yang sesuai tugasnya.

Pemain dapat membentuk pasukan berpedang, bertombak, berpanah, memakai atau tanpa perisai, pengintai, kavaleri pedang/tombak/panah, pasukan unta dan mesin kepung. Pendobrak benar-benar bergerak ke gerbang, berhenti, mengayunkan balok, merusak struktur dan membuka jalan. Benteng berubah penampilan serta kemampuan ketika upgrade selesai.

Naik era memunculkan pilihan teknologi dan pasukan baru. Setiap peradaban punya arsitektur, pakaian, perlengkapan, suara, roster, teknologi dan landmark tersendiri. Mengganti nama atau warna saja tidak memenuhi persyaratan keunikan peradaban.

“Seperti Age of Empires” ditafsirkan sebagai kedalaman pengalaman RTS: ekonomi, pengintaian, pembangunan, counter unit, era dan siege. Identitas, aset, musik, cerita, peta, antarmuka dan angka balance proyek dibuat sendiri atau diperoleh dengan hak pakai yang sesuai.

## 2. Persyaratan wajib dan prioritas

| ID | Persyaratan wajib | Bukti kelulusan |
|---|---|---|
| R01 | Aset final berupa mesh 3D realistis dengan material dan rig yang tepat | Model dapat diputar/dizoom, material terbaca, animasi berfungsi dalam game |
| R02 | Warga mempunyai siklus komoditas fisik lengkap | Bekerja → muatan → mengantar → menyetor → kembali; stok hanya bertambah saat setor |
| R03 | Gerakan manusia/hewan wajar | Sendi bergerak; langkah mengikuti kecepatan; penunggang menempel pada pelana |
| R04 | Seluruh keluarga pasukan wajib tersedia dalam cakupan rilis | Roster bagian 9 dapat direkrut, diperintah, bertarung dan mati |
| R05 | Pendobrak, gerbang, tembok dan upgrade benteng berfungsi | Pengepungan menghasilkan kerusakan, celah dan perubahan jalur |
| R06 | Empat era mengubah strategi dan tampilan | Tech tree, armor/senjata dan bangunan berubah setelah proses riset |
| R07 | Peradaban unik secara visual dan mekanik | Bonus terukur, roster berbeda, landmark berfungsi |
| R08 | Ringan pada profil MacBook target | Memenuhi anggaran frame, memori dan muatan setelah sesi uji panjang |
| R09 | Skirmish bisa selesai dan dilanjutkan dari save | AI memakai ekonomi nyata; kemenangan/kekalahan dan save/load konsisten |
| R10 | Main menu, setup, settings dan pause bisa dipakai tanpa tutorial paksa | Tidak ada tombol aktif yang hanya menampilkan klaim fungsi |
| R11 | Perubahan setiap versi terdokumentasi | Catatan membedakan data, visual, gameplay, perbaikan dan fitur belum selesai |
| R12 | Hak pakai semua aset final terlacak | Ada file, sumber, lisensi, bukti perolehan bila perlu, serta atribusi |

**P0:** ekonomi, gerak, aset manusia, pathfinding dan tempur dasar. **P1:** roster lengkap, peradaban, empat era, siege, benteng, AI, save/load. **P2:** campaign, variasi peta dan penyempurnaan audio. Semua R01–R12 tetap syarat rilis; tahapan mengatur urutan kerja, bukan menghapus fitur yang diminta.

## 3. Audit implementasi yang ada

Audit ini merupakan pembacaan source, bukan bukti hasil pengujian runtime.

| Area | Kondisi yang ditemukan | Pekerjaan yang wajib dilakukan |
|---|---|---|
| Model | Unit/bangunan memakai geometri prosedural sederhana | Ganti dengan aset produksi; manifest bukan model |
| Animasi | Unit ditranslasikan dan digoyangkan vertikal | Rig, clip, transisi, langkah dan aksi sinkron |
| Ekonomi | `assignGather` membutuhkan seleksi; klik resource mengosongkan seleksi | Perintah kontekstual pekerja → resource; simpan job secara independen |
| Gather | Berjalan di cabang gerak; stok ditambah langsung dari node | Pisahkan job, muatan dan penyetoran dari locomotion/render |
| Rekrutmen | `train` langsung membuat unit | Antrean, durasi, populasi, spawn/rally dan pembatalan |
| Konstruksi | `build` langsung menambahkan mesh di posisi acak | Placement, footprint, pekerja, tahap konstruksi dan refund |
| Tempur | Attack/hold/formation/repair sebagian hanya pesan | Targeting, damage, cooldown, posisi, prioritas dan simulasi sebenarnya |
| Era | Resource terpotong, label era berubah | Proses riset, syarat, unlock, upgrade visual dan stat |
| Faksi | Teks/katalog berubah | Hubungkan ke simulasi, roster, seni dan teknologi |
| Minimap | Elemen dekoratif tetap | Proyeksi posisi dunia, kamera, unit, bangunan dan fog |
| Save | Pengaturan browser tersimpan; itu bukan save permainan | Snapshot dunia lengkap dan pemulihan |
| GLB | Ada helper loader dan daftar `pending` | Peroleh, impor, pasang, animasikan dan optimalkan aset |

Satu fitur baru boleh diberi status **selesai** setelah data, perilaku, visual, UI, suara bila relevan, penyimpanan dan bukti penerimaannya tersedia. Build berhasil hanya membuktikan bundling; tidak membuktikan ekonomi, animasi atau AI berjalan.

## 4. Cakupan rilis dan definisi pertandingan

Rilis v1 menargetkan skirmish darat 1v1 melawan AI, lima paket peradaban bertahap, seluruh keluarga pasukan wajib, empat era, tiga peta darat, dan satu campaign empat misi. Semua peradaban memakai sistem bersama, tetapi tidak semua unit tersedia untuk semua faksi.

Pertandingan standar dimulai pada Dark Age dengan satu Town Center, enam warga dan satu penjelajah jalan kaki (U02). Target durasi 25–45 menit. Populasi awal 7/20; rumah menambah 10 kapasitas sampai batas 150 per pemain. Unit berkuda menghabiskan 2 populasi, siege 3; ini angka awal untuk diuji. Tidak ada produksi otomatis gratis.

**Kemenangan standar:** lawan tidak mempunyai Town Center maupun landmark pemerintahan yang sudah selesai dibangun selama 30 detik. Jika satu selesai dibangun selama hitung mundur, hitung mundur dibatalkan. Pasukan yang tersisa tetap dapat bertempur selama hitung mundur. Kondisi ini terlihat di UI dan AI memakai aturan yang sama. Menyerah menghasilkan kekalahan segera. Campaign dapat memakai kondisi berbeda yang dinyatakan di briefing.

New Game membuat sesi bersih. Continue memulihkan save, Resume melanjutkan sesi di memori. Kembali ke menu tidak menyamar sebagai pertandingan baru. Multiplayer, editor map, mod workshop, ponsel, diplomasi kompleks dan perang laut adalah pengembangan berikutnya; peta pesisir boleh memuat penangkapan ikan di pantai tanpa kapal perang.

## 5. Dunia, skala, kamera dan keterbacaan

- Dunia penuh 3D: medan memiliki elevasi, bangunan ber-volume, unit ber-rig, proyektil berada di ruang dunia. Kamera bisa pan, zoom, rotasi terbatas dan kembali ke orientasi utara.
- Satu satuan dunia ditetapkan sebagai satu meter pada pipeline. Skala bangunan boleh dikompresi untuk keterbacaan strategi, tetapi pintu, penunggang, senjata dan tubuh harus proporsional satu sama lain.
- Zoom normal harus membedakan tombak, pedang/perisai, busur, kuda dan unta. Zoom dekat harus menunjukkan wajah dasar, tangan, sabuk, pelana, armor dan tekstur tanpa tampilan “pentol”.
- Tiga biome rilis: perbatasan padang/hutan, lembah batu, dan wilayah kering. Semua memiliki lokasi start adil, hutan, pangan, emas, batu dan jalur ekspansi. Biome tidak memberi buff tersembunyi kepada satu faksi.
- Sungai dalam tidak dilalui pasukan darat. Ford dan jembatan punya konektivitas nyata. Tembok, pohon, bangunan dan mesin kepung besar memengaruhi jalur.
- Fog terdiri dari belum dijelajahi, pernah terlihat, dan sedang terlihat. Unit musuh bergerak hanya tampak dalam sight. Bangunan terakhir terlihat menjadi ingatan buram yang diperbarui ketika dilihat kembali.
- Minimap memakai data dunia serta fog yang sama; klik memindahkan kamera, klik kanan memberi perintah jika ada unit terpilih. Marker dekoratif tetap dilarang dianggap minimap selesai.

## 6. Ekonomi: komoditas, muatan dan bangunan setor

### 6.1 Resource inti

PRD ini menetapkan **Food, Wood, Gold, Stone** sebagai empat stok inti. Gold menggantikan `iron` yang ada di prototype. Besi menjadi material visual/teknologi perlengkapan, bukan stok kelima di skirmish v1. Save prototype lama perlu migrasi eksplisit atau dinyatakan tidak kompatibel; tidak boleh mengubah arti nilainya diam-diam.

| Resource | Sumber dunia | Alat/animasi | Muatan yang terlihat | Tempat setor | Kegunaan |
|---|---|---|---|---|---|
| Food | Berry, hewan buruan, ternak, ladang, ikan pantai | Petik, berburu, potong, panen, menangkap ikan | Keranjang, karung atau hasil panen | Town Center, mill/granary | Warga, pasukan, riset era |
| Wood | Pohon hidup → tumbang → kayu habis | Kapak, tebang, potong | Ikatan kayu | Town Center, lumber camp | Rumah, produksi, panah, siege |
| Gold | Deposit emas | Beliung dan kerja tambang | Kantong bijih | Town Center, mining camp | Unit profesional, riset, perdagangan |
| Stone | Tambang batu | Beliung/pahat | Keranjang batu | Town Center, mining camp | Benteng, gerbang, tembok, landmark |

Tidak ada pertumbuhan stok pasif kecuali bonus tertentu yang tertulis jelas di tech tree. HUD menampilkan stok tersedia, pekerja per resource, pekerja idle, dan angka bersih per menit yang dihitung dari kejadian transaksi; tooltip memisahkan stok dengan muatan di perjalanan.

### 6.2 State pekerja

`Idle → AcquireJob → MoveToWork → Gather → MoveToDropOff → Deposit → ReturnToWork`.

Cabang tambahan: `Build`, `Repair`, `Flee`, `Garrison`, `Blocked`, `Dead`. Job bertahan ketika pekerja dipilih/deseleksi; pemilihan UI tidak menyimpan logika pekerjaan.

1. Pilih satu/beberapa pekerja, klik kanan pohon/deposit/ladang. Sistem menyimpan resource ID dan mencari slot kerja yang bisa dicapai.
2. Worker berjalan melalui jalur; animasi alat baru dimulai setelah mencapai slot.
3. Gather menambah muatan personal dan mengurangi deposit sebesar jumlah yang sama, berdasarkan waktu simulasi. Seratus klik tidak mempercepat produksi.
4. Kapasitas awal 12 unit muatan; upgrade meningkatkan kapasitas. Satu pekerja membawa satu jenis resource pada satu waktu.
5. Saat penuh, pekerja pergi ke drop-off kompatibel dengan biaya jalur terpendek, bukan jarak lurus terdekat.
6. Stok global baru bertambah ketika event penyetoran valid terjadi. Muatan dikosongkan tepat sekali.
7. Worker kembali ke slot/deposit lama bila tersedia; jika habis, pilih sumber jenis sama di area job dengan radius pencarian 20 meter. Bila tidak ada, idle dan beri notifikasi tunggal.

Contoh penerimaan wajib: stok wood 100, pohon 300, pekerja membawa 0. Sesudah mengambil 12, stok tetap 100, pohon 288, muatan 12. Sesudah setor, stok 112, pohon tetap 288, muatan 0. Jika pekerja mati sebelum setor, stok tetap 100; muatan hilang untuk aturan awal. Tidak ada duplikasi saat pause, save/load, pindah job atau pembatalan.

### 6.3 Perilaku tepi

- Pindah job saat membawa barang: setor barang lama dulu bila ada jalur aman; lalu kerjakan perintah baru. Perintah retreat/garrison mengutamakan keselamatan dan mempertahankan muatan.
- Drop-off hancur saat perjalanan: cari alternatif yang dapat dicapai. Bila tidak ada, berhenti membawa barang dengan ikon “tempat setor tidak tersedia”.
- Deposit diblokir: pekerja tidak teleport atau menembus tembok; cari slot lain lalu tampilkan status blocked jika semua gagal.
- Beberapa pekerja: slot/reservasi mencegah menumpuk satu titik. Setiap pengambilan resource bersifat atomik agar deposit terakhir tidak diklaim dua pekerja.
- Serangan pada warga: default flee ke titik aman/Town Center; pemain bisa memerintahkan bertahan. Muatan tidak hilang akibat perintah biasa.
- Berburu membutuhkan pembunuhan hewan lalu pemotongan; hewan buruan dapat lari. Ternak memakai kandang/area domestik yang dapat dipilih.
- Farm dibangun dengan wood dan memiliki persediaan food per siklus. Auto-reseed memakai biaya yang tertulis; bila stok kurang, menunggu dan tidak berutang/menjadi negatif.
- Pertumbuhan ekonomi berhenti ketika game single-player dipause; mengganti kecepatan game mengubah seluruh simulasi dengan faktor yang sama.

### 6.4 Nilai awal ekonomi untuk tuning

Resource awal F/W/G/S = 260/220/100/80. Gather baseline food 0,65; wood 0,60; gold 0,50; stone 0,45 unit per detik simulasi saat sedang bekerja. Waktu berjalan dan menyetor menurunkan hasil efektif. Deposit awal pohon 180 wood, berry 250 food, petak tambang 700 gold/stone. Parameter disimpan di data; bukan konstanta tersebar pada renderer.

Upgrade: alat tingkat 1 memberi +10% laju kerja; gerobak menambah kapasitas muatan dari 12 ke 18 dan +8% kecepatan mengantar; alat tingkat 2 memberi +12% tambahan secara perkalian setelah tingkat 1. UI menunjukkan rumus dan nilai efektif. Angka harus ditinjau melalui match nyata sebelum final.

## 7. Perdagangan dan logistik

Market terbuka Feudal. Tukar beli/jual resource memakai gold, spread awal 20%, jumlah transaksi 50 unit. Transaksi berulang menggeser harga dalam rentang yang ditentukan data; harga yang akan dibayar ditampilkan sebelum konfirmasi. Tidak boleh ada putaran beli-jual yang menghasilkan keuntungan tanpa perubahan eksternal.

Trade cart mempunyai muatan, perjalanan fisik dan risiko diserang. Skirmish 1v1 memakai pasar netral di area yang diperebutkan. Putaran Town Market → neutral market → Town Market menghasilkan gold hanya saat pulang; jarak memakai rute valid yang dibatasi agar tidak dieksploitasi lewat waypoint buatan. Pendapatan awal = tarif dasar + faktor jarak yang diset data. Mengganti tujuan mengulang perhitungan pada perjalanan baru, bukan membuat pembayaran instan.

Supply v1 berupa populasi, waktu rekrut dan biaya, tanpa konsumsi food pasif untuk tentara. Rantai produksi senjata individual dan kereta amunisi ditunda; prajurit tetap menunjukkan perlengkapan yang sesuai kelas/upgrade.

## 8. Era, riset dan perubahan yang terlihat

| Era | Ekonomi/struktur | Militer | Perubahan visual wajib |
|---|---|---|---|
| Dark Age | TC, rumah awal, kamp kayu/tambang, pangan, barracks | Warga, pengintai, milisi, tombak ringan | Kayu/anyaman/kain sederhana; permukiman awal yang koheren |
| Feudal Age | Market, mill upgrade, stable, range, palisade dan tower | Pedang/perisai, archer, skirmisher, kavaleri ringan | Fondasi lebih kokoh, perlengkapan lebih lengkap, banner dan atap berbeda |
| Castle Age | TC tambahan, smithy lanjutan, benteng batu, siege workshop | Knight, cavalry archer, unta, ram, mangonel | Mail/armor, pelana, perisai, menara batu dan crenellation |
| Imperial Age | Landmark tinggi, teknologi ekonomi dan pertahanan akhir | Varian elite, trebuchet, gunpowder hanya skenario/faksi yang cocok | Armor/senjata tingkat akhir, arsitektur diperkuat dan efek produksi |

Urutan era adalah penyederhanaan gameplay. Campaign mengunci tanggal, wilayah dan teknologi; unit gunpowder tidak muncul pada cerita yang tidak sesuai. Roster historis dan kostum belum dianggap terverifikasi hanya karena tercantum di PRD.

Kenaikan era diteliti di Town Center. Draft biaya/waktu: Feudal 420F/100G/90 detik, Castle 720F/320G/140 detik, Imperial 1.050F/650G/190 detik. Syarat: dua bangunan ekonomi berbeda untuk Feudal; stable/range/barracks dan smithy untuk Castle; benteng serta dua riset militer untuk Imperial. UI menampilkan syarat terpenuhi/tidak, biaya dan progress. Era research memakai satu slot riset terpisah dari antrean warga; maksimal satu riset era aktif per pemain.

Unlock tidak otomatis meningkatkan semua pasukan menjadi elite. Riset armor/senjata meng-upgrade unit yang sudah ada secara atomik setelah selesai: HP diperbarui dengan mempertahankan rasio kesehatan, damage/range dihitung ulang, perlengkapan/mesh berubah. Unit yang sedang menyerang menyelesaikan event serang lama sebelum memakai profil baru. Batal riset mengembalikan 80% biaya, tanpa efek parsial.

Bangunan biasa menerima refresh visual era tanpa bonus HP gratis; peningkatan pertahanan menggunakan upgrade bangunan tersendiri. Era, upgrade armor, dan upgrade benteng adalah tiga sistem berbeda yang harus dijelaskan di tooltip.

## 9. Roster lengkap dan fungsi pasukan

Interpretasi frasa pengguna “pakek prosa”: perisai. Roster mencakup varian berperisai dan tanpa perisai. Nomor di bawah adalah keluarga gameplay, bukan bukti aset sudah tersedia. Perbedaan tier, armor dan senjata tidak boleh dihitung sebagai model unik jika hanya mengubah nama.

F/W/G/S = food/wood/gold/stone. Semua angka biaya/waktu adalah seed balancing orisinal. Unlock peradaban ada di bagian 10.

| ID | Unit/keluarga | Era pertama | Senjata/pelindung & peran | Biaya awal; waktu; pop | Risiko/counter utama |
|---|---|---|---|---|---|
| U01 | Warga | Dark | Alat kerja; gather/build/repair | 45F; 20s; 1 | Semua tentara |
| U02 | Penjelajah jalan kaki | Dark | Senjata pendek, tanpa armor; sight tinggi | 35F; 18s; 1 | Hampir semua pasukan; damage bangunan minimal |
| U03 | Pengintai berkuda | Dark | Kuda ringan, senjata pendek; scouting | 65F; 28s; 2 | Tombak, pertahanan |
| U04 | Milisi pedang | Dark | Pedang tanpa perisai; tempur awal | 45F/10G; 22s; 1 | Archer, infanteri berarmor |
| U05 | Pedang dan perisai | Feudal | Pedang satu tangan/perisai; garis depan | 60F/25G; 28s; 1 | Crossbow, cavalry charge |
| U06 | Infanteri berat | Castle | Pedang/mail/perisai; upgrade armor akhir | 75F/40G; 34s; 1 | Anti-armor, siege splash |
| U07 | Penombak ringan | Dark | Tombak tanpa perisai; anti-kuda | 45F/25W; 24s; 1 | Pemanah dan pedang |
| U08 | Penombak berperisai | Feudal | Tombak/perisai; brace defensif | 55F/25W/10G; 28s; 1 | Flank, swordsman, siege |
| U09 | Pikeman | Castle | Tombak panjang dua tangan; tahan charge | 65F/35W; 30s; 1 | Archer dan serangan samping |
| U10 | Pemanah jalan kaki | Feudal | Busur/quiver; tembak dari belakang | 35F/45W; 26s; 1 | Kavaleri cepat, skirmisher |
| U11 | Pemanah jarak jauh khas | Castle | Busur panjang; keunikan faksi | 45F/60W/15G; 32s; 1 | Kavaleri, armor, siege |
| U12 | Crossbowman | Castle | Crossbow; menembus armor lebih baik, reload lambat | 40F/45W/30G; 32s; 1 | Kavaleri ringan, reload window |
| U13 | Pelempar lembing/perisai | Feudal | Javelin, perisai; anti-archer | 35F/35W; 24s; 1 | Pedang, kavaleri |
| U14 | Kavaleri pedang ringan | Feudal | Kuda, pedang, armor ringan | 85F/20G; 32s; 2 | Tombak; benteng |
| U15 | Kavaleri tombak/lance | Castle | Charge dengan lance; sidearm jarak dekat | 105F/45G; 38s; 2 | Brace, ruang sempit |
| U16 | Kesatria pedang berat | Castle | Kuda, pedang, shield/mail; elite armor akhir | 120F/65G; 42s; 2 | Pike, crossbow, biaya tinggi |
| U17 | Pemanah berkuda | Castle | Kuda, busur; tembak dan berpindah | 95F/50W/35G; 38s; 2 | Archer massal, skirmisher; berhenti saat aim |
| U18 | Pasukan unta tombak | Castle | Unta dengan rig tersendiri; peran anti-mounted | 100F/35W/30G; 38s; 2 | Tombak jalan kaki, panah |
| U19 | Pasukan unta pedang | Castle | Unta/penunggang dengan senjata pedang | 115F/45G; 40s; 2 | Infanteri defensif, ranged |
| U20 | Healer | Castle | Perlengkapan dukungan; heal di luar pertarungan | 80G; 35s; 1 | Semua unit ofensif |
| U21 | Pendobrak/ram | Castle | Roda, atap pelindung, balok dan awak | 180W/70G; 50s; 3 | Infanteri melee, api/serangan anti-siege |
| U22 | Mangonel | Castle | Mesin pelontar; splash, perlu perlindungan | 210W/110G; 60s; 3 | Kavaleri, jarak dekat |
| U23 | Trebuchet | Imperial | Setup/pack, proyektil batu jarak jauh | 280W/170G; 70s; 3 | Raid, ram, siege balasan |
| U24 | Bombard | Imperial, bersyarat | Artileri untuk campaign/tech set yang sesuai | 200W/230G; 75s; 3 | Kavaleri, reload lambat |
| U25 | Trade cart/karavan | Feudal | Gerobak dengan barang/pengemudi | 80W/40G; 35s; 1 | Raid di rute perdagangan |

Unit unik tambahan seperti cavalry elite Prancis tidak menambah seluruh kelas baru tanpa fungsi; ia merupakan varian dengan profil, model dan teknologi khusus yang terdokumentasi. U24 hanya mengganti opsi siege dalam skenario yang cocok, bukan syarat setiap peradaban.

### 9.1 Counter dan perisai

Counter adalah bonus tertulis pada tag target, bukan kemenangan mutlak. Tombak memberi bonus terhadap `mounted`; crossbow terhadap `heavy_armor`; ram terhadap `structure`; skirmisher terhadap `ranged_light`. UI menampilkan kategori “efektif melawan” dan “rentan terhadap” secara terpisah agar tidak ambigu.

Perisai memberi perlindungan proyektil dari sektor depan 120° pada kondisi hold/brace; tidak melindungi punggung atau splash. Unit tanpa perisai tidak memainkan animasi block perisai. Berat armor mengurangi mobilitas berdasarkan definisi unit, bukan sekadar warna tekstur. Camelry diberi peran melalui balance yang eksplisit; game tidak mengklaim efek taktisnya sebagai hukum sejarah universal.

### 9.2 Recruitment yang benar

U01–U03 tersedia dari Town Center pada Dark Age; U03 pindah ke stable saat Feudal. Semua unit lain mengikuti bangunan kelasnya pada bagian 11. Unik infantry/ranged/cavalry memakai keep atau fasilitas kelas yang dinyatakan tech tree per faksi, tanpa membutuhkan bangunan yang belum tersedia pada era unlock.

Bangunan produksi memiliki antrean terlihat maksimal 12 entri; biaya dibayar saat masuk antrean. Populasi dipesan saat unit mulai dilatih. Tidak dapat mulai bila kapasitas tidak cukup; tooltip menunjukkan penyebab. Selesai training memunculkan unit di exit slot yang bebas dan menuju rally point. Exit tertutup membuat unit siap menunggu, tidak menumpuk di dalam bangunan.

Cancel sebelum training dimulai: 100% refund; setelah mulai: 80% refund; reservasi populasi dilepas tepat sekali. Bangunan hancur membatalkan antrean menunggu dengan refund 100%; unit aktif hilang tanpa refund. Rally ke resource memberi job otomatis hanya untuk warga; tentara tetap memakai perintah gerak/attack-move yang sesuai.

## 10. Peradaban, roster dan landmark

Target v1 terdiri dari lima paket peradaban. Inggris, Prancis, Kastilia dan Ayyubiyah melanjutkan katalog awal; paket Steppe/Mongol adalah penambahan yang diusulkan untuk identitas mounted archery. Nama/era/arsitektur spesifik adalah **kandidat desain** yang membutuhkan riset sumber sebelum aset dibeli atau dibuat. Tidak ada klaim roster final sudah akurat secara historis.

| Paket | Fokus desain | Khas gameplay yang dirancang | Arah aset dan landmark |
|---|---|---|---|
| Inggris | Archer dan pertahanan posisi | Upgrade longbow; bonus gather food +8% dekat mill | Hall kayu/batu, kit benteng, landmark aula pemerintahan |
| Prancis | Kavaleri berat dan dukungan ekonomi | Elite cavalry; training cavalry -10% setelah riset | Kit istana/keep, perlengkapan knight, landmark kediaman kerajaan |
| Kastilia | Mobilitas dan pertahanan perbatasan | Light cavalry; biaya stone outpost -12% | Kit alcázar, bangunan halaman, landmark benteng kerajaan |
| Ayyubiyah | Pasukan unta dan perdagangan | Unta dua loadout; pendapatan caravan +10% | Kit citadel/rumah halaman, pasar, landmark administrasi berbenteng |
| Steppe/Mongol | Mounted archery dan manuver | Horse archer; deploy/reposition lebih cepat | Kit permukiman dan pusat kekuasaan yang diteliti tersendiri |

Bonus adalah usulan mekanik, bukan pernyataan sifat bangsa atau fakta sejarah. Besaran berbeda harus dihitung dalam laporan balance. Setiap paket mempunyai sekurangnya satu teknologi unik dan dua loadout militer khas. Logo, warna, patung, pakaian dan VO dibuat konsisten berdasarkan paket riset.

Matriks ketersediaan awal: `✓` tersedia setelah era; `K` varian khas; `—` tidak tersedia. Semua mendapat warga, scout, infanteri dasar, archer, healer, ram, mangonel, trebuchet dan perdagangan kecuali campaign membatasi.

| Keluarga | Inggris | Prancis | Kastilia | Ayyubiyah | Steppe |
|---|---|---|---|---|---|
| Long-range bow U11 | K | — | — | — | — |
| Crossbow U12 | ✓ | K | K | ✓* | —* |
| Knight U16 | ✓ | K | ✓ | —* | —* |
| Light sword cavalry U14 | ✓ | ✓ | K | ✓ | ✓ |
| Lance cavalry U15 | ✓ | K | ✓ | ✓* | ✓* |
| Horse archer U17 | — | — | — | — | K |
| Camel spear U18 | — | — | — | K* | — |
| Camel sword U19 | — | — | — | K* | — |
| Bombard U24 | Skenario | Skenario | Skenario | — | — |

`*` merupakan keputusan roster sementara yang harus lulus tinjauan periode/region. Jika tidak lolos, ganti identitas historis unit/faksi yang relevan tanpa menghapus kebutuhan pemain akan kavaleri, mounted archery dan camelry dari keseluruhan game.

### Landmark wajib mempunyai fungsi

Setiap paket punya satu landmark pemerintahan yang berperan dalam kondisi kemenangan dan satu landmark spesialis yang dipilih untuk ekonomi atau militer. Model unik, footprint, HP, biaya, era, waktu konstruksi, efek, VFX, keadaan rusak dan keadaan hancur wajib tersedia. Tooltip menjelaskan area/radius efek dan apakah efek ditumpuk.

Landmark spesialis bukan objek kebal: musuh dapat menghancurkannya; bonus berhenti ketika hancur. Pembangunan ulang mengembalikan bonus setelah selesai, tanpa pembayaran bonus dua kali. Nama bangunan bersejarah final memerlukan referensi bentuk sesuai tanggal campaign; menamai kotak umum “Citadel of Cairo” tidak cukup.

Pemain memilih peradaban sebelum match. Panel saat bermain untuk inspeksi; tidak boleh mengganti faksi di tengah pertandingan dan mempertahankan semua bonus atau roster sebelumnya.

## 11. Bangunan, penempatan dan upgrade benteng

| ID | Bangunan | Era | Fungsi minimum |
|---|---|---|---|
| B01 | Town Center | Dark | Train warga dan scout awal, drop-off semua resource, garrison 10, riset era |
| B02 | Rumah | Dark | +10 populasi setelah selesai; variasi tingkat era |
| B03 | Mill/granary | Dark | Drop-off food dan riset pertanian |
| B04 | Lumber camp | Dark | Drop-off wood dan upgrade kapak |
| B05 | Mining camp | Dark | Drop-off gold/stone dan upgrade tambang |
| B06 | Farm | Dark | Food terbarukan lewat reseed berbiaya |
| B07 | Barracks | Dark | Milisi, pedang, spear/pike |
| B08 | Archery range | Feudal | Archer, crossbow, skirmisher |
| B09 | Stable | Feudal | Horse units dan riset mounted |
| B10 | Camel stable | Castle | Unit unta pada faksi pemiliknya |
| B11 | Smithy | Feudal | Armor, senjata, perlengkapan visual |
| B12 | Market | Feudal | Exchange dan caravan |
| B13 | Palisade/gerbang kayu | Feudal | Menghalangi rute; gerbang dapat dikunci |
| B14 | Watchtower | Feudal | Sight, garrison 5, serangan defensif |
| B15 | Tembok/gerbang batu | Castle | Pertahanan modular dengan koneksi/jalur |
| B16 | Keep/benteng | Castle | Garrison 15, pertahanan, unique-unit production |
| B17 | Siege workshop | Castle | Ram/mangonel; riset siege |
| B18 | Rumah penyembuhan | Castle | Healer dan dukungan |
| B19 | Academy | Imperial | Teknologi ekonomi/militer akhir |
| B20 | Landmark pemerintahan | Castle | Kondisi kemenangan dan identitas faksi |
| B21 | Landmark spesialis | Imperial | Bonus unik pilihan |

### 11.1 Konstruksi

Preview footprint mengikuti kursor, dapat dirotasi dan diberi alasan bila invalid: terrain terlalu curam, overlap, air, luar area terjelajah, menutup exit kritis. UI menunjukkan biaya sebelum konfirmasi. Resource dibayar saat fondasi ditempatkan; satu unit pekerja wajib mencapai slot konstruksi.

Tahap visual: fondasi → kerangka/scaffolding → atap/dinding → selesai. Banyak pekerja mempercepat dengan diminishing return, misalnya faktor `1 + 0,6 × (n−1)`, dibatasi lima pekerja efektif. Bangunan belum selesai tidak memproduksi atau memberi bonus populasi. Fondasi memiliki collision sehingga rute dihitung ulang; blocker yang menjebak unit ditolak sebelum placement.

Batal fondasi sebelum pekerja mulai: 100% refund. Setelah pekerjaan mulai: 70% biaya dikalikan sisa proporsi konstruksi. Bangunan yang dihancurkan musuh tidak memberi refund. Blueprint hancur, workers bebas mencari job baru/idle.

### 11.2 Upgrade benteng wajib

| Tahap | Syarat/usulan biaya | Perubahan tampilan | Perubahan fungsi |
|---|---|---|---|
| Keep I | Castle; 420S/180W; 150s bangun | Benteng dasar, gerbang dan menara sudut | HP dasar, 15 garrison, produksi unik |
| Keep II | Castle + masonry; 260S/120G; 90s | Dinding lebih tebal, parapet/menara tambahan | +25% max HP, +1 range, armor struktur naik |
| Keep III | Imperial; 400S/240G; 130s | Gatehouse diperkuat, atap/tower tingkat akhir | +20% max HP dari II, 20 garrison, slot defensif |

Semua angka awal untuk balancing. Upgrade memakai slot khusus; bangunan tetap mempertahankan serangan lama dan tidak menerima bonus sebelum selesai. HP ratio dipertahankan ketika maksimum naik. Jika hancur saat upgrade, riset dan bonus batal; tidak memunculkan versi baru. Save/load menyimpan tier dan progress. Tampilan model berubah sesuai tier, bukan sekadar diperbesar.

Wood palisade dan stone wall memakai blueprint berbeda. Konversi jaringan kayu ke batu bukan upgrade instan v1; pemain membangun ulang segmen. Tiap segmen punya HP sendiri; sambungan gerbang/corner mesti tanpa celah collision yang tidak disengaja.

Watchtower kayu dapat ditingkatkan menjadi tower batu pada Castle dengan biaya 140S/60G dan waktu 65 detik; model, HP serta armor berubah setelah selesai. Gerbang batu mempunyai reinforcement research tersendiri (+20% HP, 90S/40G, 45 detik). Peningkatan range panah dilakukan melalui riset pertahanan; upgrade ini tidak memberikan serangan artileri pada faksi/era yang tidak mengizinkannya. Semua angka adalah draft.

### 11.3 Repair dan garrison

Repair memerlukan pekerja, waktu dan resource proporsional kerusakan. Jika resource habis, pekerjaan menunggu. Repair tidak dapat menghidupkan kembali bangunan rubble. Bangunan terbakar menunjukkan tingkat kerusakan; efek kebakaran tidak otomatis menyebabkan damage tambahan kecuali aturan serangan menyatakan demikian.

Garrison benar-benar menyimpan unit, melepasnya dari dunia aktif dan memberi kapasitas yang jelas. Ungarrison mencari exit slot aman; kapasitas berlebih menunggu, tidak teleport. Saat bangunan hancur, unit keluar ke slot terdekat dengan kehilangan 25% HP saat ini; bila tidak ada slot, urai pencarian radius bertahap. Kesehatan tetap positif setelah aturan evakuasi kecuali damage penghancuran unit diterapkan terpisah.

## 12. Combat, proyektil dan pengepungan

State tempur: acquire target → approach → face target → wind-up → hit/release → recovery → reacquire. Musuh dipilih berdasarkan sight dan perintah; unit tidak menyerang musuh yang hanya diketahui dari memori fog.

Draft rumus: `damage = max(1, baseAttack − applicableArmor) × classMultiplier × situationalModifier`. Jenis melee, pierce, siege memiliki armor/bonus tersendiri. Perisai frontal dan brace adalah situational modifiers. Semua multiplier mempunyai cap tertulis; urutan operasi konsisten pada UI dan sim.

Melee memakai jarak, facing dan hit event di tick yang ditetapkan. Satu ayunan menghasilkan satu damage event. Proyektil mempunyai waktu terbang, asal pelepasan, titik sasaran dan aturan hit/miss. Panah tidak mengurangi HP pada saat animasi menarik busur. Saat kualitas rendah menyembunyikan proyektil, simulasi hit tetap sama. Bangunan menghalangi line-of-fire sesuai kategori; arc siege dapat melewati obstacle rendah tetapi tidak menembak di luar range.

Cavalry charge membutuhkan minimal 8 meter lintasan maju dan cooldown 12 detik; kehilangan kecepatan/terhalang membatalkan charge. Lance berganti sidearm pada kontak dekat melalui animasi dan attachment yang sesuai. Horse archer v1 berhenti sejenak untuk aim/shoot agar window serang dapat dibalas; tidak menembak omnidirectional sambil berlari tanpa animasi.

Healer hanya mengobati allied unit yang tidak memberi/menerima damage selama 5 detik. Heal mengisi 4 HP/detik, berhenti saat target menerima damage/keluar range 5 meter, tidak menghidupkan kembali unit, dan tidak menumpuk dari beberapa healer pada target yang sama. Target dipilih manual atau otomatis berdasarkan persentase HP terendah dalam range; semua parameter dapat dituning.

### Siege khusus

- Ram bergerak lambat, memiliki turning radius dan footprint. Memilih gerbang memberi titik serang pada permukaan gerbang yang bisa dicapai. Awak/roda bergerak saat perjalanan; balok hanya berayun ketika posisi serang valid. Damage terjadi saat kontak balok. Ram tidak memukul dari seberang tembok.
- Ram tahan pierce biasa dan rentan melee. Awak adalah bagian visual/simulasi mesin, tidak dihitung sebagai tentara bebas atau populasi ganda. Sistem transport/garrison ram tidak termasuk v1.
- Mangonel memiliki minimum range dan splash radius; friendly fire berlaku untuk proyektil siege dan terlihat di tooltip.
- Trebuchet memakai state packed → unpacking → deployed → packing; tidak bergerak sambil menembak. Jeda perubahan state 6 detik, batal kembali ke state valid tanpa duplikasi proyektil.
- Tembok/gerbang yang HP-nya nol memainkan runtuh, melepas blocker pada event runtuh tertentu dan memperbarui navgraph. Rubble tersisa sebagai dekorasi nonblocking kecuali skenario menyatakan berbeda.
- Tower dan keep memilih target visible; bonus garrison dibatasi maksimum damage, tidak menghasilkan proyektil tak terbatas. Siege dapat menjadi prioritas target manual.
- Kematian unit menghilangkan target, reservasi kerja dan populasi tepat sekali. Corpse mempunyai timer visual; tidak memakan kapasitas penduduk setelah mati.

## 13. Gerak, formasi dan navigasi

Movement berbasis posisi sim; render menginterpolasi antartick. Unit mempunyai radius, kecepatan maksimum, percepatan, perlambatan dan turn rate. Kuda/unta/ram memiliki radius dan turn rate sendiri. Gerakan tidak boleh berupa sekumpulan titik yang saling melewati.

Navigation menggunakan peta keterlintasan, pencarian rute jarak jauh, penghindaran lokal dan slot tujuan. Perubahan tembok/gerbang/fondasi menginvalkan area rute yang terkait. Jika unit tertahan selama 2 detik tanpa progres bermakna, lakukan replanning; setelah gagal tiga kali, tampilkan blocked dan tunggu perintah baru. Jangan menggunakan teleport sebagai penyelesaian normal.

Formasi: spread, line, compact dan wedge untuk cavalry. Setiap unit mendapat slot; kelompok campuran menempatkan infantry depan dan ranged belakang. Masuk gerbang/jembatan mengubah menjadi kolom, lalu membentuk ulang di ruang terbuka. Tidak ada bonus damage formasi tersembunyi; manfaat awal berasal dari posisi/brace.

Attack-move bertempur pada musuh yang ditemui lalu melanjutkan tujuan; move biasa mengutamakan perjalanan; hold mempertahankan radius kecil dan tidak mengejar jauh; patrol mengulangi waypoint; stop menghapus perintah aktif; Shift menyusun antrean. Drag select, Shift select, control group, select idle worker, double-click kelas sama dan selection cap bekerja konsisten. Klik resource dengan pekerja terseleksi adalah perintah kerja, bukan mengganti seleksi pekerja.

## 14. Anatomi, rig dan animasi yang wajib

### 14.1 Bentuk karakter

Manusia wajib memiliki kepala/wajah dasar, leher, torso, bahu, lengan atas/bawah, tangan, paha/betis dan kaki yang proporsional. Siluet tidak berupa kapsul dengan bola kepala. Armor mengikuti bentuk tubuh; sarung pedang, quiver, perisai dan sabuk melekat pada socket yang benar. Tidak boleh mengklaim manusia final hanya karena jumlah segmen bola ditambah.

Kuda memiliki empat kaki bersendi, hoof, leher, kepala, telinga, ekor dan pelana; unta memiliki anatomi, proporsi, rig dan gait tersendiri. Penunggang duduk pada pelana dengan tangan pada reins/senjata dan kaki pada posisi masuk akal. Rider dan mount adalah satu entity tempur dengan rig terkoordinasi; death keduanya merupakan animasi yang disusun, bukan horse hilang sementara rider berdiri melayang.

### 14.2 Matriks clip

| Kelompok | Clip minimum | Event/gameplay yang mengikuti |
|---|---|---|
| Semua humanoid | Idle 2 variasi, walk, run, start, stop, turn kiri/kanan, hit, death | Foot contact, perubahan kecepatan, lepas entity saat mati |
| Warga | Chop, mine, pick, harvest, carry, deposit, build, repair, flee | Alat kontak, muatan bertambah, penyetoran sekali |
| Pedang tanpa shield | Draw, slash, thrust, recovery | Hit window dan facing |
| Pedang dengan shield | Slash/thrust, shield hold/block, recovery | Perlindungan frontal hanya pada state yang valid |
| Tombak/pike | Thrust, brace, release-brace | Anti-charge dan range ujung senjata |
| Archer | Nock, draw, aim, release, recover | Panah muncul di tangan lalu dilepas dari busur |
| Crossbow | Load, crank/draw sesuai senjata, aim, fire | Cooldown reload yang terlihat |
| Horse/camel | Idle, walk, trot/run sesuai hewan, start/stop, turn, hit, death | Kecepatan gait dan kontak tanah |
| Mounted melee | Rider locomotion, charge, left/right swing, hit/death | Sinkron saddle dan target samping |
| Mounted ranged | Rider locomotion, nock/aim/release, recover | Batas sudut bidik dan jeda tembak |
| Ram | Idle, wheel move, crew push, swing, impact, destroy | Roda mengikuti jarak dan hit struktur |
| Mangonel/trebuchet | Load, tension, fire, recovery, pack/unpack yang relevan | Proyektil dilahirkan pada release |
| Bangunan | Tahap konstruksi, idle accents, damage, collapse | Progres kerja, kapasitas dan collision |

Clip boleh dibagi antarunit bila skeleton kompatibel dan tidak merusak perbedaan pose senjata. Mount dan manusia tidak memakai skeleton yang sama. Aksi kerja harus memegang alat sesuai komoditas; penambang tidak memakai animasi busur.

### 14.3 Kriteria kualitas animasi

Transisi awal ditargetkan 0,12–0,25 detik; hindari snapping. Kecepatan walk/run menyesuaikan stride sehingga telapak tidak meluncur jauh saat fase kontak. Pada capture close-up 10 detik permukaan datar, telapak yang sedang menapak tidak bergeser lebih dari 10 cm selama satu fase kontak; deviasi medan harus diperbaiki dengan koreksi pose/IK sederhana atau pemilihan jalur.

Turn-in-place berlaku saat berhenti; berlari memakai radius belok, bukan berputar 180° satu frame. Replay klip harus bebas tangan menembus torso, tombak menembus badan sendiri, rider melayang dan panah yang keluar dari perut. Pemeriksaan mencakup empat sudut kamera serta locomotion pada lereng dan perubahan kecepatan game.

Animasi tidak menjadi sumber kebenaran hit/resource. Simulasi menentukan tick event; visual mengikuti event tersebut. Menurunkan animation update rate pada LOD jauh tidak mengubah DPS atau ekonomi.

## 15. Standar model, tekstur dan inventaris aset

Target visual adalah realisme terbaca dari kamera RTS, bukan menambah polygon tanpa hasil visual. Semua aktor utama wajib mesh 3D; billboard hanya untuk vegetasi sangat jauh/partikel, bukan pengganti prajurit dekat. LOD teknis diperbolehkan selama perubahan tidak menyebabkan wajah/badan menjadi bentuk kasar pada jarak bermain normal.

| Kategori | Anggaran awal dekat | Jarak bermain normal/jauh | Tekstur dan material |
|---|---|---|---|
| Manusia dan perlengkapan | 15–35 ribu triangle total | 5–12 ribu / 1–3 ribu | Atlas 1–2K, PBR, max 3 material utama |
| Mount + rider lengkap | 30–55 ribu | 10–18 ribu / 2–5 ribu | Atlas bersama; detail saddle/armor |
| Bangunan biasa | 15–50 ribu | 5–15 ribu / 1–4 ribu | Trim sheet/tileable 1–2K |
| Landmark | 50–120 ribu | 15–35 ribu / 3–8 ribu | Detail unik plus material bersama |
| Siege | 15–40 ribu | 5–12 ribu / 1–3 ribu | Kayu, metal, kain; rig mekanik |

Budget ini menggantikan asumsi bahwa seluruh pasukan selalu memakai 30–60 ribu triangle. Aset near hanya muncul pada sedikit unit saat zoom dekat; pada zoom lebar dipakai LOD yang mempertahankan silhouette. Pelanggaran budget memerlukan profil GPU, bukan pengurangan kualitas sepihak.

Wajib: base color tanpa shadow dibakar sembarangan, normal map, roughness, metallic bila relevan, AO; UV benar, skala konsisten, material kain/metal/kayu/batu berbeda. Warna tim ditempatkan pada surcoat, shield, banner atau aksen, bukan mengecat seluruh tubuh. Dua pasukan dari faksi berbeda tetap terbaca ketika warna tim sama.

Setiap asset package memuat GLB game, source authoring, tekstur, skeleton, clip list, LOD, collision proxy, socket, bounds, footprint bila bangunan, thumbnail aktual serta preview turntable. Preview harus berasal dari model yang benar-benar akan dipakai. Concept art atau gambar AI tidak dihitung sebagai mesh, rig atau animasi selesai.

Inventaris rinci pada [ASSET-PRODUCTION-MATRIX.csv](ASSET-PRODUCTION-MATRIX.csv). Satu keluarga unit dapat memakai kit modular, tetapi komponen helmet, shield, armor, weapon dan mount setiap loadout harus tercatat. Jumlah skin/tier tidak boleh dijumlah sebagai jumlah unit gameplay tambahan.

Lingkungan wajib meliputi pohon utuh/tumbang/stump, tambang tahap utuh/habis, berry, farm tahap tumbuh/panen/kering, hewan buruan dan ternak, sumber air, jalan, jembatan, rubble, scaffold, market props, karung, kayu bawaan dan hasil tambang. Senjata wajib pedang, tombak pendek, pike, lance, busur, crossbow, lembing, shield, quiver, ram beam dan batu siege.

## 16. Hak pakai dan perolehan aset

Setiap file mencatat creator, sumber, lisensi beserta versinya, tanggal perolehan, bukti pembelian/claim bila berlaku, pemegang hak pakai proyek, perubahan yang dilakukan dan kebutuhan atribusi. Status yang dipakai: proposed → acquired → rights-reviewed → integrated → approved. Daftar URL kandidat tidak mengubah status menjadi acquired.

Pilihan asal: aset orisinal pesanan, marketplace dengan hak penggunaan game yang sesuai, atau aset terbuka yang syaratnya dipenuhi. Pembelian menunggu budget dan pemegang akun yang benar. Hak pakai tidak berarti hak eksklusif atau kepemilikan hak cipta atas aset pihak ketiga. File sumber, invoice dan data pembayaran disimpan di arsip privat; distribusi web dan konversi GLB diperiksa terhadap syarat aset yang dipilih.

Tidak ada model produksi yang dianggap tersedia pada penulisan PRD ini. File `gltf-runtime.ts` adalah helper dan bukan bukti model sudah dipakai di scene. Implementasi harus menunjukkan manifest ID → file nyata → mesh di dunia → rig/aksi → bukti penerimaan.

## 17. Audio dan umpan balik

Audio rilis mencakup musik menu, ambience biome, langkah tanah/batu, horse hoof, suara unta yang sesuai, alat kerja, proses setor, produksi, shield impact, bow release, hit armor, charge, siege fire/impact, runtuh gerbang, alarm dan hasil match. Voice command memberi variasi agar tidak mengulang satu klip setiap klik. Atur priority dan concurrency supaya 100 unit tidak menghasilkan 100 suara penuh setiap frame.

Volume master, music, effects dan voices benar-benar mengendalikan bus audio. Mute dan kehilangan fokus bekerja tanpa memengaruhi simulasi. Subtitle tersedia untuk briefing/cerita dan notifikasi penting tidak bergantung pada suara. Selama aset audio belum tersedia, UI harus mengatakan belum tersedia dan tidak menampilkan slider yang pura-pura bekerja.

## 18. Main menu, setup, HUD dan settings

Main menu: New Skirmish, Continue bila save valid tersedia, Campaign, Encyclopedia/Tech Tree, Settings, Credits/Asset Attribution, Patch Notes. Mode belum siap tampil dengan status jelas; tidak memakai tombol Start aktif untuk fitur kosong. Tanpa onboarding paksa.

Setup match: peradaban pemain/lawan, warna tim, map dan preview nyata, seed, AI difficulty, kecepatan game, populasi maksimum dan kondisi kemenangan. Faksi dikunci pada awal. Start memperlihatkan progress loading aset, dapat membatalkan sebelum simulasi mulai, dan memberi retry bila ada file rusak.

HUD: resource, population aktif/reserved/cap, pekerja idle, era/research timer, minimap hidup, selection details, HP/armor/range, production queue, command grid, objective, notifikasi under attack. Pilih bangunan memperlihatkan rekrut/upgrade yang benar-benar tersedia. Tooltip menyebut resource kurang, syarat era, bangunan belum selesai atau slot populasi.

Settings: render scale, kualitas shadow, target FPS, vegetasi, VFX, UI scale, camera/zoom speed, edge scroll, warna aksesibel, audio bus, bahasa dan remap hotkey. Preset tidak mengubah jumlah unit simulasi, fog atau efektivitas senjata. Tombol Apply, Restore Defaults dan Cancel punya perilaku konsisten. Keybinding konflik memberi peringatan dan dapat diganti. Fullscreen mengikuti dukungan browser; kegagalan ditampilkan, tidak menjadi error diam-diam.

Pause membekukan sim termasuk gather, research, projectile, AI, win countdown dan produksi; rendering/UI tetap berjalan. Settings/faction encyclopedia yang dibuka dalam single-player juga pause sementara, lalu memulihkan status pause sebelumnya. Keyboard yang dipakai slider/menu tidak menggerakkan kamera atau melatih warga di belakang overlay. Kembali ke main menu menawarkan save ketika progress belum tersimpan.

## 19. AI dan difficulty

AI memakai stok, populasi, queue, pathfinding, fog dan resource node yang sama. Tidak mendapat penglihatan peta penuh atau spawn resource tersembunyi. Tahap keputusan: ekonomi → scouting → penilaian ancaman → pilihan komposisi → pertahanan/ekspansi → serangan/siege.

Easy mengambil keputusan lebih jarang dan agresi rendah; Normal menyeimbangkan ekonomi/militer; Hard melakukan scouting, counter dan serangan gabungan lebih baik. Hard v1 tetap tanpa bonus resource. AI harus bisa mengganti resource habis, membangun drop-off, memperbaiki pekerja idle, melewati bottleneck dan menghancurkan tembok memakai siege.

AI tidak boleh mengetahui unit di balik fog saat menentukan posisi serangan. Informasi terakhir terlihat mempunyai timestamp dan confidence. Rekaman debug menampilkan sebab keputusan agar masalah “AI diam” dan “AI curang” dapat dibuktikan.

## 20. Campaign

Campaign pertama berisi empat misi: mempertahankan settlement, merebut rute komoditas, menyerang gerbang dengan ram, dan pengepungan benteng tingkat akhir. Ini misi bermain penuh, bukan tutorial yang dipaksakan sebelum skirmish. Briefing menyatakan tahun/lokasi/faksi, objective utama, optional objectives, kondisi kalah dan batas teknologi.

Pemilihan peristiwa sejarah final menunggu riset. Setiap misi memiliki dossier sumber yang membedakan fakta, rekonstruksi visual dan dramatisasi. Event trigger, reinforcement dan perubahan objective terkonfigurasi data; reinforcement tidak muncul di lokasi terlihat tanpa alasan yang dinyatakan skenario. Save menyimpan trigger yang sudah terjadi sehingga cutscene/reward tidak diulang.

## 21. Arsitektur sistem dan kontrak data

Pertahankan Three.js sebagai renderer yang sudah dipakai, TypeScript dan Vite. Pindahkan logika dari `main.ts` secara bertahap; jangan menggabungkan jam ekonomi dengan loop animasi. Ini keputusan proyek, bukan klaim library tertentu menjamin performa.

| Komponen | Tanggung jawab | Input/output penting |
|---|---|---|
| World/Entity store | ID, komponen dan lifecycle | Spawn/despawn; ownership; health; tags |
| Simulation clock | Tick tetap 20 Hz awal, pause/speed | Tick ID, deltaSim; render interpolation |
| Command system | Seleksi menjadi perintah tervalidasi | Player ID, entity IDs, target ID/point, queue mode |
| Economy/jobs | Gather/cargo/deposit, build/repair | Job state, work slot, carried resource, drop-off ID |
| Navigation | Rute dan local avoidance | Radius, blocker version, path, destination slots |
| Production/research | Queue/cost/pop/unlock | Paid cost, progress, prerequisites, completion events |
| Combat | Targeting, range, hit, death | Attack profile, target tags, projectile/hit tick |
| Fog/visibility | Sight dan informasi terlihat | Shared visibility grid untuk UI/AI |
| Animation | State dan clip blending | Locomotion velocity, equipment, event markers |
| Asset manager | Load/cache/LOD/dispose | Manifest ID, files, status, progress, error |
| Civilization/tech | Roster, bonus, architecture set | Faction ID, era, unlocks, upgrades |
| AI | Command dengan aturan pemain | Observed world, planning interval |
| Save system | Snapshot dan version migration | Sim state lengkap, content version |
| UI/audio | Representasi sim dan preferensi | Subscribe events, no hidden game logic |

Entity minimal menyimpan id, owner, unit/structure definition ID, faction, era/tier, transform, collider, health, job/order, cargo, status, stats dan visual reference. Definisi unit menyimpan `effectiveAgainst` dan `vulnerableTo` terpisah; field lama `counter` yang ambigu harus dimigrasi. Runtime stat tidak diambil dari teks deskripsi.

Asset entity jangan dipandang siap hanya karena sudah dibeli: syarat ready = rights reviewed, file ada, dapat dimuat, model sesuai kategori dan integrasi disetujui. Runtime tidak meminta file `pending` lalu menyembunyikan kegagalan dengan proxy tanpa label.

## 22. Save, pemulihan dan versi

Save menyimpan seed/RNG state, tick, resources, cargo, jobs, unit/building health/tier/position, queue paid costs/progress, population reservation, research, fog, AI planning state, projectiles yang aktif, victory countdown, campaign triggers dan versi konten. Asset byte tidak disalin ke save; referensi memakai ID stabil.

Autosave setiap 120 detik simulasi dan saat sebelum kembali menu, dengan dua slot rotasi dan write atomik. Manual save dan export/import tersedia. Storage penuh atau private mode menampilkan kegagalan secara jelas, tidak menampilkan “saved” palsu. Content migration mempunyai versi; save yang tidak kompatibel diberi alasan dan tetap bisa diekspor.

Load di tengah workers membawa barang harus menghasilkan satu penyetoran; load saat arrow terbang tidak menduplikasi hit; load saat keep upgrade tidak menyelesaikan gratis. Continue hanya aktif jika save dapat dibaca dan sesuai content version.

## 23. Anggaran performa dan strategi ringan

Profil sementara: **MacBook Air M1, RAM 8 GB**, browser Safari dan Chrome yang dipakai saat pengujian, render internal 1600×900 medium. Ini perangkat target rancangan, bukan identifikasi MacBook pengguna. Profil low menargetkan 1280×720. Keputusan dukungan Mac Intel menunggu uji dan tidak dijanjikan sekarang.

| Skenario ukur | Target awal |
|---|---|
| Desa 60 unit total, 25 bangunan | Median 60 FPS; p95 frame ≤22 ms |
| Pertempuran 150 unit total, 40 bangunan | Median ≥45 FPS; p95 ≤33 ms |
| Beban 300 unit total, campuran siege/mounted | Median ≥30 FPS; p95 ≤45 ms; tidak crash/stall permanen |
| Command lokal sampai mulai respons | p95 ≤100 ms pada 150 unit |
| Main-thread simulation per tick | p95 ≤8 ms pada 150 unit |
| Session 30 menit | Tidak ada tren memori naik tanpa batas atau penurunan FPS terus-menerus |
| Download menuju sesi pertama | Target ≤45 MB compressed; faksi/peta tambahan dimuat sesuai kebutuhan |
| Memori | Target estimasi working set game ≤900 MB; tekstur resident ≤256 MB |

Browser tidak selalu mengekspos angka GPU/memori yang sama; laporan menyebut metode ukur/estimasi, versi browser, daya tersambung/tidak, suhu kondisi awal, resolusi dan preset. Tampilkan median, p95, 1% low bila tersedia, bukan FPS sesaat pada scene kosong. Profil stress tidak boleh mengurangi count pasukan secara tersembunyi.

Optimasi: shared geometry/material, instancing untuk objek statis, skinning/animation LOD, culling, spatial index, pooling proyektil/VFX, shadow distance terbatas, texture atlas, kompresi asset, incremental path replanning. Simulasikan entitas luar layar tetap benar; hanya pekerjaan visual yang dikurangi. Turunkan resolusi/shadow/vegetasi sebelum mengorbankan anatomi pasukan pada kamera normal.

Unit data, collision dan visual LOD dipisah. Jangan render setiap prajurit memakai ratusan mesh/material terpisah. Jangan menjalankan physics ragdoll seluruh tentara; death clip dengan corpse pooling cukup. Transisi LOD memakai hysteresis/crossfade bila perlu, tanpa popping besar.

## 24. Tahapan produksi dan syarat lewat

| Tahap | Hasil yang wajib dapat dimainkan | Syarat sebelum tahap berikut |
|---|---|---|
| T0 Audit/reset status | Daftar bug, inventory nyata, requirement IDs | Semua klaim fitur lama diberi status akurat |
| T1 Vertical slice mutu | 1 warga, 1 swordsman/shield, 1 archer, 1 horse rider produksi; 1 rumah dan camp; rig/animasi/PBR | Pengguna bisa melihat anatomi, langkah dan kerja tanpa proxy pada aset tersebut |
| T2 Ekonomi | Full gather/carry/deposit, construction, repair, queue/pop | Bukti transaksi resource dan state edge cases; sesi 15 menit stabil |
| T3 Tempur & siege | Damage/projectile, counter, fog, navigation, ram dan tembok | Satu pengepungan playable sampai gerbang runtuh dan pasukan masuk |
| T4 Empat era & roster | Semua keluarga wajib, unta, horse archer, keep tiers | Upgrade mengubah visual dan gameplay, seluruh roster bisa dipakai |
| T5 Peradaban & AI | Lima kit faksi/landmark bertahap, AI memakai ekonomi nyata | Skirmish penuh selesai pada semua faksi; bonus terukur |
| T6 Rilis | Save/load, menu/settings, audio, campaign empat misi, polish/performa | Semua R01–R12 lulus dan rights asset jelas |

T1 adalah gerbang mutu wajib sebelum memperbanyak 100 model. T1 tidak boleh dirilis sebagai klaim “game lengkap”. Estimasi hari/budget menunggu tim, sumber aset dan kapasitas produksi; tanggal selesai tidak ditebak dari ukuran PRD. Pekerjaan gameplay boleh paralel secara organisasi dengan produksi seni setelah kontrak asset jelas.

## 25. Rencana penerimaan dan bukti

Matriks lengkap terdapat pada [ACCEPTANCE-MATRIX.csv](ACCEPTANCE-MATRIX.csv); semua baris diawali `not_run`. Bukti yang diminta berupa replay/save, capture close-up, rekaman skenario, log transaksi resource dan laporan performa yang relevan. Tidak ada hasil tes yang diisi hanya karena dokumen ini dibuat.

Skenario demo terpadu: buka menu → pilih faksi/map → warga ambil kayu dan setor → rumah dibangun → antrekan warga/pasukan → naik Feudal → lihat perubahan perlengkapan → naik Castle → bangun siege workshop → kirim ram didampingi infantry dan ranged → runtuhkan gerbang → upgrade benteng sendiri → lanjut Imperial → selesaikan match → load autosave dan ulang akhir tanpa duplikasi resource.

Skenario visual: prajurit pedang/perisai, tombak tanpa shield, archer, cavalry sword, horse archer dan camel ditampilkan berdampingan pada kamera normal serta dekat. Setiap kelas dapat dikenali tanpa membaca namanya. Periksa walk/run/turn, kontak tanah, attack/reload dan death, termasuk saat speed 0,5×/1×/2×.

Skenario ekonomi tepi: dua workers berebut sisa deposit; drop-off mati ketika muatan penuh; pekerja dialihkan ke build; farm kehabisan food ketika wood tidak cukup untuk reseed; save saat pekerja berjalan pulang. Semua menjaga invariant tidak ada resource negatif, hilang tanpa aturan, atau digandakan.

Skenario navigasi: 50 mixed units melewati gerbang sempit; gate dikunci; siege menutup jalur; satu wall segment runtuh. Tidak ada unit melewati collider aktif atau terjebak permanen tanpa status/error yang terlihat.

## 26. Definition of Done per fitur

Selesai berarti: data valid, implementasi runtime aktif, visual benar, perintah UI terhubung, audio relevan tersedia/ditandai, save/load konsisten, kesalahan tertangani, bukti acceptance ada dan budget performa tidak dilanggar. Fitur dengan proxy, hanya data, atau hanya label memakai status tersendiri.

Status proyek yang diperbolehkan: `planned`, `data_only`, `prototype`, `asset_integrated`, `playable`, `verified`, `release_ready`. Build/typecheck tidak menaikkan `prototype` menjadi `verified` tanpa penerimaan gameplay. Changelog harus memakai kata kerja yang sesuai tahap.

## 27. Aturan setiap update

Setiap update mencatat versi, tanggal, kategori, ID requirement, perubahan sebelum/sesudah, pasukan/bangunan/faksi terdampak, kompatibilitas save, daftar aset baru beserta status lisensi, hasil pemeriksaan dan kekurangan tersisa. Perubahan stat menyebut angka lama → baru. Perubahan visual menyertakan capture dari build yang benar-benar berubah.

Contoh yang benar: “U21 ram sekarang menghasilkan damage pada event kontak dan membuat gerbang membuka jalur setelah runtuh; acceptance SIEGE-01 lulus pada build X.” Contoh data-only: “Definisi U21 ditambahkan; model dan combat belum terintegrasi.” Dilarang menulis “ram selesai” untuk penambahan baris JSON.

PRD v3 ini adalah **update dokumentasi**. Tidak mengubah status mesh/ekonomi/tempur yang masih prototype. Rekaman PRD v2 disimpan pada `archive/PRD-iron-crown-rts-v2.md`.

## 28. Keputusan terbuka yang tidak menghambat spesifikasi

- Model MacBook pengguna sebenarnya; gunakan profil sementara bagian 23 sampai perangkat diketahui.
- Budget pembelian/komisi aset dan nama pemegang lisensi. Tidak ada pembelian yang diklaim sudah dilakukan.
- Tahun/lokasi campaign dan referensi historis untuk setiap roster/kostum/landmark. Tinjauan sejarah harus mendahului final art.
- Identitas final paket Steppe; prioritasnya menjamin mounted archery punya peradaban dengan visual dan sistem yang koheren.
- Batas dukungan browser/OS final setelah benchmark; render web dipertahankan.

Kebutuhan pemain yang sudah pasti tidak ditanyakan ulang: 3D realistis, ringan, gerakan manusia/hewan layak, ekonomi komoditas nyata, ragam pasukan termasuk unta dan kavaleri, siege, benteng upgrade, empat era, peradaban unik, menu/settings serta tanpa tutorial wajib.
