import React from "react";

/**
 * RecentActivity: lista simple de actividad
 * items = [{ id, text, color, time }]
 */
export default function RecentActivity({ items = [] }) {
  return (
    <ul className="divide-y divide-techo-gray-100 dark:divide-techo-gray-800" aria-label="Lista de actividad reciente">
      {items.map(item => (
        <li key={item.id} className="flex items-center gap-3 py-3">
          <span aria-hidden className={`h-2 w-2 rounded-full ${item.color}`}></span>
          <span className="flex-1 text-sm text-techo-gray-600 dark:text-techo-gray-300">{item.text}</span>
          <time className="text-[11px] text-techo-gray-400 dark:text-techo-gray-500">{item.time}</time>
        </li>
      ))}
    </ul>
  );
}