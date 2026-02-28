import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, Question, QuizSettings } from '../types'

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function decodeHtml(html: string): string {
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

function processQuestion(q: Question): Question {
  const correct = decodeHtml(q.correct_answer)
  const incorrect = q.incorrect_answers.map(decodeHtml)
  return {
    ...q,
    question: decodeHtml(q.question),
    correct_answer: correct,
    incorrect_answers: incorrect,
    shuffledAnswers: shuffleArray([correct, ...incorrect]),
  }
}

// Persists for the page session — reset on reload
let quotaExceeded = false
const SEP = ' ||| '

async function translateBatch(texts: string[]): Promise<string[]> {
  if (quotaExceeded) return texts
  const joined = texts.join(SEP)
  if (joined.length > 450) return texts  // MyMemory free-tier limit
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(joined)}&langpair=en|de`
    )
    const data = await res.json()
    if (data.quotaFinished) { quotaExceeded = true; return texts }
    if (data.responseStatus !== 200) return texts
    const parts: string[] = (data.responseData.translatedText as string).split(SEP)
    if (parts.length !== texts.length) return texts
    return parts.map((p, i) => p.trim() || texts[i]!)
  } catch {
    return texts
  }
}

async function translateQuestion(q: Question): Promise<Question> {
  const texts = [q.question, q.correct_answer, ...q.incorrect_answers]
  const translated = await translateBatch(texts)
  const correct = translated[1] ?? q.correct_answer
  const incorrect = [
    translated[2] ?? q.incorrect_answers[0]!,
    translated[3] ?? q.incorrect_answers[1]!,
    translated[4] ?? q.incorrect_answers[2]!,
  ]
  return {
    ...q,
    question: translated[0] ?? q.question,
    correct_answer: correct,
    incorrect_answers: incorrect,
    shuffledAnswers: shuffleArray([correct, ...incorrect]),
  }
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
      if (remaining > 0) await new Promise(r => setTimeout(r, 1000))
    }

    return results
  }

  async function loadQuestions(quizSettings: QuizSettings) {
    isLoading.value = true
    error.value = null
    settings.value = quizSettings
    players.value = quizSettings.players.map(p => ({ ...p, jokers: 2 }))

    try {
      // Fetch questions individually per player with their own settings
      const perPlayerQuestions = await Promise.all(
        quizSettings.players.map(player =>
          fetchFromAPI(quizSettings.questionCount, player.category, player.difficulty)
        )
      )

      // Interleave round by round: [P0Q0, P1Q0, P2Q0, P0Q1, P1Q1, P2Q1, ...]
      const interleaved: Question[] = []
      for (let round = 0; round < quizSettings.questionCount; round++) {
        for (let p = 0; p < quizSettings.players.length; p++) {
          const q = perPlayerQuestions[p]?.[round]
          if (q) interleaved.push(processQuestion(q))
        }
      }

      // Translate while quota allows; falls back to English silently
      const translated: Question[] = []
      for (const q of interleaved) {
        translated.push(await translateQuestion(q))
      }
      questions.value = translated
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
    if (isCorrect) player.score++
  }

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
