<template>
  <Dialog v-model:visible="visible" modal header="Ses Kaydı" :style="{ width: '500px' }" @hide="handleClose">
    <div class="audio-recorder">
      <div class="recorder-status">
        <div class="status-indicator" :class="{ 'recording': isRecording, 'paused': isPaused }">
          <i class="pi" :class="isRecording ? 'pi-circle' : 'pi-microphone'"></i>
        </div>
        <div class="status-text">
          <span v-if="!isRecording && !audioUrl" class="status-label">Kayıt Hazır</span>
          <span v-else-if="isRecording && !isPaused" class="status-label">Kaydediliyor...</span>
          <span v-else-if="isPaused" class="status-label">Duraklatıldı</span>
          <span v-else class="status-label">Kayıt Tamamlandı</span>
          <span class="timer">{{ formattedTime }}</span>
        </div>
      </div>

      <div v-if="audioUrl" class="audio-preview">
        <audio ref="audioPlayer" :src="audioUrl" controls class="audio-player"></audio>
      </div>

      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

      <div class="recorder-controls">
        <Button v-if="!isRecording && !audioUrl" label="Kaydı Başlat" icon="pi pi-microphone" @click="startRecording" severity="success" />
        <Button v-if="isRecording && !isPaused" label="Duraklat" icon="pi pi-pause" @click="pauseRecording" severity="warning" />
        <Button v-if="isRecording && isPaused" label="Devam Et" icon="pi pi-play" @click="resumeRecording" severity="info" />
        <Button v-if="isRecording" label="Durdur" icon="pi pi-stop" @click="stopRecording" severity="danger" />
        <Button v-if="audioUrl" label="Yeni Kayıt" icon="pi pi-refresh" @click="resetRecording" severity="secondary" outlined />
      </div>
    </div>

    <template #footer>
      <Button label="İptal" icon="pi pi-times" @click="handleClose" text />
      <Button label="Kaydet" icon="pi pi-check" @click="handleSave" :disabled="!audioUrl" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isRecording = ref(false)
const isPaused = ref(false)
const audioUrl = ref(null)
const audioBlob = ref(null)
const error = ref(null)
const recordingTime = ref(0)
const recordingInterval = ref(null)

let mediaRecorder = null
let audioChunks = []

const formattedTime = computed(() => {
  const minutes = Math.floor(recordingTime.value / 60)
  const seconds = recordingTime.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const startRecording = async () => {
  try {
    error.value = null
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      audioBlob.value = blob
      audioUrl.value = URL.createObjectURL(blob)
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.start()
    isRecording.value = true
    isPaused.value = false
    recordingTime.value = 0
    
    recordingInterval.value = setInterval(() => {
      if (!isPaused.value) {
        recordingTime.value++
      }
    }, 1000)
  } catch (err) {
    error.value = 'Mikrofona erişim izni alınamadı'
    console.error('Microphone error:', err)
  }
}

const pauseRecording = () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause()
    isPaused.value = true
  }
}

const resumeRecording = () => {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume()
    isPaused.value = false
  }
}

const stopRecording = () => {
  if (mediaRecorder) {
    mediaRecorder.stop()
    isRecording.value = false
    isPaused.value = false
    clearInterval(recordingInterval.value)
  }
}

const resetRecording = () => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
  audioUrl.value = null
  audioBlob.value = null
  recordingTime.value = 0
  error.value = null
}

const handleSave = () => {
  if (audioBlob.value) {
    emit('save', audioBlob.value)
    handleClose()
  }
}

const handleClose = () => {
  if (isRecording.value) {
    stopRecording()
  }
  resetRecording()
  emit('update:modelValue', false)
}
</script>

<style scoped>
.audio-recorder {
  padding: 1rem 0;
}

.recorder-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.status-indicator {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 1.25rem;
}

.status-indicator.recording {
  background: #fee2e2;
  color: #dc2626;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-indicator.paused {
  background: #fef3c7;
  color: #f59e0b;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  flex: 1;
}

.status-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.timer {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  font-family: 'Courier New', monospace;
}

.audio-preview {
  margin-bottom: 1.5rem;
}

.audio-player {
  width: 100%;
  border-radius: 8px;
}

.recorder-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.recorder-controls button {
  flex: 1;
  min-width: 120px;
}
</style>
