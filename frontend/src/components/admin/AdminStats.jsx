import React from "react";
import { StatCard } from "../../components/ui/StatCard";

/**
 * AdminStats recibe `stats` = [{ icon, label, value, subtitle, accent }]
 */
export default function AdminStats({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((s, i) => (
        <StatCard
          key={i}
          icon={s.icon}
          label={s.label}
          value={s.value}
          subtitle={s.subtitle}
          accent={s.accent}
        />
      ))}
    </div>
  );
}