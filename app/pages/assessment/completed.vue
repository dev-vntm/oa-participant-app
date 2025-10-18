<template>
  <div class="completion-page">
    <div class="completion-container">
      <!-- Success Animation -->
      <div class="success-animation">
        <div class="success-circle">
          <div class="success-checkmark">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div class="completion-content">
        <h1 class="completion-title">🎉 Tebrikler!</h1>
        <p class="completion-subtitle">Değerlendirmeyi başarıyla tamamladınız</p>
        
        <div class="completion-info">
          <div class="info-card">
            <i class="pi pi-check-circle"></i>
            <div>
              <h3>Tüm Bölümler Tamamlandı</h3>
              <p>Cevaplarınız başarıyla kaydedildi</p>
            </div>
          </div>
          
          <div class="info-card">
            <i class="pi pi-clock"></i>
            <div>
              <h3>Süreç Tamamlandı</h3>
              <p>Sonuçlarınız değerlendirme ekibi tarafından incelenecektir</p>
            </div>
          </div>
          
          <div class="info-card">
            <i class="pi pi-envelope"></i>
            <div>
              <h3>Bilgilendirme</h3>
              <p>Sonuçlar hazır olduğunda e-posta ile bilgilendirileceksiniz</p>
            </div>
          </div>
        </div>

        <div class="completion-actions">
          <p class="thank-you-text">
            Değerlendirmemize katıldığınız için teşekkür ederiz. 
            Bu pencereyi güvenle kapatabilirsiniz.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="completion-footer">
        <a href="https://vakamaka.com" target="_blank" class="footer-brand">
          <span class="brand-name">Vakamaka</span>
        </a>
        <p class="footer-text">© 2025 Vakamaka Online Assessment</p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: []
})
</script>

<style scoped>
.completion-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.completion-container {
  max-width: 700px;
  width: 100%;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 2rem 1.75rem;
  text-align: center;
  animation: slideUp 0.6s ease-out;
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

/* Success Animation */
.success-animation {
  margin-bottom: 1.5rem;
}

.success-circle {
  display: inline-block;
  width: 100px;
  height: 100px;
  position: relative;
}

.success-checkmark {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
  stroke-width: 3;
  stroke: #10b981;
  stroke-miterlimit: 10;
}

.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 3;
  stroke-miterlimit: 10;
  stroke: #10b981;
  fill: none;
  animation: stroke 0.8s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.5s cubic-bezier(0.65, 0, 0.45, 1) 1.2s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

/* Content */
.completion-content {
  margin-bottom: 1.5rem;
}

.completion-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.completion-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.completion-info {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin: 1.5rem 0;
  text-align: left;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.125rem 1.25rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.3s;
}

.info-card:hover {
  border-color: #667eea;
  background: #f5f3ff;
  transform: translateX(5px);
}

.info-card i {
  font-size: 1.5rem;
  color: #667eea;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-card h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.info-card p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.completion-actions {
  margin: 1.5rem 0;
  padding: 1.25rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 10px;
}

.thank-you-text {
  font-size: 0.9375rem;
  color: #92400e;
  margin: 0;
  line-height: 1.6;
}

/* Footer */
.completion-footer {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1.5rem;
}

.footer-brand {
  display: inline-block;
  margin-bottom: 0.75rem;
  text-decoration: none;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: transform 0.3s;
  display: inline-block;
}

.footer-brand:hover .brand-name {
  transform: scale(1.05);
}

.footer-text {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .completion-page {
    padding: 1rem;
  }
  
  .completion-container {
    padding: 1.5rem 1.25rem;
  }
  
  .completion-title {
    font-size: 1.75rem;
  }
  
  .completion-subtitle {
    font-size: 1rem;
  }
  
  .success-circle {
    width: 80px;
    height: 80px;
  }
  
  .info-card {
    padding: 1rem;
  }
  
  .info-card h3 {
    font-size: 0.9375rem;
  }
  
  .info-card p {
    font-size: 0.8125rem;
  }
}
</style>
