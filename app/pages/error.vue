<template>
  <div class="assessment-error-page">
    <Card class="error-card">
      <template #content>
        <div class="error-content">
          <i class="pi pi-exclamation-circle error-icon"></i>
          <h2>Bir Sorun Oluştu</h2>
          <p>{{ errorMessage }}</p>
          <p class="help-text">
            Lütfen email'inizdeki daveti kontrol edin veya yetkili ile iletişime geçin.
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: false,
  middleware: [] // Panel auth bypass
})

const route = useRoute()
const errorMessage = ref('Beklenmeyen bir hata oluştu')

onMounted(() => {
  if (route.query.message) {
    errorMessage.value = route.query.message
  }
})
</script>

<style scoped>
.assessment-error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 2rem;
}

.error-card {
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.error-content {
  padding: 2rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1.5rem;
}

.error-content h2 {
  font-size: 1.8rem;
  color: #1f2937;
  margin-bottom: 1rem;
}

.error-content p {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.help-text {
  font-size: 0.95rem;
  color: #9ca3af;
  margin-top: 1.5rem;
}
</style>
