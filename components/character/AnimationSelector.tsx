"use client";

type AnimationConfig = {
  name: string;
  row: number;
  frames: number;
  directions: number;
};

type AnimationSelectorProps = {
  selectedAnimation: string;
  onAnimationChange: (animationKey: string) => void;
};

export const ANIMATIONS: Record<string, AnimationConfig> = {
  walk: { name: "Walk", row: 8, frames: 9, directions: 4 },
  spellcast: { name: "Spellcast", row: 0, frames: 7, directions: 4 },
  thrust: { name: "Thrust", row: 4, frames: 8, directions: 4 },
  slash: { name: "Slash", row: 12, frames: 6, directions: 4 },
  shoot: { name: "Shoot", row: 16, frames: 13, directions: 4 },
  idle: { name: "Idle", row: 22, frames: 1, directions: 4 },
  hurt: { name: "Hurt", row: 20, frames: 6, directions: 1 },
  climb: { name: "Climb", row: 21, frames: 6, directions: 1 },
  jump: { name: "Jump", row: 26, frames: 6, directions: 4 },
  sit: { name: "Sit", row: 30, frames: 3, directions: 4 },
  emote: { name: "Emote", row: 34, frames: 3, directions: 4 },
  run: { name: "Run", row: 38, frames: 8, directions: 4 },
  combat: { name: "Combat Idle", row: 42, frames: 1, directions: 4 },
  "1h_slash": { name: "1-Hand Slash", row: 46, frames: 13, directions: 4 },
  "1h_halfslash": { name: "1-Hand Halfslash", row: 50, frames: 6, directions: 4 },
};

export function AnimationSelector({
  selectedAnimation,
  onAnimationChange,
}: AnimationSelectorProps) {
  return (
    <div className="space-y-3">
      <label htmlFor="animation-select" className="block text-sm font-medium text-gray-700">
        Animation Type
      </label>
      <select
        id="animation-select"
        value={selectedAnimation}
        onChange={(e) => onAnimationChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 shadow-sm hover:border-gray-400 transition-colors"
      >
        {Object.entries(ANIMATIONS).map(([key, config]) => (
          <option key={key} value={key}>
            {config.name} ({config.frames} frames × {config.directions} directions)
          </option>
        ))}
      </select>

      <div className="text-xs text-gray-500 mt-2">
        Select an animation to preview the character movement
      </div>
    </div>
  );
}

