'use client';

export default function ToggleRow({
  name,
  label,
  description,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-accent/[0.03] transition-all duration-300 group">
      <div className="flex-1 me-4">
        <p className="text-sm text-white font-medium group-hover:text-accent/90 transition-colors">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <input type="hidden" name={name} value="off" />
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        value="on"
        className="sr-only peer"
      />
      <div className="relative w-11 h-[22px] bg-edge/60 rounded-full peer-checked:bg-accent/80 transition-all duration-300 after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-300 peer-checked:after:translate-x-[18px] peer-checked:shadow-[0_0_12px_rgb(var(--rgb-accent)/0.4)] flex-shrink-0" />
    </label>
  );
}
