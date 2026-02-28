<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const quiz = useQuizStore()

onMounted(() => {
  if (!quiz.players.length) {
    router.push('/')
  }
})

const emojis = ['🔵', '🔴', '🟢', '🟡', '🟣']
const medals = ['🥇', '🥈', '🥉']

const winner = computed(() => quiz.sortedPlayers[0])

const accuracy = (player: typeof quiz.players[0]) => {
  if (!player.answers.length) return 0
  return Math.round((player.score / player.answers.length) * 100)
}

function playAgain() {
  quiz.reset()
  router.push('/')
}

function newRound() {
  if (!quiz.settings) return
  quiz.loadQuestions(quiz.settings).then(() => {
    if (!quiz.error) router.push('/spiel')
  })
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="text-6xl mb-3">🏆</div>
      <h1 class="text-4xl font-bold text-white mb-2">Spiel beendet!</h1>
      <p class="text-purple-200 text-lg">
        Herzlichen Glückwunsch, <span class="text-yellow-300 font-bold">{{ winner?.name }}</span>!
      </p>
    </div>

    <!-- Rangliste -->
    <div class="w-full max-w-lg mb-8">
      <div
        v-for="(player, index) in quiz.sortedPlayers"
        :key="player.id"
        :class="[
          'flex items-center gap-4 p-4 rounded-2xl mb-3 border transition-all',
          index === 0
            ? 'bg-yellow-500/20 border-yellow-400/50 shadow-lg shadow-yellow-500/10'
            : 'bg-white/10 border-white/20'
        ]"
      >
        <!-- Platz -->
        <div class="text-3xl w-10 text-center">
          {{ index < 3 ? medals[index] : `${index + 1}.` }}
        </div>

        <!-- Spieler Info -->
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span>{{ emojis[quiz.players.indexOf(quiz.players.find(p => p.id === player.id)!)] }}</span>
            <span class="text-white font-bold text-lg">{{ player.name }}</span>
            <span v-if="index === 0" class="text-yellow-300 text-sm">👑 Sieger</span>
          </div>
          <!-- Antwort-Balken -->
          <div class="flex gap-1 flex-wrap">
            <span
              v-for="(correct, i) in player.answers"
              :key="i"
              :class="['w-4 h-4 rounded-full text-xs', correct ? 'bg-green-400' : 'bg-red-400']"
            />
          </div>
        </div>

        <!-- Punkte -->
        <div class="text-right">
          <div class="text-white font-bold text-2xl">{{ player.score }}</div>
          <div class="text-purple-300 text-xs">{{ accuracy(player) }}% richtig</div>
        </div>
      </div>
    </div>

    <!-- Statistiken -->
    <div class="bg-white/10 backdrop-blur-md rounded-3xl p-6 w-full max-w-lg mb-8 border border-white/20">
      <h2 class="text-white font-semibold text-lg mb-4 text-center">Spielstatistiken</h2>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-3xl font-bold text-indigo-300">{{ quiz.totalQuestions }}</div>
          <div class="text-purple-200 text-sm">Fragen</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-purple-300">{{ quiz.players.length }}</div>
          <div class="text-purple-200 text-sm">Spieler</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-pink-300">{{ quiz.settings?.categoryName }}</div>
          <div class="text-purple-200 text-sm">Kategorie</div>
        </div>
      </div>
    </div>

    <!-- Buttons -->
    <div class="flex gap-4 flex-wrap justify-center">
      <button
        @click="newRound"
        class="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold text-lg hover:from-indigo-400 hover:to-purple-400 transition-all hover:scale-105 shadow-lg"
      >
        Neue Runde 🔄
      </button>
      <button
        @click="playAgain"
        class="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all hover:scale-105 border border-white/20"
      >
        Neustart 🏠
      </button>
    </div>
  </div>
</template>
