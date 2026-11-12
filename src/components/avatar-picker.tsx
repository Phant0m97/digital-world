import { AVATARS, AVATAR_GROUPS } from "@/data/catalog";
import { Avatar } from "@/components/avatar";

export function AvatarPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
      {AVATAR_GROUPS.map((group) => (
        <section key={group.id}>
          <h3 className="sticky top-0 z-10 bg-ink py-2 font-display text-sm tracking-wide">{group.label}</h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {AVATARS.filter((avatar) => avatar.group === group.id).map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => onChange(avatar.id)}
                aria-label={avatar.name}
                className={`rounded-2xl border p-1 text-center ${value === avatar.id ? "border-cyan" : "border-transparent"}`}
              >
                <Avatar id={avatar.id} className="w-full" />
                <span className="mt-1 block px-0.5 text-xs leading-tight">{avatar.name}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
