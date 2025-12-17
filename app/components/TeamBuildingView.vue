<template>
  <div class="team-building-view">
    <!-- Talimatlar -->
    <div v-if="instructions" class="instructions-panel">
      <div class="instructions-header">
        <i class="pi pi-info-circle"></i>
        <span>Talimatlar</span>
      </div>
      <div class="instructions-content" v-html="instructions"></div>
    </div>

    <!-- 3 Sütunlu Ana Container -->
    <div class="team-building-container">
      <!-- Sol Panel: Ekip Havuzu -->
      <div class="column-panel pool-panel">
        <div class="panel-header">
          <i class="pi pi-users"></i>
          <span>Ekip Havuzu</span>
          <span class="member-count">({{ availableCharacters.length }})</span>
        </div>
        
        <div class="panel-content" @dragover.prevent @drop="handleDropToAvailable">
          <div 
            v-for="character in availableCharacters" 
            :key="character.id"
            class="member-card"
            :class="{ 'dragging': draggedCharacter?.id === character.id }"
            draggable="true"
            @dragstart="handleDragStart(character, $event)"
            @dragend="handleDragEnd"
          >
            <div class="member-avatar" @click.stop="$emit('show-character', character)">
              <img 
                v-if="character.photo || character.photo_path" 
                :src="character.photo || character.photo_path" 
                :alt="character.name"
              />
              <i v-else class="pi pi-user"></i>
            </div>
            <div class="member-info">
              <span class="member-name">{{ character.name }}</span>
              <span class="member-title" v-if="character.title">{{ character.title }}</span>
            </div>
            <div class="member-actions">
              <button class="action-btn info-btn" @click.stop="$emit('show-character', character)" title="Detayları Görüntüle">
                <i class="pi pi-eye"></i>
              </button>
              <button class="action-btn add-btn" @click.stop="addToTeam(character)" title="Ekibe Ekle">
                <i class="pi pi-arrow-right"></i>
              </button>
            </div>
          </div>
          
          <div v-if="availableCharacters.length === 0" class="empty-state">
            <i class="pi pi-check-circle"></i>
            <span>Tüm üyeler ekibe eklendi</span>
          </div>
        </div>
      </div>

      <!-- Orta Panel: Oluşturulan Ekip -->
      <div class="column-panel team-panel">
        <div class="panel-header team-header">
          <i class="pi pi-star"></i>
          <span>Oluşturulan Ekip</span>
          <span class="member-count">({{ selectedTeam.length }})</span>
        </div>
        
        <div 
          class="panel-content team-drop-zone" 
          :class="{ 'drag-over': isDragOverTeam, 'has-members': selectedTeam.length > 0 }"
          @dragover.prevent="isDragOverTeam = true"
          @dragleave="isDragOverTeam = false"
          @drop="handleDropToTeam"
        >
          <div v-if="selectedTeam.length === 0" class="drop-placeholder">
            <i class="pi pi-arrow-left"></i>
            <span>Ekip üyelerini buraya sürükleyin</span>
          </div>
          
          <TransitionGroup name="team-member" tag="div" class="team-members-list">
            <div 
              v-for="(character, index) in selectedTeam" 
              :key="character.id"
              class="team-member-card"
              draggable="true"
              @dragstart="handleDragStart(character, $event)"
              @dragend="handleDragEnd"
            >
              <span class="member-order">{{ index + 1 }}</span>
              <div class="member-avatar" @click.stop="$emit('show-character', character)">
                <img 
                  v-if="character.photo || character.photo_path" 
                  :src="character.photo || character.photo_path" 
                  :alt="character.name"
                />
                <i v-else class="pi pi-user"></i>
              </div>
              <div class="member-info">
                <span class="member-name">{{ character.name }}</span>
                <span class="member-title" v-if="character.title">{{ character.title }}</span>
              </div>
              <button class="action-btn remove-btn" @click.stop="removeFromTeam(character)" title="Ekipten Çıkar">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- Sağ Panel: Açıklama -->
      <div class="column-panel explanation-panel">
        <div class="panel-header explanation-header">
          <i class="pi pi-pencil"></i>
          <span>Açıklama</span>
          <span class="required-tag">*</span>
        </div>
        
        <div class="panel-content explanation-content">
          <Textarea
            v-model="explanation"
            :disabled="disabled"
            placeholder="Ekip seçiminizin gerekçesini açıklayabilirsiniz..."
            class="explanation-textarea"
            :autoResize="false"
          />
          <div class="char-counter">
            {{ explanation.length }} / 2000
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Textarea from 'primevue/textarea'

const props = defineProps({
  instructions: {
    type: String,
    default: ''
  },
  relatedCharacters: {
    type: [String, Array],
    default: null
  },
  characters: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'show-character'])

// State
const selectedTeam = ref([])
const explanation = ref('')
const draggedCharacter = ref(null)
const isDragOverTeam = ref(false)

// İlişkili kişi kartlarını hesapla
const relatedCharactersList = computed(() => {
  if (!props.relatedCharacters || !props.characters || props.characters.length === 0) {
    return []
  }
  
  let relatedIds = []
  if (typeof props.relatedCharacters === 'string') {
    try {
      relatedIds = JSON.parse(props.relatedCharacters)
    } catch (e) {
      console.warn('related_characters parse error:', e)
      return []
    }
  } else if (Array.isArray(props.relatedCharacters)) {
    relatedIds = props.relatedCharacters
  }
  
  if (!Array.isArray(relatedIds) || relatedIds.length === 0) {
    return []
  }
  
  return props.characters.filter(char => relatedIds.includes(char.id))
})

// Henüz seçilmemiş kişiler
const availableCharacters = computed(() => {
  const selectedIds = selectedTeam.value.map(c => c.id)
  return relatedCharactersList.value.filter(c => !selectedIds.includes(c.id))
})

// Drag & Drop handlers
const handleDragStart = (character, event) => {
  draggedCharacter.value = character
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', character.id)
}

const handleDragEnd = () => {
  draggedCharacter.value = null
  isDragOverTeam.value = false
}

const handleDropToTeam = (event) => {
  event.preventDefault()
  isDragOverTeam.value = false
  
  if (props.disabled) return
  
  if (draggedCharacter.value) {
    const isInTeam = selectedTeam.value.some(c => c.id === draggedCharacter.value.id)
    if (!isInTeam) {
      selectedTeam.value.push(draggedCharacter.value)
      updateModelValue()
    }
  }
}

const handleDropToAvailable = (event) => {
  event.preventDefault()
  
  if (props.disabled) return
  
  if (draggedCharacter.value) {
    const index = selectedTeam.value.findIndex(c => c.id === draggedCharacter.value.id)
    if (index !== -1) {
      selectedTeam.value.splice(index, 1)
      updateModelValue()
    }
  }
}

// Button handlers
const addToTeam = (character) => {
  if (props.disabled) return
  
  const isInTeam = selectedTeam.value.some(c => c.id === character.id)
  if (!isInTeam) {
    selectedTeam.value.push(character)
    updateModelValue()
  }
}

const removeFromTeam = (character) => {
  if (props.disabled) return
  
  const index = selectedTeam.value.findIndex(c => c.id === character.id)
  if (index !== -1) {
    selectedTeam.value.splice(index, 1)
    updateModelValue()
  }
}

// Model değerini güncelle
const updateModelValue = () => {
  const teamNames = selectedTeam.value.map((c, i) => `${i + 1}. ${c.name}${c.title ? ' (' + c.title + ')' : ''}`).join('\n')
  
  let result = ''
  if (teamNames) {
    result = `=== OLUŞTURULAN EKİP ===\n${teamNames}`
  }
  
  if (explanation.value.trim()) {
    result += `\n\n=== AÇIKLAMA ===\n${explanation.value.trim()}`
  }
  
  emit('update:modelValue', result)
}

// Açıklama değiştiğinde güncelle
watch(explanation, () => {
  updateModelValue()
})

// Mevcut değeri parse et (düzenleme modu için)
watch(() => props.modelValue, (newValue) => {
  if (newValue && selectedTeam.value.length === 0) {
    // Mevcut cevabı parse etmeye çalış
    const teamMatch = newValue.match(/=== OLUŞTURULAN EKİP ===\n([\s\S]*?)(?:\n\n===|$)/)
    const explanationMatch = newValue.match(/=== AÇIKLAMA ===\n([\s\S]*)$/)
    
    if (explanationMatch) {
      explanation.value = explanationMatch[1].trim()
    }
    
    // Not: Ekip üyelerini isimden geri almak zor, bu yüzden disabled modda sadece text gösterilecek
  }
}, { immediate: true })
</script>

<style scoped>
.team-building-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  flex: 1;
}

/* Talimatlar */
.instructions-panel {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
  border: 1px solid #d0deff;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.instructions-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #4f46e5;
  margin-bottom: 0.75rem;
}

.instructions-header i {
  font-size: 1.1rem;
}

.instructions-content {
  color: #374151;
  line-height: 1.6;
  font-size: 0.95rem;
}

/* 3 Sütunlu Ana Container */
.team-building-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

@media (max-width: 1200px) {
  .team-building-container {
    grid-template-columns: 1fr 1fr;
  }
  .explanation-panel {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .team-building-container {
    grid-template-columns: 1fr;
  }
  .explanation-panel {
    grid-column: span 1;
  }
}

/* Sütun Paneli */
.column-panel {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.panel-content {
  flex: 1;
  padding: 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Panel Header */
.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #475569;
  border-radius: 12px 12px 0 0;
}

.panel-header i {
  font-size: 1.1rem;
  color: #6366f1;
}

.team-header i {
  color: #f59e0b;
}

.member-count {
  font-weight: 400;
  color: #94a3b8;
  font-size: 0.875rem;
}

/* Pool Panel */
.pool-panel .panel-header i {
  color: #6366f1;
}

/* Member Card */
.member-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: grab;
  transition: all 0.2s ease;
}

.member-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateX(4px);
}

.member-card.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.member-card:active {
  cursor: grabbing;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.member-avatar:hover {
  transform: scale(1.05);
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-avatar i {
  color: white;
  font-size: 1.25rem;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.member-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-title {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-department {
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-actions {
  display: flex;
  gap: 0.375rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.info-btn {
  background: #e0e7ff;
  color: #4f46e5;
}

.info-btn:hover {
  background: #c7d2fe;
}

.add-btn {
  background: #dcfce7;
  color: #16a34a;
}

.add-btn:hover {
  background: #bbf7d0;
}

.remove-btn {
  background: #fee2e2;
  color: #dc2626;
}

.remove-btn:hover {
  background: #fecaca;
}

/* Ekip Paneli */
.team-panel {
  border: 2px solid #fcd34d;
}

.team-drop-zone {
  transition: all 0.2s ease;
}

.team-drop-zone.drag-over {
  background: #f0fdf4;
  border-color: #22c55e;
}

.drop-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #94a3b8;
  padding: 2rem;
  text-align: center;
}

.drop-placeholder i {
  font-size: 2.5rem;
  color: #cbd5e1;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.drop-placeholder .hint {
  font-size: 0.8rem;
  color: #cbd5e1;
}

.team-members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Ekip Üye Kartı */
.team-member-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
  border-radius: 10px;
  cursor: grab;
  transition: all 0.2s ease;
}

.team-member-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
}

.team-member-card:active {
  cursor: grabbing;
}

.member-order {
  width: 28px;
  height: 28px;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.team-member-card .member-avatar {
  width: 40px;
  height: 40px;
}

.team-member-card .member-name {
  color: #78350f;
}

.team-member-card .member-title {
  color: #92400e;
}

/* Transition */
.team-member-enter-active,
.team-member-leave-active {
  transition: all 0.3s ease;
}

.team-member-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.team-member-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #94a3b8;
}

.empty-state i {
  font-size: 2rem;
  color: #22c55e;
}

/* Açıklama Paneli */
.explanation-panel {
  border: 1px solid #e0e7ff;
}

.explanation-header i {
  color: #6366f1;
}

.optional-tag {
  font-weight: 400;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: auto;
}

.required-tag {
  color: #ef4444;
  font-weight: 600;
  margin-left: 0.25rem;
}

.explanation-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.explanation-textarea {
  flex: 1;
  width: 100%;
  font-family: inherit;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  resize: none;
  min-height: 150px;
  transition: border-color 0.2s ease;
}

.explanation-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.explanation-textarea:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.char-counter {
  text-align: right;
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}
</style>
