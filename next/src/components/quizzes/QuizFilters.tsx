import { Filter, Search } from "lucide-react";

export function QuizFilters() {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">

      <label className="relative block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8F8F]" />
        <input
          className="q-input pl-10"
          placeholder="Search quizzes..."
          type="search"
        />
      </label>

      <button className="q-button q-button-secondary flex items-center justify-center gap-2">
        <Filter className="h-4 w-4 pt-4" />
        Filters
      </button>
    </div>
  );
}