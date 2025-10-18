// API servis sınıfı - Participant App için
import { useParticipantAssessmentStore } from '~/stores/assessment'

// API Endpoint'inin kök URL'si (Fallback) - /api prefix'siz
const API_BASE_URL = process.env.API_BASE_URL || 'https://api1.vakamaka.com'

/**
 * API isteklerini yönetecek sınıf
 */
class ApiService {
  /**
   * API servisini başlatır
   * @param {string} [participantToken] - Katılımcı token'ı (opsiyonel)
   */
  constructor(participantToken = null) {
    this.participantToken = participantToken
    this._baseUrl = null // Lazy initialization için
  }

  /**
   * Base URL'i lazy olarak al (SSR sorunlarını önler)
   * API istekleri için otomatik olarak /api prefix'i ekler
   */
  get baseUrl() {
    if (!this._baseUrl) {
      let base
      // Client-side'da runtime config kullan
      if (process.client) {
        try {
          const config = useRuntimeConfig()
          base = config.public.apiBaseUrl // Artık /api prefix'siz
        } catch (error) {
          console.warn('Runtime config alınamadı, fallback kullanılıyor:', error)
          base = API_BASE_URL
        }
      } else {
        // Server-side'da environment variable kullan
        base = API_BASE_URL
      }
      
      // API istekleri için /api prefix'i ekle
      this._baseUrl = `${base}/api`
    }
    return this._baseUrl
  }

  /**
   * Base domain'i döndürür (/api prefix'siz)
   * Statik dosyalar için kullanılır
   */
  get baseDomain() {
    if (process.client) {
      try {
        const config = useRuntimeConfig()
        return config.public.apiBaseUrl
      } catch (error) {
        return API_BASE_URL
      }
    }
    return API_BASE_URL
  }

  /**
   * Assessment store'u lazy olarak al
   * @returns {Object|null} Assessment store
   */
  getAssessmentStore() {
    // Client-side'da store'a erişim
    if (process.client) {
      try {
        return useParticipantAssessmentStore()
      } catch (error) {
        console.warn('Assessment store alınamadı:', error)
        return null
      }
    }
    return null
  }

  /**
   * HTTP başlıklarını oluşturur
   * @returns {Object} HTTP başlıkları
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // Öncelikle constructor'dan gelen participant token'ı kullan
    if (this.participantToken) {
      headers['Authorization'] = `Bearer ${this.participantToken}`
    }
    // Yoksa assessment store'dan session token'ı al
    else {
      const assessmentStore = this.getAssessmentStore()
      if (assessmentStore && assessmentStore.sessionToken) {
        headers['Authorization'] = `Bearer ${assessmentStore.sessionToken}`
      }
    }

    return headers
  }

  /**
   * GET isteği yapar
   * @param {string} endpoint - API endpoint'i
   * @param {Object} params - Query parametreleri
   * @returns {Promise} API yanıtı
   */
  async get(endpoint, params = {}) {
    try {
      // Query parametrelerini URL'ye ekle
      const url = new URL(`${this.baseUrl}${endpoint}`)
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      })

      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * POST isteği yapar
   * @param {string} endpoint - API endpoint'i
   * @param {Object|FormData} data - POST verileri
   * @returns {Promise} API yanıtı
   */
  async post(endpoint, data = {}) {
    try {
      const headers = this.getHeaders()
      let body = data
      
      // FormData ise JSON.stringify yapma ve Content-Type header'ını kaldır
      if (data instanceof FormData) {
        // Content-Type'ı kaldır, browser otomatik ekler
        delete headers['Content-Type']
      } else {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify(data)
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: body
      })

      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * PUT isteği yapar
   * @param {string} endpoint - API endpoint'i
   * @param {Object|FormData} data - PUT verileri
   * @returns {Promise} API yanıtı
   */
  async put(endpoint, data = {}) {
    try {
      const headers = this.getHeaders()
      let body = data
      
      // FormData ise JSON.stringify yapma ve Content-Type header'ını kaldır
      if (!(data instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify(data)
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: headers,
        body: body
      })

      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * DELETE isteği yapar
   * @param {string} endpoint - API endpoint'i
   * @returns {Promise} API yanıtı
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * API yanıtını işler
   * @param {Response} response - Fetch API yanıtı
   * @returns {Promise} İşlenmiş API yanıtı
   */
  async handleResponse(response) {
    const data = await response.json()

    // Token geçersiz ise session'ı temizle
    if (response.status === 401) {
      // Eğer participant token kullanılıyorsa session'ı temizleme
      if (!this.participantToken) {
        const assessmentStore = this.getAssessmentStore()
        if (assessmentStore) {
          assessmentStore.clearSession()
        }
      }
      const error = new Error('Oturum süresi doldu veya geçersiz token')
      error.status = 401
      error.data = data
      throw error
    }

    if (!response.ok) {
      // Backend'den gelen hata mesajını al
      // Farklı hata formatlarını destekle
      let errorMessage = 'API isteği başarısız oldu'
      
      if (data.messages && data.messages.error) {
        // CodeIgniter 4 format: { messages: { error: "..." } }
        errorMessage = data.messages.error
      } else if (data.message) {
        // Standart format: { message: "..." }
        errorMessage = data.message
      } else if (typeof data.error === 'string') {
        // Alternatif format: { error: "..." }
        errorMessage = data.error
      }
      
      // Error objesine daha fazla bilgi ekle
      const error = new Error(errorMessage)
      error.status = response.status
      error.statusCode = response.status
      error.data = data
      error.response = { status: response.status, data }
      throw error
    }

    return data
  }

  /**
   * API hatalarını işler
   * @param {Error} error - Hata nesnesi
   * @returns {Promise} Hata nesnesi
   */
  handleError(error) {
    console.error('API Error:', error)
    throw error
  }

  /**
   * Generate secure token for document access
   * @param {number} userId - User ID
   * @param {number} projectId - Project ID
   * @param {string} filePath - File path
   * @returns {Promise} Token data
   */
  async generateDocumentToken(userId, projectId, filePath) {
    return this.post('/documents/generate-token', {
      user_id: userId,
      project_id: projectId,
      file_path: filePath
    })
  }
}

export default ApiService
