import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, Question, QuizSettings } from '../types'

const SEP = ' ||| '

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function decodeHtml(html: string): string {
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

async function translateText(text: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|de`
    const res = await fetch(url)
    const data = await res.json()
    if (data.responseStatus === 200) return data.responseData.translatedText as string
    return text
  } catch {
    return text
  }
}

// Translates question + all answers in a single API call using a separator.
// Falls back to individual calls if the separator is mangled.
async function translateQuestionParts(
  question: string,
  correct: string,
  incorrect: string[]
): Promise<{ question: string; correct: string; incorrect: string[] }> {
  const parts = [question, correct, ...incorrect]
  const combined = parts.join(SEP)

  const translated = await translateText(combined)
  const split = translated.split(SEP)

  if (split.length === parts.length) {
    return { question: split[0] ?? question, correct: split[1] ?? correct, incorrect: split.slice(2) }
  }

  // Fallback: translate each part individually
  const [tq, tc, ...ti] = await Promise.all(parts.map(translateText))
  return { question: tq ?? question, correct: tc ?? correct, incorrect: ti }
}

export const useQuizStore = defineStore('quiz', () => {
  const players = ref<Player[]>([])
  const questions = ref<Question[]>([])
  const currentQuestionIndex = ref(0)
  const currentPlayerIndex = ref(0)
  const isLoading = ref(false)
  const loadingMessage = ref('')
  const translationProgress = ref({ done: 0, total: 0 })
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

  async function fetchFromAPI(amount: number, category: string, difficulty: string): Promise<Question[]> {
    const results: Question[] = []
    let remaining = amount

    while (remaining > 0) {
      const batchAmount = Math.min(remaining, 50)
      let url = `https://opentdb.com/api.php?amount=${batchAmount}&type=multiple`
      if (category !== 'any') url += `&category=${category}`
      if (difficulty !== 'any') url += `&difficulty=${difficulty}`

      const res = await fetch(url)
      const data = await res.json()

      if (data.response_code !== 0) {
        throw new Error('Nicht genügend Fragen verfügbar. Bitte andere Einstellungen wählen.')
      }

      results.push(...data.results)
      remaining -= batchAmount

      // Rate-limit: wait 1s before second request
      if (remaining > 0) await new Promise(r => setTimeout(r, 1000))
    }

    return results
  }

  async function loadQuestions(quizSettings: QuizSettings) {
    isLoading.value = true
    error.value = null
    settings.value = quizSettings
    // Always initialise players with 2 jokers
    players.value = quizSettings.players.map(p => ({ ...p, jokers: 2 }))
    translationProgress.value = { done: 0, total: 0 }

    // Each player gets their own set of questions
    const totalNeeded = quizSettings.questionCount * quizSettings.players.length

    try {
      loadingMessage.value = 'Lade Fragen...'
      const rawQuestions = await fetchFromAPI(totalNeeded, quizSettings.category, quizSettings.difficulty)

      translationProgress.value = { done: 0, total: rawQuestions.length }
      loadingMessage.value = `Übersetze 1 von ${rawQuestions.length}...`

      const translated: Question[] = []
      const BATCH_SIZE = 8

      for (let i = 0; i < rawQuestions.length; i += BATCH_SIZE) {
        const batch = rawQuestions.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(
          batch.map(async (q: Question) => {
            const decoded = {
              question: decodeHtml(q.question),
              correct_answer: decodeHtml(q.correct_answer),
              incorrect_answers: q.incorrect_answers.map(decodeHtml),
            }

            const { question, correct, incorrect } = await translateQuestionParts(
              decoded.question,
              decoded.correct_answer,
              decoded.incorrect_answers
            )

            translationProgress.value.done++
            loadingMessage.value = `Übersetze ${translationProgress.value.done} von ${translationProgress.value.total}...`

            return {
              ...q,
              question,
              correct_answer: correct,
              incorrect_answers: incorrect,
              shuffledAnswers: shuffleArray([correct, ...incorrect]),
            }
          })
        )
        translated.push(...results)
      }

      questions.value = translated
      currentQuestionIndex.value = 0
      currentPlayerIndex.value = 0
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Fehler beim Laden der Fragen.'
    } finally {
      isLoading.value = false
      loadingMessage.value = ''
    }
  }

  function answerQuestion(answer: string) {
    const question = questions.value[currentQuestionIndex.value]
    if (!question) return
    const isCorrect = answer === question.correct_answer
    const player = players.value[currentPlayerIndex.value]
    if (!player) return
    player.answers.push(isCorrect)
    if (isCorrect) player.score++
  }

  // Returns 2 wrong answers to eliminate for the current question
  function useJoker(): string[] {
    const player = players.value[currentPlayerIndex.value]
    if (!player || player.jokers <= 0) return []
    const question = questions.value[currentQuestionIndex.value]
    if (!question) return []
    player.jokers--
    const wrongAnswers = (question.shuffledAnswers ?? []).filter(a => a !== question.correct_answer)
    return shuffleArray(wrongAnswers).slice(0, 2)
  }

  const currentPlayerJokers = computed(() => players.value[currentPlayerIndex.value]?.jokers ?? 0)

  // Each turn always advances to the next question; player follows via modulo
  function nextTurn() {
    currentQuestionIndex.value++
    currentPlayerIndex.value = currentQuestionIndex.value % players.value.length
  }

  function reset() {
    players.value = []
    questions.value = []
    currentQuestionIndex.value = 0
    currentPlayerIndex.value = 0
    error.value = null
    settings.value = null
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
    loadingMessage,
    translationProgress,
    error,
    settings,
    currentQuestion,
    currentPlayer,
    totalQuestions,
    isLastQuestion,
    round,
    totalRounds,
    sortedPlayers,
    currentPlayerJokers,
    loadQuestions,
    answerQuestion,
    useJoker,
    nextTurn,
    reset,
  }
})
