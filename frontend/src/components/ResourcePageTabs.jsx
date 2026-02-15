import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, FileText, BookOpen, Layers } from "lucide-react";

export default function ResourcePageTabs({
  resourceId,
  activeTab,
  darkMode = false,
  showViewTab = true,
  onTabChange,
}) {
  const navigate = useNavigate();

  const baseCls =
    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all";
  const activeCls = darkMode
    ? "bg-purple-600 text-white"
    : "bg-purple-100 text-purple-700";
  const inactiveCls = darkMode
    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
    : "text-gray-600 hover:bg-purple-50 hover:text-purple-600";

  return (
    <div className='mb-6 md:mb-8'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm w-fit ${
            darkMode ? "text-gray-400" : "text-gray-600"
          } hover:text-purple-600 transition-colors`}>
          <ChevronLeft className='w-4 h-4' />
          Back
        </button>

        <div className='flex gap-2'>
          {showViewTab && (
            <button
              onClick={() =>
                navigate(`/study-resources/${resourceId}`, { replace: true })
              }
              className={`${baseCls} ${activeTab === "view" ? activeCls : inactiveCls}`}>
              <FileText className='w-4 h-4' />
              View
            </button>
          )}
          <button
            onClick={() => {
              if (onTabChange) {
                onTabChange("notes");
              } else {
                navigate(`/study-resources/${resourceId}/notes`, {
                  replace: true,
                });
              }
            }}
            className={`${baseCls} ${activeTab === "notes" ? activeCls : inactiveCls}`}>
            <BookOpen className='w-4 h-4' />
            Notes
          </button>
          <button
            onClick={() => {
              if (onTabChange) {
                onTabChange("flashcards");
              } else {
                navigate(`/study-resources/${resourceId}/notes`, {
                  replace: true,
                });
              }
            }}
            className={`${baseCls} ${activeTab === "flashcards" ? activeCls : inactiveCls}`}>
            <Layers className='w-4 h-4' />
            Flashcards
          </button>
        </div>
      </div>

      <h2
        className={`text-2xl md:text-3xl mb-2 mt-4 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}>
        Study Resource
      </h2>
      <p
        className={`text-sm md:text-base ${
          darkMode ? "text-gray-400" : "text-gray-600"
        }`}>
        {activeTab === "view"
          ? "View your selected document."
          : activeTab === "flashcards"
            ? "Flashcards for your study resource."
            : "Notes for your study resource."}
      </p>
    </div>
  );
}
