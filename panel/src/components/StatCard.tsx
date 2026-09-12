export default function StatCard({
  label,
  value,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: number | string;
  icon: string;
  tone?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const tones: Record<string, string> = {
    blue: 'bg-accent/15 text-accent',
    green: 'bg-green-500/15 text-green-500',
    red: 'bg-red-500/15 text-red-500',
    yellow: 'bg-yellow-500/15 text-yellow-500',
  };

  return (
    <div className="bg-card border border-edge rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${tones[tone]}`}>
        <i className={icon} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
