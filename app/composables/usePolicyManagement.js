import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

/**
 * KVKK ve Yasal Politika yönetimi composable
 * 
 * @param {Object} options
 * @param {Object} options.store - Assessment store instance
 * @returns {Object} Policy management state ve methodları
 */
export function usePolicyManagement(options = {}) {
  const { store } = options
  const toast = useToast()
  
  // ========================
  // STATE
  // ========================
  const showPolicyDialog = ref(false)
  const policiesAcknowledged = ref({}) // { policy_type: boolean }
  
  // ========================
  // COMPUTED
  // ========================
  
  /**
   * Tüm politikalar onaylandı mı?
   */
  const allPoliciesApproved = computed(() => {
    if (!store.legalPolicies || store.legalPolicies.length === 0) return true
    return store.legalPolicies.every(p => policiesAcknowledged.value[p.policy_type])
  })
  
  // ========================
  // METHODS
  // ========================
  
  /**
   * Politikaları onayla ve dialog'u kapat
   */
  const approvePolicies = async () => {
    console.log('✅ Policies approved by user')
    
    // Backend'e kaydet
    const policiesToSave = store.legalPolicies.map(p => ({
      policy_type: p.policy_type,
      version: p.version || '1'
    }))
    
    const result = await store.acceptPolicies(policiesToSave)
    
    if (result.success) {
      showPolicyDialog.value = false
      
      toast.add({ 
        severity: 'success', 
        summary: 'Başarılı', 
        detail: 'Yasal politikalar onaylandı. Şimdi değerlendirmeye başlayabilirsiniz.',
        life: 3000
      })
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Hata', 
        detail: 'Politika onayı kaydedilemedi. Lütfen tekrar deneyin.',
        life: 3000
      })
    }
  }
  
  /**
   * Politikaları yükle ve gerekirse dialog göster
   */
  const loadPolicies = async () => {
    console.log('📜 Loading legal policies...')
    
    // Eğer daha önce onaylanmışsa, tekrar gösterme
    if (store.policiesAcceptedAt) {
      console.log('✅ Policies already accepted at:', store.policiesAcceptedAt)
      return
    }
    
    await store.fetchLegalPolicies()
    console.log('📜 Policies received:', store.legalPolicies.length)
    
    if (store.legalPolicies.length > 0) {
      console.log('📜 Opening policy dialog')
      showPolicyDialog.value = true
    } else {
      console.log('⚠️ No policies to show')
    }
  }
  
  /**
   * Politika kontrolü yap
   */
  const checkPolicies = () => {
    if (!allPoliciesApproved.value) {
      toast.add({ 
        severity: 'warn', 
        summary: 'Uyarı', 
        detail: 'Lütfen önce yasal politikaları onaylayın.',
        life: 3000
      })
      showPolicyDialog.value = true
      return false
    }
    return true
  }
  
  // ========================
  // RETURN PUBLIC API
  // ========================
  return {
    // State
    showPolicyDialog,
    policiesAcknowledged,
    
    // Computed
    allPoliciesApproved,
    
    // Methods
    approvePolicies,
    loadPolicies,
    checkPolicies
  }
}
