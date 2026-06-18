import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// --- Parsers -------------------------------------------------------------

// Flashcards are emitted as blank-line separated blocks of:
//   Q: <question>
//   A: <answer>
const parseFlashcards = (content) => {
  const cards = [];
  content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .forEach((block) => {
      const q = block.match(/^Q:\s*([\s\S]*?)(?=\nA:|$)/i);
      const a = block.match(/\nA:\s*([\s\S]*)$/i);
      if (q && a) cards.push({ question: q[1].trim(), answer: a[1].trim() });
    });
  return cards;
};

// Quiz questions are emitted as blank-line separated blocks of:
//   Q: <question>
//   A) opt  B) opt  C) opt  D) opt
//   Answer: <letter>
const parseQuiz = (content) => {
  const questions = [];
  content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .forEach((block) => {
      const lines = block.split("\n").map((l) => l.trim());
      const qLine = lines.find((l) => /^Q:/i.test(l));
      if (!qLine) return;
      const options = [];
      let answer = null;
      lines.forEach((l) => {
        const opt = l.match(/^([A-D])[).]\s*(.+)$/);
        if (opt) options.push({ letter: opt[1].toUpperCase(), text: opt[2].trim() });
        const ans = l.match(/^Answer:\s*([A-D])/i);
        if (ans) answer = ans[1].toUpperCase();
      });
      if (options.length) {
        questions.push({ question: qLine.replace(/^Q:\s*/i, "").trim(), options, answer });
      }
    });
  return questions;
};

// --- Sub-renderers -------------------------------------------------------

function Flashcard({ card, index }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <button
      type="button"
      className={`flashcard ${revealed ? "revealed" : ""}`}
      onClick={() => setRevealed((v) => !v)}
    >
      <span className="flashcard-index">Card {index + 1}</span>
      <span className="flashcard-q">{card.question}</span>
      {revealed ? (
        <span className="flashcard-a">{card.answer}</span>
      ) : (
        <span className="flashcard-hint">Click to reveal answer</span>
      )}
    </button>
  );
}

function QuizQuestion({ q, index }) {
  const [picked, setPicked] = useState(null);
  return (
    <div className="quiz-question">
      <p className="quiz-q">
        {index + 1}. {q.question}
      </p>
      <div className="quiz-options">
        {q.options.map((opt) => {
          const isPicked = picked === opt.letter;
          const isCorrect = q.answer && opt.letter === q.answer;
          let state = "";
          if (picked) {
            if (isCorrect) state = "correct";
            else if (isPicked) state = "incorrect";
          }
          return (
            <button
              type="button"
              key={opt.letter}
              className={`quiz-option ${state}`}
              onClick={() => setPicked(opt.letter)}
              disabled={!!picked}
            >
              <span className="quiz-option-letter">{opt.letter}</span>
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>
      {picked && q.answer && (
        <p className="quiz-result">
          {picked === q.answer ? "Correct!" : `Correct answer: ${q.answer}`}
        </p>
      )}
    </div>
  );
}

// --- Main component ------------------------------------------------------

export default function ArtifactContent({ content, type, markdownClassName = "summary-markdown" }) {
  if (!content) return null;

  if (type === "flashcards") {
    const cards = parseFlashcards(content);
    if (cards.length) {
      return (
        <div className="flashcard-grid">
          {cards.map((card, i) => (
            <Flashcard key={i} card={card} index={i} />
          ))}
        </div>
      );
    }
  }

  if (type === "quizzes") {
    const questions = parseQuiz(content);
    if (questions.length) {
      return (
        <div className="quiz-list">
          {questions.map((q, i) => (
            <QuizQuestion key={i} q={q} index={i} />
          ))}
        </div>
      );
    }
  }

  return (
    <div className={markdownClassName}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
