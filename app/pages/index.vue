<template>
  <ClientOnly>
  <Toast />
  <ConfirmDialog />
  <div class="assessment-workspace" lang="tr">
    <!-- Welcome Dialog -->
    <Dialog 
      v-model:visible="showWelcomeDialog" 
      modal 
      :closable="false"
      :draggable="false"
      :style="{ width: '50rem', maxWidth: '90vw' }"
      class="welcome-dialog"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-info-circle text-purple-600" style="font-size: 2rem;"></i>
          <h2 class="text-2xl font-bold text-gray-800 m-0">Hoş Geldiniz!</h2>
        </div>
      </template>

      <div class="welcome-dialog-content">
        <!-- HTML içeriği burada gösterilecek -->
        <div 
          v-if="store.projectWelcomeMessage" 
          class="welcome-message-html"
          v-html="store.projectWelcomeMessage"
        ></div>
        
        <!-- Varsayılan mesaj -->
        <div v-else class="default-welcome-message">
          <h3>{{ store.projectName }} - Değerlendirmeye Hoş Geldiniz!</h3>
          <p>
            Bugün VakaMaka Değerlendirme ve Gelişim Merkezi simülasyonuna katılıyorsunuz. Tüm gün boyunca sistemde yer alan dokümanlardan ve size verilen bilgilerden yararlanacaksınız.
          </p>
          <p class="font-semibold">
            Amacımız teknik bilginizi ölçmek değil; herhangi bir bilgi ezberlemenizi beklemiyoruz. Size verilen dokümanları gün içinde istediğiniz zaman tekrar açarak bilgi alabilirsiniz.
          </p>
          <p>
            Bugün katılacağınız simülasyonda, Hard Cookie Games isimli bir oyun şirketinin, yeni oluşturulan proje grubunda çalışan rolünü üstleneceksiniz. Oyun sektörü hakkında önceden bilgi sahibi olmanız gerekmemektedir. Katılacağınız simülasyonda sergilediğiniz liderlik yetkinliklerinizi gözlemleyecek ve değerlendireceğiz.
          </p>
          <h4 class="text-lg font-semibold mt-4">Rolünüz:</h4>
          <p>
            Hard Cookie Games, ortaklık yapısı yakın zamanda değişmiş bir online oyun şirketidir. Değişen ortaklık yapısına bağlı olarak şirketin yönetim kurulundaki üye sayısı artmış ve üyeler arasında, yeni geliştirilen oyunlarla ilgili görüş ayrılıkları ortaya çıkmıştır.
          </p>
        </div>

        <!-- Onay kutucuğu -->
        <div class="mt-6 flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <Checkbox v-model="welcomeAcknowledged" :binary="true" inputId="acknowledge" />
          <label for="acknowledge" class="text-sm text-gray-700 cursor-pointer">
            <span class="font-semibold">Okudum, anladım.</span> Değerlendirme sürecine devam etmek için bu kutucuğu işaretleyip "Devam Et" butonuna tıklayabilirsiniz.
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            label="Devam Et" 
            icon="pi pi-arrow-right"
            iconPos="right"
            @click="closeWelcomeDialog"
            :disabled="!welcomeAcknowledged"
            size="large"
            class="p-button-success"
          />
        </div>
      </template>
    </Dialog>

    <!-- Header -->
    <div class="workspace-header">
      <div class="header-content">
        <div class="project-info">
          <h1>{{ store.projectName }}</h1>
          <p class="participant-name">{{ store.participantName }}</p>
        </div>
        
        <div class="header-actions">
          <div class="progress-info">
            <span class="progress-text">{{ store.overallProgress }}% Tamamlandı</span>
            <ProgressBar 
              :value="store.overallProgress" 
              :showValue="false"
              class="progress-bar-mini"
            />
          </div>
          
          <Button
            v-if="canComplete"
            label="Tamamla"
            icon="pi pi-check"
            severity="success"
            @click="completeAssessment"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="workspace-content">
      <!-- Left Sidebar: Sections -->
      <div class="sections-sidebar">
        <div class="sidebar-header">
          <h3>Bölümler</h3>
        </div>
        
        <div class="sections-list">
          <div
            v-for="(section, index) in store.sections"
            :key="section.section_uuid"
            class="section-item"
            :class="{
              'active': store.currentSectionId === section.section_uuid,
              'completed': store.isSectionCompleted(section.section_uuid),
              'locked': isSectionLocked(index)
            }"
            @click="selectSection(section.section_uuid, index)"
          >
            <div class="section-icon">
              <i v-if="store.isSectionCompleted(section.section_uuid)" class="pi pi-check-circle"></i>
              <i v-else-if="isSectionLocked(index)" class="pi pi-lock"></i>
              <i v-else class="pi pi-circle"></i>
            </div>
            
            <div class="section-info">
              <h4>{{ section.section_title }}</h4>
              <div class="section-meta">
                <span class="exercise-count">
                  <i class="pi pi-list"></i>
                  {{ section.exercise_count || section.exercises?.length || 0 }} Egzersiz
                </span>
                <span class="duration">
                  <i class="pi pi-clock"></i>
                  {{ getSectionDuration(section) }} dk
                </span>
              </div>
              
              <ProgressBar
                :value="store.sectionProgress(section.section_uuid)"
                :showValue="false"
                class="section-progress"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Exercises Area -->
      <div class="exercises-area">
        <!-- Welcome Screen -->
        <div v-if="!store.hasStartedUI" class="welcome-screen">
          <div class="welcome-content">
            <div class="welcome-icon">
              <i class="pi pi-play-circle" style="font-size: 4rem; color: #8b5cf6;"></i>
            </div>
            <h2>Hazırsan Başlayalım! 🚀</h2>
            <p class="welcome-message">
              {{ store.projectName }} değerlendirmesine hoş geldiniz.<br>
              Başlamak için aşağıdaki butona tıklayın.
            </p>
            <div class="welcome-stats">
              <div class="stat-item">
                <i class="pi pi-list"></i>
                <span>{{ store.sections.length }} Bölüm</span>
              </div>
              <div class="stat-item">
                <i class="pi pi-file"></i>
                <span>{{ store.totalExercises }} Egzersiz</span>
              </div>
              <div class="stat-item">
                <i class="pi pi-clock"></i>
                <span>~{{ totalDuration }} Dakika</span>
              </div>
            </div>
            <Button
              label="Başla"
              icon="pi pi-arrow-right"
              size="large"
              @click="startWorkspace"
              class="start-button"
            />
          </div>
        </div>

        <div v-else-if="!store.currentSectionId" class="empty-state">
          <i class="pi pi-arrow-left"></i>
          <p>Sol taraftan bir bölüm seçiniz</p>
        </div>

        <!-- Bölüm Tamamlama Mesajı (Section Completed Message) -->
        <div v-else-if="showSectionCompletedMessage" class="section-completed-overlay">
          <div class="completion-card">
            <div class="completion-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h2>{{ completionMessage.title }}</h2>
            <p class="completion-text">{{ completionMessage.description }}</p>
            <div class="completion-emoji">{{ completionMessage.emoji }}</div>
            <Button
              :label="nextSectionExists ? 'Sonraki Bölüme Geç' : 'Tamamla'"
              icon="pi pi-arrow-right"
              size="large"
              class="next-section-button"
              @click="proceedToNextSection"
            />
          </div>
        </div>

        <div v-else class="exercises-container">
          <!-- Modern Section Header with Action Button -->
          <div class="modern-section-header">
            <div class="header-content">
              <div class="header-title-area">
                <h1 class="section-title">{{ currentSection?.section_title }}</h1>
                <p class="section-subtitle" v-if="currentSection?.section_description">
                  {{ currentSection?.section_description }}
                </p>
              </div>
              <div class="flex justify-between">
                <div class="progress-stats">
                  <span class="stat-badge">
                    <i class="pi pi-list"></i>
                    {{ completedExercisesCount }}/{{ currentSectionExercises.length }} Egzersiz
                  </span>
                  <span class="stat-badge">
                    <i class="pi pi-clock"></i>
                    {{ formatTime(remainingTime) }} Kalan Süre
                  </span>
                </div>
                <Button
                  v-if="canCompleteSection"
                  label="Bölümü Tamamla"
                  icon="pi pi-arrow-right"
                  severity="success"
                  raised
                  @click="completeSectionAndNext"
                  class="complete-section-btn ml-8"
                />
              </div>
              
            </div>
            <div class="progress-indicator">
              <ProgressBar 
                :value="sectionProgressPercentage" 
                :showValue="false"
                class="section-progress-bar"
              />
            </div>
          </div>

          <!-- Modern Single Exercise View -->
          <div class="modern-exercise-container" v-if="currentExercise">
            <div class="exercise-navigation" v-if="currentSectionExercises.length > 1">
              <!-- Önceki Egzersiz -->
              <div v-if="currentExerciseIndex > 0" class="nav-button-wrapper">
                <Button
                  icon="pi pi-chevron-left"
                  @click="goToPreviousExercise"
                  text
                  size="small"
                  severity="secondary"
                  class="nav-button-with-label"
                />
                <span class="nav-label">Önceki Egzersiz</span>
              </div>
              <div v-else class="nav-button-placeholder"></div>
              
              <div class="exercise-nav-center">
                <span class="exercise-counter">
                  Egzersiz {{ currentExerciseIndex + 1 }} / {{ currentSectionExercises.length }}
                </span>
                <div class="exercise-dots">
                  <span 
                    v-for="(ex, idx) in currentSectionExercises" 
                    :key="ex.exercise_uuid"
                    class="dot"
                    :class="{ 
                      'active': idx === currentExerciseIndex,
                      'completed': hasResponse(ex.exercise_uuid)
                    }"
                    @click="goToExercise(idx)"
                  ></span>
                </div>
              </div>
              
              <!-- Sonraki Egzersiz -->
              <div v-if="currentExerciseIndex < currentSectionExercises.length - 1" class="nav-button-wrapper">
                <span class="nav-label">Sonraki Egzersiz</span>
                <Button
                  icon="pi pi-chevron-right"
                  @click="goToNextExercise"
                  text
                  size="small"
                  severity="secondary"
                  class="nav-button-with-label"
                />
              </div>
              <div v-else class="nav-button-placeholder"></div>
            </div>

            <div class="modern-exercise-card">
              <!-- Exercise Header -->
              <div class="exercise-card-header">
                <h2 class="exercise-title">{{ currentExercise.exercise_title }}</h2>
                <div class="exercise-badge-container">
                  <span class="exercise-type-badge" :class="currentExercise.exercise_type || 'info'">
                    {{ formatQuestionType(currentExercise.exercise_type || 'Bilgilendirme') }}
                  </span>
                  <Tag
                    v-if="hasResponse(currentExercise.exercise_uuid)"
                    value="Tamamlandı"
                    severity="success"
                    icon="pi pi-check"
                    class="completed-tag"
                  />
                </div>
                
              </div>

              <!-- Exercise Instructions (Talimatlar) - Collapsible -->
              <Panel 
                v-if="currentExercise.instructions"
                :collapsed="false"
                toggleable
                class="exercise-instructions-panel"
              >
                <template #header>
                  <div class="instructions-panel-header">
                    <div class="header-left">
                      <i class="pi pi-info-circle"></i>
                      <span>Talimatlar</span>
                    </div>
                    <div class="header-right">
                      <Button
                        icon="pi pi-volume-up"
                        :label="isSpeaking ? 'Durdur' : 'Dinle'"
                        text
                        rounded
                        size="small"
                        :severity="isSpeaking ? 'danger' : 'secondary'"
                        @click.stop="toggleSpeech(currentExercise.instructions)"
                        :loading="isSpeechLoading"
                      />
                    </div>
                  </div>
                </template>
                <div class="instructions-content" v-html="currentExercise.instructions"></div>
              </Panel>

              <!-- Exercise Description -->
              <div class="exercise-description-modern" v-if="currentExercise.description">
                <p>{{ currentExercise.description }}</p>
              </div>

              <!-- Answer Section (Bilgilendirme değilse) -->
              <div v-if="currentExercise.exercise_type !== 'info' && currentExercise.exercise_type !== 'Bilgilendirme'" class="modern-answer-section">
                <div class="answer-header">
                  <label class="answer-label">
                    <i class="pi pi-pencil"></i>
                    {{ isExerciseAnswered(currentExercise.exercise_uuid) ? 'Kaydedilen Cevabınız (Düzenlenemez)' : 'Cevabınız' }}
                  </label>
                  <Button
                    v-if="!isExerciseAnswered(currentExercise.exercise_uuid)"
                    label="Ses Kaydı Ekle"
                    icon="pi pi-microphone"
                    @click="showAudioRecorder = true"
                    text
                    size="small"
                    class="audio-record-btn"
                  />
                </div>
                <TipTapEditor
                  v-model="exerciseAnswers[currentExercise.exercise_uuid]"
                  :placeholder="isExerciseAnswered(currentExercise.exercise_uuid) ? 'Bu cevap kaydedildi ve değiştirilemez.' : 'Düşüncelerinizi buraya yazabilirsiniz...'"
                  :disabled="isExerciseAnswered(currentExercise.exercise_uuid)"
                  :character-limit="5000"
                />
                
                <!-- Ses kaydı varsa göster -->
                <div v-if="audioRecordings[currentExercise.exercise_uuid]" class="audio-attachment">
                  <i class="pi pi-volume-up"></i>
                  <span>Ses kaydı eklendi</span>
                  <Button
                    v-if="!isExerciseAnswered(currentExercise.exercise_uuid)"
                    icon="pi pi-times"
                    @click="removeAudioRecording(currentExercise.exercise_uuid)"
                    text
                    rounded
                    size="small"
                    severity="danger"
                  />
                </div>
                
                <!-- Cevap kaydedildiyse bilgi mesajı göster -->
                <div v-if="isExerciseAnswered(currentExercise.exercise_uuid)" class="answer-locked-info">
                  <i class="pi pi-lock"></i>
                  <span>Bu egzersiz için cevabınız kaydedildi. Artık değişiklik yapamazsınız.</span>
                </div>
                
                <div v-else class="answer-actions-modern">
                  <!-- Navigasyon: Önceki Egzersiz -->
                  <Button
                    v-if="currentExerciseIndex > 0"
                    icon="pi pi-chevron-left"
                    @click="goToPreviousExercise"
                    text
                    rounded
                    severity="secondary"
                    class="nav-exercise-btn"
                    v-tooltip.top="'Önceki Egzersiz'"
                  />
                  
                  <!-- Tek Buton: Kaydet ve Devam / Kaydet ve Tamamla -->
                  <Button
                    :label="isLastExerciseInSection ? 'Kaydet ve Bölümü Tamamla' : 'Kaydet ve Devam Et'"
                    :icon="isLastExerciseInSection ? 'pi pi-check-circle' : 'pi pi-arrow-right'"
                    :loading="savingExercise === currentExercise.exercise_uuid"
                    @click="confirmAndSave(currentExercise)"
                    iconPos="right"
                    severity="success"
                    size="large"
                    class="save-next-btn"
                  />
                  
                  <!-- Navigasyon: Sonraki Egzersiz -->
                  <Button
                    v-if="currentExerciseIndex < currentSectionExercises.length - 1 && isExerciseAnswered(currentExercise.exercise_uuid)"
                    icon="pi pi-chevron-right"
                    @click="goToNextExercise"
                    text
                    rounded
                    severity="secondary"
                    class="nav-exercise-btn"
                    v-tooltip.top="'Sonraki Egzersiz'"
                  />
                </div>
              </div>

              <!-- Bilgilendirme Egzersizi (Info Type) -->
              <div v-else class="info-exercise-actions">
                <div class="info-message">
                  <i class="pi pi-lightbulb"></i>
                  <span>Bu bir bilgilendirme egzersizidir. Hazır olduğunuzda devam edebilirsiniz.</span>
                </div>
                <Button
                  label="Anladım, Devam Et"
                  icon="pi pi-arrow-right"
                  @click="markInfoAsRead(currentExercise)"
                  size="large"
                  class="info-continue-btn"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar: Section Documents / PDF Viewer -->
      <div class="documents-sidebar" v-if="store.sections.length > 0" :class="{ 'pdf-viewer-active': pdfViewerDialog, 'pdf-fullscreen': pdfFullscreen }">
        <!-- PDF Viewer Mode -->
        <template v-if="pdfViewerDialog">
          <div class="pdf-viewer-header">
            <div class="pdf-viewer-title">
              <i class="pi pi-file-pdf"></i>
              <h3>{{ currentPdfName }}</h3>
            </div>
            <div class="pdf-header-actions">
              <Button
                :icon="pdfFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
                :title="pdfFullscreen ? 'Normal Boyut' : 'Tam Ekran'"
                text
                rounded
                @click="togglePdfFullscreen"
              />
              <Button
                icon="pi pi-times"
                title="Kapat (ESC)"
                text
                rounded
                severity="secondary"
                @click="closePdfViewer"
              />
            </div>
          </div>
          <div class="pdf-viewer-content">
            <!-- Simple PDF iframe -->
            <iframe 
              v-if="currentPdfUrl"
              :src="`${currentPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`"
              frameborder="0"
              width="100%"
              height="100%"
              style="border: none;"
            ></iframe>
          </div>
        </template>

        <!-- Document List Mode -->
        <template v-else>
          <div class="sidebar-header">
            <h3>Bölüm Envanteri</h3>
          </div>
          
          <div class="documents-content">
          <!-- Bölüm Timer -->
          <div class="section-timer-card" v-if="store.hasStartedUI && store.currentSectionId">
            <div class="timer-icon">
              <i class="pi pi-clock"></i>
            </div>
            <div class="timer-info">
              <span class="timer-label">Kalan Süre</span>
              <span class="timer-value" :class="{ 'timer-warning': remainingTime < 300 }">
                {{ formatTime(remainingTime) }}
              </span>
            </div>
          </div>

          <!-- İlk Bölüm Süresi (henüz başlamadıysa) -->
          <div class="section-timer-card" v-else-if="!store.hasStartedUI">
            <div class="timer-icon">
              <i class="pi pi-clock"></i>
            </div>
            <div class="timer-info">
              <span class="timer-label">İlk Bölüm Süresi</span>
              <span class="timer-value">
                {{ formatTime(firstSectionDuration * 60) }}
              </span>
            </div>
          </div>

          <!-- Bölüm tamamlanmadıysa dosyaları göster -->
          <Divider v-if="!showSectionCompletedMessage && ((store.hasStartedUI && currentSection?.section_inventory_file) || (!store.hasStartedUI && store.sections[0]?.section_inventory_file))" />

          <!-- Bölüm Envanteri Dosyası -->
          <div v-if="!showSectionCompletedMessage && ((store.hasStartedUI && currentSection?.section_inventory_file) || (!store.hasStartedUI && store.sections[0]?.section_inventory_file))" class="document-item">
            <div class="document-icon">
              <i class="pi pi-file-pdf" style="font-size: 2rem; color: #ef4444;"></i>
            </div>
            <div class="document-info">
              <h4>{{ (store.hasStartedUI ? currentSection?.section_title : store.sections[0]?.section_title) }} - Envanter</h4>
              <p class="document-meta">PDF Döküman</p>
            </div>
            <Button
              icon="pi pi-eye"
              label="Görüntüle"
              size="small"
              outlined
              @click="viewDocument(
                store.hasStartedUI ? currentSection.section_inventory_file : store.sections[0].section_inventory_file,
                (store.hasStartedUI ? currentSection?.section_title : store.sections[0]?.section_title) + ' - Envanter'
              )"
            />
          </div>

          <!-- Egzersiz Dosyaları (sadece başladıysa ve bölüm tamamlanmadıysa) -->
          <div v-if="!showSectionCompletedMessage && store.hasStartedUI && currentExerciseFiles.length > 0">
            <Divider />
            <h4 class="documents-section-title">Egzersiz Dosyaları</h4>
            <div v-for="(file, index) in currentExerciseFiles" :key="index" class="document-item">
              <div class="document-icon">
                <i class="pi pi-file" style="font-size: 1.5rem; color: #3b82f6;"></i>
              </div>
              <div class="document-info">
                <h4>{{ file.exercise_title }}</h4>
                <p class="document-meta">{{ file.file_name }}</p>
              </div>
              <Button
                :icon="pdfLoading ? 'pi pi-spin pi-spinner' : 'pi pi-eye'"
                :label="pdfLoading ? 'Yükleniyor...' : 'Aç'"
                size="small"
                outlined
                :disabled="pdfLoading"
                @click="viewDocument(file.file_path, file.file_name)"
              />
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="store.hasStartedUI && !currentSection?.section_inventory_file && currentExerciseFiles.length === 0" class="empty-documents">
            <i class="pi pi-inbox" style="font-size: 2.5rem; color: #d1d5db;"></i>
            <p>Bu bölüm için döküman bulunmuyor</p>
          </div>
          
          <!-- Henüz başlamadı ve dosya yok -->
          <div v-if="!store.hasStartedUI && !store.sections[0]?.section_inventory_file" class="empty-documents">
            <i class="pi pi-inbox" style="font-size: 2.5rem; color: #d1d5db;"></i>
            <p>Bu bölüm için döküman bulunmuyor</p>
          </div>
          </div>
        </template>
      </div>
    </div>


    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-left">
          <span class="footer-text">
            © 2025 
            <a href="https://vakamaka.com" target="_blank" rel="noopener noreferrer" class="footer-link">
              Vakamaka
            </a>
          </span>
          <span class="footer-divider">•</span>
          <span class="footer-text">Tüm hakları saklıdır</span>
        </div>
        <div class="footer-right">
          <span class="footer-version">v{{ appVersion }}</span>
        </div>
      </div>
    </footer>
    
    <!-- Audio Recorder Modal -->
    <AudioRecorder
      v-model="showAudioRecorder"
      @save="handleAudioSave"
    />
  </div>
  </ClientOnly>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useParticipantAssessmentStore } from '~/stores/assessment'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

definePageMeta({
  layout: false, // Layout yok (tam ekran)
  middleware: ['auth'] // Session kontrolü
})

const router = useRouter()
const store = useParticipantAssessmentStore()
const toast = useToast()
const confirm = useConfirm()

// App Version
const appVersion = ref('1.0.0')

// State
const showWelcomeDialog = ref(false)
const welcomeAcknowledged = ref(false)
const exerciseAnswers = ref({})
const audioRecordings = ref({}) // { exercise_uuid: Blob }
const showAudioRecorder = ref(false)

// TTS State
const isSpeaking = ref(false)
const isSpeechLoading = ref(false)
let speechSynthesis = null
let currentUtterance = null
const savingExercise = ref(null)
const sectionTimer = ref(null)
const remainingTime = ref(0)
const currentSectionStartTime = ref(null)
const currentExerciseStartTime = ref(null) // Her egzersiz için ayrı başlangıç zamanı
const timerSyncInterval = ref(null) // Backend sync için
const pdfViewerDialog = ref(false)
const currentPdfUrl = ref(null)
const currentPdfName = ref('')
const pdfLoading = ref(false)
const pdfFullscreen = ref(false)
const currentExerciseIndex = ref(0) // Tek seferde bir egzersiz göster
const showSectionCompletedMessage = ref(false)
const completionMessage = ref({
  title: '',
  description: '',
  emoji: ''
})

// Computed
const currentSection = computed(() => store.currentSection)
const currentSectionExercises = computed(() => store.currentSectionExercises)

// Egzersiz cevaplandı mı kontrolü
const isExerciseAnswered = (exerciseUuid) => {
  return !!store.responses[exerciseUuid]
}

const totalDuration = computed(() => {
  return store.sections.reduce((total, section) => {
    return total + getSectionDuration(section)
  }, 0)
})

const firstSectionDuration = computed(() => {
  if (store.sections.length === 0) return 0
  return getSectionDuration(store.sections[0])
})

const currentExerciseFiles = computed(() => {
  if (!currentSectionExercises.value) return []
  
  const files = []
  currentSectionExercises.value.forEach(exercise => {
    if (exercise.files && Array.isArray(exercise.files)) {
      exercise.files.forEach(file => {
        files.push({
          exercise_title: exercise.exercise_title || exercise.title,
          file_name: file.name || file.file_name,
          file_path: file.path || file.file_path
        })
      })
    }
  })
  return files
})

const canCompleteSection = computed(() => {
  const exercises = currentSectionExercises.value
  if (!exercises || exercises.length === 0) return false
  
  // Tüm egzersizler cevaplanmış mı? (Info tipi egzersizler hariç)
  return exercises.every(ex => {
    if (ex.type === 'info') return true // Info egzersizleri için cevap zorunlu değil
    return hasResponse(ex.exercise_uuid)
  })
})

const canComplete = computed(() => {
  return store.overallProgress === 100
})

const currentExercise = computed(() => {
  if (!currentSectionExercises.value || currentSectionExercises.value.length === 0) return null
  return currentSectionExercises.value[currentExerciseIndex.value]
})

const completedExercisesCount = computed(() => {
  if (!currentSectionExercises.value) return 0
  return currentSectionExercises.value.filter(ex => hasResponse(ex.exercise_uuid)).length
})

const sectionProgressPercentage = computed(() => {
  if (!currentSectionExercises.value || currentSectionExercises.value.length === 0) return 0
  return Math.round((completedExercisesCount.value / currentSectionExercises.value.length) * 100)
})

const nextSectionExists = computed(() => {
  if (!store.currentSectionId) return false
  const currentIndex = store.sections.findIndex(s => s.section_uuid === store.currentSectionId)
  return currentIndex >= 0 && currentIndex < store.sections.length - 1
})

const isLastExerciseInSection = computed(() => {
  if (!currentSectionExercises.value) return false
  return currentExerciseIndex.value === currentSectionExercises.value.length - 1
})

// Methods

// Navigasyon Fonksiyonları
const goToPreviousExercise = () => {
  if (currentExerciseIndex.value > 0) {
    currentExerciseIndex.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goToNextExercise = () => {
  if (currentExerciseIndex.value < currentSectionExercises.value.length - 1) {
    currentExerciseIndex.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
const getSectionDuration = (section) => {
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

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Welcome Dialog Functions
const closeWelcomeDialog = () => {
  if (!welcomeAcknowledged.value) {
    toast.add({
      severity: 'warn',
      summary: 'Uyarı',
      detail: 'Lütfen önce "Okudum, anladım" kutucuğunu işaretleyin.',
      life: 3000
    })
    return
  }
  
  showWelcomeDialog.value = false
  // LocalStorage'a kaydedelim ki tekrar açılmasın
  localStorage.setItem(`welcome_acknowledged_${store.projectUUID}`, 'true')
}

const startWorkspace = async () => {
  store.hasStartedUI = true
  
  // İlk bölümü seç
  if (store.sections.length > 0) {
    currentExerciseIndex.value = 0 // İlk egzersize git
    currentExerciseStartTime.value = Date.now() // İlk egzersiz başlangıç zamanı
    store.setCurrentSection(store.sections[0].section_uuid)
    await startSectionTimer(store.sections[0])
  }
  
  // Assessment'ı backend'de başlat (sadece ilk kez)
  if (!store.startedAt) {
    await store.startAssessment()
  }
}

const startSectionTimer = async (section) => {
  stopSectionTimer() // Mevcut timer'ı durdur
  
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
  
  // 2. Exercises bilgisi şimdi yüklendi
  const sectionDetail = store.sectionDetails[section.section_uuid]
  console.log('📝 Section Exercises:', sectionDetail?.exercises?.length || 0)
  
  // Exercises duration kontrolü
  if (sectionDetail?.exercises) {
    const totalDuration = sectionDetail.exercises.reduce((sum, ex) => sum + (parseInt(ex.exercise_duration || ex.duration || 0)), 0)
    console.log('⏱️ Toplam beklenen süre (frontend):', totalDuration, 'dakika')
  }
  
  // 3. Backend'e bölüm başlatma isteği gönder
  const result = await store.startSectionOnBackend(section.section_uuid)
  
  if (!result.success) {
    console.error('Section başlatılamadı:', result.error)
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Bölüm başlatılamadı',
      life: 3000
    })
    return
  }
  
  console.log('✅ Backend bölüm başlatıldı, süre bilgisi alınıyor...')
  
  // Backend'den gerçek kalan süreyi al VE BEKLEBeklemeyi garanti et
  const timeResult = await store.fetchRemainingTime()
  
  console.log('📥 Backend response:', timeResult)
  
  if (!timeResult.success) {
    console.error('❌ Süre bilgisi alınamadı:', timeResult.error)
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
    onTimerEnd()
    return
  }
  
  // Şimdi timer'ı başlat (süre garantili pozitif)
  sectionTimer.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      // Süre bitti
      onTimerEnd()
    }
  }, 1000)
  
  console.log('✅ Timer başlatıldı, her 10 saniyede sync olacak')
  
  // Her 10 saniyede backend ile senkronize et
  timerSyncInterval.value = setInterval(async () => {
    await syncTimerWithBackend()
  }, 10000) // 10 saniye
}

const syncTimerWithBackend = async () => {
  const result = await store.fetchRemainingTime()
  
  if (result.success) {
    remainingTime.value = result.data.remaining_seconds
    
    // Süre bittiyse backend'den bildirim geldi
    if (result.data.time_expired && remainingTime.value <= 0) {
      onTimerEnd()
    }
    
    console.log('Timer backend ile senkronize edildi:', result.data.remaining_seconds, 'saniye')
  } else {
    console.error('Timer senkronizasyon hatası:', result.error)
  }
}

const stopSectionTimer = () => {
  if (sectionTimer.value) {
    clearInterval(sectionTimer.value)
    sectionTimer.value = null
  }
  
  if (timerSyncInterval.value) {
    clearInterval(timerSyncInterval.value)
    timerSyncInterval.value = null
  }
}

const onTimerEnd = async () => {
  console.log('⏰ Timer bitti, otomatik kayıt yapılıyor')
  
  stopSectionTimer()
  
  // Guard: Eğer zaten işlem yapılıyorsa tekrar çağrılmasın
  if (savingExercise.value === 'AUTO_SAVING') {
    console.log('⚠️ Zaten otomatik kayıt yapılıyor, tekrar çağrılmadı')
    return
  }
  
  savingExercise.value = 'AUTO_SAVING'
  
  toast.add({
    severity: 'warn',
    summary: 'Süre Doldu!',
    detail: 'Bölüm süresi doldu. İlerlemeniz otomatik kaydedildi.',
    life: 5000
  })
  
  try {
    // Otomatik kaydet ve sonraki bölüme geç
    await autoSaveAndNext()
  } finally {
    savingExercise.value = null
  }
}

const autoSaveAndNext = async () => {
  // Cevaplanmış egzersizleri kaydet
  const exercises = currentSectionExercises.value
  for (const exercise of exercises) {
    if (exerciseAnswers.value[exercise.exercise_uuid]) {
      await saveExerciseResponse(exercise, true) // Silent save
    }
  }
  
  // Bölümü tamamla ve sonrakine geç
  await completeSectionAndNext()
}

const isSectionLocked = (index) => {
  // İlk bölüm her zaman açık
  if (index === 0) return false
  
  // Önceki bölüm tamamlanmış mı kontrol et
  const previousSection = store.sections[index - 1]
  return !store.isSectionCompleted(previousSection.section_uuid)
}

const selectSection = async (sectionId, index) => {
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
  
  stopSectionTimer()
  currentExerciseIndex.value = 0 // Yeni bölümde ilk egzersizden başla
  store.setCurrentSection(sectionId)
  
  const section = store.sections.find(s => s.section_uuid === sectionId)
  if (section) {
    await startSectionTimer(section)
  }
}

const viewDocument = async (filePath, fileName = 'Döküman') => {
  try {
    // Loading başlat
    pdfLoading.value = true
    
    // PDF görüntüleme - Güvenli token ile Split View'da göster
    const config = useRuntimeConfig()
    const baseDomain = config.public.apiBaseUrl
    
    // file_path'i normalize et
    let normalizedPath = filePath
    
    // Başında / yoksa ekle
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath
    }
    
    // /uploads ile başlıyorsa /writable/uploads yap
    if (normalizedPath.startsWith('/uploads/')) {
      normalizedPath = '/writable' + normalizedPath
    }
    
    // Güvenli token generate et
    const ApiService = (await import('~/utils/api')).default
    const api = new ApiService()
    
    const tokenResponse = await api.generateDocumentToken(
      store.participantId,
      store.projectId,
      normalizedPath
    )
    
    if (tokenResponse.status === 'success') {
      // Token'lı URL ile PDF aç
      currentPdfUrl.value = tokenResponse.view_url
      currentPdfName.value = fileName
      pdfViewerDialog.value = true
      
      console.log('✅ PDF viewer açıldı:', tokenResponse.view_url)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'PDF yüklenirken bir hata oluştu',
        life: 3000
      })
    }
  } catch (error) {
    console.error('PDF yükleme hatası:', error)
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: error.message || 'PDF yüklenemedi',
      life: 3000
    })
  } finally {
    // Loading bitir
    pdfLoading.value = false
  }
}

const closePdfViewer = () => {
  pdfViewerDialog.value = false
  currentPdfUrl.value = null
  currentPdfName.value = ''
  pdfFullscreen.value = false
}

// ESC tuşu ile PDF viewer'ı kapat
const handlePdfEscape = (e) => {
  if (e.key === 'Escape' && pdfViewerDialog.value) {
    e.preventDefault()
    closePdfViewer()
  }
}

// Tam ekran toggle
const togglePdfFullscreen = () => {
  pdfFullscreen.value = !pdfFullscreen.value
}

const hasResponse = (exerciseUuid) => {
  return !!store.getExerciseResponse(exerciseUuid)
}

const proceedToNextSection = async () => {
  showSectionCompletedMessage.value = false
  
  const currentIndex = store.sections.findIndex(s => s.section_uuid === store.currentSectionId)
  
  if (currentIndex < store.sections.length - 1) {
    // Sonraki bölüme geç
    const nextSection = store.sections[currentIndex + 1]
    currentExerciseIndex.value = 0 // Egzersiz index'ini sıfırla
    currentExerciseStartTime.value = Date.now() // Yeni bölümün ilk egzersiz zamanı
    store.setCurrentSection(nextSection.section_uuid)
    await startSectionTimer(nextSection)
  } else {
    // Tüm bölümler tamamlandı (completeAssessment zaten completeSectionAndNext içinde çağrıldı)
    
    toast.add({
      severity: 'success',
      summary: 'Tebrikler! 🎊',
      detail: 'Tüm bölümleri başarıyla tamamladınız!',
      life: 3000
    })
    
    // Tamamlanma sayfasına yönlendir
    setTimeout(() => {
      router.push('/assessment/completed')
    }, 2000)
  }
}

const goToExercise = (index) => {
  if (index >= 0 && index < currentSectionExercises.value.length) {
    currentExerciseIndex.value = index
  }
}

// Confirm dialog ile kaydet
const confirmAndSave = async (exercise) => {
  const answer = exerciseAnswers.value[exercise.exercise_uuid]
  
  // Info tipi egzersizler için cevap zorunlu değil
  if (exercise.type === 'info' || exercise.exercise_type === 'info') {
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

const saveAndNext = async (exercise) => {
  await saveExerciseResponse(exercise, false)
  
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
      await completeSectionAndNext()
    }, 1000)
  } else {
    // Sonraki egzersize geç
    currentExerciseIndex.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const markInfoAsRead = async (exercise) => {
  // Bilgilendirme egzersizi için boş bir cevap kaydet
  savingExercise.value = exercise.exercise_uuid
  
  try {
    const result = await store.saveResponse({
      section_uuid: store.currentSectionId || currentSection.value?.section_uuid,
      exercise_uuid: exercise.exercise_uuid,
      question_id: null,
      answer_value: 'INFO_VIEWED',
      answer_text: 'Bilgilendirme görüntülendi',
      time_spent: currentExerciseStartTime.value ? Math.floor((Date.now() - currentExerciseStartTime.value) / 1000) : 5
    })
    
    if (result.success) {
      // Sonraki egzersize geç
      if (currentExerciseIndex.value < currentSectionExercises.value.length - 1) {
        currentExerciseIndex.value++
      } else {
        toast.add({
          severity: 'info',
          summary: 'Tüm Egzersizler Tamamlandı',
          detail: 'Bölümü tamamlamak için "Bölümü Tamamla" butonuna tıklayın',
          life: 4000
        })
      }
    }
  } catch (error) {
    console.error('Info exercise marking error:', error)
  } finally {
    savingExercise.value = null
  }
}

const formatQuestionType = (type) => {
  const types = {
    'multiple_choice': 'Çoktan Seçmeli',
    'essay': 'Kompozisyon',
    'practice': 'Uygulama',
    'analysis': 'Analiz',
    'info': 'Bilgilendirme'
  }
  return types[type] || type
}

// Ses Kayıt Fonksiyonları
const handleAudioSave = (audioBlob) => {
  if (currentExercise.value) {
    audioRecordings.value[currentExercise.value.exercise_uuid] = audioBlob
    toast.add({
      severity: 'success',
      summary: 'Başarılı',
      detail: 'Ses kaydı eklendi',
      life: 2000
    })
  }
}

const removeAudioRecording = (exerciseUuid) => {
  delete audioRecordings.value[exerciseUuid]
  toast.add({
    severity: 'info',
    summary: 'Bilgi',
    detail: 'Ses kaydı kaldırıldı',
    life: 2000
  })
}

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
    return
  }
  
  const answer = exerciseAnswers.value[exercise.exercise_uuid]
  
  // Info tipi egzersizler için cevap zorunlu değil
  if (exercise.type === 'info' || exercise.exercise_type === 'info') {
    // Info egzersizi için otomatik "görüldü" işareti
    store.responses[exercise.exercise_uuid] = {
      exercise_uuid: exercise.exercise_uuid,
      answer_value: 'INFO_VIEWED',
      answer_text: 'Bilgilendirme görüntülendi'
    }
    return
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
    return
  }

  savingExercise.value = exercise.exercise_uuid

  try {
    const responseData = {
      section_uuid: store.currentSectionId || currentSection.value?.section_uuid,
      exercise_uuid: exercise.exercise_uuid,
      question_id: null,
      answer_value: answer,
      answer_text: answer,
      time_spent: currentExerciseStartTime.value ? Math.floor((Date.now() - currentExerciseStartTime.value) / 1000) : 0
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
    } else {
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: result.error,
        life: 3000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Cevap kaydedilemedi',
      life: 3000
    })
  } finally {
    savingExercise.value = null
  }
}

const completeSectionAndNext = async () => {
  const currentIndex = store.sections.findIndex(s => s.section_uuid === store.currentSectionId)
  
  // Timer'ı durdur ve sıfırla
  stopSectionTimer()
  remainingTime.value = 0
  
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
  
  // Mesajı göster (son bölüm ve ara bölüm için farklı mesajlar)
  completionMessage.value = messageToShow
  showSectionCompletedMessage.value = true
  
  // Son bölümse assessment tamamlama işlemini yap (ama popup'ta kalıyoruz)
  if (isLastSection) {
    await store.completeAssessment()
  }
  
  // Not: Kullanıcı butona tıklayınca:
  // - Ara bölümse: proceedToNextSection() → sonraki bölüme geçer
  // - Son bölümse: proceedToNextSection() → /assessment/completed sayfasına gider
}

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

// TTS Functions
const initSpeechSynthesis = () => {
  if (process.client && 'speechSynthesis' in window) {
    speechSynthesis = window.speechSynthesis
  }
}

const stripHtml = (html) => {
  if (!html) return ''
  // HTML etiketlerini kaldır
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

const toggleSpeech = (htmlContent) => {
  if (!speechSynthesis) {
    toast.add({
      severity: 'warn',
      summary: 'Desteklenmiyor',
      detail: 'Tarayıcınız ses okuma özelliğini desteklemiyor',
      life: 3000
    })
    return
  }

  // Eğer konuşma devam ediyorsa durdur
  if (isSpeaking.value) {
    speechSynthesis.cancel()
    isSpeaking.value = false
    currentUtterance = null
    return
  }

  // Yeni konuşma başlat
  isSpeechLoading.value = true
  const text = stripHtml(htmlContent)
  
  if (!text) {
    toast.add({
      severity: 'warn',
      summary: 'Boş İçerik',
      detail: 'Okunacak metin bulunamadı',
      life: 3000
    })
    isSpeechLoading.value = false
    return
  }

  currentUtterance = new SpeechSynthesisUtterance(text)
  currentUtterance.lang = 'tr-TR' // Türkçe
  currentUtterance.rate = 1.0 // Normal hız
  currentUtterance.pitch = 1.0 // Normal pitch

  currentUtterance.onstart = () => {
    isSpeaking.value = true
    isSpeechLoading.value = false
  }

  currentUtterance.onend = () => {
    isSpeaking.value = false
    currentUtterance = null
  }

  currentUtterance.onerror = (event) => {
    // 'interrupted' veya 'canceled' hataları normal durumlardır (manuel durdurma)
    if (event.error === 'interrupted' || event.error === 'canceled') {
      console.log('🔇 TTS durduruldu:', event.error)
      isSpeaking.value = false
      isSpeechLoading.value = false
      return
    }
    
    // Gerçek hatalarda toast göster ve console'a error yaz
    console.error('❌ TTS Error:', event)
    isSpeaking.value = false
    isSpeechLoading.value = false
    toast.add({
      severity: 'error',
      summary: 'Ses Hatası',
      detail: 'Metin okunurken bir hata oluştu',
      life: 3000
    })
  }

  speechSynthesis.speak(currentUtterance)
}

// Watchers
// Her egzersiz değiştiğinde başlangıç zamanını kaydet
watch(currentExerciseIndex, () => {
  currentExerciseStartTime.value = Date.now()
  console.log('⏱️ Egzersiz başlangıç zamanı kaydedildi:', new Date(currentExerciseStartTime.value).toLocaleTimeString())
  
  // Egzersiz değiştiğinde TTS'i durdur
  if (isSpeaking.value && speechSynthesis) {
    speechSynthesis.cancel()
    isSpeaking.value = false
    currentUtterance = null
  }
})

// Mozilla PDF.js viewer kullanıyoruz (CDN iframe olarak)

// Lifecycle
onMounted(async () => {
  try {
    // TTS initialize et
    initSpeechSynthesis()
    
    // Pinia persist hydration'ını bekle
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log('Workspace onMounted - sessionToken:', !!store.sessionToken)
    console.log('Workspace onMounted - project:', !!store.project)
    console.log('Workspace onMounted - sections:', store.sections?.length || 0)
    
    // Session token kontrolü (localStorage'dan gelecek)
    if (!store.sessionToken) {
      console.error('❌ Oturum bilgisi bulunamadı - localStorage temizlenmiş olabilir')
      
      toast.add({
        severity: 'error',
        summary: 'Oturum Hatası',
        detail: 'Oturum bilginiz bulunamadı',
        life: 3000
      })
      
      // Error sayfasına yönlendir
      setTimeout(() => {
        router.push({
          path: '/assessment/error',
          query: {
            message: 'Oturum bilginiz bulunamadı. Lütfen davet linkini kullanarak tekrar giriş yapın.'
          }
        })
      }, 2000)
      return
    }
    
    // Session doğrulama (opsiyonel - middleware zaten yapıyor)
    // const sessionValid = await store.validateSession()
    // if (!sessionValid.success) {
    //   toast.add({
    //     severity: 'error',
    //     summary: 'Oturum Hatası',
    //     detail: 'Oturumunuz sona ermiş',
    //     life: 3000
    //   })
    //   router.push('/assessment/error?message=Oturum süresi doldu')
    //   return
    // }

    // Proje özet bilgilerini yükle (GÜVENLİ - egzersiz detayları YOK!)
    // ÖNEMLİ: Her zaman backend'den güncel progress bilgisini almak için API çağrısı yap
    // Cache kullanmıyoruz çünkü katılımcı tekrar giriş yaptığında güncel bilgiler lazım
    console.log('Proje özeti yükleniyor...')
    await store.fetchProjectSummary()
    
    console.log('📊 Progress bilgileri:')
    console.log('  - hasStartedUI:', store.hasStartedUI)
    console.log('  - currentSectionId:', store.currentSectionId)
    console.log('  - completedSections:', store.completedSections.length)
    console.log('  - completedAt:', store.completedAt)
    
    // Assessment zaten tamamlanmış mı kontrol et
    if (store.completedAt) {
      console.log('✅ Assessment zaten tamamlanmış - completed sayfasına yönlendiriliyor')
      toast.add({
        severity: 'info',
        summary: 'Değerlendirme Tamamlandı',
        detail: 'Bu değerlendirmeyi zaten tamamladınız',
        life: 3000
      })
      
      // Completed sayfasına yönlendir
      setTimeout(() => {
        router.push('/assessment/completed')
      }, 1500)
      return
    }
    
    // İlk bölümün detaylarını yükle (eğer başlanmışsa)
    if (store.hasStartedUI && store.currentSectionId) {
      console.log('İlk bölüm detayları yükleniyor:', store.currentSectionId)
      await store.fetchSectionDetails(store.currentSectionId)
      
      // Mevcut cevapları yükle
      Object.keys(store.responses).forEach(exerciseUuid => {
        const response = store.responses[exerciseUuid]
        exerciseAnswers.value[exerciseUuid] = response.answer_text || response.answer_value
      })
      
      // İlk cevapsız egzersizi bul (kaldığı yerden devam etsin)
      const exercises = currentSectionExercises.value
      let firstUnanswered = -1
      
      for (let i = 0; i < exercises.length; i++) {
        if (!isExerciseAnswered(exercises[i].exercise_uuid)) {
          firstUnanswered = i
          break
        }
      }
      
      // Eğer bulunduysa oradan başlat, yoksa ilk egzersizden
      if (firstUnanswered !== -1) {
        currentExerciseIndex.value = firstUnanswered
        console.log('📍 Kaldığı egzersizden devam ediyor:', firstUnanswered + 1, '/', exercises.length)
      } else {
        console.log('✅ Bu bölümün tüm egzersizleri tamamlanmış')
      }
    }
    
    // Eğer daha önce başlatılmışsa timer'ı kontrol et
    if (store.hasStartedUI && store.currentSectionId) {
      const section = store.sections.find(s => s.section_uuid === store.currentSectionId)
      if (section) {
        // Backend'den kalan süreyi kontrol et
        const timeResult = await store.fetchRemainingTime()
        
        if (timeResult.success) {
          if (timeResult.data.time_expired || timeResult.data.remaining_seconds <= 0) {
            // SÜRE BİTMİŞ! Otomatik tamamla
            console.log('⏰ Bölüm süresi dolmuş, otomatik tamamlanıyor...')
            toast.add({
              severity: 'warn',
              summary: 'Bölüm Süresi Dolmuş',
              detail: 'Bu bölümün süresi dolmuş. Otomatik olarak tamamlanacak.',
              life: 5000
            })
            
            // Otomatik complete
            await onTimerEnd()
          } else if (timeResult.data.remaining_seconds > 0) {
            // Süre var, timer devam ediyor
            remainingTime.value = timeResult.data.remaining_seconds
            console.log('⏱️ Mevcut bölüm timer devam ediyor:', remainingTime.value, 'saniye')
            
            // Timer'ı başlat (ama backend'e yeni istek atmadan)
            sectionTimer.value = setInterval(() => {
              if (remainingTime.value > 0) {
                remainingTime.value--
              }
              
              if (remainingTime.value <= 0) {
                onTimerEnd()
              }
            }, 1000)
            
            // Sync interval'ı başlat
            timerSyncInterval.value = setInterval(async () => {
              await syncTimerWithBackend()
            }, 10000)
          }
        } else {
          // Backend'den süre bilgisi alınamadı, yeni başlat
          console.log('🆕 Backend süre bilgisi yok, yeni timer başlatılıyor')
          await startSectionTimer(section)
        }
      }
    }
    
    // İlk egzersiz başlangıç zamanını ayarla
    currentExerciseStartTime.value = Date.now()
    console.log('⏱️ İlk egzersiz başlangıç zamanı kaydedildi')
    
    // Welcome Dialog göster (sadece daha önce gösterilmediyse ve henüz başlanmamışsa)
    const welcomeAcknowledgedKey = `welcome_acknowledged_${store.projectUUID}`
    const hasAcknowledged = localStorage.getItem(welcomeAcknowledgedKey)
    
    if (!hasAcknowledged && !store.hasStartedUI) {
      console.log('🎉 Karşılama mesajı gösteriliyor...')
      showWelcomeDialog.value = true
    }
  } catch (error) {
    console.error('Workspace initialization error:', error)
    toast.add({
      severity: 'error',
      summary: 'Yükleme Hatası',
      detail: 'Workspace yüklenirken hata oluştu',
      life: 3000
    })
  }
  
  // ESC tuşu listener ekle (PDF viewer için)
  window.addEventListener('keydown', handlePdfEscape)
})

// Cleanup
onBeforeUnmount(() => {
  stopSectionTimer()
  
  // TTS cleanup
  if (speechSynthesis && isSpeaking.value) {
    speechSynthesis.cancel()
  }
  
  // ESC tuşu listener kaldır
  window.removeEventListener('keydown', handlePdfEscape)
})
</script>

<style scoped>
/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.assessment-workspace {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f3f4f6;
  overflow: hidden;
  
  /* TÜM ASSESSMENT WORKSPACE İÇİN TÜRKÇE KELİME WRAP - KELİMELER BÖLÜNMEDEN */
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word; /* Evaluate sayfasındaki gibi */
  white-space: normal;
}

/* Tüm metin alanları için - KELİMELER BÖLÜNMEDEN WRAP */
.assessment-workspace * {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word; /* Evaluate sayfasındaki gibi */
  white-space: normal;
}

/* Header - Compact */
.workspace-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-info h1 {
  font-size: 1.25rem;
  color: #111827;
  margin: 0;
  font-weight: 600;
}

.participant-name {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.progress-info {
  min-width: 160px;
}

.progress-text {
  display: block;
  font-size: 0.8125rem;
  color: #6b7280;
  margin-bottom: 0.375rem;
}

.progress-bar-mini {
  height: 0.5rem;
}

/* Main Content - 3 Column Layout - Compact & Dynamic */
.workspace-content {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  width: 100%;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
  height: calc(100vh - 68px);
  transition: grid-template-columns 0.3s ease;
}

/* PDF Viewer açıkken: Sol dar, sağ geniş */
.workspace-content:has(.pdf-viewer-active) {
  grid-template-columns: 250px 1fr 650px;
}

/* Sections Sidebar */
.sections-sidebar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 100%;
}

.sidebar-header {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #111827;
  font-weight: 600;
}

.sections-list {
  padding: 0.75rem;
  overflow-y: auto;
  flex: 1;
}

.section-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.375rem;
}

.section-item:hover {
  background: #f3f4f6;
}

.section-item.active {
  background: #ede9fe;
  border-left: 4px solid #8b5cf6;
}

.section-item.completed .section-icon i {
  color: #10b981;
}

.section-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-item.locked:hover {
  background: transparent;
}

.section-item.locked .section-icon i {
  color: #9ca3af;
}

.section-item.completed {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
}

.section-item.completed .section-icon i {
  color: #10b981;
}

.section-icon {
  font-size: 1.25rem;
  color: #9ca3af;
}

.section-info {
  flex: 1;
}

.section-info h4 {
  margin: 0 0 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.section-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.375rem;
}

.section-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.section-progress {
  height: 0.25rem;
}

/* Exercises Area */
.exercises-area {
  min-width: 0; /* Grid overflow fix */
  overflow: hidden;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

/* Welcome Screen */
.welcome-screen {
  background: white;
  border-radius: 12px;
  padding: 4rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

.welcome-icon {
  margin-bottom: 2rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.welcome-content h2 {
  font-size: 2rem;
  color: #111827;
  margin: 0 0 1rem;
}

.welcome-message {
  font-size: 1.1rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.welcome-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #374151;
}

.stat-item i {
  color: #8b5cf6;
}

.start-button {
  font-size: 1.1rem;
  padding: 1rem 3rem !important;
}

.empty-state {
  background: white;
  border-radius: 12px;
  padding: 4rem;
  text-align: center;
  color: #9ca3af;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.exercises-container {
  background: white;
  border-radius: 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.section-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-header h2 {
  margin: 0 0 0.5rem;
  color: #111827;
}

.section-description {
  color: #6b7280;
  margin: 0;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.exercise-card {
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
}

.exercise-card.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.exercise-title-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.exercise-status-icon {
  font-size: 1.5rem;
}

.exercise-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.exercise-content {
  padding: 1.5rem;
}

.exercise-description {
  margin-bottom: 1rem;
  color: #4b5563;
  line-height: 1.6;
}

.exercise-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.exercise-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.answer-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.answer-textarea {
  width: 100%;
  margin-bottom: 1rem;
}

/* Textarea içindeki metin için - Evaluate sayfasındaki gibi */
.answer-textarea :deep(textarea) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.answer-actions {
  display: flex;
  justify-content: flex-end;
}

.info-note {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.95rem;
  margin-top: 1.5rem;
}

.info-note i {
  font-size: 1.25rem;
}

.section-actions {
  text-align: center;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
}

/* Documents Sidebar */
.documents-sidebar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  transition: all 0.3s ease;
}

/* PDF Viewer Mode */
.documents-sidebar.pdf-viewer-active {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.pdf-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  gap: 1rem;
}

.pdf-viewer-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.pdf-viewer-title i {
  font-size: 1.25rem;
  color: #ef4444;
  flex-shrink: 0;
}

.pdf-viewer-title h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #111827;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pdf-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pdf-viewer-content {
  flex: 1;
  overflow: hidden;
  background: #525252;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-viewer-content iframe {
  border: none;
  display: block;
}

/* PDF Fullscreen Mode */
.documents-sidebar.pdf-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw;
  max-height: 100vh;
  z-index: 9999;
  border-radius: 0;
  box-shadow: none;
}

.documents-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.section-timer-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 1rem;
}

.timer-icon {
  font-size: 2rem;
  opacity: 0.9;
}

.timer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.timer-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.timer-value {
  font-size: 1.75rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.timer-warning {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.documents-section-title {
  font-size: 0.95rem;
  color: #374151;
  margin: 1rem 0 0.75rem;
  padding: 0;
}

.document-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  margin-bottom: 1rem;
}

.document-icon {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
}

.document-info h4 {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  color: #111827;
}

.document-meta {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.empty-documents {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.empty-documents p {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
}

/* PDF Viewer Dialog */
.pdf-viewer-container {
  width: 100%;
  height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.pdf-viewer-container iframe {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Section Completed Overlay - Modern Congratulations Screen */
.section-completed-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  padding: 2rem;
  animation: fadeIn 0.6s ease-in-out;
}

.completion-card {
  max-width: 700px;
  width: 100%;
  text-align: center;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  color: white;
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  animation: scaleIn 0.5s ease-out;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.completion-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: bounceIn 0.8s ease-out;
}

.completion-icon i {
  color: #10b981;
  background: white;
  border-radius: 50%;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.completion-card h2 {
  font-size: 2rem;
  margin: 0 0 1rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.completion-text {
  font-size: 1.15rem;
  line-height: 1.7;
  margin: 0 0 1.5rem;
  opacity: 0.95;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.completion-emoji {
  font-size: 4rem;
  margin: 1.5rem 0;
  animation: pulse 2s infinite;
}

.next-section-button {
  margin-top: 1rem;
  padding: 1rem 2.5rem !important;
  font-size: 1.1rem !important;
  background: white !important;
  color: #667eea !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.next-section-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

/* Modern Section Header - Ultra Compact */
.modern-section-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 1.25rem;
  border-radius: 8px 8px 0 0;
  flex: none;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.header-title-area {
  flex: 1;
}

.section-title {
  font-size: 1.375rem;
  margin: 0 0 0.25rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.section-subtitle {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.complete-section-btn {
  flex-shrink: 0;
  border-radius: 20px;
}

.progress-indicator {
  margin-top: 0.75rem;
}

.progress-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8125rem;
  backdrop-filter: blur(10px);
}

.stat-badge i {
  font-size: 0.875rem;
}

.section-progress-bar {
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.section-progress-bar :deep(.p-progressbar-value) {
  background: #10b981;
  border-radius: 4px;
}

/* Modern Exercise Container - Compact */
.modern-exercise-container {
  animation: slideInUp 0.4s ease-out;
  padding: 1rem 1.25rem;
  max-width: 100%;
  width: 100%;
  overflow-y: auto;
  flex: 1;
  margin: 0 auto;
  margin-bottom: 1rem;
}

.exercise-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  gap: 1rem;
}

.nav-button-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.nav-button-wrapper:hover {
  background: rgba(102, 126, 234, 0.05);
}

.nav-button-wrapper:hover .nav-button-with-label {
  background: rgba(102, 126, 234, 0.15) !important;
  transform: scale(1.1);
}

.nav-button-wrapper:hover .nav-label {
  color: #667eea;
}

.nav-button-with-label {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  transition: all 0.2s;
}

.nav-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-button-placeholder {
  width: 120px;
  height: 32px;
  flex-shrink: 0;
}

.exercise-nav-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.exercise-counter {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
}

.exercise-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d1d5db;
  cursor: pointer;
  transition: all 0.3s;
}

.dot.active {
  background: #667eea;
  width: 28px;
  border-radius: 5px;
}

.dot.completed {
  background: #10b981;
}

.dot:hover {
  transform: scale(1.2);
}

/* Modern Exercise Card */
.modern-exercise-card {
  background: white;
  border-radius: 0;
  /*box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);*/
  padding: 0;
  border: 0;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  word-wrap: break-word;
}

.exercise-card-header {
  margin-bottom: 1.25rem;
  display: flex;
  justify-content: space-between;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.exercise-badge-container {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.exercise-type-badge {
  display: inline-block;
  padding: 0.3rem 0.875rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #e0e7ff;
  color: #4f46e5;
}

.exercise-type-badge.essay {
  background: #fef3c7;
  color: #d97706;
}

.exercise-type-badge.info {
  background: #dbeafe;
  color: #2563eb;
}

.exercise-title {
  font-size: 1.375rem;
  margin: 0;
  color: #111827;
  font-weight: 700;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
  flex: 1;
}

/* Exercise Instructions Panel - Compact */
.exercise-instructions-panel {
  margin-bottom: 1.25rem;
}

.exercise-instructions-panel :deep(.p-panel-header) {
  background: #fef3c7 !important;
  border-left: 4px solid #f59e0b;
  border-radius: 8px 8px 0 0 !important;
  padding: 0.75rem 1rem !important;
}

.exercise-instructions-panel :deep(.p-panel-content) {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 0 0 8px 8px;
  padding: 1rem !important;
}

.instructions-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  color: #b45309;
  font-size: 1.05rem;
}

.header-left i {
  font-size: 1.125rem;
}

.header-right {
  display: flex;
  align-items: center;
}

.instructions-content {
  color: #78350f;
  line-height: 1.7;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word; /* Evaluate sayfasındaki gibi */
  white-space: normal;
}

.instructions-content :deep(ul),
.instructions-content :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.instructions-content :deep(li) {
  margin: 0.5rem 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.instructions-content :deep(strong) {
  color: #92400e;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.instructions-content :deep(p) {
  margin: 0.5rem 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* Exercise Description - Compact */
.exercise-description-modern {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #4b5563;
  margin-bottom: 1.5rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.exercise-description-modern p {
  margin: 0 0 1rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* Modern Answer Section - Compact */
.modern-answer-section {
  margin-top: 1.5rem;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.answer-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #374151;
  font-weight: 600;
  font-size: 1.05rem;
}

.answer-label i {
  color: #667eea;
  font-size: 1.2rem;
}

.audio-record-btn {
  font-size: 0.875rem;
}

.audio-record-btn:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;
}

.audio-attachment {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  margin-top: 0.75rem;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 500;
}

.audio-attachment i {
  color: #f59e0b;
  font-size: 1.125rem;
}

.modern-textarea {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  font-size: 1rem;
  line-height: 1.7;
  transition: border-color 0.3s, box-shadow 0.3s;
  min-height: 200px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.modern-textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.modern-textarea:disabled {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
  opacity: 0.7;
}

.answer-locked-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 12px;
  margin-top: 1rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.answer-locked-info i {
  font-size: 1.2rem;
}

.answer-actions-modern {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.nav-exercise-btn {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  transition: all 0.2s;
}

.nav-exercise-btn:hover {
  transform: scale(1.1);
  background: rgba(102, 126, 234, 0.1) !important;
}

.save-next-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  font-weight: 600;
  flex: 1;
  max-width: 400px;
}

.save-next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .exercise-navigation {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .nav-button-wrapper {
    width: 100%;
    justify-content: center;
  }
  
  .nav-button-placeholder {
    display: none;
  }
  
  .exercise-nav-center {
    order: -1;
    margin-bottom: 0.5rem;
  }
  
  .answer-actions-modern {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .save-next-btn {
    max-width: 100%;
  }
  
  .nav-exercise-btn {
    width: 100%;
    height: 42px;
  }
}

/* Info Exercise Actions */
.info-exercise-actions {
  margin-top: 2rem;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  color: #1e40af;
  font-size: 1.05rem;
  margin-bottom: 2rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.info-message i {
  font-size: 1.8rem;
  color: #2563eb;
  flex-shrink: 0;
}

.info-continue-btn {
  width: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.info-continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes slideInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 1400px) {
  .workspace-content {
    grid-template-columns: 280px 1fr 300px;
  }
}

@media (max-width: 1024px) {
  .assessment-workspace {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }
  
  .workspace-content {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }
  
  .sections-sidebar,
  .documents-sidebar {
    max-height: 400px;
  }
  
  .exercises-area {
    max-height: none;
    overflow: visible;
  }
  
  .modern-exercise-container {
    padding: 0 1rem 1rem 1rem;
  }
  
  .modern-section-header {
    padding: 0.875rem 1rem;
  }
  
  .section-title {
    font-size: 1.125rem;
  }
  
  .exercise-title {
    font-size: 1.25rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .progress-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .completion-card {
    padding: 2rem 1.5rem;
  }
  
  .completion-card h2 {
    font-size: 1.5rem;
  }
  
  .completion-text {
    font-size: 1rem;
  }
}

/* Welcome Dialog Styles */
.welcome-dialog :deep(.p-dialog-header) {
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.welcome-dialog :deep(.p-dialog-content) {
  padding: 2rem;
}

.welcome-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 1rem; /* Scroll ile metin arasında boşluk */
}

.welcome-message-html {
  line-height: 1.8;
  color: #374151;
  /* Kelimeleri bölmeden wrap - Evaluate sayfasındaki gibi */
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.welcome-message-html :deep(h1),
.welcome-message-html :deep(h2),
.welcome-message-html :deep(h3),
.welcome-message-html :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.welcome-message-html :deep(h3) {
  font-size: 1.25rem;
}

.welcome-message-html :deep(h4) {
  font-size: 1.1rem;
}

.welcome-message-html :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.8;
}

.welcome-message-html :deep(p.font-semibold),
.welcome-message-html :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.welcome-message-html :deep(ul),
.welcome-message-html :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.welcome-message-html :deep(li) {
  margin: 0.5rem 0;
  line-height: 1.7;
}

.welcome-message-html :deep(a) {
  color: #8b5cf6;
  text-decoration: underline;
}

.default-welcome-message {
  line-height: 1.8;
  color: #374151;
  /* Kelimeleri bölmeden wrap - Evaluate sayfasındaki gibi */
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.default-welcome-message h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.default-welcome-message h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.default-welcome-message p {
  margin-bottom: 1rem;
}

/* Footer */
.app-footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  margin-top: auto;
}

.footer-content {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-right {
  display: flex;
  align-items: center;
}

.footer-text {
  color: #6b7280;
}

.footer-link {
  color: #8b5cf6;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #7c3aed;
  text-decoration: underline;
}

.footer-divider {
  color: #d1d5db;
}

.footer-version {
  font-family: 'Courier New', monospace;
  color: #9ca3af;
  font-size: 0.8125rem;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
</style>
