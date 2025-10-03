import React from 'react';

/**
 * PriorityBadge: badge consistente para prioridades Alta/Media/Baja.
 * Props: level ('Alta'|'Media'|'Baja'), small (boolean)
 */
export function PriorityBadge({ level, small }) {
  const base = 'inline-flex items-center font-medium rounded-full whitespace-nowrap';
  const size = small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';
  const map = {
    Alta: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    Media: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
    Baja: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
  };
  const cls = map[level] || 'bg-techo-gray-100 text-techo-gray-600 dark:bg-techo-gray-700 dark:text-techo-gray-300';
  return <span className={`${base} ${size} ${cls}`}> {level} </span>;
}
