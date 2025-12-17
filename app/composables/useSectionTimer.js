import { ref, computed } from 'vue'
import { useAssessmentStore } from '~/stores/assessment'
import { useToast } from 'primevue/usetoast'

/**
 * Bölüm süre yönetimi composable
 * 
 * @param {Object} options
 * @param {Function} options.onTimerComplete - Timer bittiğinde çağrılacak callback
 * @param {Ref} options.savingExercise - Kayıt durumu ref'i (collision prevention için)
 * @returns {Object} Timer state ve methodları
 */
export function useSectionTimer(options = {}) {
  const store = useAssessmentStore()
  const toast = useToast()
  
  const { onTimerComplete, savingExercise } = options
  
  // ========================
  // STATE
  // ========================
  const remainingTime = ref(0)
  const sectionTimer = ref(null)
  const timerSyncInterval = ref(null)
  
  // ========================
  // COMPUTED
  // ========================
  const formattedTime = computed(() => {
    const mins = Math.floor(remainingTime.value / 60)
    const secs = remainingTime.value % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  })
  
  // ========================
  // METHODS
  // ========================
  
  /**
   * Timer'ı durdur ve temizle
   */
  const stopTimer = () => {
    if (sectionTimer.value) {
      clearInterval(sectionTimer.value)
      sectionTimer.value = null
    }
    
    if (timerSyncInterval.value) {
      clearInterval(timerSyncInterval.value)
      timerSyncInterval.value = null
    }
  }
  
  /**
   * Backend ile timer senkronizasyonu
   */
  const syncWithBackend = async () => {
    const result = await store.fetchRemainingTime()
    
    if (result.success) {
      remainingTime.value = result.data.remaining_seconds
      
      // Süre bittiyse backend'den bildirim geldi
      if (result.data.time_expired && remainingTime.value <= 0) {
        await handleTimerEnd()
      }
      
      console.log('⏱️ Timer backend ile senkronize edildi:', result.data.remaining_seconds, 'saniye')
    } else {
      console.error('Timer sync hatası:', result.error)
    }
  }
  
  /**
   * Timer bittiğinde yapılacak işlemler
   */
  const handleTimerEnd = async () => {
    console.log('⏰ Timer bitti, otomatik kayıt yapılıyor')
    
    stopTimer()
    
    // Guard: Eğer zaten işlem yapılıyorsa tekrar çağrılmasın
    if (savingExercise?.value === 'AUTO_SAVING') {
      console.log('⚠️ Zaten otomatik kayıt yapılıyor, skip')
      return
    }
    
    // Callback varsa çağır (parent component'ten gelen completeCurrentSection gibi)
    if (onTimerComplete) {
      await onTimerComplete()
    }
  }
  
  /**
   * Bölüm timer'ını başlat
   * @param {Object} section - Bölüm bilgisi
   */
  const startTimer = async (section) => {
    stopTimer() // Mevcut timer'ı durdur
    
    console.log('🚀 Bölüm timer başlatılıyor:', section.section_title)
    console.log('📌 Section UUID:', section.section_uuid)
    
    // 1. Önce bölüm detaylarını yükle (eğer yüklenmemişse)
    if (!store.sectionDetails[section.section_uuid]) {
      console.log('📥 Bölüm detayları yükleniyor...')
      const detailsResult = await store.fetchSectionDetails(section.section_uuid)
      if (!detailsResult.success) {
        console.error('❌ Bölüm detayları yüklenemedi:', detailsResult.error)
        toast.add({
          severity: 'error',
          summary: 'Hata',
          detail: 'Bölüm yüklenemedi: ' + detailsResult.error,
          life: 3000
        })
        return
      }
    }
    
    // 2. Backend'e bölüm başlatma isteği gönder
    const startResult = await store.startSectionOnBackend(section.section_uuid)
    
    if (!startResult.success) {
      console.error('❌ Bölüm başlatılamadı:', startResult.error)
      
      // Eğer "already_completed" hatası ise, bu bölüm zaten tamamlanmış demektir
      if (startResult.error && startResult.error.includes('already_completed')) {
        toast.add({
          severity: 'info',
          summary: 'Bölüm Tamamlanmış',
          detail: 'Bu bölüm zaten tamamlanmış. Sonraki bölüme geçiliyor...',
          life: 3000
        })
        // Sonraki bölüme geç
        const currentIndex = store.sections.findIndex(s => s.section_uuid === section.section_uuid)
        if (currentIndex < store.sections.length - 1) {
          const nextSection = store.sections[currentIndex + 1]
          store.setCurrentSection(nextSection.section_uuid)
          await startTimer(nextSection)
        }
        return
      }
      
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'Bölüm başlatılamadı: ' + startResult.error,
        life: 5000
      })
      return
    }
    
    console.log('✅ Backend bölüm başlatıldı, süre bilgisi alınıyor...')
    
    // Backend'den gerçek kalan süreyi al
    const timeResult = await store.fetchRemainingTime()
    
    console.log('📥 Backend response:', timeResult)
    
    if (!timeResult.success) {
      console.error('❌ Kalan süre alınamadı:', timeResult.error)
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'Süre bilgisi alınamadı',
        life: 3000
      })
      return
    }
    
    // Süreyi set et
    remainingTime.value = timeResult.data.remaining_seconds
    console.log('⏱️ Başlangıç süresi set edildi:', remainingTime.value, 'saniye')
    console.log('📊 Backend data:', {
      total_duration: timeResult.data.total_duration,
      elapsed_seconds: timeResult.data.elapsed_seconds,
      remaining_seconds: timeResult.data.remaining_seconds
    })
    
    // Eğer süre 0 veya negatifse başlatma
    if (remainingTime.value <= 0) {
      console.warn('⚠️ Süre zaten bitmiş, timer başlatılmıyor')
      await handleTimerEnd()
      return
    }
    
    // Şimdi timer'ı başlat (süre garantili pozitif)
    sectionTimer.value = setInterval(() => {
      if (remainingTime.value > 0) {
        remainingTime.value--
      } else {
        // Süre bitti
        handleTimerEnd()
      }
    }, 1000)
    
    console.log('✅ Timer başlatıldı, her 10 saniyede sync olacak')
    
    // Her 10 saniyede backend ile senkronize et
    timerSyncInterval.value = setInterval(async () => {
      await syncWithBackend()
    }, 10000) // 10 saniye
  }
  
  /**
   * Sayfa yüklendiğinde mevcut bölüm için timer'ı devam ettir
   */
  const resumeTimer = async (section) => {
    stopTimer()
    
    console.log('🔄 Timer resume ediliyor:', section.section_title)
    
    // Backend'den kalan süreyi kontrol et
    const timeResult = await store.fetchRemainingTime()
    
    if (timeResult.success) {
      if (timeResult.data.time_expired || timeResult.data.remaining_seconds <= 0) {
        // Süre bitmiş, otomatik complete
        console.log('⏰ Bölüm süresi dolmuş, otomatik tamamlanıyor...')
        await handleTimerEnd()
      } else if (timeResult.data.remaining_seconds > 0) {
        // Süre var, timer devam ediyor
        remainingTime.value = timeResult.data.remaining_seconds
        console.log('⏱️ Timer resume ediliyor:', remainingTime.value, 'saniye')
        
        // Timer'ı başlat (ama backend'e yeni istek atmadan)
        sectionTimer.value = setInterval(() => {
          if (remainingTime.value > 0) {
            remainingTime.value--
          }
          
          if (remainingTime.value <= 0) {
            handleTimerEnd()
          }
        }, 1000)
        
        // Sync interval'ı başlat
        timerSyncInterval.value = setInterval(async () => {
          await syncWithBackend()
        }, 10000)
      }
    } else {
      // Backend'den süre bilgisi alınamadı, yeni başlat
      console.log('🆕 Backend süre bilgisi yok, yeni timer başlatılıyor')
      await startTimer(section)
    }
  }
  
  /**
   * Timer'ı sıfırla
   */
  const resetTimer = () => {
    stopTimer()
    remainingTime.value = 0
  }
  
  // ========================
  // RETURN PUBLIC API
  // ========================
  return {
    // State
    remainingTime,
    formattedTime,
    
    // Methods
    startTimer,
    stopTimer,
    resetTimer,
    resumeTimer,
    syncWithBackend,
    handleTimerEnd
  }
}
