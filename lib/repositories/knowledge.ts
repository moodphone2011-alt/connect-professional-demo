import { getDatabase } from "@/lib/demo/store";
import type { KnowledgeDoc } from "@/lib/demo/types";

function matches(doc: KnowledgeDoc, needle: string): boolean {
  if (!needle) return true;
  const haystack = [
    doc.title,
    doc.category,
    doc.summary,
    doc.tags.join(" "),
    doc.sections.map((section) => `${section.heading} ${section.body}`).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

export const knowledgeRepository = {
  list(): KnowledgeDoc[] {
    return [...getDatabase().knowledge].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getById(id: string): KnowledgeDoc | undefined {
    return getDatabase().knowledge.find((doc) => doc.id === id);
  },

  categories(): string[] {
    return Array.from(new Set(knowledgeRepository.list().map((doc) => doc.category))).sort();
  },

  search(query: string, category = "All"): KnowledgeDoc[] {
    return knowledgeRepository
      .list()
      .filter((doc) => (category === "All" ? true : doc.category === category))
      .filter((doc) => matches(doc, query.trim()));
  },
};
