import { categories } from "@vinfuit/fruitData";
import { categoryLabel, type Language } from "@vinfuit/lib/i18n";

export function CategoryTabs({
  active,
  onCategory,
  language = "vi",
  vertical = false,
}: {
  active: string;
  onCategory: (category: string) => void;
  language?: Language;
  vertical?: boolean;
}) {
  return (
    <div
      className={
        vertical
          ? "flex flex-col gap-2"
          : "kf-scroll-tabs mb-5 flex gap-2 overflow-x-auto"
      }
    >
      {categories.map((category) => (
        <button
          className={`btn btn-sm ${active === category ? "btn-primary" : "btn-outline"}`}
          key={category}
          onClick={() => onCategory(category)}
        >
          {categoryLabel(category, language)}
        </button>
      ))}
    </div>
  );
}
