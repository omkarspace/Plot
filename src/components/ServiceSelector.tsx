"use client";

import { getAllServices } from "@/lib/services";

interface ServiceSelectorProps {
  selected: string[];
  onToggle: (serviceId: string) => void;
}

export default function ServiceSelector({ selected, onToggle }: ServiceSelectorProps) {
  const services = getAllServices();

  return (
    <div>
      <p className="text-[#737373] text-sm mb-3">What are you subscribed to?</p>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => {
          const isSelected = selected.includes(service.id);
          return (
            <button
              key={service.id}
              onClick={() => onToggle(service.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                isSelected
                  ? "border-transparent text-white"
                  : "border-[#262626] text-[#737373] hover:border-[#525252] hover:text-white"
              }`}
              style={isSelected ? { backgroundColor: service.color } : undefined}
            >
              {service.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
