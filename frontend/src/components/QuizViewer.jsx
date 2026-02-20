import { useState, useEffect, useCallback } from "react";
import { quizzesAPI } from "../utils/api";
import "../styles/QuizViewer.css";

export default function QuizViewer({ resourceId }) {
  const [quiz, setQuiz] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuiz = useCallback(() => {
    if (!resourceId) return;

    setLoading(true);
    setError(null);

    quizzesAPI
      .getQuiz(resourceId)
      .then((questions) => {
        setQuiz(questions);
        setCurrentIndex(0);
        setSelectedOption(null);
        setShowResult(false);
        setScore(0);
        setQuizStarted(false);
        setQuizCompleted(false);
      })
      .catch(() => {
        setError("Failed to load quiz");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [resourceId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleGenerate = () => {
    setGenerating(true);
    setError(null);

    quizzesAPI
      .generateQuiz(resourceId)
      .then(() => {
        fetchQuiz();
      })
      .catch(() => {
        setError("Failed to generate quiz");
      })
      .finally(() => {
        setGenerating(false);
      });
  };

  const handleSelectOption = (option) => {
    if (showResult) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption || showResult) return;
    const item = quiz[currentIndex];
    if (selectedOption === item.answer) {
      setScore((prev) => prev + 1);
    }
    setShowResult(true);
  };

  const handlePrev = () => {
    setSelectedOption(null);
    setShowResult(false);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex === quiz.length - 1) {
      setQuizCompleted(true);
      setQuizStarted(false);
      return;
    }
    setSelectedOption(null);
    setShowResult(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleEndQuiz = () => {
    setQuizCompleted(true);
    setQuizStarted(false);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowResult(false);
    setQuizStarted(true);
    setQuizCompleted(false);
  };

  if (loading) {
    return (
      <div className="quiz-container">
        <p className="quiz-loading">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-container">
        <p className="quiz-error">{error}</p>
      </div>
    );
  }

  if (quiz.length === 0) {
    return (
      <div className="quiz-container">
        <div className="quiz-empty">
          <p>No quiz yet for this resource.</p>
          <button
            className="quiz-btn"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / quiz.length) * 100);
    return (
      <div className="quiz-container">
        <div className="quiz-card">
          <span className="quiz-question-label">Quiz Completed</span>
          <p className="quiz-question-text">
            Score: {score} / {quiz.length}
          </p>
          <p className="quiz-question-text">{percentage}%</p>
        </div>
        <button className="quiz-btn" onClick={handleRetry}>
          Retry Quiz
        </button>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="quiz-container">
        <div className="quiz-card" style={{ textAlign: "center" }}>
          <span className="quiz-question-label">Ready to Start Quiz?</span>
          <p className="quiz-question-text">
            {quiz.length} question{quiz.length !== 1 ? "s" : ""} available
          </p>
          <button
            className="quiz-btn"
            onClick={() => setQuizStarted(true)}
            style={{ marginTop: "1rem" }}
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  const item = quiz[currentIndex];
  const isCorrect = selectedOption === item.answer;

  return (
    <div className="quiz-container">
      <div className="quiz-top-bar">
        <button className="quiz-btn quiz-end-btn" onClick={handleEndQuiz}>
          End Quiz
        </button>
      </div>

      <div className="quiz-card">
        <span className="quiz-question-label">
          Question {currentIndex + 1}
        </span>
        <p className="quiz-question-text">{item.question}</p>
      </div>

      <div className="quiz-options">
        {item.options.map((option, idx) => {
          let cls = "quiz-option";
          if (showResult) {
            if (option === item.answer) {
              cls += " correct";
            } else if (option === selectedOption) {
              cls += " incorrect";
            }
          } else if (option === selectedOption) {
            cls += " selected";
          }

          return (
            <button
              key={idx}
              className={cls}
              onClick={() => handleSelectOption(option)}
              disabled={showResult}
            >
              {option}
            </button>
          );
        })}
      </div>

      {!showResult && (
        <button
          className="quiz-btn"
          onClick={handleSubmit}
          disabled={!selectedOption}
          style={{ marginBottom: "1rem" }}
        >
          Submit Answer
        </button>
      )}

      {showResult && (
        <p className="quiz-hint">
          {isCorrect ? "Correct!" : `Incorrect — the answer is: ${item.answer}`}
        </p>
      )}

      <div className="quiz-nav">
        <button onClick={handlePrev} disabled={currentIndex === 0}>
          Previous
        </button>
        <span className="quiz-counter">
          {currentIndex + 1} / {quiz.length}
        </span>
        <button
          onClick={handleNext}
          disabled={!showResult}
        >
          {currentIndex === quiz.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
