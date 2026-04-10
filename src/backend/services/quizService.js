import { QUIZ_QUESTIONS } from '../data/quizData.js';
import { database } from '../db/database.js';

export const quizService = {
  getQuestions() {
    return QUIZ_QUESTIONS;
  },

  evaluateAnswer(questionIndex, selectedOption) {
    const question = QUIZ_QUESTIONS[questionIndex];
    return selectedOption === question.ans;
  },

  calculateScore(correctAnswers, totalQuestions) {
    return Math.round((correctAnswers / totalQuestions) * 100);
  },

  async saveScore(score) {
    const scoreData = { pct: score, date: new Date().toISOString().split('T')[0], timestamp: new Date().toISOString() };
    await database.saveQuizScore(scoreData);
  },

  getModuleQuiz(step) {
    return step.quiz || [];
  },

  evaluateModuleQuiz(quiz, answers) {
    let correct = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.ans) correct++;
    });
    return { score: correct, total: quiz.length, passed: correct >= Math.ceil(quiz.length * 0.67) };
  }
};