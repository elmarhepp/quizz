<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import type { Player, QuizSettings } from '../types'

const router = useRouter()
const quizStore = useQuizStore()

const playerNames = ref<string[]>(['', '', '', '', ''])
const playerCount = ref(2)
const category = ref('any')
const difficulty = ref<'easy' | 'medium' | 'hard' | 'any'>('any')
const questionCount = ref(10)

const categories = [
  { id: 'any',  name: 'Gemischt',        emoji: '🎲' },
  { id: '9',   name: 'Allgemeinwissen',  emoji: '🌍' },
  { id: '23',  name: 'Geschichte',       emoji: '🏛️' },
  { id: '22',  name: 'Geographie',       emoji: '🗺️' },
  { id: '17',  name: 'Wissenschaft',     emoji: '🔬' },
  { id: '19',  name: 'Mathematik',       emoji: '➗' },
  { id: '21',  name: 'Sport',            emoji: '⚽' },
  { id: '27',  name: 'Tiere',            emoji: '🐾' },
  { id: '12',  name: 'Musik',            emoji: '🎵' },
  { id: '11',  name: 'Film',             emoji: '🎬' },
  { id: '14',  name: 'Fernsehen',        emoji: '📺' },
  { id: '15',  name: 'Videospiele',      emoji: '🎮' },
  { id: '18',  name: 'Computer',         emoji: '💻' },
  { id: '10',  name: 'Bücher',           emoji: '📚' },
  { id: '25',  name: 'Kunst',            emoji: '🎨' },
  { id: '20',  name: 'Mythologie',       emoji: '⚡' },
  { id: '28',  name: 'Fahrzeuge',        emoji: '🚗' },
]

const categoryName = computed(
  () => categories.find(c => c.id === category.value)?.name ?? 'Gemischt'
)

const activePlayers = computed(() => playerNames.value.slice(0, playerCount.value))
const canStart = computed(() => activePlayers.value.every(n => n.trim().length > 0))

const progressPercent = computed(() => {
  const { done, total } = quizStore.translationProgress
  return total > 0 ? Math.round((done / total) * 100) : 0
})

async function startGame() {
  if (!canStart.value) return
  const players: Player[] = activePlayers.value.map((name, i) => ({
    id: i, name: name.trim(), score: 0, answers: [], jokers: 2,
  }))
  const settings: QuizSettings = {
    players, category: category.value, categoryName: categoryName.value,
    difficulty: difficulty.value, questionCount: questionCount.value,
  }
  await quizStore.loadQuestions(settings)
  if (!quizStore.error) router.push('/spiel')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">

    <!-- Header -->
    <div class="text-center mb-4">
      <h1 class="text-3xl font-bold text-white">🎯 QuizZZ</h1>
      <p class="text-purple-300 text-sm">Quizspiel für 1–5 Spieler</p>
    </div>

    <!-- Loading -->
    <div v-if="quizStore.isLoading" class="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md text-center border border-white/20">
      <div class="text-4xl mb-3 animate-bounce">🤖</div>
      <p class="text-white font-bold mb-3">{{ quizStore.loadingMessage }}</p>
      <div v-if="quizStore.translationProgress.total > 0">
        <div class="w-full bg-white/10 rounded-full h-2 mb-1">
          <div class="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            :style="{ width: progressPercent + '%' }" />
        </div>
        <p class="text-purple-300 text-xs">{{ progressPercent }}% übersetzt</p>
      </div>
    </div>

    <!-- Setup Card – 2-Spalten-Layout -->
    <div v-else class="bg-white/10 backdrop-blur-md rounded-2xl p-5 w-full max-w-3xl shadow-2xl border border-white/20">
      <div class="grid grid-cols-2 gap-6">

        <!-- LINKE SPALTE: Spieler -->
        <div class="flex flex-col gap-4">

          <!-- Spieleranzahl -->
          <div>
            <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2">Spieler</p>
            <div class="flex gap-1.5">
              <button
                v-for="n in 5" :key="n" @click="playerCount = n"
                :class="[
                  'flex-1 py-2 rounded-lg font-bold text-sm transition-all',
                  playerCount === n ? 'bg-indigo-500 text-white shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'
                ]"
              >{{ n }}</button>
            </div>
          </div>

          <!-- Spielernamen -->
          <div class="flex flex-col gap-1.5">
            <div v-for="i in playerCount" :key="i" class="flex items-center gap-2">
              <span class="text-lg w-6">{{ ['🔵','🔴','🟢','🟡','🟣'][i-1] }}</span>
              <input
                v-model="playerNames[i-1]"
                :placeholder="`Spieler ${i}`"
                class="flex-1 bg-white/10 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm outline-none border border-white/20 focus:border-indigo-400 transition-colors"
                maxlength="20"
                @keydown.enter="startGame"
              />
            </div>
          </div>

          <!-- Schwierigkeit -->
          <div>
            <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2">Schwierigkeit</p>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="d in [
                  { value: 'any',    label: 'Mix',    emoji: '🎲' },
                  { value: 'easy',   label: 'Leicht', emoji: '😊' },
                  { value: 'medium', label: 'Mittel', emoji: '🤔' },
                  { value: 'hard',   label: 'Schwer', emoji: '🔥' },
                ]"
                :key="d.value"
                @click="difficulty = d.value as typeof difficulty"
                :class="[
                  'py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5',
                  difficulty === d.value ? 'bg-indigo-500 text-white shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'
                ]"
              >
                <span class="text-base">{{ d.emoji }}</span>
                <span>{{ d.label }}</span>
              </button>
            </div>
          </div>

          <!-- Fragen pro Spieler + Start -->
          <div>
            <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2">Fragen pro Spieler</p>
            <div class="flex gap-1.5 mb-4">
              <button
                v-for="n in [5, 10, 15, 20]" :key="n" @click="questionCount = n"
                :class="[
                  'flex-1 py-2 rounded-lg font-bold text-sm transition-all',
                  questionCount === n ? 'bg-indigo-500 text-white shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'
                ]"
              >{{ n }}</button>
            </div>

            <div v-if="quizStore.error" class="mb-3 bg-red-500/20 border border-red-400 text-red-200 rounded-lg p-2 text-xs">
              {{ quizStore.error }}
            </div>

            <button
              @click="startGame" :disabled="!canStart"
              :class="[
                'w-full py-3 rounded-xl font-bold text-base transition-all',
                canStart
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 shadow-lg hover:scale-105'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              ]"
            >Spiel starten 🚀</button>
          </div>
        </div>

        <!-- RECHTE SPALTE: Kategorie -->
        <div>
          <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2">Kategorie</p>

          <!-- Gemischt – volle Breite -->
          <button
            @click="category = 'any'"
            :class="[
              'w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm mb-2 transition-all border',
              category === 'any'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/20'
            ]"
          >
            <span>🎲</span> Gemischt
          </button>

          <!-- Icon-Raster 4 Spalten -->
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="cat in categories.slice(1)" :key="cat.id"
              @click="category = cat.id"
              :class="[
                'flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-xs font-medium transition-all border',
                category === cat.id
                  ? 'bg-indigo-500 text-white border-transparent shadow scale-105'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 border-white/10'
              ]"
            >
              <span class="text-lg">{{ cat.emoji }}</span>
              <span class="leading-tight text-center text-[10px]">{{ cat.name }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
