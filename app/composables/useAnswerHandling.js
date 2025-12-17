import { ref } from 'vue'
import { useAssessmentStore } from '~/stores/assessment'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

/**
 * Egzersiz cevap yönetimi composable
 * 
 * @param {Object} options
 * @param {Ref} options.currentSection - Mevcut bölüm ref'i
 * @param {Ref} options.currentExerciseIndex - Mevcut egzersiz index'i
 * @param {Ref} options.currentSectionExercises - Mevcut bölüm egzersizleri
 * @param {Ref} options.savingExercise - Kayıt durumu (collision prevention)
 * @param {Ref} options.currentExerciseStartTime - Egzersiz başlangıç zamanı
 * @param {Function} options.onSectionComplete - Bölüm tamamlama callback
 * @returns {Object} Answer handling state ve methodları
 */
export function useAnswerHandling(options = {}) {
  const store = useAssessmentStore()
  const toast = useToast()
  const confirm = useConfirm()
  
  const {
    currentSection,
    currentExerciseIndex,
    currentSectionExercises,
    savingExercise,
    currentExerciseStartTime,
    onSectionComplete
  } = options
  
  // ========================
  // STATE
  // ========================
  const exerciseAnswers = ref({})
  const audioRecordings = ref({})
  const showAudioRecorder = ref(false)
  
  // ========================
  // HELPERS
  // ========================
  
  /**
   * Egzersiz cevaplandı mı kontrolü
   */
  const isExerciseAnswered = (exerciseUuid) => {
    return !!store.responses[exerciseUuid]
  }
  
  /**
   * Info tipindeki egzersiz mi kontrolü
   */
  const isInfoExercise = (exercise) => {
    return exercise.type === 'info' || exercise.exercise_type === 'info'
  }
  
  // ========================
  // AUDIO HANDLING
  // ========================
  
  /**
   * Ses kaydı ekle
   */
  const handleAudioSave = (audioBlob, exerciseUuid) => {
    if (exerciseUuid) {
      audioRecordings.value[exerciseUuid] = audioBlob
      toast.add({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Ses kaydı eklendi',
        life: 2000
      })
    }
  }
  
  /**
   * Ses kaydını sil
   */
  const removeAudioRecording = (exerciseUuid) => {
    delete audioRecordings.value[exerciseUuid]
    toast.add({
      severity: 'info',
      summary: 'Bilgi',
      detail: 'Ses kaydı kaldırıldı',
      life: 2000
    })
  }
  
  // ========================
  // SAVE OPERATIONS
  // ========================
  
  /**
   * Egzersiz cevabını kaydet
   * @param {Object} exercise - Egzersiz bilgisi
   * @param {Boolean} silent - Sessiz kayıt (toast gösterme)
   */
  const saveExerciseResponse = async (exercise, silent = false) => {
    // Zaten kaydedilmiş cevaplara izin verme
    if (isExerciseAnswered(exercise.exercise_uuid)) {
      if (!silent) {
        toast.add({
          severity: 'info',
          summary: 'Bilgilendirme',
          detail: 'Bu egzersiz için cevabınız zaten kaydedildi',
          life: 3000
        })
      }
      return { success: false, alreadyAnswered: true }
    }
    
    const answer = exerciseAnswers.value[exercise.exercise_uuid]
    
    // Info tipi egzersizler için cevap zorunlu değil
    if (isInfoExercise(exercise)) {
      // Info egzersizi için otomatik "görüldü" işareti
      store.responses[exercise.exercise_uuid] = {
        exercise_uuid: exercise.exercise_uuid,
        answer_value: 'INFO_VIEWED',
        answer_text: 'Bilgilendirme görüntülendi'
      }
      return { success: true, isInfo: true }
    }
    
    if (!answer || answer.trim() === '') {
      if (!silent) {
        toast.add({
          severity: 'warn',
          summary: 'Uyarı',
          detail: 'Lütfen bir cevap giriniz',
          life: 3000
        })
      }
      return { success: false, emptyAnswer: true }
    }

    if (savingExercise) {
      savingExercise.value = exercise.exercise_uuid
    }

    try {
      const responseData = {
        section_uuid: store.currentSectionId || currentSection?.value?.section_uuid,
        exercise_uuid: exercise.exercise_uuid,
        question_id: null,
        answer_value: answer,
        answer_text: answer,
        time_spent: currentExerciseStartTime?.value 
          ? Math.floor((Date.now() - currentExerciseStartTime.value) / 1000) 
          : 0
      }

      // Ses kaydı varsa ekle
      const audioBlob = audioRecordings.value[exercise.exercise_uuid]
      
      const result = await store.saveResponse(responseData, audioBlob)

      if (result.success) {
        if (!silent) {
          toast.add({
            severity: 'success',
            summary: 'Harika! 🎉',
            detail: 'Cevabınız başarıyla kaydedildi',
            life: 2000
          })
        }
        return { success: true }
      } else {
        toast.add({
          severity: 'error',
          summary: 'Hata',
          detail: result.error,
          life: 3000
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'Cevap kaydedilemedi',
        life: 3000
      })
      return { success: false, error: error.message }
    } finally {
      if (savingExercise) {
        savingExercise.value = null
      }
    }
  }
  
  /**
   * Kaydet ve sonraki egzersize geç
   */
  const saveAndNext = async (exercise) => {
    const result = await saveExerciseResponse(exercise, false)
    
    if (!result.success && !result.isInfo) {
      return
    }
    
    // Son egzersiz mi kontrol et
    const isLastExercise = currentExerciseIndex.value === currentSectionExercises.value.length - 1
    
    if (isLastExercise) {
      // Son egzersizse bölümü otomatik tamamla
      toast.add({
        severity: 'success',
        summary: 'Harika! 🎉',
        detail: 'Tüm egzersizleri tamamladınız. Bölüm tamamlanıyor...',
        life: 2000
      })
      
      // 1 saniye bekle, sonra bölümü tamamla
      setTimeout(async () => {
        if (onSectionComplete) {
          await onSectionComplete()
        }
      }, 1000)
    } else {
      // Sonraki egzersize geç
      currentExerciseIndex.value++
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  /**
   * Onay dialogu ile kaydet
   */
  const confirmAndSave = async (exercise) => {
    const answer = exerciseAnswers.value[exercise.exercise_uuid]
    
    // Info tipi egzersizler için cevap zorunlu değil
    if (isInfoExercise(exercise)) {
      await saveAndNext(exercise)
      return
    }
    
    // Cevap boşsa uyar
    if (!answer || answer.trim() === '') {
      toast.add({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Lütfen bir cevap giriniz',
        life: 3000
      })
      return
    }
    
    // Confirm dialog göster
    confirm.require({
      message: 'Bu cevabınızı kaydettikten sonra tekrar düzenleyemezsiniz. Devam etmek istiyor musunuz?',
      header: 'Cevabı Kaydet',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, Kaydet',
      rejectLabel: 'İptal',
      acceptClass: 'p-button-success',
      rejectClass: 'p-button-secondary p-button-outlined',
      accept: async () => {
        await saveAndNext(exercise)
      },
      reject: () => {
        // İptal edildi, hiçbir şey yapma
      }
    })
  }
  
  /**
   * EmailInboxView için: Kaydet ve sonraki email'e geç
   */
  const confirmAndSaveAndNext = async (exercise) => {
    const answer = exerciseAnswers.value[exercise.exercise_uuid]
    
    // Cevap boşsa uyar
    if (!answer || answer.trim() === '') {
      toast.add({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Lütfen bir cevap giriniz',
        life: 3000
      })
      return
    }
    
    // Confirm dialog göster
    confirm.require({
      message: 'Bu cevabınızı kaydettikten sonra tekrar düzenleyemezsiniz. Devam etmek istiyor musunuz?',
      header: 'Cevabı Kaydet',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, Kaydet ve Devam',
      rejectLabel: 'İptal',
      acceptClass: 'p-button-success',
      rejectClass: 'p-button-secondary p-button-outlined',
      accept: async () => {
        await saveExerciseResponse(exercise, false)
        // EmailInboxView kendi içinde sonraki email'i seçecek
      },
      reject: () => {
        // İptal edildi
      }
    })
  }
  
  /**
   * Timer bittiğinde otomatik kaydet ve devam et
   */
  const autoSaveAndNext = async () => {
    // Cevaplanmış egzersizleri kaydet
    const exercises = currentSectionExercises.value
    for (const exercise of exercises) {
      if (exerciseAnswers.value[exercise.exercise_uuid]) {
        await saveExerciseResponse(exercise, true) // Silent save
      }
    }
    
    // Bölümü tamamla ve sonrakine geç
    if (onSectionComplete) {
      await onSectionComplete()
    }
  }
  
  /**
   * Mevcut cevapları yükle (store'dan)
   */
  const loadExistingAnswers = () => {
    Object.keys(store.responses).forEach(exerciseUuid => {
      const response = store.responses[exerciseUuid]
      exerciseAnswers.value[exerciseUuid] = response.answer_text || response.answer_value
    })
  }
  
  // ========================
  // RETURN PUBLIC API
  // ========================
  return {
    // State
    exerciseAnswers,
    audioRecordings,
    showAudioRecorder,
    
    // Helpers
    isExerciseAnswered,
    isInfoExercise,
    
    // Audio
    handleAudioSave,
    removeAudioRecording,
    
    // Save Operations
    saveExerciseResponse,
    saveAndNext,
    confirmAndSave,
    confirmAndSaveAndNext,
    autoSaveAndNext,
    loadExistingAnswers
  }
}
