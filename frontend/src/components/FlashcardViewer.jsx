import { useState, useEffect, useCallback } from "react";
import { flashcardsAPI } from "../utils/api";
import "../styles/FlashcardViewer.css";

export default function FlashcardViewer({ resourceId }) {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const fetchFlashcards = useCallback(() => {
    if (!resourceId) return;

    setLoading(true);
    setError(null);

    flashcardsAPI
      .getFlashcards(resourceId)
      .then((cards) => {
        setFlashcards(cards);
        setCurrentIndex(0);
        setFlipped(false);
      })
      .catch(() => {
        setError("Failed to load flashcards");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [resourceId]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const handleGenerate = () => {
    setGenerating(true);
    setError(null);

    flashcardsAPI
      .generateFlashcards(resourceId)
      .then(() => {
        fetchFlashcards();
      })
      .catch(() => {
        setError("Failed to generate flashcards");
      })
      .finally(() => {
        setGenerating(false);
      });
  };

  const handleFlip = () => setFlipped((prev) => !prev);

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flashcard-container">
        <p className="flashcard-loading">Loading flashcards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flashcard-container">
        <p className="flashcard-error">{error}</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-empty">
          <p>No flashcards yet for this resource.</p>
          <button
            className="flashcard-btn"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Flashcards"}
          </button>
        </div>
      </div>
    );
  }

  const card = flashcards[currentIndex];

  return (
    <div className="flashcard-container">
      <div className="flashcard-card" onClick={handleFlip}>
        <div className={`flashcard-inner${flipped ? " flipped" : ""}`}>
          <div className="flashcard-front">
            <span className="flashcard-label">Question</span>
            {card.front}
          </div>
          <div className="flashcard-back">
            <span className="flashcard-label">Answer</span>
            {card.back}
          </div>
        </div>
      </div>
      <p className="flashcard-hint">Click card to flip</p>

      <div className="flashcard-nav">
        <button onClick={handlePrev} disabled={currentIndex === 0}>
          Previous
        </button>
        <span className="flashcard-counter">
          {currentIndex + 1} / {flashcards.length}
        </span>
        <button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
