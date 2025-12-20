/**
 * Assessment utility functions
 * Değerlendirme işlemleri için yardımcı fonksiyonlar
 */

/**
 * Bölüm süresini hesapla (dakika cinsinden)
 * @param {Object} section - Bölüm objesi
 * @returns {number} Toplam süre (dakika)
 */
export function getSectionDuration(section) {
  // 1. Backend'den gelen summary duration'ı kullan (GÜVENLİ)
  if (section.section_duration !== undefined) {
    return parseInt(section.section_duration || 0)
  }
  
  // 2. Detay yüklenmişse exercises'dan hesapla (fallback)
  if (!section.exercises || section.exercises.length === 0) return 0
  
  return section.exercises.reduce((total, exercise) => {
    const duration = parseInt(exercise.exercise_duration || exercise.duration || 0)
    return total + duration
  }, 0)
}

/**
 * Soru tipini Türkçe formatla
 * @param {string} type - Soru tipi (örn: 'multiple_choice')
 * @returns {string} Formatlanmış tip (örn: 'Çoktan Seçmeli')
 */
export function formatQuestionType(type) {
  const types = {
    'multiple_choice': 'Çoktan Seçmeli',
    'case_study': 'Çoktan Seçmeli',
    'essay': 'Kompozisyon',
    'practice': 'Uygulama',
    'analysis': 'Analiz',
    'info': 'Bilgilendirme',
    'team_building': 'Ekip Kurma',
    'presentation': 'Sunum'
  }
  return types[type] || type
}

/**
 * Egzersiz cevabı var mı kontrol et
 * @param {Object} store - Assessment store instance
 * @param {string} exerciseUuid - Egzersiz UUID
 * @returns {boolean} Cevap var mı?
 */
export function hasResponse(store, exerciseUuid) {
  return !!store.getExerciseResponse(exerciseUuid)
}

/**
 * Bölüm tamamlanma yüzdesini hesapla
 * @param {Array} exercises - Egzersiz listesi
 * @param {Object} store - Assessment store instance
 * @returns {number} Tamamlanma yüzdesi (0-100)
 */
export function calculateSectionProgress(exercises, store) {
  if (!exercises || exercises.length === 0) return 0
  
  const completedCount = exercises.filter(ex => {
    if (ex.type === 'info') return true // Info egzersizleri için cevap zorunlu değil
    return hasResponse(store, ex.exercise_uuid)
  }).length
  
  return Math.round((completedCount / exercises.length) * 100)
}

/**
 * Dosya uzantısından ikon sınıfını al
 * @param {string} fileName - Dosya adı
 * @returns {string} PrimeVue icon sınıfı
 */
export function getFileIcon(fileName) {
  if (!fileName) return 'pi-file'
  
  const ext = fileName.split('.').pop().toLowerCase()
  const iconMap = {
    'pdf': 'pi-file-pdf',
    'doc': 'pi-file-word',
    'docx': 'pi-file-word',
    'xls': 'pi-file-excel',
    'xlsx': 'pi-file-excel',
    'jpg': 'pi-image',
    'jpeg': 'pi-image',
    'png': 'pi-image',
    'gif': 'pi-image',
    'mp4': 'pi-video',
    'avi': 'pi-video',
    'mp3': 'pi-volume-up',
    'wav': 'pi-volume-up'
  }
  
  return iconMap[ext] || 'pi-file'
}

/**
 * Süreyi insan okunabilir formata çevir
 * @param {number} minutes - Dakika cinsinden süre
 * @returns {string} Formatlanmış süre (örn: "1 saat 30 dakika")
 */
export function formatDuration(minutes) {
  if (!minutes || minutes === 0) return '0 dakika'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins} dakika`
  if (mins === 0) return `${hours} saat`
  
  return `${hours} saat ${mins} dakika`
}

/**
 * Bölüm kilidi kontrolü
 * @param {number} index - Bölüm index'i
 * @param {Array} sections - Tüm bölümler
 * @param {Function} isSectionCompleted - Bölüm tamamlanma kontrolü
 * @returns {boolean} Bölüm kilitli mi?
 */
export function isSectionLocked(index, sections, isSectionCompleted) {
  // İlk bölüm her zaman açık
  if (index === 0) return false
  
  // Önceki bölüm tamamlanmış mı kontrol et
  const previousSection = sections[index - 1]
  return !isSectionCompleted(previousSection.section_uuid)
}
