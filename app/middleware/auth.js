import { useParticipantAssessmentStore } from '~/stores/assessment'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Client-side only kontrol
  if (!process.client) return
  
  const store = useParticipantAssessmentStore()

  // Pinia persist'in yüklenmesini bekle (client-side hydration)
  // Hard refresh durumunda daha uzun bekle
  await new Promise(resolve => setTimeout(resolve, 300))

  // Debug: localStorage'ı kontrol et
  if (process.client) {
    const storageData = localStorage.getItem('participant-assessment-session')
    console.log('Assessment Auth - localStorage data:', storageData ? 'EXISTS' : 'NULL')
    console.log('Assessment Auth - store.sessionToken:', store.sessionToken ? 'EXISTS' : 'NULL')
    
    // Eğer localStorage'da veri varsa ama store'da yoksa, bir kez daha bekle
    if (storageData && !store.sessionToken) {
      console.log('⏳ localStorage var ama store boş, ekstra bekleme...')
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Assessment Auth - 2. kontrol - store.sessionToken:', store.sessionToken ? 'EXISTS' : 'NULL')
    }
  }

  // Session token kontrolü
  if (!store.sessionToken) {
    console.log('Assessment Auth: Session token yok, hata sayfasına yönlendiriliyor')
    return navigateTo('/error?message=Oturum bulunamadı')
  }

  // Session geçerliliği kontrolü
  if (!store.isSessionValid) {
    console.log('Assessment Auth: Session geçersiz, temizleniyor')
    store.clearSession()
    return navigateTo('/error?message=Oturumunuz sona erdi')
  }

  // Session doğrulama (her sayfa yüklendiğinde)
  const result = await store.validateSession()
  
  if (!result.success) {
    console.log('Assessment Auth: Session doğrulanamadı')
    store.clearSession()
    return navigateTo('/error?message=Oturum doğrulanamadı')
  }
})
