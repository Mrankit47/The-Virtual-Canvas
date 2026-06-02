"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useUIStore } from "@/store/useUIStore";
import { useGalleryStore } from "@/store/useGalleryStore";

interface LikeButtonProps {
  itemId: string;
  initialLikes?: string[];
  className?: string;
  dark?: boolean;
}

export function LikeButton({
  itemId,
  initialLikes = [],
  className = "",
  dark = false,
}: LikeButtonProps) {
  const { data: session } = useSession();
  const { addToast } = useUIStore();
  const likesMap = useGalleryStore((state) => state.likesMap);
  const setLikesForItem = useGalleryStore((state) => state.setLikesForItem);
  const [isLiking, setIsLiking] = useState(false);

  // Initialize the Zustand store cache with initialLikes if not already cached
  useEffect(() => {
    if (likesMap[itemId] === undefined) {
      setLikesForItem(itemId, initialLikes || []);
    }
  }, [itemId, initialLikes, likesMap, setLikesForItem]);

  const currentLikes = likesMap[itemId] !== undefined ? likesMap[itemId] : initialLikes;
  const userId = (session?.user as any)?.id;
  const isLiked = userId ? currentLikes.includes(userId) : false;
  const likesCount = currentLikes.length;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!session) {
      addToast("Please log in to like this artwork", "info");
      return;
    }

    if (!userId || isLiking) return;

    // Optimistic Update
    const previousLikes = [...currentLikes];
    const newLikes = isLiked
      ? currentLikes.filter((id) => id !== userId)
      : [...currentLikes, userId];

    setLikesForItem(itemId, newLikes);
    setIsLiking(true);

    try {
      const res = await fetch("/api/gallery/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          action: isLiked ? "unlike" : "like",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update like status");
      }

      const data = await res.json();
      if (data.likes) {
        setLikesForItem(itemId, data.likes);
      }
    } catch (error) {
      console.error("Like Error:", error);
      setLikesForItem(itemId, previousLikes); // Rollback on error
      addToast("Failed to update like. Please try again.", "error");
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1.5 group/btn transition-colors duration-300 font-sans text-xs focus:outline-none ${
        dark
          ? "text-[#f5f5f0]/60 hover:text-[#f5f5f0]"
          : "text-ink/60 hover:text-ink"
      } ${className}`}
      aria-label={isLiked ? "Unlike" : "Like"}
    >
      <motion.div
        whileTap={{ scale: 0.7 }}
        animate={isLiked ? { scale: [1, 1.25, 1] } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="flex items-center justify-center"
      >
        <Heart
          size={20}
          className={`transition-all duration-300 ${
            isLiked
              ? "fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_4px_rgba(244,63,94,0.4)]"
              : `text-current group-hover/btn:text-rose-500 group-hover/btn:scale-110`
          }`}
        />
      </motion.div>
      <span className="tabular-nums font-semibold tracking-tight min-w-[1ch]">
        {likesCount}
      </span>
    </button>
  );
}
