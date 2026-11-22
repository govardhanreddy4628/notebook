import { Plus } from "lucide-react";

interface AddLanguageProps {
  name: string;
  setName: (name: string) => void;
  saving: boolean;
  add: () => Promise<void>;
}

const AddLanguage = ({
  name,
  setName,
  saving,
  add,
}: AddLanguageProps) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void add();
      }}
      className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-border p-5"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New language…"
        disabled={saving}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {saving ? "Adding..." : "Add language"}
      </button>
    </form>
  );
};

export default AddLanguage;