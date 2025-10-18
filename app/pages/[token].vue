<template>
  <div class="assessment-entry-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <ProgressSpinner />
      <p class="loading-text">Davet bilgileri kontrol ediliyor...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <Card class="error-card">
        <template #content>
          <div class="error-content">
            <!-- Tamamlanmış assessment için özel ikon -->
            <i v-if="isCompletedAssessment" class="pi pi-check-circle completed-icon"></i>
            <i v-else class="pi pi-exclamation-triangle error-icon"></i>
            
            <h2>{{ isCompletedAssessment ? 'Değerlendirme Tamamlandı' : 'Bir Sorun Oluştu' }}</h2>
            <p>{{ error }}</p>
            
            <!-- Tamamlanmış assessment için bilgilendirme -->
            <div v-if="isCompletedAssessment" class="completed-info">
              <p class="info-text">
                <i class="pi pi-info-circle"></i>
                Bu değerlendirme linki artık geçerli değildir. Değerlendirme sonuçlarınız hazır olduğunda email ile bilgilendirileceksiniz.
              </p>
            </div>
            
            <Button 
              label="Sayfayı Kapat" 
              icon="pi pi-times" 
              @click="closePage"
              class="mt-4"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- 2FA Code Input -->
    <div v-else-if="store.codeVerificationPending" class="verification-container">
      <Card class="verification-card">
        <template #header>
          <div class="card-header">
            <i class="pi pi-shield"></i>
            <h2>Güvenlik Doğrulaması</h2>
          </div>
        </template>
        
        <template #content>
          <div class="verification-content">
            <div class="welcome-info">
              <p class="welcome-text">Merhaba <strong>{{ store.participantName }}</strong>,</p>
              <p class="project-name">{{ store.projectName }}</p>
            </div>

            <Message severity="info" :closable="false">
              Email adresinize gönderilen 6 haneli doğrulama kodunu giriniz.
            </Message>

            <div class="code-input-container">
              <label for="accessCode" class="input-label">Doğrulama Kodu</label>
              <InputText
                id="accessCode"
                v-model="accessCode"
                placeholder="000000"
                maxlength="6"
                class="code-input"
                :class="{ 'p-invalid': codeError }"
                @input="onCodeInput"
                @keyup.enter="verifyCode"
              />
              <small v-if="codeError" class="p-error">{{ codeError }}</small>
            </div>

            <Button
              label="Doğrula ve Devam Et"
              icon="pi pi-check"
              :loading="isVerifying"
              :disabled="accessCode.length !== 6"
              @click="verifyCode"
              class="verify-button"
              size="large"
            />

            <div class="help-text">
              <p>Kod almadınız mı?</p>
              <Button
                label="Yeni Kod Gönder"
                link
                :disabled="resendCountdown > 0"
                @click="resendCode"
              />
              <span v-if="resendCountdown > 0" class="countdown">
                ({{ resendCountdown }}s)
              </span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Welcome Screen (Token verified, waiting for code) -->
    <div v-else-if="store.tokenVerified && !store.isAuthenticated" class="welcome-container">
      <Card class="welcome-card">
        <template #content>
          <div class="welcome-screen">
            <i class="pi pi-envelope welcome-icon"></i>
            <h2>Doğrulama Kodu Gönderildi</h2>
            <p>Email adresinizi kontrol edin: <strong>{{ store.participantEmail }}</strong></p>
            <ProgressSpinner style="width: 50px; height: 50px;" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useParticipantAssessmentStore } from '~/stores/assessment'
import { useToast } from 'primevue/usetoast'

definePageMeta({
  layout: false, // Katılımcı için temiz layout
  middleware: [] // Hiçbir middleware çalışmasın (auth bypass)
})

const route = useRoute()
const router = useRouter()
const store = useParticipantAssessmentStore()
const toast = useToast()

// State
const isLoading = ref(true)
const isVerifying = ref(false)
const error = ref(null)
const accessCode = ref('')
const codeError = ref(null)
const resendCountdown = ref(0)
let resendInterval = null

// Token'ı route'dan al
const token = route.params.token

// Tamamlanmış assessment kontrolü
const isCompletedAssessment = computed(() => {
  return error.value && error.value.includes('tamamlanmış')
})

// Component mount
onMounted(async () => {
  await initializeAssessment()
})

// Cleanup
onUnmounted(() => {
  if (resendInterval) {
    clearInterval(resendInterval)
  }
})

// Token doğrulama ve 2FA başlatma
const initializeAssessment = async () => {
  if (!token) {
    error.value = 'Geçersiz davet linki'
    isLoading.value = false
    return
  }

  try {
    const result = await store.verifyToken(token)
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Başarılı',
        detail: result.message,
        life: 3000
      })
      startResendCountdown()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message || 'Beklenmeyen bir hata oluştu'
  } finally {
    isLoading.value = false
  }
}

// Kod input işleme
const onCodeInput = () => {
  // Sadece rakam kabul et
  accessCode.value = accessCode.value.replace(/[^0-9]/g, '')
  codeError.value = null
}

// Kod doğrulama
const verifyCode = async () => {
  if (accessCode.value.length !== 6) {
    codeError.value = 'Kod 6 haneli olmalıdır'
    return
  }

  isVerifying.value = true
  codeError.value = null

  try {
    const result = await store.verifyAccessCode(token, accessCode.value)
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Doğrulama Başarılı',
        detail: 'Assessment sayfasına yönlendiriliyorsunuz...',
        life: 2000
      })
      
      // Ana sayfaya yönlendir
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } else {
      codeError.value = result.error
      toast.add({
        severity: 'error',
        summary: 'Doğrulama Hatası',
        detail: result.error,
        life: 3000
      })
    }
  } catch (err) {
    codeError.value = err.message || 'Kod doğrulama hatası'
  } finally {
    isVerifying.value = false
  }
}

// Yeni kod gönder
const resendCode = async () => {
  isLoading.value = true
  
  try {
    const result = await store.verifyToken(token)
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Kod Gönderildi',
        detail: 'Yeni doğrulama kodu email adresinize gönderildi',
        life: 3000
      })
      startResendCountdown()
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: err.message,
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

// Resend countdown başlat
const startResendCountdown = () => {
  resendCountdown.value = 180
  
  if (resendInterval) {
    clearInterval(resendInterval)
  }
  
  resendInterval = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) {
      clearInterval(resendInterval)
    }
  }, 1000)
}

// Ana sayfaya dön
const goHome = () => {
  window.location.href = '/'
}

// Sayfayı kapat
const closePage = () => {
  window.close()
}
</script>

<style scoped>
.assessment-entry-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.loading-container,
.error-container,
.verification-container,
.welcome-container {
  width: 100%;
  max-width: 500px;
}

/* Loading */
.loading-container {
  text-align: center;
  color: white;
}

.loading-text {
  margin-top: 1rem;
  font-size: 1.1rem;
}

/* Error */
.error-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.error-content {
  text-align: center;
  padding: 2rem;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.completed-icon {
  font-size: 4rem;
  color: #10b981;
  margin-bottom: 1rem;
  filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3));
}

.error-content h2 {
  color: #1f2937;
  margin-bottom: 1rem;
}

.error-content p {
  color: #6b7280;
  font-size: 1.1rem;
}

.completed-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f0fdf4;
  border-left: 4px solid #10b981;
  border-radius: 8px;
}

.info-text {
  color: #047857;
  font-size: 0.95rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  line-height: 1.6;
}

.info-text i {
  margin-top: 0.2rem;
  flex-shrink: 0;
}

/* Verification */
.verification-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.card-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.card-header i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  display: block;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.verification-content {
  padding: 2rem;
}

.welcome-info {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-text {
  font-size: 1.1rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.project-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: #667eea;
}

.code-input-container {
  margin: 2rem 0;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.code-input {
  width: 100%;
  font-size: 2rem;
  text-align: center;
  letter-spacing: 0.5rem;
  font-weight: 600;
}

.verify-button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 1rem;
  font-size: 1.1rem;
}

.help-text {
  text-align: center;
  margin-top: 2rem;
  color: #6b7280;
}

.countdown {
  color: #9ca3af;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

/* Welcome Screen */
.welcome-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.welcome-screen {
  text-align: center;
  padding: 3rem 2rem;
}

.welcome-icon {
  font-size: 4rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.welcome-screen h2 {
  color: #1f2937;
  margin-bottom: 1rem;
}

.welcome-screen p {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

/* Responsive */
@media (max-width: 640px) {
  .assessment-entry-page {
    padding: 1rem;
  }
  
  .code-input {
    font-size: 1.5rem;
    letter-spacing: 0.3rem;
  }
}
</style>
