<template>
  <div class="email-inbox-container">
    <!-- Left Panel: Email List (Inbox) -->
    <div class="inbox-panel">
      <div class="inbox-header">
        <div class="inbox-title">
          <i class="pi pi-inbox"></i>
          <span>Gelen Kutusu</span>
        </div>
        <div class="email-count">{{ exercises.length }} mesaj</div>
      </div>

      <div class="email-list">
        <!-- Real Emails (Exercises) -->
        <div
          v-for="(exercise, index) in exercises"
          :key="exercise.exercise_uuid"
          class="email-item"
          :class="{ 
            'active': selectedEmailIndex === index,
            'read': isExerciseAnswered(exercise.exercise_uuid)
          }"
          @click="selectEmail(index)"
        >
          <div class="email-avatar">
            <i class="pi pi-user"></i>
          </div>
          <div class="email-preview">
            <div class="email-header-row">
              <span class="email-sender">{{ extractFrom(exercise) }}</span>
              <span class="email-time">{{ getEmailTime(index) }}</span>
            </div>
            <div class="email-subject">{{ extractSubject(exercise) || exercise.title }}</div>
          </div>
          <div class="email-status">
            <i v-if="isExerciseAnswered(exercise.exercise_uuid)" class="pi pi-check-circle"></i>
            <i v-else class="pi pi-circle"></i>
          </div>
        </div>

        <!-- Dummy Skeleton Emails -->
        <div
          v-for="n in 6"
          :key="'dummy-' + n"
          class="email-item dummy"
        >
          <div class="email-avatar">
            <i class="pi pi-user"></i>
          </div>
          <div class="email-preview">
            <div class="email-header-row">
              <span class="email-sender">{{ getDummySender(n) }}</span>
              <span class="email-time">{{ getDummyTime(n) }}</span>
            </div>
            <div class="email-subject">{{ getDummySubject(n) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Email Detail + Reply -->
    <div class="email-detail-panel">
      <template v-if="selectedEmail">
        <!-- Email Detail -->
        <div class="email-detail">
          <div class="email-detail-header">
            <h2 class="email-detail-subject">{{ extractSubject(selectedEmail) || selectedEmail.title }}</h2>
            <div class="email-actions">
              <Button 
                v-if="isExerciseAnswered(selectedEmail.exercise_uuid)"
                label="Yanıtlandı" 
                icon="pi pi-check" 
                severity="success"
                text
                disabled
              />
            </div>
          </div>

          <div class="email-meta">
            <div class="email-meta-row">
              <div class="meta-avatar">
                <i class="pi pi-user"></i>
              </div>
              <div class="meta-info">
                <div class="meta-from">
                  <strong>{{ extractFrom(selectedEmail) }}</strong>
                  <span class="meta-email">&lt;{{ extractFromEmail(selectedEmail) }}&gt;</span>
                </div>
                <div class="meta-to">
                  <span class="meta-label">Kime:</span> <strong>{{ extractTo(selectedEmail) }}</strong>
                </div>
                <div class="meta-subject" v-if="extractSubject(selectedEmail)">
                  <span class="meta-label">Konu:</span> <strong>{{ extractSubject(selectedEmail) }}</strong>
                </div>
              </div>
              <div class="meta-time">
                {{ getFullEmailTime(selectedEmailIndex) }}
              </div>
            </div>
          </div>

          <!-- İlişkili Kişi Kartları -->
          <div v-if="getRelatedCharacters(selectedEmail).length > 0" class="related-characters">
            <div class="characters-label">
              <i class="pi pi-users"></i>
              <span>İlgili Kişiler</span>
            </div>
            <div class="characters-list">
              <div 
                v-for="character in getRelatedCharacters(selectedEmail)" 
                :key="character.id"
                class="character-card-mini"
                @click="$emit('show-character', character)"
              >
                <div class="character-avatar">
                  <img 
                    v-if="character.photo" 
                    :src="character.photo" 
                    :alt="character.name"
                  />
                  <i v-else class="pi pi-user"></i>
                </div>
                <div class="character-info">
                  <span class="character-name">{{ character.name }}</span>
                  <span class="character-title" v-if="character.title">{{ character.title }}</span>
                </div>
                <i class="pi pi-external-link view-icon"></i>
              </div>
            </div>
          </div>

          <!-- User's Reply (if answered) - Outlook style thread -->
          <div v-if="isExerciseAnswered(selectedEmail.exercise_uuid)" class="user-reply-thread">
            <div class="user-reply-header">
              <div class="reply-meta">
                <i class="pi pi-reply reply-icon"></i>
                <span class="reply-label">Yanıtınız</span>
                <span class="reply-time">{{ getCurrentTime() }}</span>
              </div>
            </div>
            <div class="user-reply-content" v-html="exerciseAnswers[selectedEmail.exercise_uuid]"></div>
          </div>

          <div class="email-body" v-html="extractBody(selectedEmail.instructions)"></div>
        </div>

        <!-- Reply Section -->
        <div class="email-reply-section" v-if="!isExerciseAnswered(selectedEmail.exercise_uuid)">
          <div class="reply-divider">
            <i class="pi pi-reply"></i>
            <span>Yanıtla</span>
          </div>

          <div class="reply-editor">
            <TipTapEditor
              v-model="exerciseAnswers[selectedEmail.exercise_uuid]"
              placeholder="Yanıtınızı buraya yazın..."
              :character-limit="5000"
            />
          </div>

          <div class="reply-actions">
            <Button
              label="Gönder"
              icon="pi pi-send"
              @click="sendReply"
              :loading="savingExercise === selectedEmail.exercise_uuid"
              size="large"
              class="send-button"
            />
          </div>
        </div>

        <!-- Already Answered -->
        <div v-else class="email-answered-notice">
          <i class="pi pi-check-circle"></i>
          <span>Bu e-postaya yanıt verdiniz.</span>
        </div>
      </template>

      <!-- No Email Selected -->
      <div v-else class="no-email-selected">
        <i class="pi pi-envelope"></i>
        <p>Bir e-posta seçin</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Button from 'primevue/button'
import TipTapEditor from '~/components/TipTapEditor.vue'

const props = defineProps({
  exercises: {
    type: Array,
    required: true
  },
  exerciseAnswers: {
    type: Object,
    required: true
  },
  savingExercise: {
    type: String,
    default: null
  },
  isExerciseAnswered: {
    type: Function,
    required: true
  },
  characters: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save-answer', 'save-and-next', 'show-character'])

// İlişkili kişi kartlarını getir
const getRelatedCharacters = (exercise) => {
  if (!exercise?.related_characters || !props.characters || props.characters.length === 0) {
    return []
  }
  
  // related_characters string (JSON) veya array olabilir
  let relatedIds = []
  if (typeof exercise.related_characters === 'string') {
    try {
      relatedIds = JSON.parse(exercise.related_characters)
    } catch (e) {
      console.warn('related_characters parse error:', e)
      return []
    }
  } else if (Array.isArray(exercise.related_characters)) {
    relatedIds = exercise.related_characters
  }
  
  if (!Array.isArray(relatedIds) || relatedIds.length === 0) {
    return []
  }
  
  // characters listesinden ilgili kişileri filtrele
  return props.characters.filter(char => relatedIds.includes(char.id))
}

const selectedEmailIndex = ref(0)

const selectedEmail = computed(() => {
  return props.exercises[selectedEmailIndex.value] || null
})

const selectEmail = (index) => {
  selectedEmailIndex.value = index
}

// Helper: Email metadata'yı parse et (JSON string ise)
const parseMetadata = (exercise) => {
  if (!exercise.email_metadata) return null
  
  try {
    return typeof exercise.email_metadata === 'string' 
      ? JSON.parse(exercise.email_metadata) 
      : exercise.email_metadata
  } catch (e) {
    console.warn('Email metadata parse hatası:', e)
    return null
  }
}

// Email metadata'dan gönderen adını al (email'den isim çıkar)
const extractFrom = (exercise) => {
  const metadata = parseMetadata(exercise)
  
  if (metadata && metadata.from) {
    const email = metadata.from
    const username = email.split('@')[0]
    return username
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
  
  return 'Gönderen'
}

// Email metadata'dan gönderen email adresini al
const extractFromEmail = (exercise) => {
  const metadata = parseMetadata(exercise)
  return metadata?.from || 'email@example.com'
}

// Email metadata'dan alıcı email adresini al
const extractTo = (exercise) => {
  const metadata = parseMetadata(exercise)
  return metadata?.to || 'Siz'
}

// Email metadata'dan konuyu al
const extractSubject = (exercise) => {
  const metadata = parseMetadata(exercise)
  return metadata?.subject || 'Konu yok'
}

// Email body'den snippet (ilk 60 karakter) al
const extractSnippet = (html) => {
  if (!html) return 'E-posta içeriğini görüntüle...'
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const text = doc.body.textContent || ''
  
  const trimmed = text.trim()
  if (trimmed.length === 0) return 'E-posta içeriğini görüntüle...'
  
  return trimmed.length > 60 ? trimmed.substring(0, 60) + '...' : trimmed
}

// Email body'yi direkt al - artık instructions sadece body içeriyor
const extractBody = (html) => {
  if (!html) return '<p>Email içeriği yükleniyor...</p>'
  return html.trim() || '<p>Email içeriği yükleniyor...</p>'
}

// Time helpers
const getEmailTime = (index) => {
  const times = ['10:30', '11:45', '14:20', '09:15', '16:40']
  return times[index] || '12:00'
}

const getFullEmailTime = (index) => {
  const date = new Date()
  date.setHours(10 + index)
  return date.toLocaleString('tr-TR', { 
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getCurrentTime = () => {
  const now = new Date()
  return now.toLocaleString('tr-TR', { 
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Dummy email generators
const dummySenders = ['Proje Ekibi', 'İK Departmanı', 'Müşteri İlişkileri', 'Finans', 'Operasyon', 'Pazarlama']
const dummySubjects = [
  'Haftalık Durum Raporu',
  'Toplantı Daveti',
  'Bütçe Onayı Gerekli',
  'Müşteri Geri Bildirimleri',
  'Yeni Proje Önerisi',
  'Performans Değerlendirme'
]
const dummySnippets = [
  'Merhaba, bu haftaki ilerleme durumunu paylaşmak istiyorum...',
  'Yarın saat 14:00\'te ekip toplantısı düzenlenecek...',
  'Q3 bütçe planlaması için onayınıza ihtiyacımız var...',
  'Son anket sonuçlarını inceledim ve birkaç önemli nokta var...',
  'Yeni bir proje fırsatı değerlendirmemiz gerekiyor...',
  'Yıllık performans değerlendirme sürecimiz başladı...'
]

const getDummySender = (n) => dummySenders[(n - 1) % dummySenders.length]
const getDummySubject = (n) => dummySubjects[(n - 1) % dummySubjects.length]
const getDummySnippet = (n) => dummySnippets[(n - 1) % dummySnippets.length]
const getDummyTime = (n) => {
  const hours = ['Dün', '2 gün önce', '3 gün önce', 'Geçen hafta', '15 Oca', '12 Oca']
  return hours[(n - 1) % hours.length]
}

// Actions
const sendReply = () => {
  if (!selectedEmail.value) return
  emit('save-answer', selectedEmail.value)
}

const sendAndNext = () => {
  if (!selectedEmail.value) return
  
  // Emit save event
  emit('save-and-next', selectedEmail.value)
  
  // Auto-select next email after a short delay (wait for save)
  setTimeout(() => {
    if (selectedEmailIndex.value < props.exercises.length - 1) {
      selectedEmailIndex.value++
    }
  }, 500)
}

// Auto-select first unanswered email
watch(() => props.exercises, (newExercises) => {
  if (newExercises && newExercises.length > 0) {
    const firstUnanswered = newExercises.findIndex(ex => !props.isExerciseAnswered(ex.exercise_uuid))
    if (firstUnanswered >= 0) {
      selectedEmailIndex.value = firstUnanswered
    }
  }
}, { immediate: true })
</script>

<style scoped>
.email-inbox-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  height: calc(100vh - 180px);
  max-height: calc(100vh - 180px);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* ===== INBOX PANEL (LEFT) ===== */
.inbox-panel {
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  min-height: 0;
  overflow: hidden;
}

.inbox-header {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
  flex-shrink: 0;
}

.inbox-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.inbox-title i {
  color: #667eea;
}

.email-count {
  font-size: 0.85rem;
  color: #666;
}

.email-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.email-item {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  align-items: flex-start;
}

.email-item:hover {
  background: #f0f4ff;
}

.email-item.active {
  background: #e8efff;
  border-left: 3px solid #667eea;
}

.email-item.read {
  opacity: 0.7;
}

.email-item.dummy {
  opacity: 0.4;
  cursor: not-allowed;
  filter: blur(0.5px);
}

.email-item.dummy:hover {
  background: #fff;
}

.email-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.email-preview {
  flex: 1;
  min-width: 0;
}

.email-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.email-sender {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.95rem;
}

.email-time {
  font-size: 0.75rem;
  color: #888;
  flex-shrink: 0;
}

.email-subject {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.15rem;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.email-status {
  display: flex;
  align-items: center;
  color: #667eea;
}

/* ===== EMAIL DETAIL PANEL (RIGHT) ===== */
.email-detail-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.email-detail {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2rem;
  min-height: 0;
}

.email-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.email-detail-subject {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.email-meta {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.email-meta-row {
  display: flex;
  gap: 0.75rem;
}

.meta-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.meta-info {
  flex: 1;
}

.meta-from {
  margin-bottom: 0.25rem;
  color: #333;
}

.meta-email {
  color: #666;
  margin-left: 0.5rem;
  font-size: 0.9rem;
}

.meta-to {
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.15rem;
}

.meta-subject {
  font-size: 0.9rem;
  color: #333;
}

.meta-label {
  color: #666;
  font-weight: normal;
  margin-right: 0.25rem;
}

.meta-time {
  font-size: 0.85rem;
  color: #999;
}

/* User Reply Thread (Outlook style) */
.user-reply-thread {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: #f8f9ff;
  border-left: 4px solid #667eea;
  border-radius: 8px;
}

.user-reply-header {
  margin-bottom: 1rem;
}

.reply-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 600;
}

.reply-icon {
  font-size: 1.2rem;
}

.reply-label {
  font-weight: 600;
}

.reply-time {
  color: #999;
  font-weight: 400;
  margin-left: auto;
}

.user-reply-content {
  line-height: 1.8;
  color: #333;
  padding: 1rem 0;
}

.user-reply-content :deep(p) {
  margin-bottom: 1rem;
}

.user-reply-content :deep(strong) {
  font-weight: 600;
}

.user-reply-content :deep(ul),
.user-reply-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.user-reply-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}

.user-reply-content :deep(table th) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid rgba(255,255,255,0.1);
}

.user-reply-content :deep(table td) {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  color: #333;
  font-size: 0.95rem;
}

.user-reply-content :deep(table tr:nth-child(even)) {
  background: #f8f9ff;
}

.user-reply-content :deep(table tr:hover) {
  background: #f0f2ff;
  transition: background 0.2s ease;
}

.email-body {
  line-height: 1.8;
  color: #333;
}

.email-body :deep(p) {
  margin-bottom: 1rem;
}

.email-body :deep(strong) {
  color: #667eea;
  font-weight: 600;
}

.email-body :deep(ul),
.email-body :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.email-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}

.email-body :deep(table th) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid rgba(255,255,255,0.1);
}

.email-body :deep(table td) {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  color: #333;
  font-size: 0.95rem;
}

.email-body :deep(table tr:nth-child(even)) {
  background: #f8f9ff;
}

.email-body :deep(table tr:hover) {
  background: #f0f2ff;
  transition: background 0.2s ease;
}

/* ===== REPLY SECTION ===== */
.email-reply-section {
  border-top: 1px solid #e0e0e0;
  padding: 1.5rem 2rem;
  background: #f8f9fa;
  flex-shrink: 0;
}

.reply-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 1rem;
}

.reply-divider i {
  font-size: 1.1rem;
}

.reply-editor {
  margin-bottom: 1rem;
}

.reply-actions {
  display: flex;
  gap: 0.75rem;
}

.send-button {
  background: #667eea;
  border: none;
}

.email-answered-notice {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 2rem;
  background: #e8f5e9;
  border-top: 1px solid #c8e6c9;
  color: #2e7d32;
  font-weight: 500;
  flex-shrink: 0;
}

.email-answered-notice i {
  font-size: 1.25rem;
}

/* ===== NO EMAIL SELECTED ===== */
.no-email-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.no-email-selected i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.no-email-selected p {
  font-size: 1.1rem;
}

/* Scrollbar */
.email-list::-webkit-scrollbar,
.email-detail::-webkit-scrollbar {
  width: 6px;
}

.email-list::-webkit-scrollbar-track,
.email-detail::-webkit-scrollbar-track {
  background: transparent;
}

.email-list::-webkit-scrollbar-thumb,
.email-detail::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.2);
  border-radius: 3px;
}

.email-list::-webkit-scrollbar-thumb:hover,
.email-detail::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.3);
}

/* Firefox scrollbar */
.email-list,
.email-detail {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.2) transparent;
}

/* İlişkili Kişi Kartları */
.related-characters {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
  border: 1px solid #c7d9f7;
  border-radius: 10px;
  padding: 0.875rem 1rem;
  margin: 1rem 0;
}

.characters-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4f46e5;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.625rem;
}

.characters-label i {
  font-size: 0.9rem;
}

.characters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.character-card-mini {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: #fff;
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  padding: 0.5rem 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
}

.character-card-mini:hover {
  border-color: #818cf8;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
}

.character-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.character-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.character-avatar i {
  color: #6366f1;
  font-size: 0.9rem;
}

.character-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.character-info .character-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.character-info .character-title {
  color: #6b7280;
  font-size: 0.7rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-icon {
  color: #9ca3af;
  font-size: 0.7rem;
  transition: color 0.2s ease;
}

.character-card-mini:hover .view-icon {
  color: #6366f1;
}
</style>
