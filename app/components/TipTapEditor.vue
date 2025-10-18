<template>
  <div class="tiptap-editor-wrapper">
    <div v-if="editor" class="tiptap-toolbar">
      <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" class="toolbar-btn" type="button" title="Kalın">
        <strong style="font-weight: 900;">B</strong>
      </button>
      <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" class="toolbar-btn" type="button" title="İtalik">
        <em style="font-style: italic; font-family: serif;">I</em>
      </button>
      <button @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }" class="toolbar-btn" type="button" title="Altı Çizili">
        <span style="text-decoration: underline;">U</span>
      </button>
      <div class="toolbar-divider"></div>
      <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" class="toolbar-btn" type="button" title="Madde İşaretli Liste">
        <i class="pi pi-list"></i>
      </button>
      <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" class="toolbar-btn" type="button" title="Numaralı Liste">
        <i class="pi pi-sort-numeric-down"></i>
      </button>
      <div class="toolbar-divider"></div>
      <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" class="toolbar-btn" type="button" title="Geri Al">
        <i class="pi pi-undo"></i>
      </button>
      <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" class="toolbar-btn" type="button" title="Yinele">
        <i class="pi pi-replay"></i>
      </button>
    </div>
    <EditorContent :editor="editor" class="tiptap-content" />
    <div v-if="characterLimit" class="character-count">
      {{ editor?.storage.characterCount.characters() || 0 }} / {{ characterLimit }} karakter
    </div>
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import { watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Cevabınızı buraya yazın...'
  },
  characterLimit: {
    type: Number,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    CharacterCount.configure({
      limit: props.characterLimit
    })
  ],
  content: props.modelValue,
  editable: !props.disabled,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

watch(() => props.modelValue, (value) => {
  if (editor.value && editor.value.getHTML() !== value) {
    editor.value.commands.setContent(value, false)
  }
})

watch(() => props.disabled, (value) => {
  if (editor.value) {
    editor.value.setEditable(!value)
  }
})
</script>

<style scoped>
.tiptap-editor-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.tiptap-toolbar {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: #e5e7eb;
  color: #374151;
}

.toolbar-btn.is-active {
  background: #667eea;
  color: white;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 0.25rem;
}

.tiptap-content {
  padding: 1rem;
  min-height: 120px;
  max-height: 400px;
  overflow-y: auto;
}

.tiptap-content :deep(.ProseMirror) {
  outline: none;
}

.tiptap-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}

.character-count {
  padding: 0.5rem 1rem;
  text-align: right;
  font-size: 0.75rem;
  color: #6b7280;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}
</style>
