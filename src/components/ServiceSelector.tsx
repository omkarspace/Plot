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
      <p className="text-steel-dark text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-board)] mb-3">
        Which platforms?
      </p>
      <div className="flex flex-wrap gap-0 border border-ruled">
        {services.map((service) => {
          const isSelected = selected.includes(service.id);
          return (
            <button
              key={service.id}
              onClick={() => onToggle(service.id)}
              className={`px-4 py-2.5 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-medium transition-colors border-r border-ruled last:border-r-0 ${
                isSelected
                  ? "bg-delay-amber/10 text-delay-amber border-b-2 border-b-delay-amber"
                  : "text-steel-frame hover:text-flap-white hover:bg-flap-shadow border-b-2 border-b-transparent"
              }`}
            >
              {service.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
