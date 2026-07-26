"use client";

interface MoodFilterProps {
  selected: string[];
  onToggle: (genre: string) => void;
}

const MOODS = [
  { id: "action", label: "Action" },
  { id: "comedy", label: "Comedy" },
  { id: "drama", label: "Drama" },
  { id: "horror", label: "Horror" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "thriller", label: "Thriller" },
  { id: "romance", label: "Romance" },
  { id: "documentary", label: "Documentary" },
  { id: "animation", label: "Animation" },
  { id: "mystery", label: "Mystery" },
];

export default function MoodFilter({ selected, onToggle }: MoodFilterProps) {
  return (
    <div>
      <p className="text-[#737373] text-sm mb-3">What are you in the mood for?</p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((mood) => {
          const isSelected = selected.includes(mood.id);
          return (
            <button
              key={mood.id}
              onClick={() => onToggle(mood.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                isSelected
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1a1a1a] text-[#737373] hover:bg-[#252525] hover:text-white border border-[#262626]"
              }`}
            >
              {mood.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
