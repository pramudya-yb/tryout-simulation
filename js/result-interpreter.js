/**
 * result-interpreter.js
 * Modul interpretasi hasil untuk Simulasi Psikotes Gratis.
 *
 * Fungsi utama:
 * - Membuat estimasi persentil
 * - Membuat status potensi
 * - Membuat kesimpulan kognitif per kategori
 * - Membuat saran latihan per kategori
 * - Membuat interpretasi Tes Gaya Kerja / Workstyle
 *
 * Catatan:
 * Hasil bersifat simulasi latihan, bukan diagnosis psikologis resmi.
 * Narasi dibuat menyerupai format laporan psikotes kerja, tetapi bukan asesmen psikolog resmi.
 */

const ResultInterpreter = (() => {
  const DIMENSION_LABELS = {
    leadership: 'Kepemimpinan',
    influence: 'Komunikasi & Pengaruh Sosial',
    steadiness: 'Stabilitas & Konsistensi',
    compliance: 'Ketelitian & Kepatuhan Prosedur',
    teamwork: 'Kerja Sama Tim',
    adaptability: 'Adaptasi',
    achievement: 'Orientasi Target',
    responsibility: 'Tanggung Jawab'
  };

  const DIMENSION_DESCRIPTIONS = {
    leadership:
      'Menggambarkan kecenderungan mengambil inisiatif, membantu mengarahkan situasi, serta membuat keputusan ketika diperlukan.',
    influence:
      'Menggambarkan kemampuan menyampaikan ide, membangun komunikasi, dan memengaruhi orang lain secara positif dalam konteks kerja.',
    steadiness:
      'Menggambarkan kestabilan emosi kerja, konsistensi, kesabaran, dan kemampuan menjaga ritme kerja saat berada dalam tekanan.',
    compliance:
      'Menggambarkan perhatian terhadap detail, aturan, prosedur, akurasi, dan standar kualitas kerja.',
    teamwork:
      'Menggambarkan kenyamanan bekerja sama, mempertimbangkan sudut pandang orang lain, serta menjaga hubungan kerja dalam tim.',
    adaptability:
      'Menggambarkan fleksibilitas menghadapi perubahan, kemampuan belajar hal baru, serta kesiapan menyesuaikan strategi kerja.',
    achievement:
      'Menggambarkan dorongan mencapai target, orientasi hasil, dan keinginan memperbaiki performa secara berkelanjutan.',
    responsibility:
      'Menggambarkan rasa tanggung jawab, komitmen terhadap tugas, dan kesediaan mengevaluasi peran pribadi dalam hasil kerja.'
  };

  const PROFILE_DESCRIPTIONS = {
    'Profil Teliti-Terstruktur':
      'Profil ini menunjukkan kecenderungan bekerja secara rapi, berhati-hati, patuh pada prosedur, dan berorientasi pada akurasi. Individu dengan pola ini biasanya lebih optimal pada pekerjaan yang memiliki standar jelas, data terukur, serta membutuhkan konsistensi.',
    'Profil Penggerak Target':
      'Profil ini menunjukkan dorongan kuat untuk mencapai hasil, mengambil inisiatif, dan membantu menggerakkan pekerjaan menuju tujuan. Individu dengan pola ini biasanya lebih optimal pada lingkungan kerja yang memberi ruang untuk mengambil keputusan dan mengejar target.',
    'Profil Stabil-Konsisten':
      'Profil ini menunjukkan kecenderungan bekerja tenang, stabil, sabar, dan dapat menjaga ritme dalam tugas yang berulang maupun berkelanjutan. Individu dengan pola ini biasanya cocok pada pekerjaan yang membutuhkan ketahanan, keteraturan, dan konsistensi.',
    'Profil Adaptif-Dinamis':
      'Profil ini menunjukkan kemampuan menyesuaikan diri terhadap perubahan, belajar sistem baru, dan mengubah strategi kerja ketika situasi menuntut. Individu dengan pola ini biasanya cocok pada lingkungan kerja yang dinamis dan cepat berubah.',
    'Profil Kolaboratif-Komunikatif':
      'Profil ini menunjukkan kecenderungan bekerja melalui koordinasi, komunikasi, dan dukungan antaranggota tim. Individu dengan pola ini biasanya cocok pada lingkungan kerja yang menuntut kerja sama dan interaksi sosial.',
    'Profil Seimbang':
      'Profil ini menunjukkan kecenderungan gaya kerja yang cukup merata di beberapa dimensi. Individu dengan pola ini umumnya mampu menyesuaikan diri dengan berbagai tuntutan kerja, meskipun tetap perlu melihat dimensi yang paling dominan dan yang paling rendah.'
  };

  const CATEGORY_PROFILES = {
    verbal: {
      label: 'Penalaran Verbal',
      abilityName: 'pemahaman verbal, kosakata, dan hubungan makna',
      reportFocus:
        'Subtes ini menggambarkan kemampuan memahami informasi tertulis, menangkap makna kata, membaca hubungan antar gagasan, serta menarik kesimpulan dari kalimat atau wacana pendek.',
      workContext:
        'Dalam konteks kerja, kemampuan verbal berhubungan dengan pemahaman instruksi, ketelitian membaca dokumen, komunikasi tertulis, serta kemampuan menangkap maksud informasi secara tepat.',
      high:
        'Profil verbal menunjukkan potensi sangat kuat. Anda cenderung mampu memahami makna kata, hubungan antar konsep, dan isi bacaan dengan cepat serta akurat.',
      good:
        'Profil verbal menunjukkan potensi baik. Anda cukup mampu memahami informasi tertulis dan hubungan makna, meskipun tetap perlu menjaga ketelitian pada pilihan jawaban yang mirip.',
      mid:
        'Profil verbal berada pada kategori cukup. Pemahaman dasar sudah terlihat, tetapi konsistensi dalam membaca kata kunci, konteks kalimat, dan hubungan makna masih perlu diperkuat.',
      low:
        'Profil verbal masih memerlukan penguatan dasar. Area yang perlu dilatih meliputi sinonim, antonim, analogi kata, pemahaman kalimat, dan penarikan kesimpulan dari bacaan singkat.'
    },

    numerical: {
      label: 'Penalaran Numerik',
      abilityName: 'kemampuan numerik dan analisis kuantitatif',
      reportFocus:
        'Subtes ini menggambarkan kemampuan memahami angka, pola bilangan, rasio, persentase, rata-rata, soal cerita, serta penarikan kesimpulan dari data kuantitatif.',
      workContext:
        'Dalam konteks kerja, kemampuan numerik berkaitan dengan membaca data, menghitung secara tepat, memahami laporan angka, membandingkan informasi kuantitatif, dan membuat keputusan berdasarkan data.',
      high:
        'Profil numerik menunjukkan potensi sangat kuat. Anda cenderung mampu membaca pola angka, mengolah data, dan menyelesaikan hitungan dengan akurasi yang baik.',
      good:
        'Profil numerik menunjukkan potensi baik. Anda cukup mampu menyelesaikan perhitungan dan soal data, namun tetap perlu menjaga ketelitian pada soal cerita atau perhitungan bertingkat.',
      mid:
        'Profil numerik berada pada kategori cukup. Dasar perhitungan sudah tampak, tetapi masih perlu penguatan pada persentase, rasio, rata-rata, aljabar sederhana, dan soal cerita kuantitatif.',
      low:
        'Profil numerik masih memerlukan penguatan dasar. Latihan sebaiknya difokuskan pada operasi hitung, persentase, perbandingan, rata-rata, deret angka, dan pemahaman data sederhana.'
    },

    logic: {
      label: 'Penalaran Logika / Analitikal',
      abilityName: 'penalaran deduktif, induktif, dan analisis hubungan antar informasi',
      reportFocus:
        'Subtes ini menggambarkan kemampuan memahami premis, menarik kesimpulan, membedakan kesimpulan pasti dan mungkin, membaca hubungan sebab-akibat, serta mengenali struktur logika formal.',
      workContext:
        'Dalam konteks kerja, kemampuan logika berhubungan dengan analisis masalah, pengambilan keputusan, evaluasi informasi, pemahaman aturan, dan kemampuan menyusun kesimpulan berdasarkan data yang tersedia.',
      high:
        'Profil logika menunjukkan potensi sangat kuat. Anda cenderung mampu memahami hubungan antarpernyataan, menarik kesimpulan valid, dan mengenali pola sebab-akibat secara sistematis.',
      good:
        'Profil logika menunjukkan potensi baik. Anda cukup mampu memahami premis dan menarik kesimpulan, namun tetap perlu berhati-hati pada soal dengan jebakan logika atau negasi.',
      mid:
        'Profil logika berada pada kategori cukup. Anda mulai mampu membaca hubungan antar informasi, tetapi masih perlu memperkuat kemampuan membedakan kesimpulan yang pasti, mungkin, dan tidak dapat disimpulkan.',
      low:
        'Profil logika masih memerlukan penguatan dasar. Fokus latihan sebaiknya pada silogisme, modus ponens, modus tollens, kuantor, urutan, negasi, dan hubungan sebab-akibat.'
    },

    figural: {
      label: 'Penalaran Figural / Spasial',
      abilityName: 'kemampuan visual-spasial, pola, dan abstraksi bentuk',
      reportFocus:
        'Subtes ini menggambarkan kemampuan mengenali pola visual, rotasi, posisi titik, perubahan bentuk, matriks gambar, hubungan antar elemen, serta ketelitian terhadap detail visual.',
      workContext:
        'Dalam konteks kerja, kemampuan figural berkaitan dengan pemecahan masalah visual, membaca pola, melihat hubungan bentuk, memahami struktur, dan memperhatikan perubahan detail secara cepat.',
      high:
        'Profil figural menunjukkan potensi sangat kuat. Anda cenderung mampu mengenali pola bentuk, rotasi, perubahan posisi, dan hubungan visual kompleks dengan baik.',
      good:
        'Profil figural menunjukkan potensi baik. Anda cukup mampu membaca pola visual dan hubungan bentuk, tetapi tetap perlu menjaga ketelitian pada perubahan detail kecil.',
      mid:
        'Profil figural berada pada kategori cukup. Anda mulai mampu mengenali pola visual, namun masih perlu penguatan pada rotasi, pencerminan, posisi titik, perubahan jumlah elemen, dan matriks gambar.',
      low:
        'Profil figural masih memerlukan penguatan dasar. Fokus latihan sebaiknya pada pola gambar, rotasi, perubahan bentuk, posisi titik, pencerminan, arsiran, dan hubungan antar objek visual.'
    }
  };

  function estimatePercentile(percentage) {
    const score = toNumber(percentage);

    if (score >= 90) return 'Estimasi Persentil 90–95 / Sangat Tinggi';
    if (score >= 80) return 'Estimasi Persentil 80–89 / Tinggi';
    if (score >= 70) return 'Estimasi Persentil 65–79 / Di Atas Rata-rata';
    if (score >= 60) return 'Estimasi Persentil 50–64 / Rata-rata';
    if (score >= 50) return 'Estimasi Persentil 35–49 / Cukup';
    return 'Estimasi Persentil di bawah 35 / Perlu Penguatan';
  }

  function getRecommendationStatus(percentage, subtestPercentages = []) {
    const score = toNumber(percentage);
    const hasBelowPassingGrade = subtestPercentages.some(value => toNumber(value) < 50);

    if (hasBelowPassingGrade) {
      return 'Profil Tidak Merata';
    }

    if (score >= 85) return 'Potensi Sangat Kuat';
    if (score >= 70) return 'Potensi Baik';
    if (score >= 55) return 'Potensi Cukup';
    if (score >= 40) return 'Perlu Penguatan';
    return 'Perlu Penguatan Dasar';
  }

  function getStatusNote(status) {
    const notes = {
      'Potensi Sangat Kuat':
        'Hasil simulasi menunjukkan potensi yang sangat kuat. Performa terlihat stabil dan dapat menjadi area keunggulan apabila dipertahankan dengan latihan berbatas waktu.',
      'Potensi Baik':
        'Hasil simulasi menunjukkan potensi yang baik. Dasar kemampuan sudah cukup kuat, namun peningkatan akurasi dan konsistensi masih tetap diperlukan.',
      'Potensi Cukup':
        'Hasil simulasi menunjukkan potensi yang cukup. Kemampuan dasar sudah terlihat, tetapi beberapa jenis soal masih perlu diperkuat agar performa lebih stabil.',
      'Perlu Penguatan':
        'Hasil simulasi menunjukkan perlunya penguatan. Latihan bertahap diperlukan agar pemahaman konsep dan ketelitian menjawab meningkat.',
      'Perlu Penguatan Dasar':
        'Hasil simulasi menunjukkan perlunya penguatan dasar. Disarankan memulai latihan dari konsep paling awal sebelum naik ke soal yang lebih kompleks.',
      'Profil Tidak Merata':
        'Hasil simulasi menunjukkan adanya ketimpangan performa antar subtes. Dalam konteks seleksi, area dengan skor rendah perlu menjadi prioritas evaluasi.'
    };

    return notes[status] || 'Gunakan hasil ini sebagai bahan evaluasi latihan, bukan sebagai penilaian resmi.';
  }

  function generateCognitiveConclusion({
    categoryId = '',
    categoryLabel = 'tes ini',
    percentage = 0,
    correct = 0,
    wrong = 0,
    blank = 0,
    total = 0,
    status = null
  } = {}) {
    const score = toNumber(percentage);
    const finalStatus = status || getRecommendationStatus(score);
    const profile = getCategoryProfile(categoryId, categoryLabel);

    if (!total) {
      return 'Belum ada data jawaban yang dapat dianalisis.';
    }

    const accuracyText = `Skor yang diperoleh adalah ${score}% dengan ${correct} jawaban benar dari ${total} soal.`;
    const blankText =
      blank > 0
        ? ` Terdapat ${blank} soal yang belum dijawab, sehingga aspek manajemen waktu dan keberanian mengambil keputusan juga perlu diperhatikan.`
        : '';

    let levelText = '';

    if (score >= 85) {
      levelText = profile.high;
    } else if (score >= 70) {
      levelText = profile.good;
    } else if (score >= 55) {
      levelText = profile.mid;
    } else {
      levelText = profile.low;
    }

    let conclusion =
      `${accuracyText} ${levelText} ${profile.reportFocus} ${profile.workContext}`;

    if (wrong > 0) {
      conclusion +=
        ` Terdapat ${wrong} jawaban yang belum tepat; bagian ini dapat digunakan untuk mengenali pola kesalahan, apakah berasal dari kurang teliti membaca soal, keliru memahami hubungan informasi, atau terburu-buru dalam memilih jawaban.`;
    }

    conclusion += blankText;

    if (finalStatus === 'Profil Tidak Merata') {
      conclusion +=
        ' Karena terdapat subtes yang berada di bawah ambang batas simulasi, hasil ini sebaiknya tidak hanya dilihat dari skor total, tetapi juga dari sebaran kemampuan per kategori.';
    }

    return conclusion;
  }

  function generateSubtestAdvice(categoryId, percentage) {
    const score = toNumber(percentage);

    const adviceMap = {
      verbal: {
        low:
          'Mulai dari latihan sinonim, antonim, analogi kata, dan pemahaman kalimat sederhana. Biasakan menandai kata kunci dan mencari hubungan makna sebelum memilih jawaban.',
        mid:
          'Perkuat pemahaman konteks kalimat, hubungan antar gagasan, dan inferensi dari paragraf pendek. Perhatikan pilihan jawaban yang tampak mirip karena sering menjadi jebakan.',
        high:
          'Pertahankan kemampuan verbal dengan latihan bacaan yang lebih panjang, analogi kompleks, dan soal berbatas waktu agar akurasi tetap stabil.'
      },
      numerical: {
        low:
          'Perkuat operasi hitung dasar, persentase, rasio, rata-rata, dan deret angka. Kerjakan soal bertahap dari yang sederhana sebelum masuk ke soal cerita kompleks.',
        mid:
          'Latih soal cerita numerik, perbandingan bertingkat, kecepatan, produktivitas, dan data sederhana. Tuliskan langkah singkat agar kesalahan hitung dapat dikurangi.',
        high:
          'Pertahankan akurasi numerik dengan latihan soal cerita kompleks, data tabel, persentase bertingkat, dan perhitungan berbatas waktu.'
      },
      logic: {
        low:
          'Latih silogisme dasar, modus ponens, modus tollens, negasi, urutan, dan sebab-akibat. Fokus utama adalah membedakan kesimpulan yang pasti benar, mungkin benar, dan tidak dapat disimpulkan.',
        mid:
          'Perkuat logika bertingkat, kuantor seperti semua/sebagian/tidak semua, serta soal yang mengandung jebakan afirmasi akibat atau negasi yang salah.',
        high:
          'Pertahankan kemampuan analitis dengan soal deduksi kompleks, kombinasi beberapa premis, validitas argumen, dan penalaran formal berbatas waktu.'
      },
      figural: {
        low:
          'Latih pola bentuk dasar, rotasi, pencerminan, posisi titik, jumlah elemen, dan perubahan arsiran. Mulai dari sequence sederhana sebelum masuk ke matriks.',
        mid:
          'Perkuat soal matriks gambar, rotasi bertingkat, perubahan posisi, dan hubungan baris-kolom. Perhatikan detail kecil seperti arah, titik, isi, dan jumlah elemen.',
        high:
          'Pertahankan kemampuan visual-spasial dengan soal matriks 3x3, analogi visual, rotasi gabungan, dan pola figural kompleks berbatas waktu.'
      }
    };

    const advice = adviceMap[categoryId];

    if (!advice) {
      return 'Gunakan hasil ini untuk menentukan bagian yang perlu dilatih kembali.';
    }

    if (score >= 80) return advice.high;
    if (score >= 50) return advice.mid;
    return advice.low;
  }

  function normalizeCognitiveResult({
    result = {},
    questions = [],
    answers = {},
    categoryId = '',
    categoryLabel = ''
  } = {}) {
    const total = toNumber(result.total ?? result.totalQuestions ?? questions.length);
    const correct = toNumber(result.correct ?? result.correctCount ?? result.benar);
    const blank = toNumber(result.blank ?? result.blankCount ?? result.empty ?? result.kosong);
    let wrong = toNumber(result.wrong ?? result.wrongCount ?? result.salah);

    let computedCorrect = correct;
    let computedBlank = blank;

    if (questions.length > 0 && result.correct === undefined && result.benar === undefined) {
      computedCorrect = 0;
      computedBlank = 0;

      questions.forEach(question => {
        const answer = answers[question.id];

        if (answer === null || answer === undefined || answer === '') {
          computedBlank += 1;
        } else if (answer === question.answer) {
          computedCorrect += 1;
        }
      });
    }

    if (questions.length > 0 && result.wrong === undefined && result.salah === undefined) {
      wrong = questions.length - computedCorrect - computedBlank;
    }

    const finalTotal = total || questions.length;
    const finalCorrect = computedCorrect;
    const finalBlank = computedBlank;
    const finalWrong = Math.max(wrong, 0);

    let percentage = result.percentage ?? result.percent ?? result.scorePercentage ?? result.score;

    if (percentage === undefined || percentage === null || percentage === '') {
      percentage = finalTotal > 0 ? Math.round((finalCorrect / finalTotal) * 100) : 0;
    }

    percentage = Math.round(toNumber(percentage));

    const status = result.status || result.recommendation || getRecommendationStatus(percentage);
    const percentile = result.percentile || result.estimatedPercentile || estimatePercentile(percentage);

    const conclusion =
      result.conclusion ||
      generateCognitiveConclusion({
        categoryId,
        categoryLabel: categoryLabel || getCategoryProfile(categoryId, categoryLabel).label,
        percentage,
        correct: finalCorrect,
        wrong: finalWrong,
        blank: finalBlank,
        total: finalTotal,
        status
      });

    const advice = generateSubtestAdvice(categoryId, percentage);

    return {
      type: 'cognitive',
      categoryId,
      categoryLabel: categoryLabel || getCategoryProfile(categoryId, categoryLabel).label,
      total: finalTotal,
      correct: finalCorrect,
      wrong: finalWrong,
      blank: finalBlank,
      percentage,
      status,
      percentile,
      conclusion,
      advice
    };
  }

  function normalizeFullMixResult({ cognitiveResults = {}, totalCognitive = {}, workstyle = {} } = {}) {
    const subtestPercentages = Object.values(cognitiveResults).map(item => toNumber(item.percentage));
    const totalPercentage = toNumber(totalCognitive.percentage);

    const status = getRecommendationStatus(totalPercentage, subtestPercentages);
    const percentile = totalCognitive.percentile || estimatePercentile(totalPercentage);

    const lowestSubtest = findLowestSubtest(cognitiveResults);
    const highestSubtest = findHighestSubtest(cognitiveResults);

    let conclusion =
      `Secara umum, profil kognitif simulasi menunjukkan skor total ${totalPercentage}%. ` +
      `${getStatusNote(status)} `;

    if (highestSubtest) {
      conclusion +=
        `Area yang paling menonjol adalah ${highestSubtest.label} dengan skor ${highestSubtest.percentage}%. `;
    }

    if (lowestSubtest) {
      conclusion +=
        `Area yang paling perlu dikembangkan adalah ${lowestSubtest.label} dengan skor ${lowestSubtest.percentage}%. `;
    }

    if (status === 'Profil Tidak Merata') {
      conclusion +=
        'Perbedaan performa antar subtes menunjukkan bahwa strategi latihan sebaiknya difokuskan pada area terendah terlebih dahulu sebelum mengejar peningkatan skor total.';
    } else {
      conclusion +=
        'Hasil ini dapat digunakan sebagai dasar menentukan prioritas latihan dan mengenali kecenderungan kemampuan kognitif yang paling kuat.';
    }

    return {
      status,
      percentile,
      conclusion,
      highestSubtest,
      lowestSubtest,
      workstyle
    };
  }

  function findLowestSubtest(cognitiveResults = {}) {
    const items = Object.entries(cognitiveResults).map(([key, value]) => ({
      id: key,
      label: value.categoryLabel || getCategoryProfile(key).label || key,
      percentage: toNumber(value.percentage)
    }));

    if (!items.length) return null;

    return items.sort((a, b) => a.percentage - b.percentage)[0];
  }

  function findHighestSubtest(cognitiveResults = {}) {
    const items = Object.entries(cognitiveResults).map(([key, value]) => ({
      id: key,
      label: value.categoryLabel || getCategoryProfile(key).label || key,
      percentage: toNumber(value.percentage)
    }));

    if (!items.length) return null;

    return items.sort((a, b) => b.percentage - a.percentage)[0];
  }

  function normalizeWorkstyleDimensions(dimensions = {}) {
    const normalized = {};

    Object.keys(dimensions || {}).forEach(key => {
      const item = dimensions[key];

      let average = 0;
      let count = 0;

      if (typeof item === 'number') {
        average = item > 5 ? item / 20 : item;
        count = 1;
      } else if (item && typeof item === 'object') {
        if (item.average !== undefined) {
          average = toNumber(item.average);
        } else if (item.percent !== undefined) {
          average = toNumber(item.percent) / 20;
        } else if (item.percentage !== undefined) {
          average = toNumber(item.percentage) / 20;
        } else if (item.score !== undefined) {
          const score = toNumber(item.score);
          average = score > 5 ? score / 20 : score;
        } else if (item.total !== undefined && item.count !== undefined) {
          const total = toNumber(item.total);
          const itemCount = toNumber(item.count);
          average = itemCount > 0 ? total / itemCount : 0;
        } else {
          average = 0;
        }

        count = toNumber(item.count ?? 1);
      }

      average = clamp(average, 0, 5);
      const percent = Math.round((average / 5) * 100);

      normalized[key] = {
        id: key,
        label: dimensionLabel(key),
        description: DIMENSION_DESCRIPTIONS[key] || '',
        average,
        percent,
        count
      };
    });

    return normalized;
  }

  function generateWorkstyleInterpretation(dimensions = {}) {
    const normalized = normalizeWorkstyleDimensions(dimensions);
    const ranked = Object.values(normalized).sort((a, b) => b.average - a.average);

    if (!ranked.length) {
      return {
        type: 'workstyle',
        title: 'Profil Gaya Kerja Belum Tersedia',
        dominantProfile: '-',
        summary:
          'Belum ada jawaban Tes Gaya Kerja yang dapat dianalisis. Tambahkan atau kerjakan soal gaya kerja terlebih dahulu.',
        strengths: [],
        developmentAreas: [],
        workEnvironment: [],
        notes:
          'Hasil Tes Gaya Kerja bersifat simulasi latihan dan bukan diagnosis psikologis resmi.',
        dimensions: normalized
      };
    }

    const strengths = ranked.slice(0, 3);
    const developmentAreas = ranked.slice(-2).reverse();
    const dominantProfile = determineDominantProfile(strengths);

    const strengthText = strengths.map(item => item.label).join(', ');
    const developmentText = developmentAreas.map(item => item.label).join(', ');

    const summary =
      `Profil gaya kerja menunjukkan kecenderungan paling menonjol pada aspek ${strengthText}. ` +
      `Secara umum, pola ini mendekati "${dominantProfile}". ` +
      `${PROFILE_DESCRIPTIONS[dominantProfile] || ''} ` +
      `Aspek yang relatif perlu dikembangkan adalah ${developmentText}. Area pengembangan ini tidak berarti kelemahan mutlak, tetapi menunjukkan bagian yang dapat dilatih agar gaya kerja menjadi lebih seimbang.`;

    const workEnvironment = recommendWorkEnvironment(strengths, dominantProfile);

    return {
      type: 'workstyle',
      title: 'Profil Gaya Kerja',
      dominantProfile,
      summary,
      strengths,
      developmentAreas,
      workEnvironment,
      notes:
        'Interpretasi ini bersifat teoritis dan digunakan untuk latihan mandiri. Hasil ini bukan diagnosis psikologis resmi, bukan alat seleksi resmi, dan tidak menggantikan asesmen profesional oleh psikolog.',
      dimensions: normalized
    };
  }

  function determineDominantProfile(strengths = []) {
    const ids = strengths.map(item => item.id);

    if (ids.includes('compliance') && ids.includes('responsibility')) {
      return 'Profil Teliti-Terstruktur';
    }

    if (ids.includes('leadership') && ids.includes('achievement')) {
      return 'Profil Penggerak Target';
    }

    if (ids.includes('steadiness') && ids.includes('responsibility')) {
      return 'Profil Stabil-Konsisten';
    }

    if (ids.includes('adaptability') && (ids.includes('achievement') || ids.includes('leadership'))) {
      return 'Profil Adaptif-Dinamis';
    }

    if (ids.includes('teamwork') || ids.includes('influence')) {
      return 'Profil Kolaboratif-Komunikatif';
    }

    if (ids.includes('adaptability')) {
      return 'Profil Adaptif-Dinamis';
    }

    if (ids.includes('achievement')) {
      return 'Profil Penggerak Target';
    }

    return 'Profil Seimbang';
  }

  function recommendWorkEnvironment(strengths = [], dominantProfile = '') {
    const ids = strengths.map(item => item.id);
    const recommendations = [];

    if (ids.includes('compliance') || ids.includes('responsibility')) {
      recommendations.push('Lingkungan kerja dengan prosedur jelas, standar kualitas terukur, dan ekspektasi kerja yang rapi.');
    }

    if (ids.includes('leadership') || ids.includes('achievement')) {
      recommendations.push('Lingkungan kerja yang memberi ruang mengambil inisiatif, mengatur prioritas, dan mengejar target kinerja.');
    }

    if (ids.includes('teamwork') || ids.includes('influence')) {
      recommendations.push('Lingkungan kerja kolaboratif yang membutuhkan komunikasi, koordinasi, serta dukungan antaranggota tim.');
    }

    if (ids.includes('adaptability')) {
      recommendations.push('Lingkungan kerja dinamis yang memberi variasi tugas, kesempatan belajar, dan ruang menyesuaikan strategi.');
    }

    if (ids.includes('steadiness')) {
      recommendations.push('Lingkungan kerja yang memiliki ritme stabil, arahan jelas, dan memungkinkan penyelesaian tugas secara konsisten.');
    }

    if (!recommendations.length) {
      recommendations.push('Lingkungan kerja yang seimbang antara arahan yang jelas, kesempatan belajar, dan dukungan tim.');
    }

    return recommendations;
  }

  function getCategoryProfile(categoryId = '', fallbackLabel = '') {
    if (CATEGORY_PROFILES[categoryId]) {
      return CATEGORY_PROFILES[categoryId];
    }

    return {
      label: fallbackLabel || categoryId || 'Tes',
      abilityName: 'kemampuan penalaran',
      reportFocus:
        'Subtes ini menggambarkan kemampuan memahami informasi, memproses data, dan mengambil keputusan secara lebih tepat.',
      workContext:
        'Dalam konteks kerja, kemampuan ini berkaitan dengan memahami informasi, memproses data, dan mengambil keputusan berdasarkan informasi yang tersedia.',
      high:
        `Profil ${fallbackLabel || 'tes ini'} menunjukkan potensi sangat kuat. Kemampuan penalaran terlihat stabil dan konsisten.`,
      good:
        `Profil ${fallbackLabel || 'tes ini'} menunjukkan potensi baik. Pemahaman dasar sudah cukup kuat.`,
      mid:
        `Profil ${fallbackLabel || 'tes ini'} berada pada kategori cukup, namun masih perlu penguatan.`,
      low:
        `Profil ${fallbackLabel || 'tes ini'} masih memerlukan latihan dan penguatan dasar.`
    };
  }

  function dimensionLabel(id) {
    return DIMENSION_LABELS[id] || id;
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(toNumber(value), min), max);
  }

  return {
    estimatePercentile,
    getRecommendationStatus,
    getStatusNote,
    generateCognitiveConclusion,
    generateSubtestAdvice,
    normalizeCognitiveResult,
    normalizeFullMixResult,
    normalizeWorkstyleDimensions,
    generateWorkstyleInterpretation,
    determineDominantProfile,
    recommendWorkEnvironment,
    dimensionLabel
  };
})();