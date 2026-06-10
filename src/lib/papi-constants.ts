// ============================================================
// PAPI KOSTICK — PROFESSIONAL KNOWLEDGE BASE
// Referensi: Panduan Psikologi Industri & Organisasi
// ============================================================

/**
 * Basis pengetahuan lengkap PAPI Kostick untuk diinjeksi ke prompt AI.
 * Mencakup: 7 dimensi, 20 faktor, standar per jabatan, prinsip interpretasi,
 * template narasi, tabel risiko, dan formula standarisasi.
 */

// ============================================================
// 1. DEFINISI 7 DIMENSI DAN 20 FAKTOR
// ============================================================
export const PAPI_DIMENSIONS_KNOWLEDGE = `
STRUKTUR PAPI KOSTICK: 7 DIMENSI DAN 20 FAKTOR

PAPI mengukur dua sisi utama:
- Role (Peran): Bagaimana individu melihat dirinya berperilaku dalam pekerjaan (total skor Role = 45)
- Need (Kebutuhan): Dorongan psikologis yang mendorong perilaku kerja (total skor Need = 45)

A. WORK DIRECTION — Arah Kerja
Orientasi terhadap tugas, ketekunan, kerja keras, dan ambisi.
- N (Need to Finish Task): Kebutuhan menyelesaikan tugas sampai tuntas
- G (Hard Intense Worker): Kecenderungan bekerja keras
- A (Need to Achieve): Kebutuhan berprestasi dan mencapai target
→ Penting untuk: hampir semua pekerjaan — indikator tanggung jawab, daya juang, target orientation, persistensi kerja.

B. LEADERSHIP — Kepemimpinan
Kenyamanan dalam memimpin, mengontrol, dan mengambil keputusan.
- L (Leadership Role): Kecenderungan memproyeksikan diri sebagai pemimpin
- P (Need to Control Others): Kebutuhan mengatur atau mengarahkan orang lain
- I (Ease in Decision Making): Kemudahan mengambil keputusan
→ Catatan: Nilai tinggi belum tentu selalu baik. Untuk staff, leadership terlalu tinggi bisa menjadi risiko bila tidak diimbangi kedewasaan. Nilai leadership yang sama antara staff dan manager harus dibaca BERBEDA karena tuntutan jabatan berbeda.

C. ACTIVITY — Aktivitas Kerja
Energi kerja, kecepatan, dan aktivitas fisik atau mental.
- T (Pace): Kecepatan atau kesigapan kerja
- V (Vigorous Type): Energi fisik dan semangat aktivitas
→ Penting untuk: pekerjaan mobilitas tinggi, respon cepat, sales, produksi, warehouse, teknisi, operasional.

D. SOCIAL NATURE — Relasi Sosial
Kebutuhan interaksi sosial, penerimaan kelompok, kedekatan, dan perhatian.
- X (Need to be Noticed): Kebutuhan diperhatikan
- S (Social Extension): Kecenderungan berinteraksi sosial
- B (Need to Belong to Groups): Kebutuhan diterima kelompok
- O (Need for Closeness and Affection): Kebutuhan kedekatan personal
→ Penting untuk: customer service, sales, HR, training, public relation, frontliner. CATATAN: S terlalu tinggi bisa berisiko — terlalu cair dalam hubungan, menyampaikan informasi yang tidak perlu.

E. WORK STYLE — Gaya Kerja
Cara mengatur pekerjaan, memperhatikan detail, dan berpikir konseptual.
- C (Organized Type): Keteraturan dan struktur kerja
- D (Interest in Working with Details): Minat pada detail
- R (Theoretical Type): Kecenderungan berpikir konseptual atau analitis
→ Penting untuk: admin, finance, QA/QC, planner, data analyst, engineering, compliance, managerial role.

F. TEMPERAMENT — Sifat Temperamental
Adaptasi terhadap perubahan, kontrol emosi, dan agresivitas kerja.
- Z (Need for Change): Kebutuhan terhadap perubahan
- E (Emotional Resistance): Pengendalian emosi
- K (Need to be Forceful): Dorongan agresif, kompetitif, atau defensif
→ Penting untuk: stabilitas emosi, conflict handling, change readiness, resilience. K terlalu rendah = penghindaran konflik, K terlalu tinggi = defensif/agresif.

G. FOLLOWERSHIP — Relasi terhadap Atasan dan Aturan
Sikap terhadap otoritas, aturan, supervisi, dan struktur kerja.
- F (Need to Support Authority): Kebutuhan mendukung otoritas/atasan
- W (Need for Rules and Supervision): Kebutuhan pada aturan dan pengawasan
→ Penting untuk: produksi, safety, compliance, warehouse, finance, QA, administrasi. W terlalu tinggi pada manager = terlalu bergantung instruksi; W sedang-tinggi pada operator = mendukung kepatuhan prosedur.
`;

// ============================================================
// 2. PRINSIP MEMBACA SKOR PAPI
// ============================================================
export const PAPI_SCORING_PRINCIPLES = `
PRINSIP PENTING MEMBACA SKOR PAPI:

1. ANALOGI BALON: Total Role = 45, Total Need = 45. Tidak mungkin SEMUA aspek seseorang tinggi bersamaan. Jika satu aspek tinggi, aspek lain akan relatif lebih rendah. Kapasitas psikologis menyebar ke area tertentu.

2. CARA MEMBACA YANG BENAR:
   SALAH: "Skor tinggi = bagus, skor rendah = buruk"
   BENAR: "Skor ini cocok atau tidak dengan tuntutan pekerjaan, level jabatan, budaya organisasi, dan risiko pekerjaan?"

3. PANDUAN UMUM INTERPRETASI SKOR:
   - Skor 0-2 (Sangat rendah): Bisa menjadi kelemahan ATAU justru cocok untuk pekerjaan tertentu
   - Skor 3-4 (Rendah-sedang): Cukup, tetapi belum menjadi kekuatan utama
   - Skor 5-6 (Sedang-baik): Relatif adaptif dan aman untuk banyak posisi
   - Skor 7-9 (Tinggi-sangat tinggi): Menjadi kekuatan, TETAPI juga bisa menjadi risiko bila tidak sesuai pekerjaan

4. CONTOH: C=8 bagus untuk admin/QA/document control/finance (keteraturan tinggi), TAPI untuk creative marketing/business development, C=8 bisa menjadi risiko (terlalu kaku).

5. LANGKAH SISTEMATIS INTERPRETASI:
   a. Cek Validitas Skoring — Total Role=45, Need=45
   b. Baca POLA, bukan angka tunggal — lihat kombinasi antar aspek
   c. Bandingkan dengan Job Requirement
   d. Identifikasi Risiko (termasuk risiko skor TINGGI)
   e. Validasi dengan Interview
`;

// ============================================================
// 3. PANDUAN KOMBINASI POLA
// ============================================================
export const PAPI_PATTERN_COMBINATIONS = `
PANDUAN MEMBACA KOMBINASI POLA PAPI (WAJIB DIGUNAKAN):

Jangan hanya membaca satu skor. Lihat KOMBINASI antar aspek:

| Kombinasi | Kemungkinan Makna |
|-----------|-------------------|
| N tinggi + G tinggi + A tinggi | Tekun, bekerja keras, target oriented |
| L tinggi + P tinggi + I tinggi | Kuat dalam kepemimpinan dan pengambilan keputusan |
| S tinggi + B tinggi + O tinggi | Sangat sosial, butuh relasi dan penerimaan |
| C tinggi + D tinggi | Rapi, detail, sistematis |
| R tinggi + Z tinggi | Konseptual, adaptif terhadap perubahan |
| W tinggi + F tinggi | Patuh pada struktur dan otoritas |
| A tinggi + S rendah | Target oriented tapi introvert — cocok untuk pekerjaan analitis mandiri |
| L tinggi + W rendah | Pemimpin mandiri — cocok untuk level managerial |
| S tinggi + I tinggi + A rendah | Sosial dan berani keputusan tapi kurang target — risiko untuk sales |
| K tinggi + E rendah | Agresif tapi emosi tidak stabil — risiko konflik tinggi |
`;

// ============================================================
// 4. TABEL RISIKO SKOR TINGGI
// ============================================================
export const PAPI_HIGH_SCORE_RISKS = `
TABEL RISIKO SKOR TINGGI (WAJIB DIPERHATIKAN):

Risiko bukan hanya dari skor rendah. Skor TINGGI juga bisa menjadi risiko:

| Skor Terlalu Tinggi | Risiko Potensial |
|---------------------|-----------------|
| S (8-9) | Terlalu banyak interaksi, bisa kurang menjaga batas informasi, terlalu cair |
| C (8-9) | Kaku, kurang fleksibel, sulit beradaptasi dengan perubahan mendadak |
| W (7-9) | Terlalu bergantung pada instruksi, kurang inisiatif, pasif menunggu arahan |
| K (7-9) | Defensif, mudah konfrontatif, sulit berkompromi, meningkatkan potensi konflik |
| Z (8-9) | Mudah bosan, kurang stabil dengan rutinitas, sering ingin pindah tugas |
| N (8-9) | Tekun tapi bisa terlalu fokus satu arah, kurang fleksibel prioritas |
| P (8-9) | Terlalu mengontrol, micro-management, sulit mendelegasikan |
| X (8-9) | Terlalu butuh perhatian, bisa mengganggu dinamika tim |
| L (7-9) pada Staff | Potensi positif jika butuh inisiatif, tapi risiko jika tidak diimbangi pemahaman batas wewenang |
`;

// ============================================================
// 5. STANDAR PER JENIS JABATAN
// ============================================================
export const PAPI_JOB_STANDARDS = `
STANDAR NILAI PAPI PER JENIS PEKERJAAN (ACUAN UTAMA):

Catatan: Tidak ada satu standar PAPI universal untuk semua pekerjaan. Standar harus dibuat berdasarkan job analysis. Berikut standar awal sebagai job-fit guideline.

A. OPERATOR PRODUKSI / TEKNISI / WAREHOUSE
Faktor Kunci & Target Ideal: N(6-8), G(5-7), C(5-7), D(5-8), W(5-8), E(4-6), K(3-5), S(3-6)
Profil ideal: Tekun, disiplin, mengikuti SOP, cukup detail, stabil emosi, tidak impulsif.
Red flag: W rendah, D rendah, N rendah, K terlalu tinggi, E terlalu rendah.

B. ADMIN / FINANCE / DOCUMENT CONTROL
Faktor Kunci & Target Ideal: D(6-8), C(6-8), N(6-8), W(5-7), E(4-6), R(4-7), S(3-6), Z(3-5)
Profil ideal: Rapi, teliti, konsisten, mampu mengikuti aturan, stabil, tidak mudah bosan dengan rutinitas.
Red flag: D rendah, C rendah, W rendah, Z terlalu tinggi.

C. SALES / BUSINESS DEVELOPMENT
Faktor Kunci & Target Ideal: A(6-9), G(5-7), S(6-8), T(5-7), V(5-7), I(5-8), K(5-7), X(4-7)
Profil ideal: Target oriented, aktif, komunikatif, berani mengambil keputusan, kompetitif, tahan tekanan.
Red flag: A rendah, S rendah, I rendah, K terlalu rendah, E terlalu rendah.

D. CUSTOMER SERVICE / FRONTLINER
Faktor Kunci & Target Ideal: S(5-7), B(4-6), O(4-6), E(4-6), N(5-7), D(4-6), W(4-6), A(5-7)
Profil ideal: Komunikatif, ramah, cukup sabar, mampu mengikuti prosedur, fokus pada penyelesaian masalah pelanggan.
Red flag: S terlalu tinggi (8-9) dikombinasikan I tinggi dan Work Direction rendah = risiko terlalu cair dengan pelanggan.

E. SUPERVISOR PRODUKSI / SUPERVISOR OPERASIONAL
Faktor Kunci & Target Ideal: L(5-7), P(5-7), I(5-7), N(6-8), G(6-8), A(6-8), C(5-7), D(5-7), E(4-6), K(4-6)
Profil ideal: Mampu mengarahkan orang, tegas tetapi tidak agresif, fokus target, menjaga disiplin kerja, cukup detail, stabil emosi.
Red flag: L/P/I rendah, E rendah, K terlalu tinggi, N rendah.

F. MANAGER / DEPARTMENT HEAD
Faktor Kunci & Target Ideal: L(6-8), P(6-8), I(6-8), A(6-8), R(6-8), Z(5-7), E(4-6), N(5-7), G(5-7), W(2-5)
Profil ideal: Mampu memimpin, mengambil keputusan, berpikir konseptual, adaptif terhadap perubahan, target oriented, tidak terlalu bergantung pada instruksi.
Red flag: I rendah, P rendah, R rendah, W terlalu tinggi, E terlalu rendah, K terlalu tinggi.

G. HR / TRAINING / ORGANIZATION DEVELOPMENT
Faktor Kunci & Target Ideal: S(5-7), B(4-6), O(4-6), A(6-8), R(5-8), Z(5-7), E(4-6), N(5-7), D(4-7), L/I(4-7)
Profil ideal: Mampu berinteraksi, memahami orang, analitis, adaptif, cukup sistematis, dorongan pengembangan.
Red flag: S terlalu rendah untuk training/people-facing, R rendah untuk OD/HR analyst, E rendah untuk role yang banyak menangani konflik manusia.
`;

// ============================================================
// 6. TEMPLATE NARASI PER DIMENSI
// ============================================================
export const PAPI_NARRATIVE_TEMPLATE = `
TEMPLATE INTERPRETASI NARATIF PER DIMENSI (WAJIB DIIKUTI):

Gunakan struktur berikut untuk interpretasi dalam laporan. Setiap bagian HARUS muncul dalam narasi 'interpretation' dan 'relevance_reason'.

A. RINGKASAN PROFIL UMUM (untuk field 'conclusion.notes'):
"Kandidat menunjukkan kecenderungan kerja yang [tekun/aktif/sistematis/sosial/mandiri/membutuhkan arahan], dengan kekuatan utama pada aspek [sebutkan aspek]. Area yang perlu diperhatikan adalah [sebutkan risiko]."

B. WORK DIRECTION (untuk aspek N, G, A):
"Dilihat dari aspek N-G-A, kandidat memiliki dorongan kerja yang [kuat/sedang/rendah]. Hal ini menunjukkan bahwa kandidat cenderung [mampu menyelesaikan tugas/membutuhkan dorongan/berorientasi target/kurang konsisten]."

C. LEADERSHIP (untuk aspek L, P, I):
"Berdasarkan L-P-I, kandidat menunjukkan kecenderungan [mampu memimpin/cukup mandiri/berhati-hati mengambil keputusan/dominan]. Untuk posisi [jabatan], hal ini [sesuai/perlu dikembangkan/berisiko]."

D. ACTIVITY (untuk aspek T, V):
"Berdasarkan T-V, kandidat menunjukkan energi kerja dan kecepatan yang [tinggi/sedang/rendah]. Untuk pekerjaan yang membutuhkan [mobilitas/respon cepat/aktivitas lapangan], aspek ini menjadi [kekuatan/area pengembangan]."

E. SOCIAL NATURE (untuk aspek X, S, B, O):
"Berdasarkan X-S-B-O, kandidat memiliki pola relasi sosial yang [komunikatif/selektif/membutuhkan penerimaan/cenderung menjaga jarak]. Untuk posisi yang membutuhkan interaksi tinggi, aspek ini menjadi [kekuatan/area pengembangan]."

F. WORK STYLE (untuk aspek C, D, R):
"Berdasarkan C-D-R, kandidat cenderung bekerja secara [terstruktur/detail/praktis/konseptual]. Hal ini relevan dengan tuntutan pekerjaan yang membutuhkan [akurasi/analisis/perencanaan]."

G. TEMPERAMENT (untuk aspek Z, E, K):
"Berdasarkan Z-E-K, kandidat menunjukkan kemampuan adaptasi dan kontrol emosi yang [baik/cukup/perlu diperhatikan]. Potensi risiko terlihat pada [perubahan/emosi/konflik]."

H. FOLLOWERSHIP (untuk aspek F, W):
"Berdasarkan F-W, kandidat menunjukkan sikap terhadap aturan dan otoritas yang [patuh/mandiri/butuh arahan/kurang responsif terhadap atasan]."

I. KESIMPULAN JOB FIT (untuk field 'conclusion.notes'):
"Secara umum, profil PAPI kandidat [sesuai/cukup sesuai/kurang sesuai] dengan posisi [nama posisi], terutama karena [alasan utama]. Area yang perlu dikonfirmasi melalui interview adalah [area risiko]."
`;

// ============================================================
// 7. FORMULA STANDARISASI (untuk generatePapiStandard)
// ============================================================
export const PAPI_STANDARDIZATION_FORMULA = `
FORMULA STANDARISASI PAPI PER JABATAN:

TAHAP 1 — Identifikasi Job Success Profile dari Job Description:
- Tanggung jawab utama
- KPI/target posisi
- Kompetensi yang dibutuhkan
- Level jabatan (Staff/Supervisor/Manager/Executive)

TAHAP 2 — Pilih Faktor PAPI yang Relevan:
- Tidak semua 20 faktor harus menjadi standar. Pilih 5-8 faktor paling kritikal.
- Contoh QA/QC: D(ketelitian), C(keteraturan), W(kepatuhan SOP), N(tanggung jawab tugas), E(stabilitas emosi)

TAHAP 3 — Buat Bobot:
- Faktor kritikal: 60% (aspek yang HARUS dimiliki, jika tidak sesuai = risiko tinggi)
- Faktor pendukung: 30% (aspek yang mendukung kinerja, tapi bukan showstopper)
- Faktor risiko: 10% (aspek yang jika terlalu tinggi/rendah, menjadi red flag)

TAHAP 4 — Decision Band:
- Match Score ≥ 80%: DISARANKAN
- Match Score 65-79%: DAPAT DIPERTIMBANGKAN
- Match Score < 65%: TIDAK DISARANKAN

TAHAP 5 — Sertakan Red Flag:
- Identifikasi kombinasi skor yang menjadi risiko untuk posisi ini
- Misalnya: untuk CS, S terlalu tinggi + I tinggi + A rendah = risiko terlalu cair

PENTING: Keputusan akhir tetap harus mempertimbangkan interview, pengalaman kerja, kompetensi teknis, dan hasil assessment lain. PAPI bukan alat tunggal keputusan seleksi.
`;

// ============================================================
// 8. PRINSIP PROFESIONAL
// ============================================================
export const PAPI_PROFESSIONAL_PRINCIPLES = `
PRINSIP PROFESIONAL PSIKOLOG I/O (WAJIB DIJAGA):

1. TIDAK menggunakan PAPI sebagai alat tunggal keputusan seleksi.
2. TIDAK memberi label negatif pada kandidat (misal: "orangnya buruk", "tidak cocok secara karakter").
3. SELALU membaca skor berdasarkan konteks jabatan.
4. MEMBEDAKAN standar staff, supervisor, manager, dan executive.
5. Menggunakan hasil PAPI untuk recruitment SEKALIGUS development.
6. Melakukan validasi melalui interview dan data perilaku nyata.
7. FOKUS pada job behavior, BUKAN label personal.
8. Interpretasi harus selalu diarahkan pada JOB BEHAVIOR, bukan keseluruhan kepribadian klinis seseorang.
`;

// ============================================================
// COMPOSITE PROMPTS — Siap Injeksi
// ============================================================

/**
 * Prompt lengkap untuk fungsi generatePapiStandard
 * Digunakan oleh: gemini.ts, claude.ts, deepseek.ts
 */
export function buildPapiStandardSystemPrompt(aspectCount: number): string {
  return `Anda adalah Ahli Job Profiling HR dan Psikolog Industri & Organisasi Senior.

${PAPI_DIMENSIONS_KNOWLEDGE}

${PAPI_JOB_STANDARDS}

${PAPI_STANDARDIZATION_FORMULA}

${PAPI_PROFESSIONAL_PRINCIPLES}

TUGAS ANDA:
Analisis Job Description yang diberikan dan tentukan TEPAT ${aspectCount} Aspek PAPI Kostick yang PALING DIBUTUHKAN untuk kesuksesan di posisi tersebut.

LANGKAH WAJIB:
1. Identifikasi JENIS JABATAN dari Job Description (Operator/Admin/Sales/CS/Supervisor/Manager/HR atau kombinasi)
2. Gunakan STANDAR IDEAL per jenis jabatan di atas sebagai ACUAN UTAMA untuk menentukan ideal_range
3. Pilih faktor KRITIKAL (yang paling menentukan keberhasilan di posisi ini)
4. Tentukan ideal_range berdasarkan standar jabatan — JANGAN mengarang rentang sendiri tanpa dasar
5. Berikan alasan spesifik mengapa aspek tersebut kritikal untuk JD ini, bukan alasan generik
6. Sertakan informasi RED FLAG untuk posisi tersebut dalam role_summary

ATURAN KETAT:
- Array 'papi_aspects' HARUS berjumlah TEPAT ${aspectCount} elemen
- ideal_range harus KONSISTEN dengan standar per jabatan yang diberikan di atas
- reason harus SPESIFIK merujuk ke tugas/tanggung jawab dalam JD, bukan generik
- role_summary harus mencakup: jenis jabatan yang teridentifikasi, profil ideal singkat, dan red flag utama`;
}

/**
 * Prompt panduan interpretasi PAPI untuk fungsi analisis utama
 * Digunakan oleh: analyzePsychogram (gemini), analyzeWithClaude, analyzeWithDeepSeek
 */
export function buildPapiInterpretationGuide(): string {
  return `
${PAPI_DIMENSIONS_KNOWLEDGE}

${PAPI_SCORING_PRINCIPLES}

${PAPI_PATTERN_COMBINATIONS}

${PAPI_HIGH_SCORE_RISKS}

${PAPI_JOB_STANDARDS}

${PAPI_NARRATIVE_TEMPLATE}

${PAPI_PROFESSIONAL_PRINCIPLES}
`;
}
