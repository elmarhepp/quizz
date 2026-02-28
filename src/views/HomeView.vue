<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import type { Player, QuizSettings } from '../types'

const router = useRouter()
const quizStore = useQuizStore()

const playerCount = ref(2)
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

const difficulties = [
  { value: 'any',    label: 'Gemischt', emoji: '🎲' },
  { value: 'easy',   label: 'Leicht',   emoji: '😊' },
  { value: 'medium', label: 'Mittel',   emoji: '🤔' },
  { value: 'hard',   label: 'Schwer',   emoji: '🔥' },
]

const playerEmojis = ['🔵', '🔴', '🟢', '🟡', '🟣']

interface PlayerSetting {
  name: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard' | 'any'
}

const playerSettings = ref<PlayerSetting[]>(
  Array.from({ length: 5 }, () => ({ name: '', category: 'any', difficulty: 'any' }))
)

const activePlayers = computed(() => playerSettings.value.slice(0, playerCount.value))
const canStart = computed(() => activePlayers.value.every(p => p.name.trim().length > 0))

async function startGame() {
  if (!canStart.value) return

  const players: Player[] = activePlayers.value.map((s, i) => ({
    id: i,
    name: s.name.trim(),
    score: 0,
    answers: [],
    jokers: 2,
    category: s.category,
    categoryName: categories.find(c => c.id === s.category)?.name ?? 'Gemischt',
    difficulty: s.difficulty,
  }))

  const settings: QuizSettings = { players, questionCount: questionCount.value }
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
      <div class="text-4xl mb-3 animate-bounce">⏳</div>
      <p class="text-white font-bold">Lade Fragen...</p>
    </div>

    <!-- Setup Card -->
    <div v-else class="bg-white/10 backdrop-blur-md rounded-2xl p-5 w-full max-w-3xl shadow-2xl border border-white/20">

      <!-- Zeile 1: Spieleranzahl + Fragenanzahl -->
      <div class="flex gap-4 mb-5">
        <div class="flex-1">
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
        <div class="flex-1">
          <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2">Fragen pro Spieler</p>
          <div class="flex gap-1.5">
            <button
              v-for="n in [5, 10, 15, 20]" :key="n" @click="questionCount = n"
              :class="[
                'flex-1 py-2 rounded-lg font-bold text-sm transition-all',
                questionCount === n ? 'bg-indigo-500 text-white shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'
              ]"
            >{{ n }}</button>
          </div>
        </div>
      </div>

      <!-- Trennlinie + Spaltenköpfe -->
      <div class="grid grid-cols-[2rem_1fr_1fr_auto] gap-2 items-center mb-1 px-1">
        <div></div>
        <p class="text-white/40 text-xs uppercase tracking-wide">Name</p>
        <p class="text-white/40 text-xs uppercase tracking-wide">Kategorie</p>
        <p class="text-white/40 text-xs uppercase tracking-wide">Schwierigkeit</p>
      </div>

      <!-- Pro-Spieler Zeilen -->
      <div class="flex flex-col gap-2 mb-5">
        <div
          v-for="(setting, i) in activePlayers" :key="i"
          class="grid grid-cols-[2rem_1fr_1fr_auto] gap-2 items-center"
        >
          <!-- Emoji -->
          <span class="text-xl text-center">{{ playerEmojis[i] }}</span>

          <!-- Name -->
          <input
            v-model="setting.name"
            :placeholder="`Spieler ${i + 1}`"
            class="bg-white/10 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm outline-none border border-white/20 focus:border-indigo-400 transition-colors"
            maxlength="20"
            @keydown.enter="startGame"
          />

          <!-- Kategorie -->
          <select
            v-model="setting.category"
            class="bg-indigo-950/80 text-white rounded-lg px-2 py-2 text-sm outline-none border border-white/20 focus:border-indigo-400 transition-colors cursor-pointer"
          >
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.emoji }} {{ cat.name }}
            </option>
          </select>

          <!-- Schwierigkeit -->
          <select
            v-model="setting.difficulty"
            class="bg-indigo-950/80 text-white rounded-lg px-2 py-2 text-sm outline-none border border-white/20 focus:border-indigo-400 transition-colors cursor-pointer"
          >
            <option v-for="d in difficulties" :key="d.value" :value="d.value">
              {{ d.emoji }} {{ d.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Fehler -->
      <div v-if="quizStore.error" class="mb-3 bg-red-500/20 border border-red-400 text-red-200 rounded-lg p-2 text-xs">
        {{ quizStore.error }}
      </div>

      <!-- Start Button -->
      <button
        @click="startGame" :disabled="!canStart"
        :class="[
          'w-full py-3 rounded-xl font-bold text-base transition-all',
          canStart
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 shadow-lg hover:scale-105'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        ]"
      >
        Spiel starten 🚀
      </button>
    </div>
  </div>
</template>
