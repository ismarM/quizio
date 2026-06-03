export const routes = {
    home: "/",
    login: "/login",
    dashboard: "/dashboard",
  
    quizzes: "/quizzes",
    quizDetail: (id: string | number) => `/quizzes/${id}`,
    quizLeaderboard: (id: string | number) => `/quizzes/${id}/leaderboard`,
  
    attempt: (id: string | number) => `/attempts/${id}`,
    attemptResult: (id: string | number) => `/attempts/${id}/result`,
  
    admin: "/admin",
    adminQuizzes: "/admin/quizzes",
    adminArchivedQuizzes: "/admin/quizzes/archived",
    adminQuizNew: "/admin/quizzes/new",
    adminQuizDetail: (id: string | number) => `/admin/quizzes/${id}`,

    leaderboard: "/leaderboard",
};
