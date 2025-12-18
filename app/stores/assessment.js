import { defineStore } from 'pinia'
import ApiService from '~/utils/api'

export const useParticipantAssessmentStore = defineStore('participantAssessment', {
  state: () => ({
    // Authentication
    isAuthenticated: false,
    sessionToken: null,
    sessionExpiresAt: null,
    
    // Participant info
    participantId: null, // project_participants.id (backend'de user_id olarak gönderilecek)
    participantName: null,
    participantEmail: null,
    
    // Project info
    projectId: null,
    projectUuid: null,
    projectUUID: null, // Alias için
    projectName: null,
    projectWelcomeMessage: null, // Karşılama mesajı (HTML)
    projectHasFiles: false, // Vaka dosyaları var mı?
    project: null,
    
    // Assessment data
    sections: [], // Sadece özet bilgileri (exercise_count)
    sectionDetails: {}, // Açılan bölümlerin detayları {section_uuid: {exercises: [...]}}
    currentSectionId: null,
    completedSections: [],
    
    // Responses
    responses: {},
    
    // Progress
    totalExercises: 0,
    answeredExercises: 0,
    progressPercentage: 0,
    totalTimeSpent: 0, // Toplam harcanan süre (saniye)
    
    // Timestamps
    startedAt: null,
    completedAt: null,
    
    // UI state
    isLoading: false,
    error: null,
    hasStartedUI: false, // Kullanıcı "Başla" butonuna bastı mı?
    
    // 2FA
    tokenVerified: false,
    codeVerificationPending: false,
    
    // Policies
    legalPolicies: [],
    policiesAcceptedAt: null // KVKK onay tarihi
  }),

  getters: {
    // Session getters
    isSessionValid: (state) => {
      if (!state.sessionToken || !state.sessionExpiresAt) return false
      return new Date(state.sessionExpiresAt) > new Date()
    },
    
    sessionRemainingTime: (state) => {
      if (!state.sessionExpiresAt) return 0
      const remaining = new Date(state.sessionExpiresAt) - new Date()
      return Math.max(0, Math.floor(remaining / 1000)) // saniye
    },
    
    // Assessment status getters
    isStarted: (state) => !!state.startedAt,
    isCompleted: (state) => !!state.completedAt,
    
    // Section getters
    currentSection: (state) => {
      if (!state.currentSectionId) return null
      // Özet bilgilerden section al
      const sectionSummary = state.sections.find(s => s.section_uuid === state.currentSectionId)
      // Detayları birleştir (eğer yüklenmişse)
      const sectionDetail = state.sectionDetails[state.currentSectionId]
      return {
        ...sectionSummary,
        ...sectionDetail
      }
    },
    
    currentSectionExercises: (state) => {
      if (!state.currentSectionId) return []
      // Detaylardan egzersizleri al (cache'den)
      const sectionDetail = state.sectionDetails[state.currentSectionId]
      return sectionDetail?.exercises || []
    },
    
    isSectionCompleted: (state) => (sectionId) => {
      return state.completedSections.includes(sectionId)
    },
    
    // Progress getters
    overallProgress: (state) => {
      if (state.totalExercises === 0) return 0
      
      // Backend'den gelen toplam cevap sayısını kullan (her zaman doğru!)
      const progress = Math.round((state.answeredExercises / state.totalExercises) * 100)
      
      // %100'ü geçmesin
      return Math.min(progress, 100)
    },
    
    sectionProgress: (state) => (sectionId) => {
      const section = state.sections.find(s => s.section_uuid === sectionId)
      if (!section || !section.exercises) return 0
      
      const total = section.exercises.length
      if (total === 0) return 0
      
      const answered = section.exercises.filter(ex => 
        state.responses[ex.exercise_uuid]
      ).length
      
      return Math.round((answered / total) * 100)
    },
    
    // Exercise response getter
    getExerciseResponse: (state) => (exerciseUuid) => {
      return state.responses[exerciseUuid] || null
    }
  },

  actions: {
    /**
     * API Service başlat
     */
    initApi() {
      if (this.sessionToken) {
        return new ApiService(this.sessionToken)
      }
      return new ApiService()
    },

    /**
     * 1. Token doğrulama ve 2FA kod gönderimi
     */
    async verifyToken(token) {
      this.isLoading = true
      this.error = null

      try {
        const api = this.initApi()
        const response = await api.post('/assessment/verify-token', { token })

        if (response.status === 'success') {
          // Yeni davet linki - eski verileri temizle
          console.log('🔗 Yeni davet linki algılandı - eski veriler temizleniyor...')
          this.$reset()
          
          this.tokenVerified = true
          this.codeVerificationPending = true
          this.participantName = response.data.participant_name
          this.participantEmail = response.data.participant_email
          this.projectName = response.data.project_name
          
          return {
            success: true,
            data: response.data,
            message: response.message
          }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Token verification error:', error)
        this.error = error.message || 'Token doğrulama hatası'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 2. 2FA kod doğrulama
     */
    async verifyAccessCode(token, accessCode) {
      this.isLoading = true
      this.error = null

      try {
        const api = this.initApi()
        const response = await api.post('/assessment/verify-code', {
          token,
          access_code: accessCode
        })

        if (response.status === 'success') {
          // ÖNEMLİ: Yeni katılımcı için eski verileri temizle
          console.log('🧹 Yeni katılımcı - eski veriler temizleniyor...')
          this.$reset()
          
          // Yeni session bilgilerini kaydet
          this.isAuthenticated = true
          this.sessionToken = response.data.session_token
          this.sessionExpiresAt = response.data.expires_at
          this.participantId = response.data.participant_uuid
          this.participantName = response.data.participant_name
          this.participantEmail = response.data.participant_email || null
          this.projectId = response.data.project_id
          this.projectUuid = response.data.project_uuid
          this.projectName = response.data.project_name
          this.codeVerificationPending = false
          
          // Progress bilgilerini restore et (katılımcı kaldığı yerden devam edebilsin)
          if (response.data.started_at) {
            this.startedAt = response.data.started_at
            this.completedAt = response.data.completed_at
            this.currentSectionId = response.data.current_section_uuid
            this.completedSections = response.data.completed_sections || []
            this.hasStartedUI = true // Katılımcı daha önce başlamış
            
            console.log('📍 Katılımcı kaldığı yerden devam ediyor:')
            console.log('  - Mevcut bölüm:', this.currentSectionId)
            console.log('  - Tamamlanan bölümler:', this.completedSections.length)
            console.log('  - Toplam cevap:', response.data.total_responses)
          }
          
          console.log('✅ Yeni katılımcı session başlatıldı:', this.participantName)
          
          return { success: true, message: response.message }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Code verification error:', error)
        this.error = error.message || 'Kod doğrulama hatası'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 3. Session doğrulama
     */
    async validateSession() {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      try {
        const api = new ApiService(this.sessionToken)
        const response = await api.get('/assessment/validate-session')

        if (response.status === 'success') {
          // Bilgileri güncelle
          this.participantId = response.data.participant_id
          this.participantName = response.data.participant_name
          this.participantEmail = response.data.participant_email
          this.projectId = response.data.project_id
          this.projectName = response.data.project_name
          this.startedAt = response.data.started_at
          this.completedAt = response.data.completed_at
          
          return { success: true }
        } else {
          this.clearSession()
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Session validation error:', error)
        this.clearSession()
        return { success: false, error: error.message }
      }
    },

    /**
     * 4. Proje özet bilgilerini getir (GÜVENLİ - Sadece bölüm listesi)
     */
    async fetchProjectSummary() {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      this.isLoading = true
      this.error = null

      try {
        const api = new ApiService(this.sessionToken)
        const response = await api.get('/assessment/project-summary')

        if (response.status === 'success') {
          this.project = response.data.project
          this.projectId = response.data.project.id
          this.projectName = response.data.project.name
          this.projectUuid = response.data.project.project_uuid
          this.projectUUID = response.data.project.project_uuid // Alias
          this.projectWelcomeMessage = response.data.project.welcome_message || null
          this.projectHasFiles = response.data.project.has_files || false
          
          // Backend'den zaten sıralı gelir (ps.order ASC), ama emin olmak için tekrar sırala
          console.log('📊 Sections BEFORE filter:', response.data.sections.map(s => ({ title: s.section_title, order: s.order })))
          
          // Orphaned sections'ı filtrele (title null olanlar)
          const validSections = response.data.sections.filter(s => s.section_title && s.section_title.trim() !== '')
          
          this.sections = validSections.sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0))
          console.log('📊 Sections AFTER filter & sort:', this.sections.map(s => ({ title: s.section_title, order: s.order })))
          this.participantId = response.data.participant.id
          this.participantName = response.data.participant.name
          this.participantEmail = response.data.participant.email
          this.startedAt = response.data.participant.started_at
          this.currentSectionId = response.data.participant.current_section_uuid
          this.completedAt = response.data.participant.completed_at
          this.policiesAcceptedAt = response.data.participant.policies_accepted_at // KVKK onay durumu
          
          // Backend'den gelen toplam cevap sayısını kaydet
          const totalResponsesFromBackend = response.data.participant.total_responses || 0
          const totalTimeSpentFromBackend = response.data.participant.total_time_spent || 0
          
          this.totalTimeSpent = totalTimeSpentFromBackend
          
          console.log('⏱️ Backend\'den gelen toplam süre:', totalTimeSpentFromBackend, 'saniye')
          
          // Eğer katılımcı daha önce başlamışsa UI'ı da başlat
          if (this.startedAt) {
            this.hasStartedUI = true
            console.log('📍 Katılımcı daha önce başlamış - welcome screen atlanıyor')
          }
          
          // Tamamlanmış bölümleri array'e çevir
          this.completedSections = this.sections
            .filter(section => section.is_completed)
            .map(section => section.section_uuid)
          
          // Backend'den gelen toplam cevap sayısını kaydet (progress hesaplama için)
          this.answeredExercises = totalResponsesFromBackend
          
          console.log('✅ Tamamlanmış bölümler:', this.completedSections.length)
          console.log('📍 Mevcut bölüm:', this.currentSectionId)
          console.log('📊 Toplam verilen cevap:', totalResponsesFromBackend)
          
          // İlk bölümü aktif yap (SADECE eğer katılımcı daha önce başlamışsa ve bölümü yoksa)
          // Eğer henüz başlamamışsa Intro ekranında kalmalı
          if (!this.currentSectionId && this.sections.length > 0 && this.startedAt) {
            this.currentSectionId = this.sections[0].section_uuid
          }
          
          // Toplam egzersiz sayısını hesapla (sadece exercise_count)
          this.totalExercises = this.sections.reduce((total, section) => {
            return total + (section.exercise_count || 0)
          }, 0)
          
          return { success: true }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Fetch project summary error:', error)
        this.error = error.message || 'Proje özeti alınamadı'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 5. Bölüm detaylarını getir (GÜVENLİ - Sadece unlock bölüm)
     */
    async fetchSectionDetails(sectionUuid) {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      // ÖNEMLİ: Cache kontrolünü kaldırdık çünkü katılımcı tekrar giriş yaptığında
      // backend'den güncel responses'ları almamız gerekiyor
      // Cache sadece aynı session içinde kullanılmalı
      
      // Eğer daha önce yüklendiyse tekrar yükleme (SADECE aynı session içinde)
      // if (this.sectionDetails[sectionUuid]) {
      //   console.log('✅ Bölüm detayları cache\'den alındı:', sectionUuid)
      //   return { success: true, data: this.sectionDetails[sectionUuid], cached: true }
      // }

      this.isLoading = true
      this.error = null

      try {
        const api = new ApiService(this.sessionToken)
        const response = await api.get(`/assessment/section/${sectionUuid}`)

        if (response.status === 'success') {
          // Bölüm detaylarını cache'e kaydet
          this.sectionDetails[sectionUuid] = response.data.section
          
          // Cevapları restore et (katılımcı daha önce verdiği cevapları görsün)
          if (response.data.responses && Object.keys(response.data.responses).length > 0) {
            Object.assign(this.responses, response.data.responses)
            console.log('📝 Cevaplar restore edildi:', Object.keys(response.data.responses).length, 'cevap')
          }
          
          console.log('✅ Bölüm detayları yüklendi:', response.data.section.section_title)
          return { success: true, data: response.data.section }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Fetch section details error:', error)
        this.error = error.message || 'Bölüm detayları alınamadı'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 6. Assessment başlat
     */
    async startAssessment() {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      try {
        const api = new ApiService(this.sessionToken)
        const response = await api.post('/assessment/start')

        if (response.status === 'success') {
          this.startedAt = new Date().toISOString()
          return { success: true, message: response.message }
        } else {
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Start assessment error:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * 6. Cevap kaydet
     */
    async saveResponse(responseData, audioBlob = null) {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      try {
        const api = new ApiService(this.sessionToken)
        
        // Ses dosyası varsa FormData kullan
        if (audioBlob) {
          const formData = new FormData()
          
          // Ses dosyasını ekle
          formData.append('audio_file', audioBlob, 'recording.webm')
          
          // Diğer verileri JSON string olarak ekle
          Object.keys(responseData).forEach(key => {
            formData.append(key, responseData[key])
          })
          
          // FormData ile gönder (post metodu FormData destekliyor)
          const response = await api.post('/assessment/save-response', formData)
          
          if (response.status === 'success') {
            this.responses[responseData.exercise_uuid] = responseData
            
            if (response.total_responses !== undefined) {
              this.answeredExercises = response.total_responses
              console.log('📊 Progress güncellendi - Toplam cevap:', response.total_responses)
            }
            
            return { success: true, message: response.message }
          } else {
            return { success: false, error: response.message }
          }
        } else {
          // Ses yoksa normal JSON gönder
          const response = await api.post('/assessment/save-response', responseData)

          if (response.status === 'success') {
            this.responses[responseData.exercise_uuid] = responseData
            
            if (response.total_responses !== undefined) {
              this.answeredExercises = response.total_responses
              console.log('📊 Progress güncellendi - Toplam cevap:', response.total_responses)
            }
            
            return { success: true, message: response.message }
          } else {
            return { success: false, error: response.message }
          }
        }
      } catch (error) {
        console.error('Save response error:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * 7. Assessment tamamla
     */
    async completeAssessment() {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      try {
        const api = new ApiService(this.sessionToken)
        const response = await api.post('/assessment/complete')

        if (response.status === 'success') {
          this.completedAt = new Date().toISOString()
          return { success: true, message: response.message }
        } else {
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Complete assessment error:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * 8. Bölüm başlat (Backend'de timestamp kaydet)
     */
    async startSectionOnBackend(sectionUuid) {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      try {
        const api = new ApiService(this.sessionToken)
        const response = await api.post('/assessment/start-section', {
          section_uuid: sectionUuid
        })

        if (response.status === 'success') {
          return { success: true, data: response.data }
        } else {
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Start section error:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * 9. Backend'den kalan süreyi al
     */
    async fetchRemainingTime() {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      try {
        const api = new ApiService(this.sessionToken)
        const response = await api.get('/assessment/remaining-time')

        if (response.status === 'success') {
          return { success: true, data: response.data }
        } else {
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Fetch remaining time error:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * 8. İlerleme bilgisi getir
     */
    async fetchProgress() {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      try {
        const api = new ApiService(this.sessionToken)
        const response = await api.get('/assessment/progress')

        if (response.status === 'success') {
          this.totalExercises = response.data.total_exercises
          this.answeredExercises = response.data.answered_exercises
          this.progressPercentage = response.data.progress_percentage
          this.startedAt = response.data.started_at
          this.completedAt = response.data.completed_at
          
          return { success: true, data: response.data }
        } else {
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Fetch progress error:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * Bölüm değiştir
     */
    setCurrentSection(sectionId) {
      this.currentSectionId = sectionId
    },

    /**
     * Bölümü tamamlandı olarak işaretle
     */
    markSectionCompleted(sectionId) {
      if (!this.completedSections.includes(sectionId)) {
        this.completedSections.push(sectionId)
      }
    },

    /**
     * Bölümü tamamla (Backend'e kaydet)
     */
    async completeSection(sectionUuid) {
      if (!this.sessionToken) {
        return { success: false, error: 'Session token yok' }
      }

      try {
        const api = new ApiService(this.sessionToken)
        const response = await api.post('/assessment/complete-section', {
          section_uuid: sectionUuid
        })

        if (response.status === 'success') {
          // completedSections array'ine ekle
          this.markSectionCompleted(sectionUuid)

          // sections array'indeki is_completed flag'ini güncelle
          const section = this.sections.find(s => s.section_uuid === sectionUuid)
          if (section) {
            section.is_completed = true
          }

          console.log('✅ Bölüm tamamlandı:', sectionUuid)
          return { success: true, data: response.data }
        } else {
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Complete section error:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * Session temizleme (logout için)
     */
    clearSession() {
      this.isAuthenticated = false
      this.sessionToken = null
      this.sessionExpiresAt = null
      this.participantId = null
      this.projectId = null
      this.projectUuid = null
      this.currentSectionId = null
    },

    /**
     * Tüm state'i sıfırla
     */
    resetState() {
      this.$reset()
    },

    /**
     * Politikaları getir
     */
    async fetchLegalPolicies() {
      try {
        // Token korumalı endpoint olduğu için ApiService kullanıyoruz.
        // ApiService'e sessionToken geçmeliyiz.
        const api = new ApiService(this.sessionToken) 
        
        console.log('📜 Fetching policies from protected endpoint...')
        
        const response = await api.get('/legal-policies/consent')
        
        if (response.status === 'success') {
          // Backend artık array döndürüyor
          const policies = response.data.map(policy => ({
            id: policy.policy_type,
            policy_type: policy.policy_type,
            title: policy.title,
            content: policy.content,
            button_text: policy.button_text,
            require_signature: policy.require_signature === '1' || policy.require_signature === true,
            version: policy.version
          }))
          
          this.legalPolicies = policies
          console.log('📜 Policies loaded:', policies.length)
          console.log('📜 Policy types:', policies.map(p => p.policy_type).join(', '))
          
          return { success: true, data: policies }
        } else {
          return { success: false, error: response.message || 'Politikalar alınamadı' }
        }
      } catch (error) {
        console.error('Fetch policies error:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * KVKK ve yasal politikaları onayla (Backend'e kaydet)
     */
    async acceptPolicies(policies) {
      try {
        const api = new ApiService(this.sessionToken)
        
        console.log('✅ Saving policy consent to backend...', policies)
        
        const response = await api.post('/assessment/accept-policies', {
          policies: policies
        })
        
        if (response.status === 'success') {
          this.policiesAcceptedAt = response.data.policies_accepted_at
          console.log('✅ Policies consent saved:', this.policiesAcceptedAt)
          return { success: true, data: response.data }
        } else {
          return { success: false, error: response.message || 'Politika onayı kaydedilemedi' }
        }
      } catch (error) {
        console.error('Accept policies error:', error)
        return { success: false, error: error.message }
      }
    },

    /**
     * Error temizle
     */
    clearError() {
      this.error = null
    }
  },

  persist: {
    key: 'participant-assessment-session', // Panel auth'dan ayrı key
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    paths: [
      'isAuthenticated',
      'sessionToken',
      'sessionExpiresAt',
      'participantId',
      'participantName',
      'participantEmail',
      'projectId',
      'projectUuid',
      'projectName',
      'project',
      'sections',
      'currentSectionId',
      'completedSections',
      'responses',
      'totalExercises',
      'answeredExercises',
      'progressPercentage',
      'totalTimeSpent',
      'startedAt',
      'completedAt',
      'hasStartedUI'
    ]
  }
})

// Alias export for composables (backward compatibility)
export const useAssessmentStore = useParticipantAssessmentStore
