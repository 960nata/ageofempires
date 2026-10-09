# Update 0.24.1

## Cara memakai
- Mulai New skirmish untuk Dark Age, atau frontier untuk Castle Age.
- Klik **Town Center · advance era**, kemudian pilih Town Center. Panel menunjukkan era berikutnya dan syarat yang belum selesai.
- Feudal: dua bangunan ekonomi dari House/Lumber Camp/Mining Camp/Mill/Farm.
- Castle: Blacksmith dan bangunan militer.
- Imperial: Keep, Armour & weapons tingkat pertama di Blacksmith, dan Better tools tingkat pertama di Mill/camp.
- Setelah riset era selesai, sebagian pekerja ditugaskan melakukan renovasi. Bangunan berganti tampilan setelah renovasinya selesai. Tombol Assign renovation crew tersedia untuk melanjutkan situs yang belum ditangani.

## Bukti pemeriksaan
- TypeScript dan production build berhasil.
- Skenario regresi menempuh Feudal → Castle → Imperial, memeriksa syarat dan pekerja renovasi sekaligus mempertahankan pekerja ekonomi.
- Simulasi ekonomi damai 40 menit: kerajaan 1 dan 3 masing-masing mencapai Imperial sebelum menit 30, menghasilkan 18 pekerja dan empat ladang yang selesai. Kedua AI menggunakan jalur ekonomi yang sama pada stance musuh maupun sekutu; ini bukan uji keseimbangan pertempuran.
- Browser: kota Mongol, gandum tumbuh, panel persyaratan Imperial; console tidak mencatat error pada sesi pemeriksaan.
- Pemeriksaan lintas perangkat, match panjang dengan serangan penuh, serta semua sudut bangunan belum dinyatakan lulus.

## Batas kualitas aset
Paket 800 sel baru membersihkan facade inti dan siklus Town Center dari gambar sumber yang sudah tersedia. Empat era terpisah; arah belakang asli belum tersedia untuk setiap bangunan. Gerakan pasukan membaurkan pose yang ada, bukan menghasilkan anatomi baru di setiap frame. Fortifikasi, landmark dan sebagian unit masih memakai atlas lama dan memerlukan review tersendiri.
