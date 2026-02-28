import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, Question, QuizSettings } from '../types'

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export const useQuizStore = defineStore('quiz', () => {
  const players = ref<Player[]>([])
  const questions = ref<Question[]>([])
  const currentQuestionIndex = ref(0)
  const currentPlayerIndex = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const settings = ref<QuizSettings | null>(null)

  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
  const currentPlayer = computed(() => players.value[currentPlayerIndex.value])
  const totalQuestions = computed(() => questions.value.length)
  const isLastQuestion = computed(
    () => currentQuestionIndex.value >= questions.value.length - 1
  )

  const round = computed(() =>
    Math.floor(currentQuestionIndex.value / players.value.length) + 1
  )

  const totalRounds = computed(() =>
    Math.ceil(questions.value.length / players.value.length)
  )

  async function loadQuestions(quizSettings: QuizSettings) {
    isLoading.value = true
    error.value = null
    settings.value = quizSettings
    players.value = quizSettings.players

    try {
      let url = `https://opentdb.com/api.php?amount=${quizSettings.questionCount}&type=multiple`
      if (quizSettings.category !== 'any') url += `&category=${quizSettings.category}`
      if (quizSettings.difficulty !== 'any') url += `&difficulty=${quizSettings.difficulty}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.response_code !== 0) {
        throw new Error('Nicht genügend Fragen für diese Einstellungen verfügbar.')
      }

      questions.value = data.results.map((q: Question) => ({
        ...q,
        question: decodeHtml(q.question),
        correct_answer: decodeHtml(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(decodeHtml),
        shuffledAnswers: shuffleArray([q.correct_answer, ...q.incorrect_answers].map(decodeHtml)),
      }))

      currentQuestionIndex.value = 0
      currentPlayerIndex.value = 0
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Fehler beim Laden der Fragen.'
    } finally {
      isLoading.value = false
    }
  }

  function answerQuestion(answer: string) {
    const question = questions.value[currentQuestionIndex.value]
    if (!question) return
    const isCorrect = answer === question.correct_answer
    const player = players.value[currentPlayerIndex.value]
    if (!player) return
    player.answers.push(isCorrect)
    if (isCorrect) {
      player.score++
    }
  }

  function nextTurn() {
    if (currentPlayerIndex.value < players.value.length - 1) {
      currentPlayerIndex.value++
    } else {
      currentPlayerIndex.value = 0
      currentQuestionIndex.value++
    }
  }

  function reset() {
    players.value = []
    questions.value = []
    currentQuestionIndex.value = 0
    currentPlayerIndex.value = 0
    error.value = null
    settings.value = null
  }

  function decodeHtml(html: string): string {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }

  const sortedPlayers = computed(() =>
    [...players.value].sort((a, b) => b.score - a.score)
  )

  return {
    players,
    questions,
    currentQuestionIndex,
    currentPlayerIndex,
    isLoading,
    error,
    settings,
    currentQuestion,
    currentPlayer,
    totalQuestions,
    isLastQuestion,
    round,
    totalRounds,
    sortedPlayers,
    loadQuestions,
    answerQuestion,
    nextTurn,
    reset,
  }
})
