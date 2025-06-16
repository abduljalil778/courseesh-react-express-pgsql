import { SUBJECT_CATEGORIES } from "@/config";

export function getCategoryLabel(code) {
  const found = SUBJECT_CATEGORIES.find(cat => cat.value === code);
  return found ? found.label : code;
}
