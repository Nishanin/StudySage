import React from "react";
import { BookOpen, X } from "lucide-react";

export default function WorkspacePickerModal({
  isOpen,
  darkMode = false,
  loading = false,
  error = "",
  workspaces = [],
  selectedWorkspaceId = null,
  onSelectWorkspace,
  onCancel,
  onConfirm,
  onNavigateWorkspaces,
}) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div
        className={`w-full max-w-3xl ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"} rounded-3xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col`}>
        <div
          className={`px-8 py-6 border-b ${darkMode ? "border-gray-700 bg-gray-750" : "border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50"} flex items-center justify-between`}>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center'>
              <BookOpen className='w-6 h-6 text-white' />
            </div>
            <div>
              <h2
                className={`text-2xl ${darkMode ? "text-white" : "text-gray-900"}`}>
                Select Study Workspace
              </h2>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Choose where you want to add this content
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-purple-100 text-gray-600"}`}>
            <X className='w-6 h-6' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-8'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm'>
              {error}
            </div>
          )}

          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin'></div>
            </div>
          ) : workspaces.length === 0 ? (
            <div
              className={`rounded-2xl border p-10 text-center ${darkMode ? "bg-gray-750 border-gray-700" : "bg-purple-50 border-purple-200"}`}>
              <p
                className={`text-lg mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                No study workspaces found
              </p>
              <p
                className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Create a workspace first to organize your content
              </p>
              <button
                onClick={onNavigateWorkspaces}
                className='px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all'>
                Go to Workspaces
              </button>
            </div>
          ) : (
            <div className='space-y-3'>
              {workspaces.map((workspace) => {
                const isSelected = selectedWorkspaceId === workspace.id;
                return (
                  <label
                    key={workspace.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${darkMode ? "bg-gray-750 border-gray-700 hover:border-gray-600" : "bg-white border-purple-200 hover:border-purple-300"}`}>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() =>
                        onSelectWorkspace?.(isSelected ? null : workspace.id)
                      }
                      className='h-5 w-5 accent-purple-600'
                    />
                    <div className='flex-1'>
                      <div
                        className={`text-base ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {workspace.title ||
                          workspace.name ||
                          "Untitled Workspace"}
                      </div>
                      {workspace.description && (
                        <div
                          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {workspace.description}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div
          className={`px-8 py-6 border-t ${darkMode ? "border-gray-700 bg-gray-750" : "border-purple-100 bg-white"} flex items-center justify-end gap-3`}>
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedWorkspaceId}
            className='px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
