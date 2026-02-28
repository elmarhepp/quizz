<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const quiz = useQuizStore()

const selectedAnswer = ref<string | null>(null)
const showResult = ref(false)
const eliminatedAnswers = ref<string[]>([])
const jokerUsedThisTurn = ref(false)
const timeLeft = ref(30)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)

onMounted(() => {
  if (!quiz.questions.length) { router.push('/'); return }
  startTimer()
})

function startTimer() {
  timeLeft.value = 30
  clearTimer()
  timerInterval.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) { clearTimer(); if (!showResult.value) submitAnswer(null) }
  }, 1000)
}

function clearTimer() {
  if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
}

function submitAnswer(answer: string | null) {
  if (showResult.value) return
  clearTimer()
  selectedAnswer.value = answer
  showResult.value = true
  quiz.answerQuestion(answer ?? '')
}

function handleJoker() {
  if (jokerUsedThisTurn.value || showResult.value || quiz.currentPlayerJokers <= 0) return
  eliminatedAnswers.value = quiz.useJoker()
  jokerUsedThisTurn.value = true
}

function next() {
  if (quiz.isLastQuestion) { router.push('/ergebnis'); return }
  quiz.nextTurn()
  selectedAnswer.value = null
  showResult.value = false
  eliminatedAnswers.value = []
  jokerUsedThisTurn.value = false
  startTimer()
}

const answerClass = (answer: string) => {
  if (eliminatedAnswers.value.includes(answer)) return 'bg-white/5 border-white/10 text-white/25 line-through cursor-not-allowed'
  if (!showResult.value) return 'bg-white/10 hover:bg-white/25 text-white border-white/20 hover:border-indigo-400 cursor-pointer'
  if (answer === quiz.currentQuestion?.correct_answer) return 'bg-green-500/30 border-green-400 text-green-100'
  if (answer === selectedAnswer.value) return 'bg-red-500/30 border-red-400 text-red-100'
  return 'bg-white/5 border-white/10 text-white/40'
}

const progressPercent = computed(() => (quiz.currentQuestionIndex / quiz.totalQuestions) * 100)

const timerColor = computed(() => timeLeft.value > 15 ? 'text-green-400' : timeLeft.value > 8 ? 'text-yellow-400' : 'text-red-400')
const timerBg = computed(() => timeLeft.value > 15 ? 'bg-green-500' : timeLeft.value > 8 ? 'bg-yellow-500' : 'bg-red-500')

watch(() => quiz.currentQuestionIndex, () => {
  selectedAnswer.value = null
  showResult.value = false
  eliminatedAnswers.value = []
  jokerUsedThisTurn.value = false
})
</script>

<template>
  <div class="min-h-screen flex flex-col p-3 max-w-3xl mx-auto">

    <!-- Top Bar -->
    <div class="flex items-center justify-between pt-3 mb-2">
      <span class="text-purple-300 text-xs">Runde {{ quiz.round }}/{{ quiz.totalRounds }}</span>
      <span class="text-white font-bold">🎯 QuizZZ</span>
      <span class="text-purple-300 text-xs">Frage {{ quiz.currentQuestionIndex + 1 }}/{{ quiz.totalQuestions }}</span>
    </div>

    <!-- Fortschrittsbalken -->
    <div class="w-full bg-white/10 rounded-full h-1.5 mb-3">
      <div class="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
        :style="{ width: progressPercent + '%' }" />
    </div>

    <!-- Spieler + Punkte in einer Zeile -->
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <!-- Aktiver Spieler -->
      <div class="flex items-center gap-2">
        <span class="text-2xl">{{ ['🔵','🔴','🟢','🟡','🟣'][quiz.currentPlayerIndex] }}</span>
        <div>
          <p class="text-purple-300 text-xs leading-none">Jetzt dran</p>
          <p class="text-white font-bold text-base leading-tight">{{ quiz.currentPlayer?.name }}</p>
        </div>
      </div>

      <!-- Scoreboard -->
      <div class="flex gap-1.5 flex-wrap">
        <span
          v-for="(player, i) in quiz.players" :key="player.id"
          :class="[
            'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
            i === quiz.currentPlayerIndex ? 'bg-indigo-500 text-white scale-110 shadow' : 'bg-white/10 text-white/60'
          ]"
        >{{ ['🔵','🔴','🟢','🟡','🟣'][i] }} {{ player.name }}: {{ player.score }}</span>
      </div>

      <!-- Timer -->
      <div class="flex items-center gap-2">
        <div class="w-28 bg-white/10 rounded-full h-2">
          <div class="h-2 rounded-full transition-all duration-1000" :class="timerBg"
            :style="{ width: (timeLeft / 30 * 100) + '%' }" />
        </div>
        <span :class="['font-bold text-sm tabular-nums', timerColor]">{{ timeLeft }}s</span>
      </div>
    </div>

    <!-- Frage Card -->
    <div class="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-2xl flex-1 flex flex-col">

      <!-- Badges + Joker-Button -->
      <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="bg-indigo-500/30 text-indigo-200 text-xs px-2.5 py-0.5 rounded-full">
            {{ quiz.currentQuestion?.category }}
          </span>
          <span :class="[
            'text-xs px-2.5 py-0.5 rounded-full',
            quiz.currentQuestion?.difficulty === 'easy' ? 'bg-green-500/30 text-green-200' :
            quiz.currentQuestion?.difficulty === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
            'bg-red-500/30 text-red-200'
          ]">
            {{ quiz.currentQuestion?.difficulty === 'easy' ? '😊 Leicht' :
               quiz.currentQuestion?.difficulty === 'medium' ? '🤔 Mittel' : '🔥 Schwer' }}
          </span>
        </div>

        <!-- Joker-Button -->
        <button
          @click="handleJoker"
          :disabled="jokerUsedThisTurn || showResult || quiz.currentPlayerJokers <= 0"
          :class="[
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border',
            !jokerUsedThisTurn && !showResult && quiz.currentPlayerJokers > 0
              ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 hover:bg-yellow-500/30'
              : 'bg-white/5 border-white/10 text-white/25 cursor-not-allowed'
          ]"
        >
          <span>🃏</span>
          <span>Joker</span>
          <span class="bg-yellow-400/20 rounded-full px-1.5">{{ quiz.currentPlayerJokers }}×</span>
        </button>
      </div>

      <!-- Frage Text -->
      <p class="text-white text-lg font-semibold text-center mb-4 leading-snug flex-1 flex items-center justify-center">
        {{ quiz.currentQuestion?.question }}
      </p>

      <!-- Antworten: 2x2 Grid -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <button
          v-for="(answer, idx) in quiz.currentQuestion?.shuffledAnswers"
          :key="answer"
          @click="submitAnswer(answer)"
          :disabled="showResult || eliminatedAnswers.includes(answer)"
          :class="['py-3 px-4 rounded-xl border text-left text-sm font-medium transition-all duration-200', answerClass(answer)]"
        >
          <span class="text-white/40 text-xs mr-1.5">{{ ['A','B','C','D'][idx] }}</span>
          <span v-if="showResult && answer === quiz.currentQuestion?.correct_answer" class="mr-1">✅</span>
          <span v-else-if="showResult && answer === selectedAnswer && answer !== quiz.currentQuestion?.correct_answer" class="mr-1">❌</span>
          {{ answer }}
        </button>
      </div>

      <!-- Feedback -->
      <div v-if="showResult" class="text-center pt-2 border-t border-white/10">
        <div class="flex items-center justify-between">
          <div class="text-left">
            <p v-if="selectedAnswer === quiz.currentQuestion?.correct_answer" class="text-green-300 font-bold">Richtig! +1 Punkt 🎉</p>
            <p v-else-if="selectedAnswer === null" class="text-yellow-300 font-bold">Zeit abgelaufen! ⏰</p>
            <p v-else class="text-red-300 font-bold">Falsch! ❌</p>
            <p v-if="selectedAnswer !== quiz.currentQuestion?.correct_answer" class="text-white/50 text-xs mt-0.5">
              Richtig: {{ quiz.currentQuestion?.correct_answer }}
            </p>
          </div>
          <button
            @click="next"
            class="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-sm hover:from-indigo-400 hover:to-purple-400 transition-all hover:scale-105 shadow"
          >
            {{ quiz.isLastQuestion ? 'Ergebnis 🏆' : 'Weiter →' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
