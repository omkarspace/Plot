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
  { id: "documentary", label: "Docs" },
  { id: "animation", label: "Animation" },
  { id: "mystery", label: "Mystery" },
];

export default function MoodFilter({ selected, onToggle }: MoodFilterProps) {
  return (
    <div>
      <p className="text-steel-dark text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-board)] mb-3">
        What&apos;s the mood?
      </p>
      <div className="flex flex-wrap gap-0 border border-ruled">
        {MOODS.map((mood) => {
          const isSelected = selected.includes(mood.id);
          return (
            <button
              key={mood.id}
              onClick={() => onToggle(mood.id)}
              className={`px-4 py-2.5 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-medium transition-colors border-r border-ruled last:border-r-0 ${
                isSelected
                  ? "bg-delay-amber/10 text-delay-amber border-b-2 border-b-delay-amber"
                  : "text-steel-frame hover:text-flap-white hover:bg-flap-shadow border-b-2 border-b-transparent"
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
