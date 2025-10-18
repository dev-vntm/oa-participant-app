<template>
  <div class="assessment-completed-page">
    <!-- ClientOnly wrapper: SSR hydration mismatch'i önler -->
    <ClientOnly>
      <Card class="completion-card">
        <template #content>
          <div class="completion-content">
            <!-- Success Icon Animation -->
            <div class="success-icon-container">
              <i class="pi pi-check-circle success-icon"></i>
            </div>

            <!-- Completion Message -->
            <h1 class="completion-title">Tebrikler!</h1>
            <h2 class="completion-subtitle">{{ store.projectName }}</h2>
            <p class="completion-message">
              Değerlendirmeyi başarıyla tamamladınız.
            </p>

            <!-- Participant Info -->
            <div class="participant-info">
              <div class="info-item">
                <i class="pi pi-user"></i>
                <span>{{ store.participantName }}</span>
              </div>
              <div class="info-item">
                <i class="pi pi-envelope"></i>
                <span>{{ store.participantEmail }}</span>
              </div>
            </div>

            <!-- Statistics -->
            <div class="statistics-grid">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-check"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ store.sections.length }}</div>
                  <div class="stat-label">Bölüm Tamamlandı</div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-list"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ store.totalExercises }}</div>
                  <div class="stat-label">Egzersiz Tamamlandı</div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-clock"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ completionTime }}</div>
                  <div class="stat-label">Toplam Süre</div>
                </div>
              </div>
            </div>

            <!-- Completion Date -->
            <div class="completion-date">
              <i class="pi pi-calendar"></i>
              <span>{{ formattedCompletionDate }}</span>
            </div>

            <!-- Next Steps -->
            <div class="next-steps">
              <h3>Sırada Ne Var?</h3>
              <ul>
                <li>Değerlendirme sonuçlarınız analiz edilecektir</li>
                <li>Sonuçlar hazır olduğunda email ile bilgilendirileceksiniz</li>
                <li>Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz</li>
              </ul>
            </div>

            <!-- Contact Info -->
            <div class="contact-info">
              <p>Sorularınız için:</p>
              <a href="mailto:support@vakamaka.com" class="contact-email">
                <i class="pi pi-envelope"></i>
                support@vakamaka.com
              </a>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Loading placeholder (gösterilmez, sadece hydration için) -->
      <template #fallback>
        <div class="loading-placeholder">
          <Card class="completion-card">
            <template #content>
              <div class="completion-content" style="text-align: center; padding: 3rem;">
                <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #667eea;"></i>
                <p style="margin-top: 1rem; color: #6b7280;">Yükleniyor...</p>
              </div>
            </template>
          </Card>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useParticipantAssessmentStore } from '~/stores/assessment'

definePageMeta({
  layout: false,
  middleware: [] // Panel auth bypass
})

const store = useParticipantAssessmentStore()

// Sayfa yüklendiğinde verileri güncelle
onMounted(async () => {
  // Session token kontrolü - localStorage temizlenmişse
  if (!store.sessionToken || !store.participantName) {
    console.error('❌ Oturum bilgisi bulunamadı - localStorage temizlenmiş olabilir')
    
    // Error sayfasına yönlendir
    navigateTo({
      path: '/assessment/error',
      query: {
        message: 'Oturum bilginiz bulunamadı. Lütfen davet linkini kullanarak tekrar giriş yapın.'
      }
    })
    return
  }
  
  // Eğer totalTimeSpent yüklenmemişse (0 ise), backend'den al
  if (store.sessionToken && store.totalTimeSpent === 0) {
    console.log('⏰ Toplam süre bilgisi yok, backend\'den yükleniyor...')
    await store.fetchProjectSummary()
  }
})

// Computed
const formattedCompletionDate = computed(() => {
  if (!store.completedAt) return 'Bilinmiyor'
  
  const date = new Date(store.completedAt)
  return date.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const completionTime = computed(() => {
  // Backend'den gelen gerçek harcanan süreyi kullan (time_spent toplamı)
  const totalSeconds = store.totalTimeSpent || 0
  
  console.log('⏱️ Toplam harcanan süre (saniye):', totalSeconds)
  
  if (totalSeconds === 0) return 'Bilinmiyor'
  
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  // Kullanıcı dostu format
  const parts = []
  if (hours > 0) parts.push(`${hours} saat`)
  if (minutes > 0) parts.push(`${minutes} dakika`)
  if (seconds > 0 && hours === 0) parts.push(`${seconds} saniye`) // Sadece 1 saatten azsa saniye göster
  
  return parts.join(' ') || 'Bilinmiyor'
})

// Methods
const closePage = () => {
  window.close()
}
</script>

<style scoped>
.assessment-completed-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.completion-card {
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.completion-content {
  padding: 2rem 1.5rem;
  text-align: center;
}

/* Success Icon */
.success-icon-container {
  margin-bottom: 1.5rem;
  animation: scaleIn 0.6s ease-out 0.2s both;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.success-icon {
  font-size: 4rem;
  color: #10b981;
  filter: drop-shadow(0 10px 20px rgba(16, 185, 129, 0.3));
}

/* Titles */
.completion-title {
  font-size: 2rem;
  color: #111827;
  margin: 0 0 0.5rem;
  font-weight: 700;
}

.completion-subtitle {
  font-size: 1.25rem;
  color: #667eea;
  margin: 0 0 0.75rem;
  font-weight: 600;
}

.completion-message {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Participant Info */
.participant-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4b5563;
  font-size: 0.95rem;
}

.info-item i {
  color: #667eea;
}

/* Statistics */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

/* Completion Date */
.completion-date {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.completion-date i {
  color: #667eea;
}

/* Next Steps */
.next-steps {
  text-align: left;
  padding: 1rem;
  background: #f0fdf4;
  border-left: 4px solid #10b981;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.next-steps h3 {
  color: #065f46;
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.next-steps ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #047857;
  font-size: 0.9rem;
}

.next-steps li {
  margin-bottom: 0.4rem;
  line-height: 1.5;
}

/* Contact Info */
.contact-info {
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.contact-info p {
  margin: 0 0 0.5rem;
  color: #78350f;
  font-weight: 600;
}

.contact-email {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #92400e;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.2s;
}

.contact-email:hover {
  color: #78350f;
}

.contact-email i {
  font-size: 1.2rem;
}

/* Close Button */
.close-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .assessment-completed-page {
    padding: 1rem;
  }

  .completion-content {
    padding: 2rem 1rem;
  }

  .completion-title {
    font-size: 2rem;
  }

  .completion-subtitle {
    font-size: 1.2rem;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .participant-info {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
