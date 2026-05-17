# Format Soal Try Out CPNS

Setiap file JSON berisi array of objects dengan format berikut:

```json
[
  {
    "id": "1",
    "question": "Teks pertanyaan di sini",
    "options": {
      "A": "Pilihan A",
      "B": "Pilihan B",
      "C": "Pilihan C",
      "D": "Pilihan D"
    },
    "answer": "A",
    "explanation": "Penjelasan jawaban (opsional, bisa string kosong)"
  }
]
```

## Catatan

- `id` harus unik dalam satu file
- `answer` harus salah satu dari: A, B, C, atau D
- `explanation` boleh dikosongkan dengan string kosong `""`
- Untuk TKP (Tes Karakteristik Pribadi), semua pilihan bisa benar tapi dengan bobot berbeda — gunakan `explanation` untuk menjelaskan skor
- Minimal 1 soal per file agar bisa dikerjakan

## Contoh Soal TWK

```json
[
  {
    "id": "1",
    "question": "Pancasila sebagai dasar negara pertama kali dirumuskan dalam sidang...",
    "options": {
      "A": "BPUPKI",
      "B": "PPKI",
      "C": "MPR",
      "D": "DPR"
    },
    "answer": "A",
    "explanation": "Pancasila dirumuskan dalam sidang BPUPKI (Badan Penyelidik Usaha-Usaha Persiapan Kemerdekaan Indonesia) pada 1 Juni 1945."
  }
]
```

## Struktur Direktori

```
data/bank-soal-template/
├── skd/
│   ├── twk.json         ← Tes Wawasan Kebangsaan
│   ├── tiu.json         ← Tes Intelegensia Umum
│   └── tkp.json         ← Tes Karakteristik Pribadi
└── skb/
    ├── hukum/
    │   ├── hukum-perdata.json
    │   ├── hukum-pidana.json
    │   ├── hukum-administrasi.json
    │   └── hukum-tata-negara.json
    ├── kesehatan/
    │   ├── kesehatan-keperawatan.json
    │   ├── kesehatan-farmakologi.json
    │   └── kesehatan-ikm.json
    ├── teknik/
    │   ├── teknik-sipil.json
    │   ├── teknik-informatika.json
    │   └── teknik-elektro.json
    ├── ekonomi/
    │   ├── ekonomi-akuntansi.json
    │   ├── ekonomi-keuangan.json
    │   └── ekonomi-perpajakan.json
    └── pendidikan/
        ├── pendidikan-pedagogik.json
        ├── pendidikan-kurikulum.json
        └── pendidikan-psikologi.json
```

## Daftar Sub-Tes SKD

### TWK — Tes Wawasan Kebangsaan
Mencakup: Pancasila, UUD 1945, NKRI & Bela Negara, Bhinneka Tunggal Ika, Sejarah Indonesia

### TIU — Tes Intelegensia Umum
Mencakup: Verbal (Analogi, Silogisme, Analitis), Numerik (Berhitung, Deret Angka, Perbandingan), Figural

### TKP — Tes Karakteristik Pribadi
Mencakup: Integritas Diri, Orientasi Pelayanan, Kemampuan Beradaptasi, Semangat Berprestasi, Kreativitas & Inovasi, Kerja Sama Tim

## Daftar Bidang SKB

- **Hukum**: Perdata, Pidana, Administrasi Negara, Tata Negara
- **Kesehatan**: Keperawatan, Farmakologi, Kesehatan Masyarakat
- **Teknik**: Sipil, Informatika, Elektro
- **Ekonomi & Keuangan**: Akuntansi Pemerintah, Keuangan Negara, Perpajakan
- **Pendidikan**: Pedagogik, Kurikulum & Pembelajaran, Psikologi Pendidikan
