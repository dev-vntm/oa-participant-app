<template>
  <div class="default-view">
    <!-- Sadece içerik - başlık, çerçeve, gölge yok -->
    <div class="instructions-content">
      <div class="instructions-body" v-html="instructions"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  instructions: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.default-view {
  margin-bottom: 1.5rem;
}

.instructions-content {
  /* Sade, çerçevesiz, gölgesiz */
  background: transparent;
  line-height: 1.8;
}

.instructions-body {
  color: #374151;
  font-size: 1rem;
  line-height: 1.8;
}

.instructions-body :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.8;
}

.instructions-body :deep(p:last-child) {
  margin-bottom: 0;
}

.instructions-body :deep(ul),
.instructions-body :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.instructions-body :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.8;
}

.instructions-body :deep(strong) {
  color: #1f2937;
  font-weight: 600;
}

.instructions-body :deep(em) {
  font-style: italic;
  color: #6b7280;
}

.instructions-body :deep(code) {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.instructions-body :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
  font-style: italic;
}

.instructions-body :deep(h1),
.instructions-body :deep(h2),
.instructions-body :deep(h3),
.instructions-body :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #1f2937;
  font-weight: 600;
}

.instructions-body :deep(h1) {
  font-size: 1.5rem;
}

.instructions-body :deep(h2) {
  font-size: 1.25rem;
}

.instructions-body :deep(h3) {
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .default-panel :deep(.p-panel-header) {
    padding: 0.875rem 1rem !important;
  }

  .default-panel :deep(.p-panel-content) {
    padding: 1.25rem;
  }

  .header-left {
    font-size: 0.95rem;
  }

  .instructions-body {
    font-size: 0.95rem;
  }
}
</style>
