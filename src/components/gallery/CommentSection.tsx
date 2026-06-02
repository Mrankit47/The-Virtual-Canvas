"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Send, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/useUIStore";
import { useGalleryStore } from "@/store/useGalleryStore";

interface Comment {
  _key: string;
  userId: string;
  userName: string;
  userImage?: string;
  text: string;
  createdAt: string;
}

interface CommentSectionProps {
  itemId: string;
  initialComments?: Comment[];
  dark?: boolean;
}

// Generate consistent background color based on name string for initials avatar
function getAvatarColor(name: string) {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function CommentSection({
  itemId,
  initialComments = [],
  dark = false,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const { addToast } = useUIStore();
  const commentsMap = useGalleryStore((state) => state.commentsMap);
  const setCommentsForItem = useGalleryStore((state) => state.setCommentsForItem);

  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Sync state with Zustand cache
  useEffect(() => {
    if (commentsMap[itemId] === undefined) {
      setCommentsForItem(itemId, initialComments || []);
    }
  }, [itemId, initialComments, commentsMap, setCommentsForItem]);

  const currentComments = commentsMap[itemId] !== undefined ? commentsMap[itemId] : initialComments;
  const userId = (session?.user as any)?.id;
  const userRole = session?.user?.role;

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentComments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      addToast("Please log in to add a comment", "info");
      return;
    }

    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const textToSend = commentText.trim();

    try {
      const res = await fetch("/api/gallery/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          text: textToSend,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to post comment");
      }

      const data = await res.json();
      if (data.comments) {
        setCommentsForItem(itemId, data.comments);
        setCommentText("");
        addToast("Comment posted successfully", "success");
      }
    } catch (error) {
      console.error("Comment submit error:", error);
      addToast("Something went wrong. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentKey: string) => {
    if (deletingKey) return;

    setDeletingKey(commentKey);
    // Optimistic delete
    const previousComments = [...currentComments];
    const newComments = currentComments.filter((c) => c._key !== commentKey);
    setCommentsForItem(itemId, newComments);

    try {
      const res = await fetch("/api/gallery/comment", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          commentKey,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete comment");
      }

      const data = await res.json();
      if (data.comments) {
        setCommentsForItem(itemId, data.comments);
        addToast("Comment deleted", "success");
      }
    } catch (error) {
      console.error("Comment delete error:", error);
      setCommentsForItem(itemId, previousComments); // Rollback
      addToast("Failed to delete comment. Please try again.", "error");
    } finally {
      setDeletingKey(null);
    }
  };

  const formatCommentDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className={`flex flex-col h-full w-full ${dark ? "text-canvas" : "text-ink"}`}>
      {/* Comments List Panel */}
      <div className="flex-grow overflow-y-auto max-h-[350px] mb-4 pr-1 scrollbar-thin flex flex-col gap-4">
        {currentComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-40 gap-2">
            <MessageSquare size={24} strokeWidth={1.5} />
            <p className="font-sans text-[11px] uppercase tracking-widest text-center">
              No comments yet. Share your thoughts!
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {currentComments.map((comment) => {
              const isOwner = comment.userId === userId || userRole === "admin";
              const initials = comment.userName
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <motion.div
                  key={comment._key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 items-start group p-3 rounded-lg transition-colors ${
                    dark ? "hover:bg-canvas/5" : "hover:bg-ink/5"
                  }`}
                >
                  {/* User Avatar */}
                  {comment.userImage ? (
                    <img
                      src={comment.userImage}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full object-cover shadow-sm shrink-0"
                      onError={(e) => {
                        // Fallback to initials if image load fails
                        (e.target as any).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white shadow-sm ${getAvatarColor(
                        comment.userName
                      )}`}
                    >
                      {initials}
                    </div>
                  )}

                  {/* Comment Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-sans text-xs font-bold truncate">
                        {comment.userName}
                      </span>
                      <span className="font-sans text-[9px] opacity-40 shrink-0">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className={`font-sans text-xs mt-1 leading-relaxed break-words whitespace-pre-line ${
                      dark ? "text-canvas/80" : "text-ink/80"
                    }`}>
                      {comment.text}
                    </p>
                  </div>

                  {/* Delete Button */}
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(comment._key)}
                      disabled={deletingKey === comment._key}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1.5 self-center text-red-500 rounded-md"
                      title="Delete comment"
                    >
                      {deletingKey === comment._key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment Input Form */}
      <form onSubmit={handleSubmit} className="relative mt-auto">
        <input
          type="text"
          placeholder={session ? "Write a comment..." : "Please log in to comment"}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={!session || isSubmitting}
          className={`w-full h-11 pl-4 pr-12 rounded-xl text-xs font-medium focus:outline-none transition-all shadow-inner border ${
            dark
              ? "bg-canvas/5 border-canvas/10 text-canvas focus:border-canvas/30 placeholder-canvas/35 disabled:bg-canvas/0 disabled:opacity-50"
              : "bg-ink/5 border-ink/10 text-ink focus:border-ink/30 placeholder-ink/35 disabled:bg-ink/0 disabled:opacity-50"
          }`}
        />
        {session && (
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              dark
                ? "text-canvas hover:bg-canvas/10 disabled:opacity-20"
                : "text-ink hover:bg-ink/10 disabled:opacity-20"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-current" />
            ) : (
              <Send className="w-4 h-4 text-current" />
            )}
          </button>
        )}
      </form>
    </div>
  );
}
