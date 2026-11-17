import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  accentClass?: string;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accentClass = 'bg-accent/10 text-accent',
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-content-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-content">{value}</p>
          {sublabel && <p className="mt-1 truncate text-xs text-content-secondary">{sublabel}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

