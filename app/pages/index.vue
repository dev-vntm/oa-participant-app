<template>
  <ClientOnly>
  <Toast />
  <ConfirmDialog />
  <div class="assessment-workspace" lang="tr">
    <!-- Countdown Overlay -->
    <div v-if="showCountdown" class="countdown-overlay">
      <div class="countdown-content">
        <div class="countdown-number">{{ countdownValue }}</div>
        <div class="countdown-text">Başlıyor...</div>
      </div>
    </div>

    <!-- Policy Dialog -->
    <Dialog 
      v-model:visible="showPolicyDialog" 
      modal 
      :closable="false"
      :draggable="false"
      :closeOnEscape="false"
      :style="{ width: '60rem', maxWidth: '90vw' }"
      class="policy-dialog"
      header="Yasal Bilgilendirme ve Onaylar"
    >
      <div class="policy-content space-y-6">
        <p class="text-gray-600 mb-4">
          Değerlendirme sürecine başlamadan önce aşağıdaki politikaları okuyup onaylamanız gerekmektedir.
        </p>
        
        <div v-for="policy in store.legalPolicies" :key="policy.id" class="policy-item border rounded-lg p-4 bg-gray-50">
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <h3 class="font-bold text-gray-800 mb-2">{{ policy.title }}</h3>
              <div class="policy-text text-sm text-gray-600 max-h-32 overflow-y-auto mb-3 p-2 bg-white rounded border" v-html="policy.content"></div>
              
              <div class="flex items-center gap-2">
                <Checkbox 
                  v-model="policiesAcknowledged[policy.policy_type]" 
                  :binary="true" 
                  :inputId="'policy-' + policy.id" 
                />
                <label :for="'policy-' + policy.id" class="text-sm font-medium cursor-pointer select-none">
                  {{ policy.button_text || 'Okudum, anladım, onaylıyorum.' }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end">
          <Button 
            label="Onayla ve Devam Et" 
            icon="pi pi-check" 
            @click="approvePolicies" 
            :disabled="!allPoliciesApproved"
            severity="success"
            size="large"
          />
        </div>
      </template>
    </Dialog>

    <!-- Section Self-Evaluation Dialog -->
    <Dialog 
      v-model:visible="showSelfEvaluationDialog" 
      modal 
      :closable="false"
      :draggable="false"
      :style="{ width: '50rem', maxWidth: '90vw' }"
      class="self-evaluation-dialog"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-star text-purple-600" style="font-size: 2rem;"></i>
          <h2 class="text-2xl font-bold text-gray-800 m-0">Bölüm Öz-Değerlendirmeniz</h2>
        </div>
      </template>

      <div class="self-evaluation-content">
        <p class="text-gray-700 mb-4">
          Tamamladığınız bölüm hakkında kendinizi değerlendirin. Bu değerlendirme raporunuza dahil edilecektir.
        </p>

        <div class="questions-list space-y-6">
          <div 
            v-for="(question, index) in selfEvaluationQuestions" 
            :key="question.id"
            class="question-item"
          >
            <div class="question-header">
              <h4 class="font-semibold text-gray-900">
                {{ index + 1 }}. {{ question.question_text }}
                <span v-if="question.is_required" class="text-red-500 ml-1">*</span>
              </h4>
            </div>

            <!-- Likert 5 Scale -->
            <div v-if="question.question_type === 'likert_5'" class="likert-scale mt-3">
              <div class="flex justify-between items-center gap-2">
                <button
                  v-for="value in 5"
                  :key="value"
                  @click="selfEvaluationAnswers[question.id] = value"
                  :class="[
                    'likert-button',
                    selfEvaluationAnswers[question.id] === value ? 'active' : ''
                  ]"
                >
                  {{ value }}
                </button>
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span>Hiç Katılmıyorum</span>
                <span>Tamamen Katılıyorum</span>
              </div>
            </div>

            <!-- Likert 7 Scale -->
            <div v-else-if="question.question_type === 'likert_7'" class="likert-scale mt-3">
              <div class="flex justify-between items-center gap-2">
                <button
                  v-for="value in 7"
                  :key="value"
                  @click="selfEvaluationAnswers[question.id] = value"
                  :class="[
                    'likert-button',
                    selfEvaluationAnswers[question.id] === value ? 'active' : ''
                  ]"
                >
                  {{ value }}
                </button>
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span>Hiç Katılmıyorum</span>
                <span>Tamamen Katılıyorum</span>
              </div>
            </div>

            <!-- Yes/No -->
            <div v-else-if="question.question_type === 'yes_no'" class="yes-no-buttons mt-3">
              <Button
                label="Evet"
                :outlined="selfEvaluationAnswers[question.id] !== 'yes'"
                :severity="selfEvaluationAnswers[question.id] === 'yes' ? 'success' : 'secondary'"
                @click="selfEvaluationAnswers[question.id] = 'yes'"
                class="mr-2"
              />
              <Button
                label="Hayır"
                :outlined="selfEvaluationAnswers[question.id] !== 'no'"
                :severity="selfEvaluationAnswers[question.id] === 'no' ? 'danger' : 'secondary'"
                @click="selfEvaluationAnswers[question.id] = 'no'"
              />
            </div>

            <!-- Open Text -->
            <div v-else-if="question.question_type === 'open_text'" class="open-text mt-3">
              <Textarea
                v-model="selfEvaluationAnswers[question.id]"
                rows="4"
                placeholder="Cevabınızı buraya yazın..."
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            label="Kaydet ve Devam Et" 
            icon="pi pi-check"
            @click="saveSelfEvaluationAnswers"
            severity="success"
            size="large"
          />
        </div>
      </template>
    </Dialog>

    <!-- Character Card Detail Popup -->
    <Dialog 
      v-model:visible="showCharacterPopup" 
      modal 
      :closable="true"
      :draggable="false"
      :style="{ width: '42rem', maxWidth: '95vw', maxHeight: '90vh' }"
      class="character-detail-dialog"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-id-card text-indigo-600" style="font-size: 1.5rem;"></i>
          <h2 class="text-xl font-bold text-gray-800 m-0">Kişi Kartı</h2>
        </div>
      </template>

      <div v-if="selectedCharacter" class="character-detail-content">
        <!-- Kişi Fotoğrafı ve Temel Bilgiler -->
        <div class="character-header-section">
          <div class="character-avatar-large">
            <img 
              v-if="selectedCharacter.photo || selectedCharacter.photo_path" 
              :src="selectedCharacter.photo || selectedCharacter.photo_path" 
              :alt="selectedCharacter.name"
              class="avatar-image"
            />
            <i v-else class="pi pi-user avatar-placeholder"></i>
          </div>
          <div class="character-main-info">
            <h3 class="character-name">{{ selectedCharacter.name }}</h3>
            <p class="character-title" v-if="selectedCharacter.title">{{ selectedCharacter.title }}</p>
            <p class="character-department" v-if="selectedCharacter.department">
              <i class="pi pi-building"></i> {{ selectedCharacter.department }}
            </p>
            <p class="character-role" v-if="selectedCharacter.role">
              <i class="pi pi-briefcase"></i> {{ selectedCharacter.role }}
            </p>
          </div>
        </div>

        <!-- Eğitim Bilgileri -->
        <div v-if="selectedCharacter.education_html" class="character-info-block">
          <div class="info-block-header">
            <i class="pi pi-graduation-cap"></i>
            <span>Eğitim Bilgileri</span>
          </div>
          <div class="info-block-content" v-html="selectedCharacter.education_html"></div>
        </div>

        <!-- Kariyer Özeti -->
        <div v-if="selectedCharacter.career_summary" class="character-info-block">
          <div class="info-block-header">
            <i class="pi pi-chart-line"></i>
            <span>Kariyer Özeti</span>
          </div>
          <div class="info-block-content" v-html="selectedCharacter.career_summary"></div>
        </div>

        <!-- Kişilik Özellikleri -->
        <div v-if="selectedCharacter.personality_traits_html" class="character-info-block">
          <div class="info-block-header">
            <i class="pi pi-heart"></i>
            <span>Kişilik Özellikleri</span>
          </div>
          <div class="info-block-content" v-html="selectedCharacter.personality_traits_html"></div>
        </div>

        <!-- Güçlü Yönler -->
        <div v-if="selectedCharacter.strengths_html" class="character-info-block">
          <div class="info-block-header">
            <i class="pi pi-star"></i>
            <span>Güçlü Yönler</span>
          </div>
          <div class="info-block-content" v-html="selectedCharacter.strengths_html"></div>
        </div>

        <!-- Gelişim Alanları -->
        <div v-if="selectedCharacter.development_areas_html" class="character-info-block">
          <div class="info-block-header">
            <i class="pi pi-sync"></i>
            <span>Gelişim Alanları</span>
          </div>
          <div class="info-block-content" v-html="selectedCharacter.development_areas_html"></div>
        </div>
      </div>
    </Dialog>

    <!-- Section Instructions Popup (Bölüm Talimatları) -->
    <Dialog 
      v-model:visible="showInstructionsPopup" 
      modal 
      :closable="true"
      :draggable="false"
      :style="{ width: '36rem', maxWidth: '95vw' }"
      class="instructions-popup-dialog"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-info-circle text-blue-600" style="font-size: 1.5rem;"></i>
          <h2 class="text-xl font-bold text-gray-800 m-0">Bölüm Talimatları</h2>
        </div>
      </template>

      <div v-if="currentSection?.section_description" class="instructions-popup-content">
        <div class="instructions-text" v-html="currentSection.section_description"></div>
      </div>

      <template #footer>
        <Button 
          label="Anladım" 
          icon="pi pi-check"
          @click="dismissInstructionsPopup"
          severity="primary"
        />
      </template>
    </Dialog>

    <!-- Header -->
    <div class="workspace-header">
      <div class="header-content">
        <div class="project-info">
          <h1>{{ store.projectName }}</h1>
          <p class="participant-name">{{ store.participantName }}</p>
        </div>
        
        <div class="header-actions">
          <div v-if="store.projectHasFiles" class="inventory-btn-wrapper">
            <Button
              icon="pi pi-folder-open"
              label="Vaka Dosyaları"
              @click="toggleInventorySidebar"
              outlined
              size="small"
              class="inventory-toggle-btn"
            />
            <Badge 
              v-if="documentCountInCurrentSection > 0" 
              :value="documentCountInCurrentSection" 
              severity="info"
              class="inventory-badge"
            />
          </div>
          
          <div class="progress-info">
            <span class="progress-text">{{ store.overallProgress }}% Tamamlandı</span>
            <ProgressBar 
              :value="store.overallProgress" 
              :showValue="false"
              class="progress-bar-mini"
            />
          </div>
          
          <Button
            v-if="canComplete"
            label="Tamamla"
            icon="pi pi-check"
            severity="success"
            @click="completeAssessment"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="workspace-content">
      <!-- Left Sidebar: Sections (Bölüm tamamlama mesajı gösterilirken gizle) -->
      <div v-if="!showSectionCompletedMessage" class="sections-sidebar">
        <div class="sidebar-header">
          <h3>Bölümler</h3>
        </div>
        
        <div class="sections-list">
          <!-- Intro Section Item (Sadece assessment başlamadan önce göster) -->
          <div 
            v-if="!store.hasStartedUI"
            class="section-item intro-item"
            :class="{ 'active': store.currentSectionId === 'intro' }"
            @click="selectSection('intro')"
          >
            <div class="section-icon">
              <i class="pi pi-home"></i>
            </div>
            <div class="section-info">
              <h4>Giriş</h4>
              <div class="section-meta">
                <span class="exercise-count">
                  Hoş Geldiniz
                </span>
              </div>
            </div>
          </div>

          <div
            v-for="(section, index) in store.sections"
            :key="section.section_uuid"
            class="section-item"
            :class="{
              'active': store.currentSectionId === section.section_uuid,
              'completed': store.isSectionCompleted(section.section_uuid),
              'locked': isSectionLocked(index)
            }"
            @click="selectSection(section.section_uuid, index)"
          >
            <div class="section-icon">
              <i v-if="store.isSectionCompleted(section.section_uuid)" class="pi pi-check-circle"></i>
              <i v-else-if="isSectionLocked(index)" class="pi pi-lock"></i>
              <i v-else class="pi pi-circle"></i>
            </div>
            
            <div class="section-info">
              <h4>{{ section.section_title }}</h4>
              <div class="section-meta">
                <span class="exercise-count">
                  <i class="pi pi-list"></i>
                  {{ section.exercise_count || section.exercises?.length || 0 }} Egzersiz
                </span>
              </div>
              
              <ProgressBar
                :value="store.sectionProgress(section.section_uuid)"
                :showValue="false"
                class="section-progress"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Exercises Area -->
      <div class="exercises-area">
        <!-- Intro Screen (Giriş Bölümü İçeriği) -->
        <div v-if="store.currentSectionId === 'intro'" class="welcome-screen">
          <div class="welcome-content">
            <div class="welcome-icon">
              <i class="pi pi-play-circle" style="font-size: 4rem; color: #8b5cf6;"></i>
            </div>
            <h2>Hazırsan Başlayalım! 🚀</h2>
            <div class="welcome-message-container">
              <div 
                v-if="store.projectWelcomeMessage" 
                class="welcome-message-html mb-6"
                v-html="store.projectWelcomeMessage"
              ></div>
              <p v-else class="welcome-message">
                {{ store.projectName }} değerlendirmesine hoş geldiniz.<br>
                Başlamak için aşağıdaki butona tıklayın.
              </p>
            </div>
            
            <div class="welcome-stats">
              <div class="stat-item">
                <i class="pi pi-list"></i>
                <span>{{ store.sections.length }} Bölüm</span>
              </div>
              <div class="stat-item">
                <i class="pi pi-file"></i>
                <span>{{ store.totalExercises }} Egzersiz</span>
              </div>
              <div class="stat-item">
                <i class="pi pi-clock"></i>
                <span>~{{ totalDuration }} Dakika</span>
              </div>
            </div>
            <div class="intro-actions mt-6 mb-6 flex flex-col items-center gap-4">
              <div class="flex items-center gap-2 bg-white p-3 rounded border border-gray-200 shadow-sm">
                <Checkbox v-model="introAcknowledged" :binary="true" inputId="intro-ack" />
                <label for="intro-ack" class="cursor-pointer select-none text-gray-700 font-medium">
                  Değerlendirme yönergelerini okudum ve anladım.
                </label>
              </div>
              
              <div class="h-16 flex items-center justify-center min-w-[200px]">
                <Button
                  v-if="introAcknowledged"
                  label="Başla"
                  icon="pi pi-arrow-right"
                  size="large"
                  @click="startWorkspace"
                  class="start-button animate-fade-in"
                  :disabled="!store.sections.length"
                />
                <span v-else class="text-sm text-gray-500 italic bg-gray-50 px-3 py-1 rounded">
                  Devam etmek için lütfen yönergeleri onaylayın.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="!store.currentSectionId" class="empty-state">
          <i class="pi pi-arrow-left"></i>
          <p>Sol taraftan bir bölüm seçiniz</p>
        </div>

        <!-- Bölüm Tamamlama Mesajı (Section Completed Message) -->
        <div v-else-if="showSectionCompletedMessage" class="section-completed-overlay">
          <div class="completion-card">
            <div class="completion-icon">
              <!-- Özel emoji varsa emoji göster, yoksa default ikon -->
              <span v-if="completionMessage.emoji" class="completion-emoji-icon">{{ completionMessage.emoji }}</span>
              <i v-else class="pi pi-check-circle"></i>
            </div>
            <h2>{{ completionMessage.title }}</h2>
            <p class="completion-text">{{ completionMessage.description }}</p>
            <Button
              :label="nextSectionExists ? 'Sonraki Bölüme Geç' : 'Tamamla'"
              icon="pi pi-arrow-right"
              size="large"
              class="next-section-button"
              @click="proceedToNextSection"
            />
          </div>
        </div>

        <!-- Section Start Screen - Bölüm başlangıç ekranı -->
        <div v-else-if="!isSectionStarted" class="section-start-screen">
          <div class="start-screen-content">
            <div class="start-screen-header">
              <div class="start-screen-icon">
                <i class="pi pi-bookmark-fill"></i>
              </div>
              <h1 class="start-screen-title">{{ currentSection?.section_title }}</h1>
              <div class="section-meta">
                <span class="meta-item">
                  <i class="pi pi-list"></i>
                  {{ currentSectionExercises.length }} Egzersiz
                </span>
                <span class="meta-item" v-if="currentSection?.duration">
                  <i class="pi pi-clock"></i>
                  {{ currentSection.duration }} Dakika
                </span>
              </div>
            </div>
            
            <div class="start-screen-description" v-if="currentSection?.section_description">
              <h3><i class="pi pi-info-circle"></i> Bölüm Açıklaması</h3>
              <div class="description-content" v-html="currentSection.section_description"></div>
            </div>
            
            <div class="start-screen-exercises">
              <h3><i class="pi pi-list-check"></i> Bu Bölümdeki Egzersizler</h3>
              <ul class="exercise-list">
                <li v-for="(exercise, idx) in currentSectionExercises" :key="exercise.exercise_uuid" class="exercise-list-item">
                  <span class="exercise-number">{{ idx + 1 }}</span>
                  <span class="exercise-name">{{ exercise.exercise_title }}</span>
                  <span class="exercise-type-tag" :class="exercise.exercise_type">
                    {{ formatQuestionType(exercise.exercise_type) }}
                  </span>
                </li>
              </ul>
            </div>
            
            <div class="start-screen-action">
              <Button
                label="Bölüme Başla"
                icon="pi pi-play"
                iconPos="right"
                severity="success"
                size="large"
                raised
                @click="startSection"
                class="start-section-btn"
              />
              <p class="start-hint">
                <i class="pi pi-info-circle"></i>
                Bölüme başladığınızda süre sayacı otomatik olarak başlayacaktır.
              </p>
            </div>
          </div>
        </div>

        <div v-else class="exercises-container">
          <!-- Modern Section Header with Action Button -->
          <div class="modern-section-header">
            <div class="header-content">
              <div class="header-title-area">
                <div class="title-with-badge">
                  <h1 class="section-title">{{ currentSection?.section_title }}</h1>
                </div>
                <!-- Egzersiz başlığı ve türü - tüm egzersiz türleri için gösterilir -->
                <div class="exercise-info-line" v-if="currentExercise">
                  <span class="exercise-title-inline">{{ currentExercise.exercise_title }}</span>
                  <span class="exercise-type-badge-inline" :class="currentExercise.exercise_type">
                    {{ formatQuestionType(currentExercise.exercise_type) }}
                  </span>
                </div>
              </div>
              <div class="header-actions-row">
                <div class="progress-stats">
                  <span class="stat-badge">
                    <i class="pi pi-list"></i>
                    {{ completedExercisesCount }}/{{ currentSectionExercises.length }} Egzersiz
                  </span>
                  <span class="stat-badge">
                    <i class="pi pi-clock"></i>
                    {{ formattedTime }} Kalan Süre
                  </span>
                  <!-- Talimatlar Butonu -->
                  <button 
                    v-if="hasInstructions" 
                    class="instructions-hint-btn"
                    @click="openInstructionsPopup"
                    title="Egzersiz talimatlarını görüntüle"
                  >
                    <i class="pi pi-info-circle"></i>
                    <span>Talimatlar</span>
                  </button>
                </div>
                <!-- Normal egzersizler için Bölümü Tamamla (Ekip Kurma hariç) -->
                <Button
                  v-if="canCompleteSection && currentExercise?.exercise_type !== 'presentation' && currentExercise?.exercise_type !== 'team_building'"
                  label="Bölümü Tamamla"
                  icon="pi pi-arrow-right"
                  severity="success"
                  raised
                  @click="completeSectionAndNext"
                  class="complete-section-btn"
                />
                <!-- Ekip Kurma egzersizi için Kaydet butonu -->
                <Button
                  v-if="currentExercise?.exercise_type === 'team_building' && !isExerciseAnswered(currentExercise.exercise_uuid)"
                  :label="isLastExerciseInSection ? 'Ekibi Kaydet ve Tamamla' : 'Ekibi Kaydet'"
                  :icon="isLastExerciseInSection ? 'pi pi-check-circle' : 'pi pi-save'"
                  :loading="savingExercise === currentExercise.exercise_uuid"
                  :disabled="!exerciseAnswers[currentExercise.exercise_uuid] || !exerciseAnswers[currentExercise.exercise_uuid].includes('=== OLUŞTURULAN EKİP ===') || !exerciseAnswers[currentExercise.exercise_uuid].includes('=== AÇIKLAMA ===')"
                  @click="confirmAndSave(currentExercise)"
                  severity="success"
                  raised
                  class="complete-section-btn"
                />
                <!-- Çoktan Seçmeli (case_study) egzersizi için Kaydet butonu -->
                <Button
                  v-if="currentExercise?.exercise_type === 'case_study' && !isExerciseAnswered(currentExercise.exercise_uuid)"
                  :label="isLastExerciseInSection ? 'Cevabı Kaydet ve Tamamla' : 'Cevabı Kaydet'"
                  :icon="isLastExerciseInSection ? 'pi pi-check-circle' : 'pi pi-save'"
                  :loading="savingExercise === currentExercise.exercise_uuid"
                  :disabled="exerciseAnswers[currentExercise.exercise_uuid] === undefined || exerciseAnswers[currentExercise.exercise_uuid] === null || (Array.isArray(exerciseAnswers[currentExercise.exercise_uuid]) && exerciseAnswers[currentExercise.exercise_uuid].length === 0)"
                  @click="saveCaseStudyAnswer(currentExercise)"
                  severity="success"
                  raised
                  class="complete-section-btn"
                />
                <!-- Sunum egzersizi için Bölümü Tamamla (son slide'da görünür) -->
                <Transition name="slide-fade">
                  <Button
                    v-if="currentExercise?.exercise_type === 'presentation' && currentSlide >= totalSlides"
                    :label="isLastExerciseInSection ? 'Bölümü Tamamla' : 'Devam Et'"
                    :icon="isLastExerciseInSection ? 'pi pi-check-circle' : 'pi pi-arrow-right'"
                    iconPos="right"
                    severity="success"
                    raised
                    @click="markPresentationAsViewed(currentExercise)"
                    class="complete-section-btn presentation-complete-btn"
                  />
                </Transition>
                <!-- Analiz egzersizi için Cevabı Kaydet (cevap girildiğinde görünür) -->
                <Transition name="slide-fade">
                  <Button
                    v-if="currentExercise?.exercise_type === 'analysis' && !isExerciseAnswered(currentExercise.exercise_uuid) && hasAnalysisContent"
                    :label="isLastExerciseInSection ? 'Kaydet ve Bölümü Tamamla' : 'Cevabı Kaydet'"
                    :icon="isLastExerciseInSection ? 'pi pi-check-circle' : 'pi pi-save'"
                    iconPos="right"
                    severity="success"
                    raised
                    :loading="savingExercise === currentExercise.exercise_uuid"
                    @click="confirmAndSave(currentExercise)"
                    class="complete-section-btn analysis-save-btn"
                  />
                </Transition>
              </div>
              
            </div>
            <div class="progress-indicator">
              <ProgressBar 
                :value="sectionProgressPercentage" 
                :showValue="false"
                class="section-progress-bar"
              />
            </div>
          </div>

          <!-- Email Inbox View (for Email Correspondence Section) -->
          <EmailInboxView 
            v-if="currentSection?.section_type === 'email_correspondence'"
            :exercises="currentSectionExercises"
            :exercise-answers="exerciseAnswers"
            :saving-exercise="savingExercise"
            :is-exercise-answered="isExerciseAnswered"
            :characters="currentSection?.characters"
            @save-answer="confirmAndSave"
            @save-and-next="confirmAndSaveAndNext"
            @show-character="showCharacterDetail"
          />

          <!-- Modern Single Exercise View (for other section types) -->
          <div v-else class="modern-exercise-container" v-if="currentExercise">
            <div class="exercise-navigation" v-if="currentSectionExercises.length > 1 && currentExercise.exercise_type !== 'case_study'">
              <!-- Önceki Egzersiz -->
              <div v-if="currentExerciseIndex > 0" class="nav-button-wrapper">
                <Button
                  icon="pi pi-chevron-left"
                  @click="goToPreviousExercise"
                  text
                  size="small"
                  severity="secondary"
                  class="nav-button-with-label"
                />
                <span class="nav-label">Önceki Egzersiz</span>
              </div>
              <div v-else class="nav-button-placeholder"></div>
              
              <div class="exercise-nav-center">
                <span class="exercise-counter">
                  Egzersiz {{ currentExerciseIndex + 1 }} / {{ currentSectionExercises.length }}
                </span>
                <div class="exercise-dots">
                  <span 
                    v-for="(ex, idx) in currentSectionExercises" 
                    :key="ex.exercise_uuid"
                    class="dot"
                    :class="{ 
                      'active': idx === currentExerciseIndex,
                      'completed': hasExerciseResponse(ex.exercise_uuid)
                    }"
                    @click="goToExercise(idx)"
                  ></span>
                </div>
              </div>
              
              <!-- Sonraki Egzersiz -->
              <div v-if="currentExerciseIndex < currentSectionExercises.length - 1" class="nav-button-wrapper">
                <span class="nav-label">Sonraki Egzersiz</span>
                <Button
                  icon="pi pi-chevron-right"
                  @click="goToNextExercise"
                  text
                  size="small"
                  severity="secondary"
                  class="nav-button-with-label"
                />
              </div>
              <div v-else class="nav-button-placeholder"></div>
            </div>

            <div class="modern-exercise-card" :class="{ 
              'info-type-card': currentExercise.exercise_type === 'info' || currentExercise.exercise_type === 'Bilgilendirme',
              'presentation-type-card': currentExercise.exercise_type === 'presentation',
              'case-study-type-card': currentExercise.exercise_type === 'case_study'
            }">
              
              <!-- Scrollable Content Area (Presentation, Analiz ve Ekip Kurma türünde gizlenir) -->
              <div class="exercise-content-area" v-if="currentExercise.exercise_type !== 'presentation' && currentExercise.exercise_type !== 'analysis' && currentExercise.exercise_type !== 'team_building'">
                <!-- Exercise Header (Analiz ve Ekip Kurma türünde gizlenir - başlık section header'da) -->
                <div class="exercise-card-header" v-if="currentExercise.exercise_type !== 'analysis' && currentExercise.exercise_type !== 'team_building'">
                  <h2 class="exercise-title">{{ currentExercise.exercise_title }}</h2>
                  <div class="exercise-badge-container">
                    <span class="exercise-type-badge" :class="currentExercise.exercise_type || 'info'">
                      {{ formatQuestionType(currentExercise.exercise_type || 'Bilgilendirme') }}
                    </span>
                    <Tag
                      v-if="hasExerciseResponse(currentExercise.exercise_uuid)"
                      value="Tamamlandı"
                      severity="success"
                      icon="pi pi-check"
                      class="completed-tag"
                    />
                  </div>
                  
                </div>

                <!-- Exercise Instructions (Talimatlar) - Email View or Default View (Analiz ve Ekip Kurma türünde gizlenir) -->
                <template v-if="currentExercise.instructions && currentExercise.exercise_type !== 'analysis' && currentExercise.exercise_type !== 'team_building'">
                  <!-- Email View for Email Correspondence Section -->
                  <EmailView 
                    v-if="currentSection?.section_type === 'email_correspondence'"
                    :instructions="currentExercise.instructions"
                    :related-characters="currentExercise.related_characters"
                    :characters="currentSection?.characters"
                    @show-character="showCharacterDetail"
                  />
                  
                  <!-- Default View for Standard Sections -->
                  <DefaultView 
                    v-else
                    :instructions="currentExercise.instructions"
                  />
                </template>

                <!-- Exercise Description (Analiz türünde gizlenir) -->
                <div class="exercise-description-modern" v-if="currentExercise.description && currentExercise.exercise_type !== 'analysis'">
                  <p>{{ currentExercise.description }}</p>
                </div>
              </div>

              <!-- Ekip Kurma Egzersizi -->
              <div v-if="currentExercise.exercise_type === 'team_building'" class="team-building-section">
                <TeamBuildingView
                  v-model="exerciseAnswers[currentExercise.exercise_uuid]"
                  :instructions="currentExercise.instructions"
                  :related-characters="currentExercise.related_characters"
                  :characters="currentSection?.characters"
                  :disabled="isExerciseAnswered(currentExercise.exercise_uuid)"
                  @show-character="showCharacterDetail"
                />
                
                <!-- Cevap kaydedildiyse bilgi mesajı göster -->
                <div v-if="isExerciseAnswered(currentExercise.exercise_uuid)" class="answer-locked-info team-building-locked">
                  <i class="pi pi-lock"></i>
                  <span>Bu egzersiz için ekip seçiminiz kaydedildi. Artık değişiklik yapamazsınız.</span>
                </div>
              </div>

              <!-- Çoktan Seçmeli Egzersiz (Case Study) -->
              <div v-else-if="currentExercise.exercise_type === 'case_study'" class="case-study-section">
                <div class="case-study-options">
                  <div class="options-header">
                    <label class="options-label">
                      <i class="pi pi-list"></i>
                      <span>{{ isExerciseAnswered(currentExercise.exercise_uuid) ? 'Seçiminiz (Kaydedildi)' : 'Seçenekler' }}</span>
                    </label>
                    <span v-if="currentExercise.options?.allow_multiple" class="multiple-hint">
                      <i class="pi pi-info-circle"></i>
                      Birden fazla seçenek işaretleyebilirsiniz
                    </span>
                  </div>
                  
                  <!-- Tek Seçim (Radio) -->
                  <div v-if="!currentExercise.options?.allow_multiple" class="options-list single-select">
                    <div 
                      v-for="(choice, index) in currentExercise.options?.choices || []" 
                      :key="index"
                      class="option-item"
                      :class="{ 
                        'selected': exerciseAnswers[currentExercise.exercise_uuid] === index,
                        'disabled': isExerciseAnswered(currentExercise.exercise_uuid)
                      }"
                      @click="!isExerciseAnswered(currentExercise.exercise_uuid) && selectOption(currentExercise.exercise_uuid, index)"
                    >
                      <div class="option-radio">
                        <RadioButton 
                          :inputId="'option-' + currentExercise.exercise_uuid + '-' + index"
                          :name="'options-' + currentExercise.exercise_uuid"
                          :value="index"
                          v-model="exerciseAnswers[currentExercise.exercise_uuid]"
                          :disabled="isExerciseAnswered(currentExercise.exercise_uuid)"
                        />
                      </div>
                      <label :for="'option-' + currentExercise.exercise_uuid + '-' + index" class="option-text">
                        <span class="option-letter">{{ String.fromCharCode(65 + index) }}.</span>
                        {{ choice.text }}
                      </label>
                    </div>
                  </div>
                  
                  <!-- Çoklu Seçim (Checkbox) -->
                  <div v-else class="options-list multi-select">
                    <div 
                      v-for="(choice, index) in currentExercise.options?.choices || []" 
                      :key="index"
                      class="option-item"
                      :class="{ 
                        'selected': (exerciseAnswers[currentExercise.exercise_uuid] || []).includes(index),
                        'disabled': isExerciseAnswered(currentExercise.exercise_uuid)
                      }"
                      @click="!isExerciseAnswered(currentExercise.exercise_uuid) && toggleOption(currentExercise.exercise_uuid, index)"
                    >
                      <div class="option-checkbox">
                        <Checkbox 
                          :inputId="'option-' + currentExercise.exercise_uuid + '-' + index"
                          :value="index"
                          v-model="exerciseAnswers[currentExercise.exercise_uuid]"
                          :disabled="isExerciseAnswered(currentExercise.exercise_uuid)"
                        />
                      </div>
                      <label :for="'option-' + currentExercise.exercise_uuid + '-' + index" class="option-text">
                        <span class="option-letter">{{ String.fromCharCode(65 + index) }}.</span>
                        {{ choice.text }}
                      </label>
                    </div>
                  </div>
                </div>
                
                <!-- Cevap kaydedildiyse bilgi mesajı göster -->
                <div v-if="isExerciseAnswered(currentExercise.exercise_uuid)" class="answer-locked-info case-study-locked">
                  <i class="pi pi-lock"></i>
                  <span>Bu egzersiz için seçiminiz kaydedildi. Artık değişiklik yapamazsınız.</span>
                </div>
              </div>

              <!-- Answer Section (Bilgilendirme, Sunum, Ekip Kurma ve Çoktan Seçmeli değilse) -->
              <div v-else-if="currentExercise.exercise_type !== 'info' && currentExercise.exercise_type !== 'Bilgilendirme' && currentExercise.exercise_type !== 'presentation' && currentExercise.exercise_type !== 'team_building'" 
                   class="modern-answer-section"
                   :class="{ 'analysis-report-section': currentExercise.exercise_type === 'analysis' }">
                <div class="answer-header">
                  <label class="answer-label">
                    <i :class="currentExercise.exercise_type === 'analysis' ? 'pi pi-file-edit' : 'pi pi-pencil'"></i>
                    <span v-if="currentExercise.exercise_type === 'analysis' && currentExercise.instructions" v-html="currentExercise.instructions"></span>
                    <template v-else-if="currentExercise.exercise_type === 'analysis'">
                      {{ isExerciseAnswered(currentExercise.exercise_uuid) ? 'Analiz Raporunuz (Kaydedildi)' : 'Analiz Raporunuz' }}
                    </template>
                    <template v-else>
                      {{ isExerciseAnswered(currentExercise.exercise_uuid) ? 'Kaydedilen Cevabınız (Düzenlenemez)' : 'Cevabınız' }}
                    </template>
                  </label>
                  <!-- TODO: Ses kaydı özelliği ilerleyen sürümlerde aktif olacak
                  <Button
                    v-if="!isExerciseAnswered(currentExercise.exercise_uuid)"
                    label="Ses Kaydı Ekle"
                    icon="pi pi-microphone"
                    @click="showAudioRecorder = true"
                    text
                    size="small"
                    class="audio-record-btn"
                  />
                  -->
                </div>
                <TipTapEditor
                  v-model="exerciseAnswers[currentExercise.exercise_uuid]"
                  :placeholder="getEditorPlaceholder(currentExercise)"
                  :disabled="isExerciseAnswered(currentExercise.exercise_uuid)"
                  :character-limit="currentExercise.exercise_type === 'analysis' ? 10000 : 5000"
                  :class="{ 'analysis-editor': currentExercise.exercise_type === 'analysis' }"
                />
                
                <!-- Ses kaydı varsa göster -->
                <div v-if="audioRecordings[currentExercise.exercise_uuid]" class="audio-attachment">
                  <i class="pi pi-volume-up"></i>
                  <span>Ses kaydı eklendi</span>
                  <Button
                    v-if="!isExerciseAnswered(currentExercise.exercise_uuid)"
                    icon="pi pi-times"
                    @click="removeAudioRecording(currentExercise.exercise_uuid)"
                    text
                    rounded
                    size="small"
                    severity="danger"
                  />
                </div>
                
                <!-- Cevap kaydedildiyse bilgi mesajı göster -->
                <div v-if="isExerciseAnswered(currentExercise.exercise_uuid)" class="answer-locked-info">
                  <i class="pi pi-lock"></i>
                  <span>Bu egzersiz için cevabınız kaydedildi. Artık değişiklik yapamazsınız.</span>
                </div>
                
                <!-- Analiz egzersizleri için alt butonlar gösterilmez - sağ üstteki buton kullanılır -->
                <div v-else-if="currentExercise.exercise_type !== 'analysis'" class="answer-actions-modern">
                  <!-- Navigasyon: Önceki Egzersiz -->
                  <Button
                    v-if="currentExerciseIndex > 0"
                    icon="pi pi-chevron-left"
                    @click="goToPreviousExercise"
                    text
                    rounded
                    severity="secondary"
                    class="nav-exercise-btn"
                    v-tooltip.top="'Önceki Egzersiz'"
                  />
                  
                  <!-- Tek Buton: Kaydet ve Devam / Kaydet ve Tamamla -->
                  <Button
                    :label="isLastExerciseInSection ? 'Kaydet ve Bölümü Tamamla' : 'Kaydet ve Devam Et'"
                    :icon="isLastExerciseInSection ? 'pi pi-check-circle' : 'pi pi-arrow-right'"
                    :loading="savingExercise === currentExercise.exercise_uuid"
                    @click="confirmAndSave(currentExercise)"
                    iconPos="right"
                    severity="success"
                    size="large"
                    class="save-next-btn"
                  />
                  
                  <!-- Navigasyon: Sonraki Egzersiz -->
                  <Button
                    v-if="currentExerciseIndex < currentSectionExercises.length - 1 && isExerciseAnswered(currentExercise.exercise_uuid)"
                    icon="pi pi-chevron-right"
                    @click="goToNextExercise"
                    text
                    rounded
                    severity="secondary"
                    class="nav-exercise-btn"
                    v-tooltip.top="'Sonraki Egzersiz'"
                  />
                </div>
              </div>

              <!-- Bilgilendirme Egzersizi (Info Type) - Sticky Footer -->
              <div v-else-if="currentExercise.exercise_type === 'info' || currentExercise.exercise_type === 'Bilgilendirme'" class="info-exercise-footer">
                <div class="info-message">
                  <i class="pi pi-lightbulb"></i>
                  <span>Bu bir bilgilendirme egzersizidir. Hazır olduğunuzda devam edebilirsiniz.</span>
                </div>
                <Button
                  label="Anladım, Devam Et"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  @click="markInfoAsRead(currentExercise)"
                  size="large"
                  class="info-continue-btn"
                />
              </div>

              <!-- Sunum Egzersizi (Presentation Type) - Slide Show -->
              <div v-else-if="currentExercise.exercise_type === 'presentation'" class="presentation-exercise-container" :class="{ 'fullscreen-mode': isSlideFullscreen }">

                <!-- Slide Show Viewer -->
                <div class="slide-show-container" v-if="getPresentationFile(currentExercise)">
                  <!-- Slide Area with Overlay Navigation -->
                  <div class="slide-area">
                    <!-- Slide Content -->
                    <div class="slide-content" ref="slideContainer" @click="toggleSlideFullscreen">
                      <div class="slide-wrapper" :class="{ 'slide-transitioning': isSlideTransitioning }">
                        <canvas ref="pdfCanvas" class="pdf-slide-canvas"></canvas>
                      </div>
                      
                      <!-- Loading Overlay -->
                      <div v-if="pdfSlideLoading" class="slide-loading-overlay">
                        <ProgressSpinner style="width: 40px; height: 40px;" strokeWidth="3" />
                      </div>

                      <!-- Overlay Navigation Buttons -->
                      <button 
                        class="slide-nav-overlay slide-nav-prev"
                        @click.stop="prevSlide"
                        :disabled="currentSlide <= 1"
                        :class="{ 'disabled': currentSlide <= 1 }"
                      >
                        <i class="pi pi-chevron-left"></i>
                      </button>

                      <button 
                        class="slide-nav-overlay slide-nav-next"
                        @click.stop="nextSlide"
                        :disabled="currentSlide >= totalSlides"
                        :class="{ 'disabled': currentSlide >= totalSlides }"
                      >
                        <i class="pi pi-chevron-right"></i>
                      </button>

                      <!-- Fullscreen Toggle -->
                      <button 
                        class="fullscreen-toggle"
                        @click.stop="toggleSlideFullscreen"
                        v-tooltip.top="isSlideFullscreen ? 'Küçült (ESC)' : 'Tam Ekran'"
                      >
                        <i :class="isSlideFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"></i>
                      </button>

                      <!-- Slide Counter Overlay -->
                      <div class="slide-counter-overlay">
                        {{ currentSlide }} / {{ totalSlides }}
                      </div>
                    </div>
                  </div>

                  <!-- Slide Progress Bar -->
                  <div class="slide-progress-container">
                    <div class="slide-progress-bar">
                      <div 
                        class="slide-progress-fill" 
                        :style="{ width: `${(currentSlide / totalSlides) * 100}%` }"
                      ></div>
                    </div>
                  </div>

                  <!-- Slide Thumbnails (Mini Navigation) -->
                  <div class="slide-thumbnails" v-if="totalSlides > 1">
                    <button 
                      v-for="n in totalSlides" 
                      :key="n"
                      class="slide-thumb"
                      :class="{ 'active': n === currentSlide, 'viewed': n < currentSlide }"
                      @click="goToSlide(n)"
                    >
                      {{ n }}
                    </button>
                  </div>
                </div>

                <!-- PDF yoksa bilgi mesajı -->
                <div v-else class="no-presentation-file">
                  <i class="pi pi-info-circle"></i>
                  <p>Bu egzersiz için sunum dosyası bulunamadı.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar: Section Documents / PDF Viewer -->
      <div class="documents-sidebar" v-if="(showInventorySidebar || pdfViewerDialog) && store.sections.length > 0 && !showSectionCompletedMessage" :class="{ 'pdf-viewer-active': pdfViewerDialog, 'pdf-fullscreen': pdfFullscreen }">
        <!-- PDF Viewer Mode -->
        <template v-if="pdfViewerDialog">
          <div class="pdf-viewer-header">
            <div class="pdf-viewer-title">
              <i class="pi pi-file-pdf"></i>
              <h3>{{ currentPdfName }}</h3>
            </div>
            <div class="pdf-header-actions">
              <Button
                :icon="pdfFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
                :title="pdfFullscreen ? 'Normal Boyut' : 'Tam Ekran'"
                text
                rounded
                @click="togglePdfFullscreen"
              />
              <Button
                icon="pi pi-times"
                title="Kapat (ESC)"
                text
                rounded
                severity="secondary"
                @click="closePdfViewer"
              />
            </div>
          </div>
          <div class="pdf-viewer-content">
            <!-- Simple PDF iframe -->
            <iframe 
              v-if="currentPdfUrl"
              :src="`${currentPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`"
              frameborder="0"
              width="100%"
              height="100%"
              style="border: none;"
            ></iframe>
          </div>
        </template>

        <!-- Document List Mode -->
        <template v-else>
          <div class="inventory-sidebar-content">
            <div class="sidebar-header">
              <h3>Vaka Dosyaları</h3>
            </div>
          
            <div class="documents-content">
              <!-- Dosya Listesi - Minimal Görünüm -->
              <div v-if="allAccessibleFiles.length > 0" class="files-list">
                <div 
                  v-for="(file, index) in allAccessibleFiles" 
                  :key="index" 
                  class="file-item-minimal"
                  @click="viewDocument(file.file_path, file.file_name)"
                >
                  <div class="file-icon-minimal">
                    <i :class="file.type === 'inventory' ? 'pi pi-file-pdf' : (file.type === 'presentation' ? 'pi pi-desktop' : 'pi pi-file')" 
                       :style="{ color: file.type === 'inventory' ? '#ef4444' : (file.type === 'presentation' ? '#8b5cf6' : '#3b82f6') }"></i>
                  </div>
                  <div class="file-info-minimal">
                    <span class="file-name-minimal">{{ file.file_name }}</span>
                    <span class="file-section-minimal">{{ file.section_title }}</span>
                  </div>
                  <i class="pi pi-chevron-right file-arrow"></i>
                </div>
              </div>

              <!-- Empty state -->
              <div v-else class="empty-documents">
                <i class="pi pi-inbox" style="font-size: 2.5rem; color: #d1d5db;"></i>
                <p>Henüz erişilebilir dosya bulunmuyor</p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>


    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-left">
          <span class="footer-text">
            © 2025 
            <a href="https://vakamaka.com" target="_blank" rel="noopener noreferrer" class="footer-link">
              Vakamaka
            </a>
          </span>
          <span class="footer-divider">•</span>
          <span class="footer-text">Tüm hakları saklıdır</span>
        </div>
        <div class="footer-right">
          <span class="footer-version">v{{ appVersion }}</span>
        </div>
      </div>
    </footer>
    
    <!-- Audio Recorder Modal -->
    <AudioRecorder
      v-model="showAudioRecorder"
      @save="onAudioSave"
    />
  </div>
  </ClientOnly>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useParticipantAssessmentStore } from '~/stores/assessment'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useSectionTimer } from '~/composables/useSectionTimer'
import { useAnswerHandling } from '~/composables/useAnswerHandling'
import { useExerciseNavigation } from '~/composables/useExerciseNavigation'
import { usePdfViewer } from '~/composables/usePdfViewer'
import { usePolicyManagement } from '~/composables/usePolicyManagement'
import { getSectionDuration, formatQuestionType, hasResponse } from '~/utils/assessment'
import EmailView from '~/components/EmailView.vue'
import EmailInboxView from '~/components/EmailInboxView.vue'
import TeamBuildingView from '~/components/TeamBuildingView.vue'

definePageMeta({
  layout: false, // Layout yok (tam ekran)
  middleware: ['auth'] // Session kontrolü
})

const router = useRouter()
const store = useParticipantAssessmentStore()
const toast = useToast()
const confirm = useConfirm()

// App Version (runtimeConfig'den alınır)
const runtimeConfig = useRuntimeConfig()
const appVersion = computed(() => runtimeConfig.public.appVersion || '1.0.0')

// State
// const showWelcomeDialog = ref(false) - REMOVED
// const welcomeAcknowledged = ref(false) - REMOVED

// Intro & Countdown
const introAcknowledged = ref(false) // Intro yönerge onayı
const showCountdown = ref(false)
const countdownValue = ref(3)

// Kişi kartı popup
const showCharacterPopup = ref(false)
const selectedCharacter = ref(null)

// Bölüm talimatları popup
const showInstructionsPopup = ref(false)

// LocalStorage'dan görülen talimatları yükle
const loadSeenInstructions = () => {
  try {
    const saved = localStorage.getItem('seenInstructions')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  } catch {
    return new Set()
  }
}
const seenInstructions = ref(loadSeenInstructions())

const showCharacterDetail = (character) => {
  selectedCharacter.value = character
  showCharacterPopup.value = true
}

// Bölüm talimatları fonksiyonları
const dismissInstructionsPopup = () => {
  if (currentSection.value?.section_uuid) {
    seenInstructions.value.add(currentSection.value.section_uuid)
    // LocalStorage'a kaydet
    try {
      localStorage.setItem('seenInstructions', JSON.stringify([...seenInstructions.value]))
    } catch (e) {
      console.warn('seenInstructions kaydetme hatası:', e)
    }
  }
  showInstructionsPopup.value = false
}

const openInstructionsPopup = () => {
  showInstructionsPopup.value = true
}

// Bölüm talimatları olup olmadığını ve görülüp görülmediğini kontrol et
const hasUnseenInstructions = computed(() => {
  if (!currentSection.value?.section_description) return false
  if (!currentSection.value?.section_uuid) return false
  return !seenInstructions.value.has(currentSection.value.section_uuid)
})

// Bölümde talimat (açıklama) var mı?
const hasInstructions = computed(() => {
  return currentSection.value?.section_description && currentSection.value.section_description.trim() !== ''
})

const savingExercise = ref(null)
const currentSectionStartTime = ref(null)
const currentExerciseStartTime = ref(null) // Her egzersiz için ayrı başlangıç zamanı
const showSectionCompletedMessage = ref(false)
const completionMessage = ref({
  title: '',
  description: '',
  emoji: ''
})
const showSelfEvaluationDialog = ref(false)
const selfEvaluationQuestions = ref([])
const selfEvaluationAnswers = ref({})
const showInventorySidebar = ref(false) // Bölüm envanteri sidebar visibility

// Bölüm başlangıç ekranı state'i - her bölüm için ayrı takip
const startedSections = ref(new Set())

// Bölüm başlatıldı mı kontrolü
const isSectionStarted = computed(() => {
  if (!currentSection.value?.section_uuid) return false
  return startedSections.value.has(currentSection.value.section_uuid)
})

// Bölümü başlat
const startSection = async () => {
  if (currentSection.value?.section_uuid) {
    startedSections.value.add(currentSection.value.section_uuid)
    // Timer'ı bölüm bilgisiyle başlat
    await startTimer(currentSection.value)
    
    // Eğer ilk egzersiz presentation ise, DOM güncellemesinden sonra slide'ı yeniden render et
    const firstExercise = currentSectionExercises.value?.[0]
    if (firstExercise?.exercise_type === 'presentation') {
      // DOM'un tamamen güncellenmesi için biraz bekle
      setTimeout(async () => {
        await nextTick()
        if (pdfDoc && pdfCanvas.value) {
          console.log('📽️ Bölüm başladı, sunum ilk sayfası render ediliyor')
          await renderPage(1)
        }
      }, 300)
    }
  }
}

// Computed
const currentSection = computed(() => store.currentSection)
const currentSectionExercises = computed(() => store.currentSectionExercises)

const totalDuration = computed(() => {
  return store.sections.reduce((total, section) => {
    return total + getSectionDuration(section)
  }, 0)
})

// Initialize Section Timer Composable
const sectionTimerComposable = useSectionTimer({
  onTimerComplete: async () => {
    console.log('⏰ Timer bitti, otomatik kayıt yapılıyor')
    
    // Guard: Eğer zaten işlem yapılıyorsa tekrar çağrılmasın
    if (savingExercise.value === 'AUTO_SAVING') {
      console.log('⚠️ Zaten otomatik kayıt yapılıyor, tekrar çağrılmadı')
      return
    }
    
    savingExercise.value = 'AUTO_SAVING'
    
    toast.add({
      severity: 'warn',
      summary: 'Süre Doldu!',
      detail: 'Bölüm süresi doldu. İlerlemeniz otomatik kaydedildi.',
      life: 5000
    })
    
    try {
      // Otomatik kaydet ve sonraki bölüme geç
      await autoSaveAndNext()
    } finally {
      savingExercise.value = null
    }
  },
  savingExercise
})

// Destructure timer methods and state
const { remainingTime, formattedTime, startTimer, stopTimer, resetTimer, resumeTimer } = sectionTimerComposable

// Initialize Exercise Navigation Composable (needs to be before answer handling)
const navigationComposable = useExerciseNavigation({
  currentSection,
  currentSectionExercises,
  currentExerciseStartTime,
  showSectionCompletedMessage,
  completionMessage,
  selfEvaluationQuestions,
  selfEvaluationAnswers,
  showSelfEvaluationDialog,
  onStartTimer: startTimer,
  onStopTimer: stopTimer,
  onResetTimer: resetTimer,
  onCleanupInventory: () => cleanupInventory(),
  isExerciseAnswered: (uuid) => !!store.responses[uuid] // Temporary until answer handling is initialized
})

// Destructure navigation methods and state
const {
  currentExerciseIndex,
  currentExercise,
  completedExercisesCount,
  canCompleteSection,
  isLastExerciseInSection,
  goToPreviousExercise,
  goToNextExercise,
  goToExercise,
  selectSection,
  isSectionLocked,
  completeSectionAndNext,
  proceedToNextSection,
  completeAssessment
} = navigationComposable

// Initialize Answer Handling Composable (now currentExerciseIndex is available)
const answerHandlingComposable = useAnswerHandling({
  currentSection,
  currentExerciseIndex,
  currentSectionExercises,
  savingExercise,
  currentExerciseStartTime,
  onSectionComplete: completeSectionAndNext
})

// Destructure answer handling methods and state
const {
  exerciseAnswers,
  audioRecordings,
  showAudioRecorder,
  isExerciseAnswered,
  handleAudioSave,
  removeAudioRecording,
  saveExerciseResponse,
  confirmAndSave,
  confirmAndSaveAndNext,
  autoSaveAndNext,
  loadExistingAnswers
} = answerHandlingComposable

// Update navigation's isExerciseAnswered with the real one from answer handling
navigationComposable.isExerciseAnswered = isExerciseAnswered

// Alias for template compatibility
const onAudioSave = handleAudioSave

// Initialize PDF Viewer Composable
const pdfViewerComposable = usePdfViewer({
  store
})

// Destructure PDF viewer methods and state
const {
  pdfViewerDialog,
  currentPdfUrl,
  currentPdfName,
  pdfLoading,
  pdfFullscreen,
  viewDocument,
  closePdfViewer,
  togglePdfFullscreen,
  cleanupPdfViewer
} = pdfViewerComposable

// Initialize Policy Management Composable
const policyManagementComposable = usePolicyManagement({
  store
})

// Destructure policy management methods and state
const {
  showPolicyDialog,
  policiesAcknowledged,
  allPoliciesApproved,
  approvePolicies,
  loadPolicies,
  checkPolicies
} = policyManagementComposable

const firstSectionDuration = computed(() => {
  if (store.sections.length === 0) return 0
  return getSectionDuration(store.sections[0])
})

const currentExerciseFiles = computed(() => {
  if (!currentSectionExercises.value) return []
  
  const files = []
  currentSectionExercises.value.forEach(exercise => {
    if (exercise.files && Array.isArray(exercise.files)) {
      exercise.files.forEach(file => {
        files.push({
          exercise_title: exercise.exercise_title || exercise.title,
          file_name: file.name || file.file_name,
          file_path: file.path || file.file_path
        })
      })
    }
  })
  return files
})

const hasDocumentsInCurrentSection = computed(() => {
  const section = store.hasStartedUI ? currentSection.value : store.sections[0]
  if (!section) return false
  
  // Bölüm envanteri var mı?
  const hasInventory = !!section.section_inventory_file
  // Egzersiz dosyaları var mı?
  const hasExerciseFiles = store.hasStartedUI && currentExerciseFiles.value.length > 0
  
  return hasInventory || hasExerciseFiles
})

const documentCountInCurrentSection = computed(() => {
  return allAccessibleFiles.value.length
})

// Tüm erişilebilir dosyalar (tamamlanmış + aktif bölümler)
const allAccessibleFiles = computed(() => {
  const files = []
  
  if (!store.hasStartedUI) {
    // Henüz başlamadıysa sadece ilk bölümün envanter dosyasını göster
    const firstSection = store.sections[0]
    if (firstSection?.section_inventory_file) {
      files.push({
        type: 'inventory',
        section_title: firstSection.section_title,
        section_uuid: firstSection.section_uuid,
        file_path: firstSection.section_inventory_file,
        file_name: 'Bölüm Envanteri'
      })
    }
    return files
  }
  
  // Tamamlanmış bölümlerin dosyaları
  const completedSectionIds = store.completedSections || []
  
  store.sections.forEach(section => {
    const isCompleted = completedSectionIds.includes(section.section_uuid)
    const isCurrent = section.section_uuid === currentSection.value?.section_uuid
    
    // Sadece tamamlanmış veya aktif bölümlerin dosyalarını göster
    if (isCompleted || isCurrent) {
      // Bölüm envanter dosyası
      if (section.section_inventory_file) {
        files.push({
          type: 'inventory',
          section_title: section.section_title,
          section_uuid: section.section_uuid,
          file_path: section.section_inventory_file,
          file_name: 'Bölüm Envanteri'
        })
      }
      
      // Egzersiz dosyaları - sectionDetails'dan al (cache)
      const sectionDetail = store.sectionDetails[section.section_uuid]
      const exercises = sectionDetail?.exercises || section.exercises || []
      
      exercises.forEach(exercise => {
        // Normal egzersiz dosyaları (files dizisi)
        const exerciseFiles = exercise.files || []
        exerciseFiles.forEach(file => {
          files.push({
            type: 'exercise',
            section_title: section.section_title,
            section_uuid: section.section_uuid,
            exercise_title: exercise.exercise_title,
            file_path: file.path || file.file_path,
            file_name: file.name || file.file_name
          })
        })
        
        // Sunum türü egzersizler için doğrudan file_path
        if (exercise.exercise_type === 'presentation' && exercise.file_path) {
          files.push({
            type: 'presentation',
            section_title: section.section_title,
            section_uuid: section.section_uuid,
            exercise_title: exercise.exercise_title,
            file_path: exercise.file_path,
            file_name: exercise.file_name || 'Sunum Dosyası'
          })
        }
      })
    }
  })
  
  return files
})

const canComplete = computed(() => {
  return store.overallProgress === 100
})

const sectionProgressPercentage = computed(() => {
  if (!currentSectionExercises.value || currentSectionExercises.value.length === 0) return 0
  return Math.round((completedExercisesCount.value / currentSectionExercises.value.length) * 100)
})

const nextSectionExists = computed(() => {
  if (!store.currentSectionId) return false
  const currentIndex = store.sections.findIndex(s => s.section_uuid === store.currentSectionId)
  return currentIndex >= 0 && currentIndex < store.sections.length - 1
})

// Analiz egzersizi için gerçek içerik kontrolü (HTML tagları hariç)
const hasAnalysisContent = computed(() => {
  if (!currentExercise.value) return false
  const content = exerciseAnswers.value[currentExercise.value.exercise_uuid]
  if (!content) return false
  // HTML taglarını temizle ve boşlukları kontrol et
  const textContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  return textContent.length > 0
})

// Methods

// Wrapper for hasResponse util to provide store
const hasExerciseResponse = (exerciseUuid) => {
  return hasResponse(store, exerciseUuid)
}

// Editor placeholder - egzersiz türüne göre
const getEditorPlaceholder = (exercise) => {
  if (isExerciseAnswered(exercise.exercise_uuid)) {
    return exercise.exercise_type === 'analysis' 
      ? 'Bu analiz raporu kaydedildi ve değiştirilemez.'
      : 'Bu cevap kaydedildi ve değiştirilemez.'
  }
  
  if (exercise.exercise_type === 'analysis') {
    return 'Analiz raporunuzu buraya yazınız. Bulgularınızı, değerlendirmelerinizi ve önerilerinizi detaylı şekilde açıklayınız...'
  }
  
  return 'Düşüncelerinizi buraya yazabilirsiniz...'
}

// Çoktan seçmeli (case_study) - Tek seçim
const selectOption = (exerciseUuid, optionIndex) => {
  exerciseAnswers.value[exerciseUuid] = optionIndex
}

// Çoktan seçmeli (case_study) - Çoklu seçim toggle
const toggleOption = (exerciseUuid, optionIndex) => {
  if (!exerciseAnswers.value[exerciseUuid]) {
    exerciseAnswers.value[exerciseUuid] = []
  }
  
  const currentSelection = exerciseAnswers.value[exerciseUuid]
  const index = currentSelection.indexOf(optionIndex)
  
  if (index === -1) {
    currentSelection.push(optionIndex)
  } else {
    currentSelection.splice(index, 1)
  }
}

// Çoktan seçmeli (case_study) cevabını kaydet ve sonraki egzersize geç
const saveCaseStudyAnswer = async (exercise) => {
  const answer = exerciseAnswers.value[exercise.exercise_uuid]
  if (answer === undefined || answer === null) return
  
  // Seçilen seçenek(ler)i metin olarak formatla
  const options = exercise.options?.choices || []
  let answerText = ''
  
  if (Array.isArray(answer)) {
    // Çoklu seçim
    const selectedTexts = answer.map(idx => {
      const opt = options[idx]
      return opt ? (opt.text || opt) : ''
    }).filter(t => t)
    answerText = selectedTexts.join('\n---\n')
  } else {
    // Tek seçim
    const opt = options[answer]
    answerText = opt ? (opt.text || opt) : ''
  }
  
  // Cevabı kaydet
  savingExercise.value = exercise.exercise_uuid
  
  try {
    await store.saveResponse({
      section_uuid: store.currentSectionId || currentSection.value?.section_uuid,
      exercise_uuid: exercise.exercise_uuid,
      answer_text: answerText,
      answer_value: JSON.stringify(answer),
      time_spent: Math.floor((Date.now() - currentExerciseStartTime.value) / 1000)
    })
    
    toast.add({
      severity: 'success',
      summary: 'Kaydedildi',
      detail: 'Cevabınız başarıyla kaydedildi',
      life: 2000
    })
    
    // Sonraki egzersize geç veya bölümü tamamla
    if (isLastExerciseInSection.value) {
      await completeSectionAndNext()
    } else {
      goToNextExercise()
      currentExerciseStartTime.value = Date.now()
    }
  } catch (error) {
    console.error('Cevap kaydetme hatası:', error)
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Cevap kaydedilemedi, lütfen tekrar deneyin',
      life: 3000
    })
  } finally {
    savingExercise.value = null
  }
}

const startWorkspace = async () => {
  // Policy check
  if (!checkPolicies()) {
    return
  }

  // Countdown
  showCountdown.value = true
  countdownValue.value = 3
  
  const timer = setInterval(async () => {
    countdownValue.value--
    if (countdownValue.value <= 0) {
      clearInterval(timer)
      showCountdown.value = false
      
      store.hasStartedUI = true
      
      // İlk bölüme geç
      if (store.sections.length > 0) {
        const firstSection = store.sections[0]
        // currentExerciseIndex ve timer ayarları selectSection içinde veya burada yapılabilir
        currentExerciseIndex.value = 0 
        currentExerciseStartTime.value = Date.now()
        
        // selectSection kullanarak geçiş yap
        await selectSection(firstSection.section_uuid, 0)
      }
      
      // Assessment'ı backend'de başlat (sadece ilk kez)
      if (!store.startedAt) {
        await store.startAssessment()
      }
    }
  }, 1000)
}

// Bölüm Envanteri Sidebar Toggle
const toggleInventorySidebar = () => {
  showInventorySidebar.value = !showInventorySidebar.value
}

// Envanter temizleme (bölüm değiştiğinde)
const cleanupInventory = () => {
  console.log('🧹 Envanter temizleniyor...')
  
  // PDF viewer'ı kapat
  cleanupPdfViewer()
  
  // Sidebar'ı kapat (opsiyonel - yeni bölümde dosya varsa watch açacak)
  // showInventorySidebar.value = false
  
  console.log('✅ Envanter temizlendi')
}

// Öz-değerlendirme cevaplarını kaydet
const saveSelfEvaluationAnswers = async () => {
  // Tüm zorunlu sorular cevaplandı mı kontrol et
  const requiredQuestions = selfEvaluationQuestions.value.filter(q => q.is_required)
  const unansweredRequired = requiredQuestions.filter(q => !selfEvaluationAnswers.value[q.id])
  
  if (unansweredRequired.length > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Eksik Cevaplar',
      detail: 'Lütfen tüm zorunlu soruları cevaplayın',
      life: 3000
    })
    return
  }
  
  try {
    const ApiService = (await import('~/utils/api')).default
    const api = new ApiService(store.sessionToken)
    
    // Backend'e cevapları gönder
    await api.post('/assessment/section-evaluation', {
      section_uuid: store.currentSectionId,
      answers: selfEvaluationAnswers.value
    })
    
    // Dialog'u kapat ve completion message göster
    showSelfEvaluationDialog.value = false
    showSectionCompletedMessage.value = true
    
    toast.add({
      severity: 'success',
      summary: 'Kaydedildi',
      detail: 'Öz-değerlendirmeniz başarıyla kaydedildi',
      life: 2000
    })
  } catch (error) {
    console.error('Öz-değerlendirme kaydetme hatası:', error)
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Cevaplar kaydedilemedi, lütfen tekrar deneyin',
      life: 3000
    })
  }
}

const markInfoAsRead = async (exercise) => {
  // Bilgilendirme egzersizi için boş bir cevap kaydet
  savingExercise.value = exercise.exercise_uuid
  
  try {
    const result = await store.saveResponse({
      section_uuid: store.currentSectionId || currentSection.value?.section_uuid,
      exercise_uuid: exercise.exercise_uuid,
      question_id: null,
      answer_value: 'INFO_VIEWED',
      answer_text: 'Bilgilendirme görüntülendi',
      time_spent: currentExerciseStartTime.value ? Math.floor((Date.now() - currentExerciseStartTime.value) / 1000) : 5
    })
    
    if (result.success) {
      // Sonraki egzersize geç
      if (currentExerciseIndex.value < currentSectionExercises.value.length - 1) {
        currentExerciseIndex.value++
      } else {
        toast.add({
          severity: 'info',
          summary: 'Tüm Egzersizler Tamamlandı',
          detail: 'Bölümü tamamlamak için "Bölümü Tamamla" butonuna tıklayın',
          life: 4000
        })
      }
    }
  } catch (error) {
    console.error('Info exercise marking error:', error)
  } finally {
    savingExercise.value = null
  }
}

// Sunum egzersizi için PDF dosyasını al
const getPresentationFile = (exercise) => {
  if (!exercise) return null
  
  // Egzersiz dosyalarından ilk PDF'i al
  if (exercise.files && Array.isArray(exercise.files) && exercise.files.length > 0) {
    return {
      file_path: exercise.files[0].path || exercise.files[0].file_path,
      file_name: exercise.files[0].name || exercise.files[0].file_name || 'Sunum'
    }
  }
  
  // Alternatif: file_path direkt olarak tanımlanmış olabilir
  if (exercise.file_path) {
    return {
      file_path: exercise.file_path,
      file_name: exercise.file_name || 'Sunum'
    }
  }
  
  return null
}

// HTML içeriğini strip et (güvenli metin gösterimi)
const stripHtml = (html) => {
  if (!html) return ''
  // HTML taglarını kaldır ve entity'leri decode et
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

// PDF Slide Show State
const pdfCanvas = ref(null)
const slideContainer = ref(null)
const currentSlide = ref(1)
const totalSlides = ref(1)
const pdfSlideLoading = ref(false)
const isSlideTransitioning = ref(false)
const isSlideFullscreen = ref(false)
const slideDirection = ref('left')
const showPresentationNotification = ref(false)
const presentationNotificationDismissed = ref(false)
let pdfDoc = null
let pdfjsLib = null

// Sunum bildirimi mesajı - önce egzersiz instructions, yoksa section description, yoksa genel mesaj
const presentationNotificationMessage = computed(() => {
  // Egzersiz talimatları varsa onu öncelikli göster
  if (currentExercise.value?.instructions && currentExercise.value.instructions.trim() !== '') {
    return currentExercise.value.instructions
  }
  // Yoksa bölüm açıklamasını göster
  if (currentSection.value?.section_description) {
    return currentSection.value.section_description
  }
  return 'Lütfen sunumun tamamını inceleyerek bölümü tamamlayınız.'
})

// Sunum bildirimini kapat
const dismissPresentationNotification = () => {
  showPresentationNotification.value = false
  presentationNotificationDismissed.value = true
  // Egzersiz talimatları görüldü olarak işaretle
  if (currentExercise.value?.exercise_uuid) {
    seenInstructions.value.add(currentExercise.value.exercise_uuid)
  }
}

// Tam ekran toggle
const toggleSlideFullscreen = () => {
  isSlideFullscreen.value = !isSlideFullscreen.value
  
  // Tam ekrandan çıkış için ESC tuşunu dinle
  if (isSlideFullscreen.value) {
    document.addEventListener('keydown', handleFullscreenEscape)
    // Body scroll'u kapat
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleFullscreenEscape)
    document.body.style.overflow = ''
  }
  
  // Canvas'ı yeniden boyutlandır
  nextTick(() => {
    if (pdfDoc) {
      renderPage(currentSlide.value)
    }
  })
}

const handleFullscreenEscape = (e) => {
  if (e.key === 'Escape' && isSlideFullscreen.value) {
    toggleSlideFullscreen()
  }
}

// PDF.js'i yükle
const loadPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib
  
  // PDF.js CDN'den yükle
  if (typeof window !== 'undefined' && !window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  
  pdfjsLib = window.pdfjsLib
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  
  return pdfjsLib
}

// PDF sayfasını canvas'a render et
const renderPage = async (pageNum) => {
  if (!pdfDoc || !pdfCanvas.value) return
  
  pdfSlideLoading.value = true
  
  try {
    const page = await pdfDoc.getPage(pageNum)
    const canvas = pdfCanvas.value
    const ctx = canvas.getContext('2d')
    
    // Container boyutuna göre scale hesapla
    const containerWidth = slideContainer.value?.clientWidth || 800
    const containerHeight = slideContainer.value?.clientHeight || 500
    
    const viewport = page.getViewport({ scale: 1 })
    const scaleX = (containerWidth - 40) / viewport.width
    const scaleY = (containerHeight - 40) / viewport.height
    const scale = Math.min(scaleX, scaleY, 2) // Max 2x scale
    
    const scaledViewport = page.getViewport({ scale })
    
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height
    
    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport
    }).promise
    
  } catch (error) {
    console.error('Sayfa render hatası:', error)
  } finally {
    pdfSlideLoading.value = false
  }
}

// Sonraki slide
const nextSlide = () => {
  if (currentSlide.value < totalSlides.value) {
    slideDirection.value = 'slide-left'
    currentSlide.value++
  }
}

// Önceki slide
const prevSlide = () => {
  if (currentSlide.value > 1) {
    slideDirection.value = 'slide-right'
    currentSlide.value--
  }
}

// Belirli slide'a git
const goToSlide = (n) => {
  if (n >= 1 && n <= totalSlides.value && n !== currentSlide.value) {
    slideDirection.value = n > currentSlide.value ? 'slide-left' : 'slide-right'
    currentSlide.value = n
  }
}

// Klavye navigasyonu
const handleSlideKeyboard = (e) => {
  if (currentExercise.value?.exercise_type !== 'presentation') return
  
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault()
    nextSlide()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prevSlide()
  }
}

// Slide değiştiğinde animasyonlu render et
watch(currentSlide, async (newPage) => {
  if (pdfDoc && pdfCanvas.value) {
    // Geçiş animasyonu başlat
    isSlideTransitioning.value = true
    
    // Kısa bir gecikme ile animasyon efekti
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Sayfayı render et
    await renderPage(newPage)
    
    // Animasyonu bitir
    isSlideTransitioning.value = false
  }
})

// Sunum egzersizi değiştiğinde PDF'i yükle ve bildirimi göster
watch(currentExercise, async (exercise) => {
  if (exercise?.exercise_type === 'presentation') {
    // Bildirim durumunu sıfırla ve göster
    presentationNotificationDismissed.value = false
    showPresentationNotification.value = true
    
    const file = getPresentationFile(exercise)
    if (file) {
      try {
        pdfSlideLoading.value = true
        currentSlide.value = 1
        totalSlides.value = 1
        pdfDoc = null
        
        // PDF URL'ini al
        const ApiService = (await import('~/utils/api')).default
        const api = new ApiService()
        
        let normalizedPath = file.file_path
        if (!normalizedPath.startsWith('/')) {
          normalizedPath = '/' + normalizedPath
        }
        if (normalizedPath.startsWith('/uploads/')) {
          normalizedPath = '/writable' + normalizedPath
        }
        
        const tokenResponse = await api.generateDocumentToken(
          store.participantId,
          store.projectId,
          normalizedPath
        )
        
        if (tokenResponse.status === 'success') {
          // PDF.js ile yükle
          await loadPdfJs()
          
          const loadingTask = pdfjsLib.getDocument(tokenResponse.view_url)
          pdfDoc = await loadingTask.promise
          totalSlides.value = pdfDoc.numPages
          
          // İlk sayfayı render et
          await nextTick()
          await renderPage(1)
        }
      } catch (error) {
        console.error('Sunum PDF yükleme hatası:', error)
        pdfDoc = null
        totalSlides.value = 1
      } finally {
        pdfSlideLoading.value = false
      }
    } else {
      pdfDoc = null
      currentSlide.value = 1
      totalSlides.value = 1
    }
  } else {
    pdfDoc = null
    currentSlide.value = 1
    totalSlides.value = 1
  }
}, { immediate: true })

// Keyboard listener
onMounted(() => {
  window.addEventListener('keydown', handleSlideKeyboard)
})

// Browser geri/ileri butonlarını yönet
const handlePopState = (event) => {
  // Geri/ileri butonuna basıldığında, kullanıcıyı mevcut sayfada tut
  // History'ye tekrar mevcut state'i ekle
  window.history.pushState(null, '', window.location.href)
  
  // Kullanıcıya bilgi ver
  toast.add({
    severity: 'warn',
    summary: 'Dikkat',
    detail: 'Değerlendirme sırasında geri/ileri butonları kullanılamaz',
    life: 3000
  })
}

onMounted(() => {
  // Browser history'yi yönet - geri gitmeyi engelle
  window.history.pushState(null, '', window.location.href)
  window.addEventListener('popstate', handlePopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleSlideKeyboard)
  window.removeEventListener('popstate', handlePopState)
})

// Sunum egzersizini görüntülenmiş olarak işaretle
const markPresentationAsViewed = async (exercise) => {
  // Eğer sunum zaten izlenmişse, sadece sonraki egzersize geç (tekrar kaydetme)
  if (isExerciseAnswered(exercise.exercise_uuid)) {
    console.log('📽️ Sunum zaten izlenmiş, sonraki egzersize geçiliyor')
    
    // Son egzersizse bölümü tamamla
    if (currentExerciseIndex.value >= currentSectionExercises.value.length - 1) {
      await completeSectionAndNext()
    } else {
      // Sonraki egzersize geç
      currentExerciseIndex.value++
    }
    return
  }
  
  savingExercise.value = exercise.exercise_uuid
  
  try {
    const result = await store.saveResponse({
      section_uuid: store.currentSectionId || currentSection.value?.section_uuid,
      exercise_uuid: exercise.exercise_uuid,
      question_id: null,
      answer_value: 'PRESENTATION_VIEWED',
      answer_text: 'Sunum görüntülendi',
      time_spent: currentExerciseStartTime.value ? Math.floor((Date.now() - currentExerciseStartTime.value) / 1000) : 10
    })
    
    if (result.success) {
      // Son egzersizse bölümü tamamla
      if (currentExerciseIndex.value >= currentSectionExercises.value.length - 1) {
        // Bölümü tamamla
        await completeSectionAndNext()
      } else {
        // Sonraki egzersize geç
        currentExerciseIndex.value++
      }
    }
  } catch (error) {
    console.error('Presentation exercise marking error:', error)
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'İşlem sırasında bir hata oluştu',
      life: 3000
    })
  } finally {
    savingExercise.value = null
  }
}

// Watchers
// Her egzersiz değiştiğinde başlangıç zamanını kaydet
watch(currentExerciseIndex, () => {
  currentExerciseStartTime.value = Date.now()
  console.log('⏱️ Egzersiz başlangıç zamanı kaydedildi:', new Date(currentExerciseStartTime.value).toLocaleTimeString())
})

// Bölüm değiştiğinde veya UI başladığında talimatları kontrol et
const checkAndShowInstructions = () => {
  console.log('🔍 checkAndShowInstructions çağrıldı:', {
    hasStartedUI: store.hasStartedUI,
    hasUnseenInstructions: hasUnseenInstructions.value,
    showSectionCompletedMessage: showSectionCompletedMessage.value,
    sectionDescription: !!currentSection.value?.section_description,
    sectionUuid: currentSection.value?.section_uuid,
    seenInstructions: Array.from(seenInstructions.value)
  })
  
  // Artık Section Start Screen olduğu için otomatik popup açılmıyor
  // Manuel olarak "Talimatlar" butonundan açılabilir
  // if (store.hasStartedUI && hasUnseenInstructions.value && !showSectionCompletedMessage.value) {
  //   console.log('📋 Bölüm talimatları popup açılıyor:', currentSection.value?.section_title)
  //   showInstructionsPopup.value = true
  // }
}

// Bölüm değiştiğinde kontrol et ve detayları yükle
watch(() => currentSection.value?.section_uuid, async (newUuid, oldUuid) => {
  if (newUuid && newUuid !== oldUuid) {
    // Bölüm detaylarını yükle (egzersiz listesi için gerekli)
    console.log('📦 Bölüm değişti, detaylar yükleniyor:', newUuid)
    await store.fetchSectionDetails(newUuid)
    
    setTimeout(() => {
      nextTick(() => checkAndShowInstructions())
    }, 300)
  }
})

// UI başladığında da kontrol et (ilk bölüm için)
watch(() => store.hasStartedUI, async (started) => {
  if (started && store.currentSectionId) {
    // İlk bölümün detaylarını yükle (egzersiz listesi için gerekli)
    console.log('📦 UI başladı, ilk bölüm detayları yükleniyor:', store.currentSectionId)
    await store.fetchSectionDetails(store.currentSectionId)
    
    setTimeout(() => {
      nextTick(() => checkAndShowInstructions())
    }, 500)
  }
})

// Mozilla PDF.js viewer kullanıyoruz (CDN iframe olarak)

// Lifecycle
onMounted(async () => {
  try {
    // Pinia persist hydration'ını bekle
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log('Workspace onMounted - sessionToken:', !!store.sessionToken)
    console.log('Workspace onMounted - project:', !!store.project)
    console.log('Workspace onMounted - sections:', store.sections?.length || 0)
    
    // Session token kontrolü (localStorage'dan gelecek)
    if (!store.sessionToken) {
      console.error('❌ Oturum bilgisi bulunamadı - localStorage temizlenmiş olabilir')
      
      toast.add({
        severity: 'error',
        summary: 'Oturum Hatası',
        detail: 'Oturum bilginiz bulunamadı',
        life: 3000
      })
      
      // Error sayfasına yönlendir
      setTimeout(() => {
        router.push({
          path: '/assessment/error',
          query: {
            message: 'Oturum bilginiz bulunamadı. Lütfen davet linkini kullanarak tekrar giriş yapın.'
          }
        })
      }, 2000)
      return
    }

    // ÖNCE Proje özet bilgilerini yükle (GÜVENLİ - egzersiz detayları YOK!)
    // Bu sayede hasStartedUI ve startedAt güncellenir.
    console.log('Proje özeti yükleniyor...')
    await store.fetchProjectSummary()
    
    console.log('📊 Progress bilgileri:')
    console.log('  - hasStartedUI:', store.hasStartedUI)
    console.log('  - currentSectionId:', store.currentSectionId)
    console.log('  - completedSections:', store.completedSections.length)
    console.log('  - completedAt:', store.completedAt)

    // Politikaları yükle (completed kontrolünden ÖNCE - ilk girişte gösterilmeli)
    if (!store.hasStartedUI) {
      await loadPolicies()
    }

    // Assessment zaten tamamlanmış mı kontrol et
    // NOT: Sadece gerçekten tamamlanmışsa (tüm bölümler completed)
    if (store.completedAt && store.completedSections.length === store.sections.length) {
      console.log('✅ Assessment zaten tamamlanmış - completed sayfasına yönlendiriliyor')
      toast.add({
        severity: 'info',
        summary: 'Değerlendirme Tamamlandı',
        detail: 'Bu değerlendirmeyi zaten tamamladınız',
        life: 3000
      })
      
      // Completed sayfasına yönlendir
      setTimeout(() => {
        router.push('/assessment/completed')
      }, 1500)
      return
    }
    
    // Başlangıç Bölümü Belirleme Mantığı:
    // Eğer UI başlatılmamışsa (startedAt yoksa), Intro'yu seç.
    // Backend currentSectionId olarak ilk bölümü dönse bile, henüz "Başla" denmediği için Intro gösterilmeli.
    if (!store.hasStartedUI) {
      store.setCurrentSection('intro')
      console.log('📍 Henüz başlanmamış -> Intro ekranı gösteriliyor')
      console.log('📝 Karşılama mesajı:', store.projectWelcomeMessage ? 'VAR' : 'YOK')
    } else if (!store.currentSectionId) {
      // Başlamış ama currentSectionId yoksa (hatalı durum), yine intro
      store.setCurrentSection('intro')
    }
    
    // Session doğrulama (opsiyonel - middleware zaten yapıyor)
    
    // İlk bölümün detaylarını yükle (eğer başlanmışsa)
    if (store.hasStartedUI && store.currentSectionId) {
      console.log('İlk bölüm detayları yükleniyor:', store.currentSectionId)
      await store.fetchSectionDetails(store.currentSectionId)
      
      // Mevcut cevapları yükle
      loadExistingAnswers()
      
      // İlk cevapsız egzersizi bul (kaldığı yerden devam etsin)
      const exercises = currentSectionExercises.value
      let firstUnanswered = -1
      
      for (let i = 0; i < exercises.length; i++) {
        if (!isExerciseAnswered(exercises[i].exercise_uuid)) {
          firstUnanswered = i
          break
        }
      }
      
      // Eğer bulunduysa oradan başlat, yoksa ilk egzersizden
      if (firstUnanswered !== -1) {
        currentExerciseIndex.value = firstUnanswered
        console.log('📍 Kaldığı egzersizden devam ediyor:', firstUnanswered + 1, '/', exercises.length)
      } else {
        console.log('✅ Bu bölümün tüm egzersizleri tamamlanmış')
      }
    }
    
    // Eğer daha önce başlatılmışsa timer'ı kontrol et
    // Backend'den remaining_time kontrolü yaparak bölümün başlatılıp başlatılmadığını anla
    if (store.hasStartedUI && store.currentSectionId) {
      const section = store.sections.find(s => s.section_uuid === store.currentSectionId)
      if (section) {
        // Backend'den kalan süreyi kontrol et
        const timeResult = await store.fetchRemainingTime()
        if (timeResult.success && timeResult.data.remaining_seconds > 0) {
          // Backend'de süre varsa, bölüm daha önce başlatılmış demektir
          console.log('🔄 Bölüm daha önce başlatılmış, timer resume ediliyor')
          startedSections.value.add(store.currentSectionId)
          await resumeTimer(section)
        } else {
          console.log('📋 Bölüm henüz başlatılmamış, Section Start Screen gösterilecek')
        }
      }
    }
    
    // İlk egzersiz başlangıç zamanını ayarla
    currentExerciseStartTime.value = Date.now()
    console.log('⏱️ İlk egzersiz başlangıç zamanı kaydedildi')
    
    // Bölüm talimatlarını kontrol et (sayfa yenileme durumunda)
    setTimeout(() => {
      checkAndShowInstructions()
    }, 800)
    
  } catch (error) {
    console.error('Workspace initialization error:', error)
    toast.add({
      severity: 'error',
      summary: 'Yükleme Hatası',
      detail: 'Workspace yüklenirken hata oluştu',
      life: 3000
    })
  }
})

// Watch: Bölüm değiştiğinde sidebar'ı kapat (otomatik açma kaldırıldı - sadece butonla açılır)
watch(() => store.currentSectionId, (newSectionId, oldSectionId) => {
  // Bölüm değiştiğinde sidebar'ı kapat
  if (newSectionId !== oldSectionId) {
    showInventorySidebar.value = false
    console.log('📂 Bölüm değişti, sidebar kapatıldı')
  }
})

// Cleanup
onBeforeUnmount(() => {
  stopTimer()
  
  // TTS cleanup
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel()
  }
})
</script>

<style scoped>
/* Countdown Overlay */
.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
}

.countdown-content {
  text-align: center;
  color: white;
}

.countdown-number {
  font-size: 10rem;
  font-weight: 800;
  line-height: 1;
  animation: pulse 1s infinite;
}

.countdown-text {
  font-size: 2rem;
  margin-top: 1rem;
  opacity: 0.8;
}

/* Intro Item */
.intro-item {
  border-left: 4px solid transparent;
}

.intro-item.active {
  border-left-color: #8b5cf6;
  background: #f3f4f6;
}

.intro-item .section-icon i {
  color: #8b5cf6;
  font-size: 1.2rem;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.assessment-workspace {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f3f4f6;
  overflow: hidden;
  
  /* TÜM ASSESSMENT WORKSPACE İÇİN TÜRKÇE KELİME WRAP - KELİMELER BÖLÜNMEDEN */
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: normal; /* Kelimeleri boşluklardan böl, ortasından değil */
  white-space: normal;
}

/* Tüm metin alanları için - KELİMELER BÖLÜNMEDEN WRAP */
.assessment-workspace * {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: normal; /* Kelimeleri boşluklardan böl, ortasından değil */
  white-space: normal;
}

/* Header - Compact */
.workspace-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-info h1 {
  font-size: 1.25rem;
  color: #111827;
  margin: 0;
  font-weight: 600;
}

.participant-name {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.progress-info {
  min-width: 160px;
}

.progress-text {
  display: block;
  font-size: 0.8125rem;
  color: #6b7280;
  margin-bottom: 0.375rem;
}

.progress-bar-mini {
  height: 0.5rem;
}

.inventory-btn-wrapper {
  position: relative;
  display: inline-flex;
}

.inventory-toggle-btn {
  border-color: #8b5cf6 !important;
  color: #8b5cf6 !important;
}

.inventory-toggle-btn:hover {
  background-color: #f3e8ff !important;
  border-color: #7c3aed !important;
  color: #7c3aed !important;
}

.inventory-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 10px;
  background: #3b82f6 !important;
  color: white !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Main Content - 3 Column Layout - Compact & Dynamic */
.workspace-content {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
  width: 100%;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
  height: calc(100vh - 68px);
  transition: grid-template-columns 0.3s ease;
}

/* Sidebar açıkken: 3 column */
.workspace-content:has(.documents-sidebar) {
  grid-template-columns: 280px 1fr 300px;
}

/* PDF Viewer açıkken: Sol dar, sağ geniş */
.workspace-content:has(.pdf-viewer-active) {
  grid-template-columns: 250px 1fr 650px;
}

/* Sections Sidebar */
.sections-sidebar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 100%;
}

.sidebar-header {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #111827;
  font-weight: 600;
}

.sections-list {
  padding: 0.75rem;
  overflow-y: auto;
  flex: 1;
}

.section-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.375rem;
}

.section-item:hover {
  background: #f3f4f6;
}

.section-item.active {
  background: #ede9fe;
  border-left: 4px solid #8b5cf6;
}

.section-item.completed .section-icon i {
  color: #10b981;
}

.section-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-item.locked:hover {
  background: transparent;
}

.section-item.locked .section-icon i {
  color: #9ca3af;
}

.section-item.completed {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
}

.section-item.completed .section-icon i {
  color: #10b981;
}

.section-icon {
  font-size: 1.25rem;
  color: #9ca3af;
}

.section-info {
  flex: 1;
  text-align: left;
}

.section-info h4 {
  margin: 0 0 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.section-meta {
  display: flex;
  justify-content: flex-start;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.375rem;
}

.section-meta span {
  display: flex;
  align-items: start;
  gap: 0.25rem;
}

.section-progress {
  height: 0.25rem;
}

/* Exercises Area */
.exercises-area {
  min-width: 0; /* Grid overflow fix */
  overflow-y: auto; /* Scroll when content is long */
  max-height: calc(100vh - 120px); /* Full height minus header */
  display: flex;
  flex-direction: column;
}

/* Welcome Screen */
.welcome-screen {
  background: white;
  border-radius: 12px;
  padding: 4rem;
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Changed from center to allow scroll */
  min-height: 500px;
  overflow-y: auto; /* Enable scroll when content is long */
  max-height: 100%;
}

.welcome-content {
  text-align: center;
  max-width: 800px; /* Increased from 600px for better readability */
  width: 100%;
  margin: auto; /* Center horizontally */
}

.welcome-icon {
  margin-bottom: 2rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.welcome-content h2 {
  font-size: 2rem;
  color: #111827;
  margin: 0 0 1rem;
}

.welcome-message {
  font-size: 1.1rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.welcome-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #374151;
}

.stat-item i {
  color: #8b5cf6;
}

.start-button {
  font-size: 1.1rem;
  padding: 1rem 3rem !important;
}

.empty-state {
  background: white;
  border-radius: 12px;
  padding: 4rem;
  text-align: center;
  color: #9ca3af;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.exercises-container {
  background: white;
  border-radius: 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.section-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-header h2 {
  margin: 0 0 0.5rem;
  color: #111827;
}

.section-description {
  color: #6b7280;
  margin: 0;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.exercise-card {
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
}

.exercise-card.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.exercise-title-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.exercise-status-icon {
  font-size: 1.5rem;
}

.exercise-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.exercise-content {
  padding: 1.5rem;
}

.exercise-description {
  margin-bottom: 1rem;
  color: #4b5563;
  line-height: 1.6;
}

.exercise-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.exercise-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.answer-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.answer-textarea {
  width: 100%;
  margin-bottom: 1rem;
}

/* Textarea içindeki metin için - Evaluate sayfasındaki gibi */
.answer-textarea :deep(textarea) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: normal; /* Kelimeleri boşluklardan böl, ortasından değil */
  white-space: normal;
}

.answer-actions {
  display: flex;
  justify-content: flex-end;
}

.info-note {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.95rem;
  margin-top: 1.5rem;
}

.info-note i {
  font-size: 1.25rem;
}

.section-actions {
  text-align: center;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
}

/* Documents Sidebar */
.documents-sidebar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  transition: all 0.3s ease;
}

.inventory-sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.inventory-sidebar-content .sidebar-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.inventory-sidebar-content .sidebar-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

/* PDF Viewer Mode */
.documents-sidebar.pdf-viewer-active {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.pdf-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  gap: 1rem;
}

.pdf-viewer-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.pdf-viewer-title i {
  font-size: 1.25rem;
  color: #ef4444;
  flex-shrink: 0;
}

.pdf-viewer-title h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #111827;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pdf-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pdf-viewer-content {
  flex: 1;
  overflow: hidden;
  background: #525252;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-viewer-content iframe {
  border: none;
  display: block;
}

/* PDF Fullscreen Mode */
.documents-sidebar.pdf-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw;
  max-height: 100vh;
  z-index: 9999;
  border-radius: 0;
  box-shadow: none;
}

.documents-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.section-timer-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 1rem;
}

.timer-icon {
  font-size: 2rem;
  opacity: 0.9;
}

.timer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.timer-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.timer-value {
  font-size: 1.75rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.timer-warning {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.documents-section-title {
  font-size: 0.95rem;
  color: #374151;
  margin: 1rem 0 0.75rem;
  padding: 0;
}

.document-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  margin-bottom: 1rem;
}

.document-icon {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
}

.document-info h4 {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  color: #111827;
}

.document-meta {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

/* Minimal File List Styles */
.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item-minimal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.file-item-minimal:hover {
  background: #f3f4f6;
  border-color: #667eea;
}

.file-icon-minimal {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 6px;
  flex-shrink: 0;
}

.file-icon-minimal i {
  font-size: 1rem;
}

.file-info-minimal {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.file-name-minimal {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-section-minimal {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-arrow {
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.file-item-minimal:hover .file-arrow {
  color: #667eea;
}

.empty-documents {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.empty-documents p {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
}

/* PDF Viewer Dialog */
.pdf-viewer-container {
  width: 100%;
  height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.pdf-viewer-container iframe {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Section Completed Overlay - Modern Congratulations Screen */
.section-completed-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  z-index: 100;
  animation: fadeIn 0.6s ease-in-out;
}

.completion-card {
  max-width: 700px;
  width: 100%;
  text-align: center;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  color: white;
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  animation: scaleIn 0.5s ease-out;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.completion-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: bounceIn 0.8s ease-out;
}

.completion-icon i {
  color: #10b981;
  background: white;
  border-radius: 50%;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.completion-emoji-icon {
  display: block;
  font-size: 4rem;
  background: white;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  line-height: 100px;
  margin: 0 auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.completion-card h2 {
  font-size: 2rem;
  margin: 0 0 1rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.completion-text {
  font-size: 1.15rem;
  line-height: 1.7;
  margin: 0 0 1.5rem;
  opacity: 0.95;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.completion-emoji {
  font-size: 4rem;
  margin: 1.5rem 0;
  animation: pulse 2s infinite;
}

.next-section-button {
  margin-top: 1rem;
  padding: 1rem 2.5rem !important;
  font-size: 1.1rem !important;
  background: white !important;
  color: #667eea !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.next-section-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

/* Section Start Screen */
.section-start-screen {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  min-height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.start-screen-content {
  max-width: 700px;
  width: 100%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.start-screen-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  text-align: center;
  color: white;
}

.start-screen-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.start-screen-icon i {
  font-size: 1.75rem;
}

.start-screen-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-meta {
  display: flex;
  justify-content: start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.section-meta .meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  opacity: 0.9;
}

.start-screen-description {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
}

.start-screen-description h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
  margin: 0 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.start-screen-description .description-content {
  font-size: 0.95rem;
  color: #4a5568;
  line-height: 1.7;
  max-height: 200px;
  overflow-y: auto;
}

.start-screen-description .description-content :deep(p) {
  margin-bottom: 1rem !important;
}

.start-screen-description .description-content :deep(ul) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
  list-style-type: disc;
}

.start-screen-description .description-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
  list-style-type: decimal;
}

.start-screen-description .description-content :deep(li) {
  margin-bottom: 0.5rem;
  display: list-item;
}
.start-screen-exercises {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
}

.start-screen-exercises h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.exercise-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.exercise-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.exercise-list-item:last-child {
  margin-bottom: 0;
}

.exercise-number {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.exercise-name {
  flex: 1;
  font-size: 0.9rem;
  color: #2d3748;
  font-weight: 500;
}

.exercise-type-tag {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  background: #e2e8f0;
  color: #4a5568;
}

.exercise-type-tag.presentation { background: #fed7e2; color: #97266d; }
.exercise-type-tag.analysis { background: #c6f6d5; color: #276749; }
.exercise-type-tag.team_building { background: #bee3f8; color: #2b6cb0; }
.exercise-type-tag.case_study { background: #feebc8; color: #c05621; }
.exercise-type-tag.info { background: #e9d8fd; color: #6b46c1; }

.start-screen-action {
  padding: 1.5rem 2rem;
  text-align: center;
}

.start-section-btn {
  min-width: 200px;
  font-size: 1.1rem;
  padding: 0.875rem 2rem;
}

.start-hint {
  font-size: 0.85rem;
  color: #718096;
  margin: 1rem 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Exercise Info Line in Header */
.exercise-info-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.exercise-info-line .exercise-title-inline {
  font-size: 0.95rem;
  opacity: 0.95;
  font-weight: 500;
}

.exercise-info-line .exercise-type-badge-inline {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Modern Section Header - Ultra Compact */
.modern-section-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 1.25rem;
  border-radius: 8px 8px 0 0;
  flex: none;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.header-title-area {
  flex: 1;
}

.title-with-badge {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.section-title {
  font-size: 1.375rem;
  margin: 0;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.title-separator {
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.25rem;
}

.exercise-title-inline {
  font-size: 1.125rem;
  font-weight: 500;
  opacity: 0.95;
}

.exercise-type-badge-inline {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.exercise-type-badge-inline.presentation {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  backdrop-filter: blur(4px);
}

.exercise-type-badge-inline.analysis {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  backdrop-filter: blur(4px);
}

.exercise-type-badge-inline.team_building {
  background: rgba(251, 191, 36, 0.3);
  color: white;
  backdrop-filter: blur(4px);
}

.exercise-type-badge-inline.case_study {
  background: rgba(99, 102, 241, 0.3);
  color: white;
  backdrop-filter: blur(4px);
}

.section-subtitle {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.complete-section-btn {
  flex-shrink: 0;
  border-radius: 20px;
}

.progress-indicator {
  margin-top: 0.75rem;
}

.progress-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8125rem;
  backdrop-filter: blur(10px);
}

.stat-badge i {
  font-size: 0.875rem;
}

.section-progress-bar {
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.section-progress-bar :deep(.p-progressbar-value) {
  background: #10b981;
  border-radius: 4px;
}

/* Modern Exercise Container - Compact */
.modern-exercise-container {
  animation: slideInUp 0.4s ease-out;
  padding: 1rem 1.25rem;
  max-width: 100%;
  width: 100%;
  overflow: hidden;
  flex: 1;
  margin: 0 auto;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.exercise-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  gap: 1rem;
}

.nav-button-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.nav-button-wrapper:hover {
  background: rgba(102, 126, 234, 0.05);
}

.nav-button-wrapper:hover .nav-button-with-label {
  background: rgba(102, 126, 234, 0.15) !important;
  transform: scale(1.1);
}

.nav-button-wrapper:hover .nav-label {
  color: #667eea;
}

.nav-button-with-label {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  transition: all 0.2s;
}

.nav-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-button-placeholder {
  width: 120px;
  height: 32px;
  flex-shrink: 0;
}

.exercise-nav-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.exercise-counter {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
}

.exercise-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d1d5db;
  cursor: pointer;
  transition: all 0.3s;
}

.dot.active {
  background: #667eea;
  width: 28px;
  border-radius: 5px;
}

.dot.completed {
  background: #10b981;
}

.dot:hover {
  transform: scale(1.2);
}

/* Modern Exercise Card */
.modern-exercise-card {
  background: white;
  border-radius: 0;
  /*box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);*/
  padding: 0;
  border: 0;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  word-wrap: break-word;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* Info Type Card - Flex Container with Sticky Footer */
.modern-exercise-card.info-type-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Presentation Type Card - Full Height */
.modern-exercise-card.presentation-type-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

/* Case Study Type Card - Scrollable */
.modern-exercise-card.case-study-type-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.modern-exercise-card.case-study-type-card .exercise-content-area {
  flex: 0 0 auto;
  overflow: visible;
}

.modern-exercise-card.case-study-type-card .case-study-section {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* Scrollable Content Area */
.exercise-content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 0.5rem;
}

.exercise-card-header {
  margin-bottom: 1.25rem;
  display: flex;
  justify-content: space-between;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.exercise-badge-container {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.exercise-type-badge {
  display: inline-block;
  padding: 0.3rem 0.875rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #e0e7ff;
  color: #4f46e5;
}

.exercise-type-badge.essay {
  background: #fef3c7;
  color: #d97706;
}

.exercise-type-badge.info {
  background: #dbeafe;
  color: #2563eb;
}

.exercise-type-badge.team_building {
  background: #fef3c7;
  color: #f59e0b;
}

.exercise-title {
  font-size: 1.375rem;
  margin: 0;
  color: #111827;
  font-weight: 700;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
  flex: 1;
}

/* Exercise Description - Compact */
.exercise-description-modern {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #4b5563;
  margin-bottom: 1.5rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: normal; /* Kelimeleri boşluklardan böl */
  white-space: normal;
}

.exercise-description-modern p {
  margin: 0 0 1rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: normal; /* Kelimeleri boşluklardan böl */
}

/* Modern Answer Section - Compact */
.modern-answer-section {
  margin-top: 1.5rem;
}

/* Analiz Raporu Section */
.modern-answer-section.analysis-report-section {
  margin-top: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.modern-answer-section.analysis-report-section .answer-header {
  margin-bottom: 1rem;
}

.modern-answer-section.analysis-report-section .answer-label {
  font-size: 1.1rem;
  color: #1f2937;
}

.modern-answer-section.analysis-report-section .answer-label i {
  color: #8b5cf6;
}

/* Analiz Editor - Daha Büyük */
:deep(.analysis-editor) {
  min-height: 400px !important;
}

:deep(.analysis-editor .ProseMirror) {
  min-height: 350px !important;
  font-size: 1rem;
  line-height: 1.75;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.answer-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #374151;
  font-weight: 600;
  font-size: 1.05rem;
}

.answer-label i {
  color: #667eea;
  font-size: 1.2rem;
}

.audio-record-btn {
  font-size: 0.875rem;
}

.audio-record-btn:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;
}

.audio-attachment {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  margin-top: 0.75rem;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 500;
}

.audio-attachment i {
  color: #f59e0b;
  font-size: 1.125rem;
}

.modern-textarea {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  font-size: 1rem;
  line-height: 1.7;
  transition: border-color 0.3s, box-shadow 0.3s;
  min-height: 200px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.modern-textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.modern-textarea:disabled {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
  opacity: 0.7;
}

.answer-locked-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 12px;
  margin-top: 1rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.answer-locked-info i {
  font-size: 1.2rem;
}

/* Ekip Kurma Section */
.team-building-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.team-building-locked {
  margin-top: 1rem;
}

.team-building-actions {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

/* Çoktan Seçmeli Egzersiz (Case Study) */
.case-study-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 1.5rem 1rem;
  overflow-y: auto !important;
  overflow-x: hidden;
  min-height: 0;
  max-height: 100%;
}

.case-study-options {
  flex: 0 0 auto;
  padding-bottom: 2rem;
}

.options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.options-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.options-label i {
  color: #6366f1;
}

.multiple-hint {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
}

.multiple-hint i {
  color: #6366f1;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover:not(.disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateX(4px);
}

.option-item.selected {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.option-item.selected:hover {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
}

.option-item.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.option-radio,
.option-checkbox {
  flex-shrink: 0;
  padding-top: 2px;
}

.option-text {
  flex: 1;
  font-size: 1rem;
  line-height: 1.6;
  color: #334155;
  cursor: pointer;
}

.option-letter {
  display: inline-block;
  font-weight: 700;
  color: #6366f1;
  margin-right: 0.5rem;
  min-width: 1.5rem;
}

.option-item.selected .option-text {
  color: #1e293b;
  font-weight: 500;
}

.option-item.selected .option-letter {
  color: #4f46e5;
}

.case-study-locked {
  margin-top: 1.25rem;
}

.case-study-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.answer-actions-modern {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.nav-exercise-btn {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  transition: all 0.2s;
}

.nav-exercise-btn:hover {
  transform: scale(1.1);
  background: rgba(102, 126, 234, 0.1) !important;
}

.save-next-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  font-weight: 600;
  flex: 1;
  max-width: 400px;
}

.save-next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .exercise-navigation {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .nav-button-wrapper {
    width: 100%;
    justify-content: center;
  }
  
  .nav-button-placeholder {
    display: none;
  }
  
  .exercise-nav-center {
    order: -1;
    margin-bottom: 0.5rem;
  }
  
  .answer-actions-modern {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .save-next-btn {
    max-width: 100%;
  }
  
  .nav-exercise-btn {
    width: 100%;
    height: 42px;
  }
}

/* Info Exercise Footer - Sticky Bottom */
.info-exercise-footer {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem 0 0 0;
  margin-top: auto;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  color: #1e40af;
  font-size: 1.05rem;
  margin-bottom: 2rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.info-message i {
  font-size: 1.8rem;
  color: #2563eb;
  flex-shrink: 0;
}

.info-continue-btn {
  width: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.info-continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* Presentation Notification */
.presentation-notification {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  max-width: 90%;
  width: max-content;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 0.875rem 1.25rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon i {
  color: white;
  font-size: 1.1rem;
}

.notification-text {
  flex: 1;
}

.notification-text p {
  margin: 0;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.5;
}

.notification-dismiss {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.notification-dismiss:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.notification-dismiss i {
  font-size: 0.85rem;
}

/* Notification Animation */
.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.notification-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

/* Slide Fade Animation for Button */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Header Actions Row */
.header-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.presentation-complete-btn {
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
}

/* Presentation Exercise Container - Slide Show */
.presentation-exercise-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
}

/* Fullscreen Mode */
.presentation-exercise-container.fullscreen-mode {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  padding: 1rem;
  gap: 0.5rem;
}

.presentation-exercise-container.fullscreen-mode .slide-content {
  max-height: none;
  min-height: 0;
  flex: 1;
  border-radius: 8px;
}

.presentation-exercise-container.fullscreen-mode .slide-thumbnails {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem;
  border-radius: 12px;
}

.presentation-exercise-container.fullscreen-mode .slide-thumb {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.presentation-exercise-container.fullscreen-mode .slide-thumb.active {
  background: #667eea;
}

.presentation-exercise-container.fullscreen-mode .slide-progress-bar {
  background: rgba(255, 255, 255, 0.2);
}

/* Slide Show Container */
.slide-show-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
  height: 100%;
}

/* Slide Area - Main viewing area */
.slide-area {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  position: relative;
  min-height: 0;
}

/* Overlay Navigation Buttons */
.slide-nav-overlay {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 20;
  opacity: 0;
}

.slide-content:hover .slide-nav-overlay {
  opacity: 1;
}

.slide-nav-overlay.slide-nav-prev {
  left: 12px;
}

.slide-nav-overlay.slide-nav-next {
  right: 12px;
}

.slide-nav-overlay i {
  font-size: 1rem;
  color: #374151;
}

.slide-nav-overlay:hover:not(.disabled) {
  background: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.slide-nav-overlay:hover:not(.disabled) i {
  color: white;
}

.slide-nav-overlay.disabled {
  opacity: 0.3 !important;
  cursor: not-allowed;
}

/* Fullscreen Toggle Button */
.fullscreen-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 20;
  opacity: 0;
}

.slide-content:hover .fullscreen-toggle {
  opacity: 1;
}

.fullscreen-toggle i {
  font-size: 0.9rem;
  color: #374151;
}

.fullscreen-toggle:hover {
  background: #667eea;
  transform: scale(1.1);
}

.fullscreen-toggle:hover i {
  color: white;
}

/* Slide Counter Overlay */
.slide-counter-overlay {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  z-index: 15;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.slide-content:hover .slide-counter-overlay {
  opacity: 1;
}

/* Legacy Navigation Buttons (hidden now) */
.slide-nav-btn {
  display: none;
}

.slide-nav-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Slide Content Area */
.slide-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  min-height: 0;
  height: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

.slide-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.slide-wrapper.slide-transitioning {
  opacity: 0.3;
  transform: scale(0.98);
}

.pdf-slide-canvas {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

/* Loading Overlay */
.slide-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(4px);
}

/* Progress Bar */
.slide-progress-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 0.5rem;
}

.slide-progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.slide-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.slide-counter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  min-width: 60px;
  justify-content: flex-end;
}

.current-slide {
  color: #667eea;
  font-size: 1.1rem;
}

.slide-separator {
  color: #cbd5e1;
}

/* Slide Thumbnails */
.slide-thumbnails {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.5rem;
}

.slide-thumb {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  background: white;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slide-thumb:hover {
  border-color: #667eea;
  color: #667eea;
}

.slide-thumb.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
  transform: scale(1.1);
}

.slide-thumb.viewed {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #16a34a;
}

/* No Presentation File */
.no-presentation-file {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px dashed #e2e8f0;
  color: #64748b;
}

.no-presentation-file i {
  font-size: 3rem;
  color: #94a3b8;
}

.no-presentation-file p {
  margin: 0;
  font-size: 1.1rem;
}

/* Animations */
.animate-fade-in {
  animation: slideInUp 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes slideInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 1400px) {
  .workspace-content {
    grid-template-columns: 280px 1fr 300px;
  }
}

@media (max-width: 1024px) {
  .assessment-workspace {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }
  
  .workspace-content {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }
  
  .sections-sidebar,
  .documents-sidebar {
    max-height: 400px;
  }
  
  .exercises-area {
    max-height: none;
    overflow: visible;
  }
  
  .modern-exercise-container {
    padding: 0 1rem 1rem 1rem;
  }
  
  .modern-section-header {
    padding: 0.875rem 1rem;
  }
  
  .section-title {
    font-size: 1.125rem;
  }
  
  .exercise-title {
    font-size: 1.25rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .progress-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .completion-card {
    padding: 2rem 1.5rem;
  }
  
  .completion-card h2 {
    font-size: 1.5rem;
  }
  
  .completion-text {
    font-size: 1rem;
  }
  
  /* Section Start Screen Responsive */
  .section-start-screen {
    padding: 1rem;
  }
  
  .start-screen-header {
    padding: 1.5rem 1rem;
  }
  
  .start-screen-title {
    font-size: 1.35rem;
  }
  
  .section-meta {
    gap: 1rem;
  }
  
  .start-screen-description,
  .start-screen-exercises,
  .start-screen-action {
    padding: 1rem;
  }
  
  .exercise-list-item {
    padding: 0.5rem;
  }
  
  .exercise-name {
    font-size: 0.85rem;
  }
  
  .exercise-type-tag {
    font-size: 0.65rem;
    padding: 0.2rem 0.4rem;
  }
}

/* Welcome Dialog Styles */
.welcome-dialog :deep(.p-dialog-header) {
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.welcome-dialog :deep(.p-dialog-content) {
  padding: 2rem;
}

.welcome-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 1rem; /* Scroll ile metin arasında boşluk */
}

.welcome-message-html {
  line-height: 1.8;
  color: #374151;
  /* Kelimeleri bölmeden wrap - Evaluate sayfasındaki gibi */
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: normal; /* Kelimeleri boşluklardan böl, ortasından değil */
  white-space: normal;
  /* Scroll for very long content */
  max-height: 400px;
  overflow-y: auto;
  text-align: left; /* Left align for better readability of long text */
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.welcome-message-html :deep(h1),
.welcome-message-html :deep(h2),
.welcome-message-html :deep(h3),
.welcome-message-html :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.welcome-message-html :deep(h3) {
  font-size: 1.25rem;
}

.welcome-message-html :deep(h4) {
  font-size: 1.1rem;
}

.welcome-message-html :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.8;
}

.welcome-message-html :deep(p.font-semibold),
.welcome-message-html :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.welcome-message-html :deep(ul),
.welcome-message-html :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.welcome-message-html :deep(li) {
  margin: 0.5rem 0;
  line-height: 1.7;
}

.welcome-message-html :deep(a) {
  color: #8b5cf6;
  text-decoration: underline;
}

.default-welcome-message {
  line-height: 1.8;
  color: #374151;
  /* Kelimeleri bölmeden wrap - Evaluate sayfasındaki gibi */
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: normal; /* Kelimeleri boşluklardan böl, ortasından değil */
  white-space: normal;
}

.default-welcome-message h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.default-welcome-message h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.default-welcome-message p {
  margin-bottom: 1rem;
}

/* Footer */
.app-footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  margin-top: auto;
}

.footer-content {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-right {
  display: flex;
  align-items: center;
}

.footer-text {
  color: #6b7280;
}

.footer-link {
  color: #8b5cf6;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #7c3aed;
  text-decoration: underline;
}

.footer-divider {
  color: #d1d5db;
}

.footer-version {
  font-family: 'Courier New', monospace;
  color: #9ca3af;
  font-size: 0.8125rem;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* Self-Evaluation Dialog Styles */
.self-evaluation-content {
  max-height: 60vh;
  overflow-y: auto;
}

.question-item {
  padding: 1.25rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.question-header h4 {
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
}

.likert-button {
  flex: 1;
  padding: 0.75rem;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.likert-button:hover {
  border-color: #8b5cf6;
  background: #f3e8ff;
  color: #8b5cf6;
}

.likert-button.active {
  background: #8b5cf6;
  border-color: #8b5cf6;
  color: white;
}

.yes-no-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Character Detail Popup */
.character-detail-dialog :deep(.p-dialog-header) {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.character-detail-dialog :deep(.p-dialog-content) {
  padding: 0;
}

.character-detail-content {
  padding: 1.5rem;
}

.character-header-section {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.character-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.character-avatar-large .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.character-avatar-large .avatar-placeholder {
  font-size: 2.5rem;
  color: #6366f1;
}

.character-main-info {
  flex: 1;
}

.character-main-info .character-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.character-main-info .character-title {
  font-size: 1rem;
  color: #6366f1;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.character-main-info .character-department {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.character-main-info .character-department i {
  font-size: 0.85rem;
}

.character-details-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.character-details-section .detail-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.character-details-section .detail-row i {
  color: #6366f1;
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

.character-details-section .detail-row span {
  color: #374151;
  font-size: 0.95rem;
}

.character-details-section .detail-description {
  margin-top: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #6366f1;
}

.character-details-section .detail-description p {
  color: #4b5563;
  line-height: 1.7;
  margin: 0;
  font-size: 0.95rem;
}

/* Character Info Blocks */
.character-info-block {
  margin-top: 1.25rem;
  background: #f9fafb;
  border-radius: 10px;
  overflow: hidden;
}

.info-block-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  font-weight: 600;
  font-size: 0.9rem;
  color: #4338ca;
}

.info-block-header i {
  font-size: 1rem;
}

.info-block-content {
  padding: 1rem;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.7;
}

.info-block-content :deep(p) {
  margin: 0 0 0.75rem 0;
}

.info-block-content :deep(p:last-child) {
  margin-bottom: 0;
}

.info-block-content :deep(ul),
.info-block-content :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.info-block-content :deep(li) {
  margin-bottom: 0.375rem;
}

.info-block-content :deep(strong) {
  color: #1f2937;
}

.character-main-info .character-role {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.character-main-info .character-role i {
  font-size: 0.8rem;
}

.character-detail-dialog :deep(.p-dialog-content) {
  overflow-y: auto;
  max-height: calc(90vh - 100px);
}

/* Instructions Popup */
.instructions-popup-dialog :deep(.p-dialog-header) {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.instructions-popup-dialog :deep(.p-dialog-content) {
  padding: 0;
}

.instructions-popup-content {
  padding: 1.5rem;
}

.instructions-exercise-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #1e40af;
}

.instructions-exercise-title i {
  font-size: 1rem;
}

.instructions-text {
  color: #374151;
  line-height: 1.8;
  font-size: 0.95rem;
}

.instructions-text :deep(p) {
  margin: 0 0 1rem 0;
}

.instructions-text :deep(p:last-child) {
  margin-bottom: 0;
}

.instructions-text :deep(ul),
.instructions-text :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.instructions-text :deep(li) {
  margin-bottom: 0.5rem;
}

.instructions-text :deep(strong) {
  color: #1f2937;
}

/* Instructions Hint Button */
.instructions-hint-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.instructions-hint-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.instructions-hint-btn i {
  font-size: 0.9rem;
}
</style>
