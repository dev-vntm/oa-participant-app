import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAssessmentStore } from '~/stores/assessment'
import { useToast } from 'primevue/usetoast'

/**
 * Egzersiz ve bölüm navigation yönetimi composable
 * 
 * @param {Object} options
 * @param {Ref} options.currentSection - Mevcut bölüm ref'i
 * @param {Ref} options.currentSectionExercises - Mevcut bölüm egzersizleri
 * @param {Ref} options.currentExerciseStartTime - Egzersiz başlangıç zamanı
 * @param {Ref} options.showSectionCompletedMessage - Completion popup kontrolü
 * @param {Ref} options.completionMessage - Tamamlama mesajı
 * @param {Ref} options.selfEvaluationQuestions - Öz-değerlendirme soruları
 * @param {Ref} options.selfEvaluationAnswers - Öz-değerlendirme cevapları
 * @param {Ref} options.showSelfEvaluationDialog - Öz-değerlendirme dialog kontrolü
 * @param {Function} options.onStartTimer - Timer başlatma callback
 * @param {Function} options.onStopTimer - Timer durdurma callback
 * @param {Function} options.onResetTimer - Timer sıfırlama callback
 * @param {Function} options.onCleanupInventory - Envanter temizleme callback
 * @param {Function} options.isExerciseAnswered - Egzersiz cevap kontrolü
 * @returns {Object} Navigation state ve methodları
 */
export function useExerciseNavigation(options = {}) {
  const store = useAssessmentStore()
  const toast = useToast()
  const router = useRouter()
  
  const {
    currentSection,
    currentSectionExercises,
    currentExerciseStartTime,
    showSectionCompletedMessage,
    completionMessage,
    selfEvaluationQuestions,
    selfEvaluationAnswers,
    showSelfEvaluationDialog,
    onStartTimer,
    onStopTimer,
    onResetTimer,
    onCleanupInventory,
    isExerciseAnswered
  } = options
  
  // ========================
  // STATE
  // ========================
  const currentExerciseIndex = ref(0)
  
  // ========================
  // COMPUTED
  // ========================
  
  /**
   * Mevcut egzersiz
   */
  const currentExercise = computed(() => {
    if (!currentSectionExercises.value || currentSectionExercises.value.length === 0) return null
    return currentSectionExercises.value[currentExerciseIndex.value]
  })
  
  /**
   * Tamamlanan egzersiz sayısı
   */
  const completedExercisesCount = computed(() => {
    if (!currentSectionExercises.value) return 0
    return currentSectionExercises.value.filter(ex => isExerciseAnswered?.(ex.exercise_uuid)).length
  })
  
  /**
   * Bölüm tamamlanabilir mi?
   */
  const canCompleteSection = computed(() => {
    const exercises = currentSectionExercises.value
    if (!exercises || exercises.length === 0) return false
    
    // Tüm egzersizler cevaplanmış mı kontrol et
    return exercises.every(exercise => isExerciseAnswered?.(exercise.exercise_uuid))
  })
  
  /**
   * Son egzersiz mi?
   */
  const isLastExerciseInSection = computed(() => {
    if (!currentSectionExercises.value) return false
    return currentExerciseIndex.value === currentSectionExercises.value.length - 1
  })
  
  // ========================
  // NAVIGATION METHODS
  // ========================
  
  /**
   * Önceki egzersize geç
   */
  const goToPreviousExercise = () => {
    if (currentExerciseIndex.value > 0) {
      currentExerciseIndex.value--
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  /**
   * Sonraki egzersize geç
   */
  const goToNextExercise = () => {
    if (currentExerciseIndex.value < currentSectionExercises.value.length - 1) {
      currentExerciseIndex.value++
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  /**
   * Belirli bir egzersize git
   */
  const goToExercise = (index) => {
    if (index >= 0 && index < currentSectionExercises.value.length) {
      currentExerciseIndex.value = index
    }
  }
  
  /**
   * Bölüm kilitli mi kontrolü
   */
  const isSectionLocked = (index) => {
    // İlk bölüm her zaman açık
    if (index === 0) return false
    
    // Önceki bölüm tamamlanmış mı kontrol et
    const previousSection = store.sections[index - 1]
    return !store.isSectionCompleted(previousSection.section_uuid)
  }
  
  /**
   * Bölüm seçimi
   */
  const selectSection = async (sectionId, index) => {
    // Intro seçimi
    if (sectionId === 'intro') {
      if (onStopTimer) onStopTimer()
      store.setCurrentSection('intro')
      return
    }

    if (!store.hasStartedUI) {
      toast.add({
        severity: 'info',
        summary: 'Henüz Başlamadınız',
        detail: 'Lütfen önce "Başla" butonuna tıklayın',
        life: 3000
      })
      return
    }
    
    // Tamamlanmış bölümlere geri dönüş engeli
    if (store.isSectionCompleted(sectionId)) {
      toast.add({
        severity: 'info',
        summary: 'Bölüm Tamamlandı',
        detail: 'Tamamlanmış bölümlere geri dönemezsiniz',
        life: 3000
      })
      return
    }
    
    if (isSectionLocked(index)) {
      toast.add({
        severity: 'warn',
        summary: 'Bölüm Kilitli',
        detail: 'Önceki bölümü tamamlayarak bu bölümü açabilirsiniz',
        life: 3000
      })
      return
    }
    
    if (onStopTimer) onStopTimer()
    currentExerciseIndex.value = 0 // Yeni bölümde ilk egzersizden başla
    store.setCurrentSection(sectionId)
    
    const section = store.sections.find(s => s.section_uuid === sectionId)
    if (section && onStartTimer) {
      await onStartTimer(section)
    }
  }
  
  // ========================
  // SECTION COMPLETION
  // ========================
  
  /**
   * Bölümü tamamla ve sonrakine geç
   */
  const completeSectionAndNext = async () => {
    const currentIndex = store.sections.findIndex(s => s.section_uuid === store.currentSectionId)
    
    // Timer'ı durdur ve sıfırla
    if (onResetTimer) onResetTimer()
    
    // Backend'e bölüm tamamlama isteği gönder
    const result = await store.completeSection(store.currentSectionId)
    
    if (!result.success) {
      console.error('Bölüm tamamlama hatası:', result.error)
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'Bölüm tamamlanırken bir hata oluştu',
        life: 3000
      })
      return
    }
    
    // Backend'den gelen data
    const responseData = result.data || {}
    const isLastSection = responseData.is_last_section || false
    const customMessage = isLastSection 
      ? responseData.final_completion_message 
      : responseData.completion_message
    
    // Son bölüm için özel tebrik mesajları
    const finalMessages = [
      {
        title: 'Tebrikler!',
        description: 'Bir adım daha yaklaştınız hedeﬁnize! Bizce şimdi toplam, belli bir şeyler atıştırın, hazır olduğunuzda devam ederiz.',
        emoji: '🎯'
      },
      {
        title: 'Muhteşemsiniz!',
        description: 'Tüm değerlendirmeyi başarıyla tamamladınız! İnanılmaz bir iş çıkardınız. Emeğinize sağlık!',
        emoji: '🏆'
      },
      {
        title: 'Harika Bir Performans!',
        description: 'Değerlendirmeyi sonuna kadar getirdiniz! Gösterdiğiniz özen ve çaba takdire şayan. Harikasınız!',
        emoji: '⭐'
      },
      {
        title: 'Başardınız!',
        description: 'Son bölümü de tamamladınız! Şimdi rahat bir nefes alabilirsiniz. Gerisi bizden, harika sonuçlarınız hazır olduğunda devam ederiz.',
        emoji: '🎊'
      },
      {
        title: 'Mükemmel!',
        description: 'Tüm süreç boyunca harika bir performans sergilemişsiniz! Değerlendirme tamamlandı, sonuçlarınızı merakla bekliyoruz.',
        emoji: '🌟'
      }
    ]
    
    // Ara bölümler için motivasyonel mesajlar
    const motivationalMessages = [
      {
        title: 'Harika İş Çıkardınız!',
        description: 'Bir bölümü daha bitirdiniz bile! Şimdi bir kahve molasını hak ettiniz. Kendinizi hazır hissettiğinizde diğer bölüme geçelim.',
        emoji: '☕'
      },
      {
        title: 'Muhteşem İlerleme!',
        description: 'Çok iyi gidiyorsunuz! Kısa bir nefes alın, gerinin ve hazır olduğunuzda devam edelim. Acelemiz yok!',
        emoji: '🌟'
      },
      {
        title: 'Tebrikler!',
        description: 'Bir adım daha yaklaştınız hedeﬁnize! Biraz enerji toplayın, belki bir şeyler atıştırın, hazır olduğunuzda devam ederiz.',
        emoji: '🎯'
      },
      {
        title: 'Süpersiniz!',
        description: 'Bu bölümü harika tamamladınız! Biraz dinlenin, kafanızı rahatlatın. Sonra tekrar başlayalım, tamam mı?',
        emoji: '💪'
      },
      {
        title: 'Çok İyi Gidiyorsunuz!',
        description: 'İnanılmaz bir performans gösteriyorsunuz! Kısa bir mola yapın, enerjilenin. Diğer bölüm sizi bekliyor!',
        emoji: '🚀'
      },
      {
        title: 'Bravo!',
        description: 'Bir bölümü daha geride bıraktınız! Kendinize bir ödül verin, biraz ara verin. Hazır olduğunuzda devam edelim.',
        emoji: '🎉'
      },
      {
        title: 'Harikasınız!',
        description: 'Bu tempoda devam edersek çok iyi bir sonuç alacağız! Şimdi küçük bir mola, sonra tekrar sahneye!',
        emoji: '⭐'
      },
      {
        title: 'Aferin Size!',
        description: 'Çok güzel gidiyoruz! Biraz soluklanın, rahatlayın. Sonraki bölümde görüşmek üzere!',
        emoji: '👏'
      }
    ]
    
    // Mesajı belirle: Önce custom, yoksa random
    let messageToShow
    
    if (customMessage && customMessage.title) {
      // Backend'den özel mesaj geldi
      messageToShow = {
        title: customMessage.title,
        description: customMessage.message || '',
        emoji: customMessage.emoji || (isLastSection ? '🏆' : '🎉')
      }
    } else {
      // Custom mesaj yok, random mesaj göster
      const messages = isLastSection ? finalMessages : motivationalMessages
      messageToShow = messages[Math.floor(Math.random() * messages.length)]
    }
    
    // Önce öz-değerlendirme sorularını kontrol et
    try {
      const ApiService = (await import('~/utils/api')).default
      const api = new ApiService(store.sessionToken)
      const questionsResponse = await api.get(`/assessment/section-evaluations/${store.currentSectionId}`)
      
      if (questionsResponse.status === 'success' && questionsResponse.data && questionsResponse.data.length > 0) {
        // Öz-değerlendirme soruları var, önce onları göster
        if (selfEvaluationQuestions) selfEvaluationQuestions.value = questionsResponse.data
        if (selfEvaluationAnswers) selfEvaluationAnswers.value = {}
        if (showSelfEvaluationDialog) showSelfEvaluationDialog.value = true
        
        // Completion message'ı sakla, sonra göstereceğiz
        if (completionMessage) completionMessage.value = messageToShow
        
        // Son bölüm bilgisini sakla
        if (isLastSection) {
          await store.completeAssessment()
        }
        
        return // Dialog kapatılınca devam edilecek
      }
    } catch (error) {
      console.error('Öz-değerlendirme soruları yüklenirken hata:', error)
      // Hata olsa bile devam et
    }
    
    // Öz-değerlendirme sorusu yoksa direkt completion message göster
    if (completionMessage) completionMessage.value = messageToShow
    if (showSectionCompletedMessage) showSectionCompletedMessage.value = true
    
    // Son bölümse assessment tamamlama işlemini yap (ama popup'ta kalıyoruz)
    if (isLastSection) {
      await store.completeAssessment()
    }
    // Not: Ara bölümlerde currentSection'ı değiştirmiyoruz
    // proceedToNextSection zaten mevcut bölümden sonrakini bulacak
    
    // Not: Kullanıcı butona tıklayınca:
    // - Ara bölümse: proceedToNextSection() → sonraki bölüme geçer (timer başlar)
    // - Son bölümse: proceedToNextSection() → /assessment/completed sayfasına gider
  }
  
  /**
   * Sonraki bölüme devam et (completion popup'tan sonra)
   */
  const proceedToNextSection = async () => {
    try {
      // Mevcut bölümü bul ve sonraki bölümü hesapla
      const currentIdx = store.sections.findIndex(s => s.section_uuid === store.currentSectionId)
      const nextSection = currentIdx >= 0 && currentIdx < store.sections.length - 1 
        ? store.sections[currentIdx + 1] 
        : null
      
      if (nextSection) {
        // Sonraki bölüme geçiyoruz - popup'ı kapat
        if (showSectionCompletedMessage) showSectionCompletedMessage.value = false
        
        // Envanter temizle
        if (onCleanupInventory) onCleanupInventory()
        
        // Sonraki bölüme geç
        console.log('📍 Sonraki bölüme geçiliyor:', nextSection.section_title)
        store.setCurrentSection(nextSection.section_uuid)
        
        // Egzersiz index'ini sıfırla
        currentExerciseIndex.value = 0
        if (currentExerciseStartTime) currentExerciseStartTime.value = Date.now()
        
        // Timer'ı başlat
        if (onStartTimer) await onStartTimer(nextSection)
      } else {
        // Tüm bölümler tamamlandı - popup'ı KAPATMADAN yönlendir
        // Böylece yönlendirme sırasında arka plandaki egzersiz ekranı görünmez
        router.push('/assessment/completed')
      }
    } catch (error) {
      console.error('Sonraki bölüme geçerken hata:', error)
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'Sonraki bölüme geçerken bir hata oluştu',
        life: 3000
      })
    }
  }
  
  /**
   * Assessment'ı tamamla
   */
  const completeAssessment = async () => {
    const result = await store.completeAssessment()
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Tebrikler!',
        detail: 'Assessment başarıyla tamamlandı',
        life: 3000
      })
      
      setTimeout(() => {
        router.push('/assessment/completed')
      }, 2000)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: result.error,
        life: 3000
      })
    }
  }
  
  // ========================
  // RETURN PUBLIC API
  // ========================
  return {
    // State
    currentExerciseIndex,
    
    // Computed
    currentExercise,
    completedExercisesCount,
    canCompleteSection,
    isLastExerciseInSection,
    
    // Navigation Methods
    goToPreviousExercise,
    goToNextExercise,
    goToExercise,
    
    // Section Methods
    selectSection,
    isSectionLocked,
    completeSectionAndNext,
    proceedToNextSection,
    completeAssessment
  }
}
