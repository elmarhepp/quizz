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
  categories: string[]
  difficulty: 'easy' | 'medium' | 'hard' | 'any'
}

const sharedCategories = ref<string[]>(['any'])
const individualMode = ref(false)

const playerSettings = ref<PlayerSetting[]>(
  Array.from({ length: 5 }, () => ({ name: '', categories: ['any'], difficulty: 'any' }))
)

const activePlayers = computed(() => playerSettings.value.slice(0, playerCount.value))
const canStart = computed(() => activePlayers.value.every(p => p.name.trim().length > 0))

function toggleCategory(current: string[], catId: string): string[] {
  if (catId === 'any') return ['any']
  const without = current.filter(id => id !== 'any')
  const idx = without.indexOf(catId)
  if (idx >= 0) return without.length > 1 ? without.filter(id => id !== catId) : without
  return [...without, catId]
}

function toggleShared(catId: string) {
  sharedCategories.value = toggleCategory(sharedCategories.value, catId)
}

function togglePlayer(i: number, catId: string) {
  playerSettings.value[i]!.categories = toggleCategory(playerSettings.value[i]!.categories, catId)
}

function toggleIndividualMode() {
  individualMode.value = !individualMode.value
  if (individualMode.value) {
    playerSettings.value.forEach(s => { s.categories = [...sharedCategories.value] })
  }
}

async function startGame() {
  if (!canStart.value) return

  const players: Player[] = activePlayers.value.map((s, i) => {
    const cats = individualMode.value ? s.categories : sharedCategories.value
    return {
      id: i,
      name: s.name.trim(),
      score: 0,
      answers: [],
      jokers: 2,
      categories: cats,
      categoryNames: cats.map(id => categories.find(c => c.id === id)?.name ?? 'Gemischt'),
      difficulty: s.difficulty,
    }
  })

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

      <!-- Spaltenköpfe -->
      <div class="grid grid-cols-[2rem_1fr_auto] gap-2 items-center mb-1 px-1">
        <div></div>
        <p class="text-white/40 text-xs uppercase tracking-wide">Name</p>
        <p class="text-white/40 text-xs uppercase tracking-wide">Schwierigkeit</p>
      </div>

      <!-- Pro-Spieler Zeilen -->
      <div class="flex flex-col gap-2 mb-5">
        <div v-for="(setting, i) in activePlayers" :key="i">
          <div class="grid grid-cols-[2rem_1fr_auto] gap-2 items-center">
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

          <!-- Individuelle Kategorie-Auswahl (wenn aktiviert) -->
          <div v-if="individualMode" class="mt-2 pl-8">
            <div class="flex flex-wrap gap-1">
              <button
                v-for="cat in categories" :key="cat.id"
                @click="togglePlayer(i, cat.id)"
                :title="cat.name"
                :class="[
                  'flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all',
                  setting.categories.includes(cat.id)
                    ? 'bg-indigo-500 border-indigo-400 text-white shadow'
                    : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'
                ]"
              >
                <span>{{ cat.emoji }}</span>
                <span>{{ cat.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Kategorie-Sektion -->
      <div class="mb-5">
        <div class="flex items-center justify-between mb-3">
          <p class="text-white/60 text-xs font-semibold uppercase tracking-wide">
            Quizfragen in folgenden Kategorien
          </p>
          <!-- Toggle: Pro Spieler -->
          <button @click="toggleIndividualMode" class="flex items-center gap-2 cursor-pointer">
            <span class="text-white/40 text-xs">Pro Spieler</span>
            <div :class="['w-9 h-5 rounded-full relative transition-all', individualMode ? 'bg-indigo-500' : 'bg-white/20']">
              <div :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200', individualMode ? 'left-4' : 'left-0.5']" />
            </div>
          </button>
        </div>

        <!-- Geteilte Kategorie-Auswahl (Standard) -->
        <div v-if="!individualMode" class="flex flex-wrap gap-1.5">
          <button
            v-for="cat in categories" :key="cat.id"
            @click="toggleShared(cat.id)"
            :class="[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border transition-all',
              sharedCategories.includes(cat.id)
                ? 'bg-indigo-500 border-indigo-400 text-white shadow'
                : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'
            ]"
          >
            <span>{{ cat.emoji }}</span>
            <span class="text-xs">{{ cat.name }}</span>
          </button>
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
