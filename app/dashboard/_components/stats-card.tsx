interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export function StatsCard({ title, value, subtitle, color = "#111827" }: StatsCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
