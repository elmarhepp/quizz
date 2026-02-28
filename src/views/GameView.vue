<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const quiz = useQuizStore()

const selectedAnswer = ref<string | null>(null)
const showResult = ref(false)
const timeLeft = ref(30)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)

onMounted(() => {
  if (!quiz.questions.length) {
    router.push('/')
    return
  }
  startTimer()
})

function startTimer() {
  timeLeft.value = 30
  clearTimer()
  timerInterval.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearTimer()
      if (!showResult.value) {
        submitAnswer(null)
      }
    }
  }, 1000)
}

function clearTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function submitAnswer(answer: string | null) {
  if (showResult.value) return
  clearTimer()
  selectedAnswer.value = answer
  showResult.value = true
  quiz.answerQuestion(answer ?? '')
}

function next() {
  if (quiz.isLastQuestion && quiz.currentPlayerIndex >= quiz.players.length - 1) {
    router.push('/ergebnis')
    return
  }
  quiz.nextTurn()
  selectedAnswer.value = null
  showResult.value = false
  startTimer()
}

const answerClass = (answer: string) => {
  if (!showResult.value) return 'bg-white/10 hover:bg-white/25 text-white border-white/20 hover:border-indigo-400 cursor-pointer hover:scale-102'
  if (answer === quiz.currentQuestion?.correct_answer) return 'bg-green-500/30 border-green-400 text-green-100'
  if (answer === selectedAnswer.value) return 'bg-red-500/30 border-red-400 text-red-100'
  return 'bg-white/5 border-white/10 text-white/40'
}

const progressPercent = computed(() =>
  ((quiz.currentQuestionIndex) / quiz.totalQuestions) * 100
)

const timerColor = computed(() => {
  if (timeLeft.value > 15) return 'text-green-400'
  if (timeLeft.value > 8) return 'text-yellow-400'
  return 'text-red-400'
})

const timerBg = computed(() => {
  if (timeLeft.value > 15) return 'bg-green-500'
  if (timeLeft.value > 8) return 'bg-yellow-500'
  return 'bg-red-500'
})

watch(() => quiz.currentQuestionIndex, () => {
  selectedAnswer.value = null
  showResult.value = false
})
</script>

<template>
  <div class="min-h-screen flex flex-col p-4 max-w-2xl mx-auto">

    <!-- Top Bar -->
    <div class="flex items-center justify-between mb-4 pt-4">
      <div class="text-purple-200 text-sm font-medium">
        Runde {{ quiz.round }} / {{ quiz.totalRounds }}
      </div>
      <div class="text-white font-bold text-lg">🎯 QuizZZ</div>
      <div class="text-purple-200 text-sm font-medium">
        Frage {{ quiz.currentQuestionIndex + 1 }} / {{ quiz.totalQuestions }}
      </div>
    </div>

    <!-- Fortschrittsbalken -->
    <div class="w-full bg-white/10 rounded-full h-2 mb-6">
      <div
        class="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
        :style="{ width: progressPercent + '%' }"
      />
    </div>

    <!-- Aktiver Spieler -->
    <div class="flex items-center justify-center gap-3 mb-6">
      <span class="text-3xl">{{ ['🔵','🔴','🟢','🟡','🟣'][quiz.currentPlayerIndex] }}</span>
      <div class="text-center">
        <p class="text-purple-300 text-sm">Jetzt dran:</p>
        <p class="text-white font-bold text-xl">{{ quiz.currentPlayer?.name }}</p>
      </div>
    </div>

    <!-- Punkte-Anzeige -->
    <div class="flex justify-center gap-3 mb-6 flex-wrap">
      <div
        v-for="(player, i) in quiz.players"
        :key="player.id"
        :class="[
          'px-4 py-2 rounded-full text-sm font-medium transition-all',
          i === quiz.currentPlayerIndex
            ? 'bg-indigo-500 text-white scale-110 shadow-lg'
            : 'bg-white/10 text-white/60'
        ]"
      >
        {{ ['🔵','🔴','🟢','🟡','🟣'][i] }} {{ player.name }}: {{ player.score }}
      </div>
    </div>

    <!-- Timer -->
    <div class="flex items-center justify-center gap-3 mb-6">
      <div class="w-48 bg-white/10 rounded-full h-3">
        <div
          class="h-3 rounded-full transition-all duration-1000"
          :class="timerBg"
          :style="{ width: (timeLeft / 30 * 100) + '%' }"
        />
      </div>
      <span :class="['font-bold text-xl tabular-nums', timerColor]">{{ timeLeft }}s</span>
    </div>

    <!-- Frage Card -->
    <div class="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/20 shadow-2xl flex-1 flex flex-col justify-between">

      <!-- Kategorie + Schwierigkeit -->
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <span class="bg-indigo-500/30 text-indigo-200 text-xs px-3 py-1 rounded-full">
          {{ quiz.currentQuestion?.category }}
        </span>
        <span :class="[
          'text-xs px-3 py-1 rounded-full',
          quiz.currentQuestion?.difficulty === 'easy' ? 'bg-green-500/30 text-green-200' :
          quiz.currentQuestion?.difficulty === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
          'bg-red-500/30 text-red-200'
        ]">
          {{ quiz.currentQuestion?.difficulty === 'easy' ? '😊 Leicht' :
             quiz.currentQuestion?.difficulty === 'medium' ? '🤔 Mittel' : '🔥 Schwer' }}
        </span>
      </div>

      <!-- Frage Text -->
      <p class="text-white text-xl font-semibold text-center mb-6 leading-relaxed">
        {{ quiz.currentQuestion?.question }}
      </p>

      <!-- Antworten -->
      <div class="grid grid-cols-1 gap-3">
        <button
          v-for="answer in quiz.currentQuestion?.shuffledAnswers"
          :key="answer"
          @click="submitAnswer(answer)"
          :disabled="showResult"
          :class="['w-full py-4 px-6 rounded-2xl border text-left font-medium transition-all duration-200', answerClass(answer)]"
        >
          <span v-if="showResult && answer === quiz.currentQuestion?.correct_answer" class="mr-2">✅</span>
          <span v-else-if="showResult && answer === selectedAnswer && answer !== quiz.currentQuestion?.correct_answer" class="mr-2">❌</span>
          {{ answer }}
        </button>
      </div>

      <!-- Feedback -->
      <div v-if="showResult" class="mt-6 text-center">
        <div v-if="selectedAnswer === quiz.currentQuestion?.correct_answer || selectedAnswer === null">
          <p v-if="selectedAnswer === quiz.currentQuestion?.correct_answer" class="text-green-300 font-bold text-xl mb-1">Richtig! +1 Punkt 🎉</p>
          <p v-else class="text-red-300 font-bold text-xl mb-1">Zeit abgelaufen! ⏰</p>
          <p v-if="selectedAnswer === null" class="text-white/60 text-sm">Richtige Antwort: {{ quiz.currentQuestion?.correct_answer }}</p>
        </div>
        <div v-else>
          <p class="text-red-300 font-bold text-xl mb-1">Falsch! ❌</p>
          <p class="text-white/60 text-sm">Richtige Antwort: {{ quiz.currentQuestion?.correct_answer }}</p>
        </div>

        <button
          @click="next"
          class="mt-4 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold hover:from-indigo-400 hover:to-purple-400 transition-all hover:scale-105 shadow-lg"
        >
          {{ quiz.isLastQuestion && quiz.currentPlayerIndex >= quiz.players.length - 1 ? 'Ergebnis anzeigen 🏆' : 'Weiter →' }}
        </button>
      </div>
    </div>
  </div>
</template>
