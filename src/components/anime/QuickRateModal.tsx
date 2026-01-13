"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { submitAnimeFeedback, submitEpisodeFeedback } from "@/lib/feedback";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchAnimeEpisodes } from "@/lib/jikan";
import type { Anime, Episode } from "@/types/anime";

type Props = {
  anime: Anime | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function QuickRateModal({ anime, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"anime" | "episode">("anime");
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [selectedEpisode, setSelectedEpisode] = useState<{ episode: Episode; episodeNumber: number } | null>(null);
  const [manualEpisodeNumber, setManualEpisodeNumber] = useState<number | "">("");
  const [episodeValidationError, setEpisodeValidationError] = useState<string | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodesError, setEpisodesError] = useState<string | null>(null);
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState("");
  const [isEpisodeDropdownOpen, setIsEpisodeDropdownOpen] = useState(false);
  const episodeDropdownRef = useRef<HTMLDivElement>(null);
  const episodeInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { supabase, user } = useAuth();

  // Fetch episodes when switching to episode mode or when anime changes
  useEffect(() => {
    if (!anime || mode !== "episode") {
      setEpisodes([]);
      setSelectedEpisode(null);
      setEpisodeSearchQuery("");
      return;
    }

    let cancelled = false;
    setLoadingEpisodes(true);
    setEpisodesError(null);

    const loadEpisodes = async () => {
      try {
        console.log(`[QuickRateModal] Fetching episodes for anime ${anime.id} (${anime.title})...`);
        const fetchedEpisodes = await fetchAnimeEpisodes(anime.id);
        console.log(`[QuickRateModal] Fetched ${fetchedEpisodes.length} episodes for anime ${anime.id}`);
        
        if (!cancelled) {
          if (fetchedEpisodes.length === 0) {
            // No episodes found - could be API issue or anime has no episode data
            console.warn(`[QuickRateModal] No episodes returned for anime ${anime.id}. Anime reports ${anime.episodes} episodes.`);
            setEpisodesError(
              anime.episodes && anime.episodes > 0
                ? `This anime has ${anime.episodes} episodes, but episode data is not available from the API. Please enter the episode number manually.`
                : "Episode data is not available. Please enter the episode number manually."
            );
            setEpisodes([]);
          } else {
            setEpisodes(fetchedEpisodes);
            // Clear manual input when episodes load successfully
            setManualEpisodeNumber("");
            setEpisodeValidationError(null);
          }
          setLoadingEpisodes(false);
        }
      } catch (err) {
        console.error(`[QuickRateModal] Error fetching episodes for anime ${anime.id}:`, err);
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load episodes";
          // Provide more helpful error messages
          if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
            setEpisodesError(
              "Rate limit reached. Please wait a moment and try again, or enter the episode number manually."
            );
          } else if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
            setEpisodesError(
              "Network error. This anime has many episodes and may take longer to load. Please try again or enter the episode number manually."
            );
          } else if (anime.episodes && anime.episodes > 1000) {
            setEpisodesError(
              `This anime has ${anime.episodes} episodes. Loading may take a while due to rate limits. Please wait or enter the episode number manually.`
            );
          } else {
            setEpisodesError(
              `Failed to load episodes: ${errorMessage}. Please enter the episode number manually.`
            );
          }
          setLoadingEpisodes(false);
          setEpisodes([]);
        }
      }
    };

    loadEpisodes();

    return () => {
      cancelled = true;
    };
  }, [anime, mode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        episodeDropdownRef.current &&
        !episodeDropdownRef.current.contains(event.target as Node) &&
        episodeInputRef.current &&
        !episodeInputRef.current.contains(event.target as Node)
      ) {
        setIsEpisodeDropdownOpen(false);
      }
    };

    if (isEpisodeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isEpisodeDropdownOpen]);

  // Filter episodes based on search query and include episode numbers
  const filteredEpisodesWithNumbers = useMemo(() => {
    const episodesWithNumbers = episodes.map((ep, idx) => ({
      episode: ep,
      episodeNumber: idx + 1,
    }));
    
    if (!episodeSearchQuery.trim()) return episodesWithNumbers;
    
    const query = episodeSearchQuery.toLowerCase();
    return episodesWithNumbers.filter(({ episode, episodeNumber }) => {
      return (
        episodeNumber.toString().includes(query) ||
        episode.title.toLowerCase().includes(query)
      );
    });
  }, [episodes, episodeSearchQuery]);

  // Validate manual episode input (returns validation result without side effects)
  const validateManualEpisode = useMemo(() => {
    if (manualEpisodeNumber === "" || manualEpisodeNumber === null) {
      return null;
    }

    const episodeNum = Number(manualEpisodeNumber);
    
    // Basic validation
    if (!Number.isInteger(episodeNum) || episodeNum < 1) {
      return { valid: false, error: "Episode number must be at least 1" };
    }

    if (episodeNum > 9999) {
      return { valid: false, error: "Episode number cannot exceed 9999" };
    }

    // Validate against anime's episode count if available
    if (anime?.episodes != null && typeof anime.episodes === "number" && anime.episodes > 0) {
      if (episodeNum > anime.episodes) {
        return {
          valid: false,
          error: `This anime only has ${anime.episodes} episode${anime.episodes === 1 ? "" : "s"}. Episode ${episodeNum} does not exist.`
        };
      }
    }

    return { valid: true, error: null };
  }, [manualEpisodeNumber, anime]);

  // Update validation error state when validation result changes
  useEffect(() => {
    if (validateManualEpisode === null) {
      setEpisodeValidationError(null);
    } else {
      setEpisodeValidationError(validateManualEpisode.error);
    }
  }, [validateManualEpisode]);

  // Handle manual episode input change
  const handleManualEpisodeChange = (value: string) => {
    if (value === "") {
      setManualEpisodeNumber("");
      setSelectedEpisode(null);
      setEpisodeValidationError(null);
      return;
    }

    const num = Number(value);
    if (!isNaN(num) && num >= 0) {
      setManualEpisodeNumber(num);
      setSelectedEpisode(null); // Clear dropdown selection when typing manually
    }
  };

  if (!anime) return null;

  const handleSubmit = async () => {
    if (!user) {
      showToast("Login required to rate", "error");
      return;
    }

    if (rating === 0) {
      showToast("Pick a rating first", "error");
      return;
    }

    if (mode === "episode") {
      // Determine which validation path to use based on whether episodes loaded successfully
      if (episodesError || episodes.length === 0) {
        // When episodes fail to load, require and validate manual input
        if (manualEpisodeNumber === "" || manualEpisodeNumber === null) {
          showToast("Enter an episode number", "error");
          return;
        }
        if (validateManualEpisode?.valid !== true) {
          if (validateManualEpisode?.error) {
            showToast(validateManualEpisode.error, "error");
          } else {
            showToast("Invalid episode number", "error");
          }
          return;
        }
      } else {
        // When episodes are loaded successfully, require selection from dropdown
        if (!selectedEpisode) {
          showToast("Select an episode from the list", "error");
          return;
        }
        // Validate that selected episode exists in fetched episodes
        const episodeExists = episodes.some((ep, idx) => idx + 1 === selectedEpisode.episodeNumber);
        if (!episodeExists) {
          showToast("Selected episode is invalid", "error");
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      if (mode === "anime") {
        await submitAnimeFeedback(supabase, {
          anime_id: anime.id,
          rating,
          comment: comment.trim() || null,
        });
        showToast("Series rating posted to feed", "success");
      } else {
        // Determine which episode number to use (dropdown selection or manual input)
        const episodeNumber = selectedEpisode 
          ? selectedEpisode.episodeNumber 
          : (manualEpisodeNumber !== "" ? Number(manualEpisodeNumber) : null);

        if (episodeNumber === null) {
          showToast("Select or enter an episode number", "error");
          return;
        }

        await submitEpisodeFeedback(supabase, {
          anime_id: anime.id,
          episode: episodeNumber,
          rating,
          comment: comment.trim() || null,
        });
        showToast(`Episode ${episodeNumber} rating posted to feed`, "success");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to submit rating", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[3rem] border border-border bg-surface p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-6">
          {anime.imageUrl && (
            <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-2 shadow-xl">
              <Image src={anime.imageUrl} alt={anime.title} fill sizes="96px" className="object-cover" />
            </div>
          )}
          
          <div className="flex flex-1 flex-col gap-2">
            <h3 className="text-xl font-black leading-tight text-foreground line-clamp-2">{anime.title}</h3>
            <div className="flex flex-wrap gap-1">
              {anime.genres.slice(0, 2).map((g) => (
                <span key={g} className="rounded-full bg-brand/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-brand ring-1 ring-brand/20">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:bg-surface hover:text-foreground shadow-inner cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 rounded-full border border-border bg-background/50 p-1">
            <button
              onClick={() => setMode("anime")}
              className={`flex-1 rounded-full py-2 text-[10px] font-black uppercase tracking-widest transition cursor-pointer ${
                mode === "anime"
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Series
            </button>
            <button
              onClick={() => {
                setMode("episode");
                setSelectedEpisode(null);
                setManualEpisodeNumber("");
                setEpisodeSearchQuery("");
                setEpisodeValidationError(null);
              }}
              className={`flex-1 rounded-full py-2 text-[10px] font-black uppercase tracking-widest transition cursor-pointer ${
                mode === "episode"
                  ? "bg-brand-2 text-white shadow-lg shadow-brand-2/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Episode
            </button>
          </div>

          {/* Episode Selector (only in episode mode) */}
          {mode === "episode" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-2">Select Episode</p>
                {anime.episodes != null && (
                  <p className="text-[9px] font-medium text-muted-2">
                    Total: {anime.episodes} episode{anime.episodes === 1 ? "" : "s"}
                  </p>
                )}
              </div>
              
              {loadingEpisodes ? (
                <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-2 border-t-transparent" />
                    <p className="text-sm font-medium text-muted-2">Loading episodes...</p>
                  </div>
                  {anime.episodes && anime.episodes > 500 && (
                    <p className="mt-2 text-[10px] font-medium text-muted-2">
                      This anime has {anime.episodes} episodes. This may take a minute due to rate limits...
                    </p>
                  )}
                </div>
              ) : episodesError || episodes.length === 0 ? (
                <div className="flex flex-col gap-3">
                  {episodesError && (
                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-center">
                      <p className="text-xs font-medium text-yellow-400">{episodesError}</p>
                      <p className="mt-1 text-[9px] font-medium text-muted-2">
                        Enter episode number manually below
                      </p>
                    </div>
                  )}
                  {!episodesError && episodes.length === 0 && (
                    <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-center">
                      <p className="text-sm font-medium text-muted-2">No episodes available</p>
                      <p className="mt-1 text-[9px] font-medium text-muted-2">
                        Enter episode number manually below
                      </p>
                    </div>
                  )}
                  {/* Manual input when episodes fail to load */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="number"
                      min={1}
                      max={anime.episodes != null && anime.episodes > 0 ? anime.episodes : undefined}
                      value={manualEpisodeNumber}
                      onChange={(e) => handleManualEpisodeChange(e.target.value)}
                      placeholder={`Enter episode number${anime.episodes && anime.episodes > 0 ? ` (1-${anime.episodes})` : ""}`}
                      className={`rounded-2xl border px-4 py-3 text-center text-lg font-black text-foreground outline-none ring-brand-2/20 transition focus:ring-2 ${
                        episodeValidationError
                          ? "border-red-500/50 bg-red-500/10"
                          : "border-border bg-surface-2"
                      }`}
                    />
                    {episodeValidationError && (
                      <p className="text-xs font-medium text-red-400 text-center">
                        {episodeValidationError}
                      </p>
                    )}
                    {anime.episodes != null && !episodeValidationError && manualEpisodeNumber !== "" && (
                      <p className="text-[9px] font-medium text-muted-2 text-center">
                        Valid episode number
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    ref={episodeInputRef}
                    type="text"
                    value={selectedEpisode ? `Episode ${selectedEpisode.episodeNumber}${selectedEpisode.episode.title ? `: ${selectedEpisode.episode.title}` : ""}` : episodeSearchQuery}
                    onChange={(e) => {
                      setEpisodeSearchQuery(e.target.value);
                      setIsEpisodeDropdownOpen(true);
                      if (selectedEpisode) {
                        setSelectedEpisode(null);
                      }
                    }}
                    onFocus={() => setIsEpisodeDropdownOpen(true)}
                    placeholder="Search episodes..."
                    className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-medium text-foreground outline-none ring-brand-2/20 transition placeholder:text-muted-2 focus:ring-2"
                  />
                  
                  {isEpisodeDropdownOpen && filteredEpisodesWithNumbers.length > 0 && (
                    <div
                      ref={episodeDropdownRef}
                      className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-xl"
                    >
                      {filteredEpisodesWithNumbers.map(({ episode, episodeNumber }) => (
                        <button
                          key={episode.mal_id}
                          type="button"
                          onClick={() => {
                            setSelectedEpisode({ episode, episodeNumber });
                            setEpisodeSearchQuery("");
                            setIsEpisodeDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-surface-2 focus:bg-surface-2 focus:outline-none cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-black text-brand-2">Ep {episodeNumber}</span>
                            {episode.title && (
                              <span className="truncate text-muted-2">{episode.title}</span>
                            )}
                            {episode.filler && (
                              <span className="ml-auto rounded-full bg-yellow-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-yellow-500">
                                Filler
                              </span>
                            )}
                            {episode.recap && (
                              <span className="ml-auto rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-blue-500">
                                Recap
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {isEpisodeDropdownOpen && episodeSearchQuery && filteredEpisodesWithNumbers.length === 0 && (
                    <div
                      ref={episodeDropdownRef}
                      className="absolute z-10 mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 shadow-xl"
                    >
                      <p className="text-sm font-medium text-muted-2">No episodes found</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Show selection banner only when episodes are loaded (dropdown selection) or when episodes failed to load (manual input) */}
              {((episodesError || episodes.length === 0) && manualEpisodeNumber !== "" && validateManualEpisode?.valid === true) || 
               (episodes.length > 0 && !episodesError && selectedEpisode) ? (
                <div className="rounded-xl border border-brand-2/20 bg-brand-2/10 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-brand-2">
                    {selectedEpisode ? (
                      <>
                        Selected: Episode {selectedEpisode.episodeNumber}
                        {selectedEpisode.episode.title && ` - ${selectedEpisode.episode.title}`}
                      </>
                    ) : (
                      <>Selected: Episode {manualEpisodeNumber}</>
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Star Rating */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Your Rating</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <span
                    className={`text-2xl transition-all ${
                      star <= (hoveredRating || rating)
                        ? "text-gold drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                        : "text-muted-2"
                    }`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-black text-gold">
                {rating} / 10
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-2">Your Take (Optional)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts with the community..."
              className="h-24 resize-none rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-medium text-foreground outline-none ring-brand/20 transition placeholder:text-muted-2 focus:ring-2"
              maxLength={500}
            />
            <p className="text-right text-[9px] font-bold text-muted-2">{comment.length} / 500</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-brand py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="relative z-10">{submitting ? "SYNCING..." : "POST TO FEED"}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
