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
  { id: 'any', name: 'Alle Kategorien' },
  { id: '9', name: 'Allgemeinwissen' },
  { id: '10', name: 'Bücher' },
  { id: '11', name: 'Film' },
  { id: '12', name: 'Musik' },
  { id: '14', name: 'Fernsehen' },
  { id: '15', name: 'Videospiele' },
  { id: '17', name: 'Wissenschaft & Natur' },
  { id: '18', name: 'Computer' },
  { id: '19', name: 'Mathematik' },
  { id: '20', name: 'Mythologie' },
  { id: '21', name: 'Sport' },
  { id: '22', name: 'Geographie' },
  { id: '23', name: 'Geschichte' },
  { id: '25', name: 'Kunst' },
  { id: '27', name: 'Tiere' },
  { id: '28', name: 'Fahrzeuge' },
]

const categoryName = computed(
  () => categories.find(c => c.id === category.value)?.name ?? 'Alle Kategorien'
)

const activePlayers = computed(() =>
  playerNames.value.slice(0, playerCount.value)
)

const canStart = computed(() =>
  activePlayers.value.every(name => name.trim().length > 0)
)

async function startGame() {
  if (!canStart.value) return

  const players: Player[] = activePlayers.value.map((name, i) => ({
    id: i,
    name: name.trim(),
    score: 0,
    answers: [],
  }))

  const settings: QuizSettings = {
    players,
    category: category.value,
    categoryName: categoryName.value,
    difficulty: difficulty.value,
    questionCount: questionCount.value,
  }

  await quizStore.loadQuestions(settings)

  if (!quizStore.error) {
    router.push('/spiel')
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-5xl font-bold text-white mb-2">
        🎯 QuizZZ
      </h1>
      <p class="text-purple-200 text-lg">Das Quizspiel für 1–5 Spieler</p>
    </div>

    <!-- Setup Card -->
    <div class="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-xl shadow-2xl border border-white/20">

      <!-- Spieleranzahl -->
      <div class="mb-6">
        <h2 class="text-white font-semibold text-lg mb-3">Wie viele Spieler?</h2>
        <div class="flex gap-2">
          <button
            v-for="n in 5"
            :key="n"
            @click="playerCount = n"
            :class="[
              'flex-1 py-3 rounded-xl font-bold text-lg transition-all',
              playerCount === n
                ? 'bg-indigo-500 text-white shadow-lg scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            ]"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <!-- Spielernamen -->
      <div class="mb-6">
        <h2 class="text-white font-semibold text-lg mb-3">Spielernamen</h2>
        <div class="flex flex-col gap-2">
          <div
            v-for="i in playerCount"
            :key="i"
            class="flex items-center gap-3"
          >
            <span class="text-2xl">{{ ['🔵','🔴','🟢','🟡','🟣'][i-1] }}</span>
            <input
              v-model="playerNames[i-1]"
              :placeholder="`Spieler ${i}`"
              class="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-indigo-400 transition-colors"
              maxlength="20"
              @keydown.enter="startGame"
            />
          </div>
        </div>
      </div>

      <!-- Kategorie -->
      <div class="mb-6">
        <h2 class="text-white font-semibold text-lg mb-3">Kategorie</h2>
        <select
          v-model="category"
          class="w-full bg-white/10 text-white rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-indigo-400 transition-colors"
        >
          <option v-for="cat in categories" :key="cat.id" :value="cat.id" class="bg-indigo-900">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- Schwierigkeit -->
      <div class="mb-6">
        <h2 class="text-white font-semibold text-lg mb-3">Schwierigkeit</h2>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="d in [
              { value: 'any', label: 'Gemischt', emoji: '🎲' },
              { value: 'easy', label: 'Leicht', emoji: '😊' },
              { value: 'medium', label: 'Mittel', emoji: '🤔' },
              { value: 'hard', label: 'Schwer', emoji: '🔥' },
            ]"
            :key="d.value"
            @click="difficulty = d.value as typeof difficulty"
            :class="[
              'py-3 px-2 rounded-xl font-medium text-sm transition-all flex flex-col items-center gap-1',
              difficulty === d.value
                ? 'bg-indigo-500 text-white shadow-lg scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            ]"
          >
            <span class="text-xl">{{ d.emoji }}</span>
            <span>{{ d.label }}</span>
          </button>
        </div>
      </div>

      <!-- Fragenanzahl -->
      <div class="mb-8">
        <h2 class="text-white font-semibold text-lg mb-3">Anzahl Fragen</h2>
        <div class="flex gap-2">
          <button
            v-for="n in [5, 10, 15, 20]"
            :key="n"
            @click="questionCount = n"
            :class="[
              'flex-1 py-3 rounded-xl font-bold transition-all',
              questionCount === n
                ? 'bg-indigo-500 text-white shadow-lg scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            ]"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <!-- Fehler -->
      <div v-if="quizStore.error" class="mb-4 bg-red-500/20 border border-red-400 text-red-200 rounded-xl p-4 text-sm">
        {{ quizStore.error }}
      </div>

      <!-- Start Button -->
      <button
        @click="startGame"
        :disabled="!canStart || quizStore.isLoading"
        :class="[
          'w-full py-4 rounded-2xl font-bold text-xl transition-all',
          canStart && !quizStore.isLoading
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 shadow-lg hover:shadow-indigo-500/25 hover:scale-105'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        ]"
      >
        <span v-if="quizStore.isLoading">Lade Fragen...</span>
        <span v-else>Spiel starten 🚀</span>
      </button>
    </div>
  </div>
</template>
