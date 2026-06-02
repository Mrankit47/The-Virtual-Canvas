"use client";

import { useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { useGalleryStore } from "@/store/useGalleryStore";

interface CommentCountProps {
  itemId: string;
  initialComments?: any[];
  dark?: boolean;
  className?: string;
}

export function CommentCount({
  itemId,
  initialComments = [],
  dark = false,
  className = "",
}: CommentCountProps) {
  const commentsMap = useGalleryStore((state) => state.commentsMap);
  const setCommentsForItem = useGalleryStore((state) => state.setCommentsForItem);

  // Sync state with Zustand cache if not already cached
  useEffect(() => {
    if (commentsMap[itemId] === undefined) {
      setCommentsForItem(itemId, initialComments || []);
    }
  }, [itemId, initialComments, commentsMap, setCommentsForItem]);

  const currentComments = commentsMap[itemId] !== undefined ? commentsMap[itemId] : initialComments;
  const count = currentComments.length;

  return (
    <div
      className={`flex items-center gap-1.5 font-sans text-xs ${
        dark ? "text-[#f5f5f0]/60 hover:text-[#f5f5f0]" : "text-ink/60 hover:text-ink"
      } transition-colors duration-300 ${className}`}
      title={`${count} comment${count === 1 ? "" : "s"}`}
    >
      <MessageSquare size={18} className="text-current" />
      <span className="tabular-nums font-semibold tracking-tight min-w-[1ch]">
        {count}
      </span>
    </div>
  );
}
