import React from "react";
import { ActionCard } from "../../components/ui/ActionCard";

/**
 * AdminTools recibe `sections` = [{ title, description, badge, action, icon, accent }]
 */
export default function AdminTools({ sections = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {sections.map((s, i) => (
        <ActionCard
          key={i}
          title={s.title}
          description={s.description}
          badge={s.badge}
          onClick={s.action}
          icon={s.icon}
          accent={s.accent}
        />
      ))}
    </div>
  );
}