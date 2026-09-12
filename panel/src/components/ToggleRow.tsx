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
    <label className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-card2 transition-colors">
      <div className="flex-1 mr-4">
        <p className="text-sm text-white font-medium">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <input type="hidden" name={name} value="off" />
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        value="on"
        className="sr-only peer"
      />
      <div className="relative w-10 h-5 bg-edge rounded-full peer-checked:bg-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}
