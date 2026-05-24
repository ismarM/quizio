export type QuizListItem = {
    id: number;
    title: string;
    description: string;
    category: string;
    questionCount: number;
    timeLimitMinutes: number;
    plays: string;
    status: "published" | "draft";
    opensAt: string;
    image: string;
};
  
export const featuredQuiz = {
  id: 1,
  title: "Science Quiz",
  description: "Test your knowledge in biology, chemistry and physics.",
  questionCount: 20,
  timeLimitMinutes: 15,
  status: "published",
};

export const quizzes: QuizListItem[] = [
  {
    id: 1,
    title: "Science Fundamentals",
    description: "Test your knowledge of biology, chemistry and physics basics.",
    category: "Science",
    questionCount: 20,
    timeLimitMinutes: 15,
    plays: "1.2k",
    status: "published",
    opensAt: "May 12",
    image: "/images/quizzes/science.png",
  },
  {
    id: 2,
    title: "Geography Basics",
    description: "Countries, capitals and world facts everyone should know.",
    category: "Geography",
    questionCount: 15,
    timeLimitMinutes: 10,
    plays: "980",
    status: "published",
    opensAt: "May 10",
    image: "/images/quizzes/geography.png",
  },
  {
    id: 3,
    title: "History Through Time",
    description: "Important events and historical periods that shaped our world.",
    category: "History",
    questionCount: 20,
    timeLimitMinutes: 20,
    plays: "1.1k",
    status: "published",
    opensAt: "May 8",
    image: "/images/quizzes/history.png",
  },
  {
    id: 4,
    title: "Math Challenge",
    description: "Logic, algebra and problem solving to challenge your brain.",
    category: "Math",
    questionCount: 25,
    timeLimitMinutes: 15,
    plays: "860",
    status: "published",
    opensAt: "May 6",
    image: "/images/quizzes/math.png",
  },
  {
    id: 5,
    title: "Tech Essentials",
    description: "Basic concepts in computers, programming and web technology.",
    category: "Technology",
    questionCount: 18,
    timeLimitMinutes: 15,
    plays: "640",
    status: "published",
    opensAt: "May 4",
    image: "/images/quizzes/technology.png",
  },
  {
    id: 6,
    title: "World Literature",
    description: "Famous authors, books and literary masterpieces.",
    category: "Literature",
    questionCount: 20,
    timeLimitMinutes: 20,
    plays: "520",
    status: "published",
    opensAt: "May 2",
    image: "/images/quizzes/literature.png",
  },
  {
    id: 7,
    title: "Art Appreciation",
    description: "Explore art history, movements and iconic artists.",
    category: "Arts",
    questionCount: 15,
    timeLimitMinutes: 12,
    plays: "410",
    status: "published",
    opensAt: "Apr 30",
    image: "/images/quizzes/arts.png",
  },
  {
    id: 8,
    title: "Space Exploration",
    description: "Planets, stars and the wonders of our universe.",
    category: "Science",
    questionCount: 20,
    timeLimitMinutes: 18,
    plays: "730",
    status: "published",
    opensAt: "Apr 28",
    image: "/images/quizzes/space.png",
  },
];

export function getQuizById(id: string | number) {
  return quizzes.find((quiz) => quiz.id === Number(id)) ?? null;
}

export const quizLeaderboardPreview = [
  { rank: 1, name: "Ana", score: 1450 },
  { rank: 2, name: "Jakob", score: 1320 },
  { rank: 3, name: "Tina", score: 1200 },
  { rank: 4, name: "Luka", score: 1100 },
  { rank: 5, name: "Mila", score: 980 },
];

export type AttemptQuestion = {
  id: number;
  text: string;
  type: "single_choice";
  points: number;
  options: {
    id: number;
    text: string;
  }[];
};

export const mockAttempt = {
  id: 1,
  quizId: 1,
  quizTitle: "Science Fundamentals",
  questionCount: 4,
  timeLeft: "12:45",
  questions: [
    {
      id: 1,
      text: "Which planet is known as the Red Planet?",
      type: "single_choice",
      points: 5,
      options: [
        { id: 1, text: "Earth" },
        { id: 2, text: "Mars" },
        { id: 3, text: "Jupiter" },
        { id: 4, text: "Venus" },
      ],
    },
    {
      id: 2,
      text: "What gas do plants absorb from the atmosphere?",
      type: "single_choice",
      points: 5,
      options: [
        { id: 1, text: "Oxygen" },
        { id: 2, text: "Carbon dioxide" },
        { id: 3, text: "Hydrogen" },
        { id: 4, text: "Nitrogen" },
      ],
    },
    {
      id: 3,
      text: "How many bones are in the adult human body?",
      type: "single_choice",
      points: 5,
      options: [
        { id: 1, text: "186" },
        { id: 2, text: "206" },
        { id: 3, text: "226" },
        { id: 4, text: "246" },
      ],
    },
    {
      id: 4,
      text: "Which force keeps planets in orbit around the Sun?",
      type: "single_choice",
      points: 5,
      options: [
        { id: 1, text: "Magnetism" },
        { id: 2, text: "Gravity" },
        { id: 3, text: "Friction" },
        { id: 4, text: "Electricity" },
      ],
    },
  ] satisfies AttemptQuestion[],
};

export const mockAttemptResult = {
  attemptId: 1,
  quizId: 1,
  quizTitle: "Science Fundamentals",
  status: "graded",
  totalScore: 15,
  maxScore: 20,
  correctAnswers: 3,
  totalQuestions: 4,
  submittedAt: "May 24, 2026",
  timeTaken: "08:42",
  answers: [
    {
      question: "Which planet is known as the Red Planet?",
      selected: "Mars",
      correct: "Mars",
      isCorrect: true,
      points: 5,
    },
    {
      question: "What gas do plants absorb from the atmosphere?",
      selected: "Oxygen",
      correct: "Carbon dioxide",
      isCorrect: false,
      points: 0,
    },
    {
      question: "How many bones are in the adult human body?",
      selected: "206",
      correct: "206",
      isCorrect: true,
      points: 5,
    },
    {
      question: "Which force keeps planets in orbit around the Sun?",
      selected: "Gravity",
      correct: "Gravity",
      isCorrect: true,
      points: 5,
    },
  ],
};

export type AdminQuizListItem = {
  id: number;
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  category: string;
  questionCount: number;
  timeLimitMinutes: number;
  attempts: number;
  createdAt: string;
};

export const adminQuizzes: AdminQuizListItem[] = [
  {
    id: 1,
    title: "Science Fundamentals",
    description: "Biology, chemistry and physics basics.",
    status: "published",
    category: "Science",
    questionCount: 20,
    timeLimitMinutes: 15,
    attempts: 42,
    createdAt: "May 12",
  },
  {
    id: 2,
    title: "Geography Basics",
    description: "Countries, capitals and world facts.",
    status: "published",
    category: "Geography",
    questionCount: 15,
    timeLimitMinutes: 10,
    attempts: 28,
    createdAt: "May 10",
  },
  {
    id: 3,
    title: "Math Challenge",
    description: "Logic, algebra and problem solving.",
    status: "draft",
    category: "Math",
    questionCount: 25,
    timeLimitMinutes: 15,
    attempts: 0,
    createdAt: "May 6",
  },
  {
    id: 4,
    title: "Technology Essentials",
    description: "Programming, networks and web basics.",
    status: "archived",
    category: "Technology",
    questionCount: 18,
    timeLimitMinutes: 15,
    attempts: 31,
    createdAt: "May 4",
  },
];

export function getAdminQuizById(id: string | number) {
  return adminQuizzes.find((quiz) => quiz.id === Number(id)) ?? null;
}

export const adminQuizQuestions = [
  {
    id: 1,
    title: "Which planet is known as the Red Planet?",
    type: "single choice",
    points: 5,
    answers: 4,
  },
  {
    id: 2,
    title: "What gas do plants absorb from the atmosphere?",
    type: "single choice",
    points: 5,
    answers: 4,
  },
  {
    id: 3,
    title: "How many bones are in the adult human body?",
    type: "single choice",
    points: 5,
    answers: 4,
  },
];