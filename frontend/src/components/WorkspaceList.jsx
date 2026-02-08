import React, { useEffect, useState } from "react";
import { BookOpen, Calendar, ChevronRight } from "lucide-react";
import { authAPI, workspaceAPI } from "../utils/api";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const extractUserId = (payload) => {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  return (
    payload?.id ||
    payload?.user_id ||
    payload?.data?.id ||
    payload?.data?.user_id ||
    payload?.user?.id ||
    payload?.data?.user?.id ||
    payload?.data?.user?.user_id ||
    null
  );
};

export default function WorkspaceList({ user, darkMode = false, onSelect }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState(
    user?.id || user?.user_id || null,
  );

  useEffect(() => {
    setResolvedUserId(user?.id || user?.user_id || null);
  }, [user?.id, user?.user_id]);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        let userId = resolvedUserId;

        if (!userId) {
          const cachedUser = localStorage.getItem("authUser");
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              userId = extractUserId(parsedUser);
              setResolvedUserId(userId);
            } catch (error) {
              console.error("Failed to parse cached user:", error);
              userId = extractUserId(cachedUser);
              setResolvedUserId(userId);
            }
          }
        }

        if (!userId) {
          try {
            const response = await authAPI.me();
            userId = extractUserId(response);
            setResolvedUserId(userId);
          } catch (error) {
            console.error("Failed to resolve user id:", error);
          }
        }

        if (!userId) {
          setWorkspaces([]);
          return;
        }

        const response = await workspaceAPI.getWorkspaces(userId);
        const data =
          response?.data?.workspaces ||
          response?.workspaces ||
          response?.data ||
          [];
        setWorkspaces(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
        setWorkspaces([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [resolvedUserId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div
        className={`rounded-2xl border p-10 text-center ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-purple-100"
        }`}>
        <BookOpen
          className={`w-14 h-14 mx-auto mb-4 ${
            darkMode ? "text-gray-600" : "text-gray-300"
          }`}
        />
        <p
          className={`text-lg mb-2 ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}>
          No workspaces yet
        </p>
        <p className={`${darkMode ? "text-gray-500" : "text-gray-500"}`}>
          Create a workspace by uploading a resource from the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'>
      {workspaces.map((workspace) => {
        const title = workspace?.title || workspace?.name || "Untitled";
        const createdAt =
          workspace?.created_at || workspace?.createdAt || workspace?.date;

        return (
          <button
            key={workspace?.id}
            onClick={() => onSelect?.(workspace)}
            className={`text-left p-5 rounded-2xl border transition-all shadow-sm hover:shadow-lg group ${
              darkMode
                ? "bg-gray-800 border-gray-700 hover:border-purple-500"
                : "bg-white border-purple-100 hover:border-purple-300"
            }`}>
            <div className='flex items-center justify-between mb-4'>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  darkMode ? "bg-purple-900/40" : "bg-purple-100"
                }`}>
                <BookOpen
                  className={`w-6 h-6 ${
                    darkMode ? "text-purple-300" : "text-purple-600"
                  }`}
                />
              </div>
              <ChevronRight
                className={`w-5 h-5 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                } group-hover:translate-x-1 transition-transform`}
              />
            </div>
            <h3
              className={`text-lg mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
              {title}
            </h3>
            <div
              className={`flex items-center gap-2 text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}>
              <Calendar className='w-4 h-4' />
              <span>{formatDate(createdAt) || "Date unavailable"}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
