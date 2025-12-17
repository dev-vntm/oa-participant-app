<template>
  <div class="email-view">
    <Panel :collapsed="false" toggleable class="email-panel">
      <template #header>
        <div class="email-panel-header">
          <div class="header-left">
            <i class="pi pi-envelope"></i>
            <span>E-Posta</span>
          </div>
        </div>
      </template>

      <div class="email-content">
        <!-- Email Metadata -->
        <div class="email-metadata">
          <div class="metadata-row" v-if="to">
            <span class="metadata-label">Kime:</span>
            <span class="metadata-value">{{ to }}</span>
          </div>
          <div class="metadata-row" v-if="from">
            <span class="metadata-label">Kimden:</span>
            <span class="metadata-value">{{ from }}</span>
          </div>
          <div class="metadata-row" v-if="subject">
            <span class="metadata-label">Konu:</span>
            <span class="metadata-value">{{ subject }}</span>
          </div>
          <div class="metadata-row" v-if="date">
            <span class="metadata-label">Tarih:</span>
            <span class="metadata-value">{{ date }}</span>
          </div>
        </div>

        <!-- İlişkili Kişi Kartları -->
        <div v-if="relatedCharactersList.length > 0" class="related-characters">
          <div class="characters-label">
            <i class="pi pi-users"></i>
            <span>İlgili Kişiler</span>
          </div>
          <div class="characters-list">
            <div 
              v-for="character in relatedCharactersList" 
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

        <!-- Email Body -->
        <div class="email-body" v-html="body"></div>
      </div>
    </Panel>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Panel from 'primevue/panel'

const props = defineProps({
  instructions: {
    type: String,
    required: true
  },
  relatedCharacters: {
    type: [String, Array],
    default: null
  },
  characters: {
    type: Array,
    default: () => []
  }
})

defineEmits(['show-character'])

// İlişkili kişi kartlarını hesapla
const relatedCharactersList = computed(() => {
  if (!props.relatedCharacters || !props.characters || props.characters.length === 0) {
    return []
  }
  
  // related_characters string (JSON) veya array olabilir
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
  
  // characters listesinden ilgili kişileri filtrele
  return props.characters.filter(char => relatedIds.includes(char.id))
})

// E-posta bilgilerini HTML'den parse et
const parseEmailData = () => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(props.instructions, 'text/html')
  
  const data = {
    to: '',
    from: '',
    subject: '',
    date: '',
    body: ''
  }

  let foundMetadata = false
  let metadataEnded = false
  let bodyHtml = ''

  // Tüm paragrafları işle
  const allElements = doc.body.children
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i]
    const text = element.textContent || ''
    
    // Metadata alanlarını tespit et
    if (text.includes('Kime') && text.includes(':')) {
      const parts = text.split(':')
      data.to = parts.slice(1).join(':').trim()
      foundMetadata = true
      continue
    }
    
    if (text.includes('Kimden') && text.includes(':')) {
      const parts = text.split(':')
      data.from = parts.slice(1).join(':').trim()
      foundMetadata = true
      continue
    }
    
    if (text.includes('Konu') && text.includes(':')) {
      const parts = text.split(':')
      data.subject = parts.slice(1).join(':').trim()
      foundMetadata = true
      metadataEnded = true
      continue
    }
    
    if (text.includes('Tarih') && text.includes(':')) {
      const parts = text.split(':')
      data.date = parts.slice(1).join(':').trim()
      foundMetadata = true
      metadataEnded = true
      continue
    }
    
    // E-Posta başlığını atla
    if (text.trim() === 'E-Posta' || element.querySelector('strong')?.textContent?.includes('E-Posta')) {
      continue
    }
    
    // Metadata sonrası tüm içerik body'e dahil
    if (foundMetadata && metadataEnded) {
      bodyHtml += element.outerHTML
    }
    
    // Eğer metadata yoksa ve genel bir başlangıç yapıldıysa body'e ekle
    if (!foundMetadata && text.trim() !== '' && !text.includes('E-Posta')) {
      bodyHtml += element.outerHTML
    }
  }

  data.body = bodyHtml

  // Eğer parse edemediyse, tüm içeriği body olarak kullan
  if (!data.to && !data.from && !data.subject) {
    data.body = props.instructions
  }

  return data
}

const emailData = computed(() => parseEmailData())
const to = computed(() => emailData.value.to)
const from = computed(() => emailData.value.from)
const subject = computed(() => emailData.value.subject)
const date = computed(() => emailData.value.date)
const body = computed(() => emailData.value.body)
</script>

<style scoped>
.email-view {
  margin-bottom: 1.5rem;
}

.email-panel :deep(.p-panel-header) {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  border: none;
  border-radius: 12px 12px 0 0;
  padding: 1rem 1.5rem;
}

.email-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 1.1rem;
  color: #fff;
}

.header-left i {
  font-size: 1.3rem;
}

.email-panel :deep(.p-panel-content) {
  background: #fffbf0;
  border: 2px solid #f6d365;
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 0;
}

.email-content {
  padding: 1.5rem;
}

.email-metadata {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}

.metadata-row {
  display: flex;
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.metadata-row:last-child {
  margin-bottom: 0;
}

.metadata-label {
  font-weight: 700;
  color: #333;
  min-width: 80px;
  flex-shrink: 0;
}

.metadata-value {
  color: #555;
}

.email-body {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  line-height: 1.8;
  color: #333;
}

.email-body :deep(p) {
  margin-bottom: 1rem;
}

.email-body :deep(p:last-child) {
  margin-bottom: 0;
}

.email-body :deep(strong) {
  color: #e03e52;
  font-weight: 600;
}

.email-body :deep(ul),
.email-body :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.email-body :deep(li) {
  margin-bottom: 0.5rem;
}

/* İlişkili Kişi Kartları */
.related-characters {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
  border: 1px solid #c7d9f7;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}

.characters-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4f46e5;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.characters-label i {
  font-size: 1rem;
}

.characters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.character-card-mini {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fff;
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 180px;
}

.character-card-mini:hover {
  border-color: #818cf8;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
}

.character-avatar {
  width: 36px;
  height: 36px;
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
  font-size: 1rem;
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
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.character-info .character-title {
  color: #6b7280;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-icon {
  color: #9ca3af;
  font-size: 0.75rem;
  transition: color 0.2s ease;
}

.character-card-mini:hover .view-icon {
  color: #6366f1;
}
</style>
