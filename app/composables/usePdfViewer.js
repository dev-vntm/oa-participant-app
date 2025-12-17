import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRuntimeConfig } from '#app'
import { useToast } from 'primevue/usetoast'

/**
 * PDF görüntüleyici yönetimi composable
 * 
 * @param {Object} options
 * @param {Object} options.store - Assessment store instance
 * @returns {Object} PDF viewer state ve methodları
 */
export function usePdfViewer(options = {}) {
  const { store } = options
  const config = useRuntimeConfig()
  const toast = useToast()
  
  // ========================
  // STATE
  // ========================
  const pdfViewerDialog = ref(false)
  const currentPdfUrl = ref(null)
  const currentPdfName = ref('')
  const pdfLoading = ref(false)
  const pdfFullscreen = ref(false)
  
  // ========================
  // METHODS
  // ========================
  
  /**
   * PDF dökümanı görüntüle
   */
  const viewDocument = async (filePath, fileName = 'Döküman') => {
    try {
      // Loading başlat
      pdfLoading.value = true
      
      // PDF görüntüleme - Güvenli token ile Split View'da göster
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
  
  /**
   * PDF viewer'ı kapat
   */
  const closePdfViewer = () => {
    pdfViewerDialog.value = false
    currentPdfUrl.value = null
    currentPdfName.value = ''
    pdfFullscreen.value = false
  }
  
  /**
   * Tam ekran toggle
   */
  const togglePdfFullscreen = () => {
    pdfFullscreen.value = !pdfFullscreen.value
  }
  
  /**
   * ESC tuşu ile PDF viewer'ı kapat
   */
  const handlePdfEscape = (e) => {
    if (e.key === 'Escape' && pdfViewerDialog.value) {
      e.preventDefault()
      closePdfViewer()
    }
  }
  
  /**
   * PDF viewer'ı temizle (bölüm değişikliğinde)
   */
  const cleanupPdfViewer = () => {
    pdfViewerDialog.value = false
    pdfFullscreen.value = false
    currentPdfUrl.value = null
    currentPdfName.value = ''
  }
  
  // ========================
  // LIFECYCLE
  // ========================
  
  // ESC tuşu için listener ekle
  onMounted(() => {
    window.addEventListener('keydown', handlePdfEscape)
  })
  
  // ESC tuşu listener kaldır
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handlePdfEscape)
  })
  
  // ========================
  // RETURN PUBLIC API
  // ========================
  return {
    // State
    pdfViewerDialog,
    currentPdfUrl,
    currentPdfName,
    pdfLoading,
    pdfFullscreen,
    
    // Methods
    viewDocument,
    closePdfViewer,
    togglePdfFullscreen,
    cleanupPdfViewer
  }
}
