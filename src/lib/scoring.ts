import type { MappingStrength, RelevanceScore } from "./types";

interface ConceptMapping {
  mapping_strength: MappingStrength;
}

interface Delta {
  current_rule: string;
  new_rule: string;
  change_type: string;
}

export function computeRelevanceScore(
  mappings: ConceptMapping[],
  deltas: Delta[]
): RelevanceScore {
  const directCount = mappings.filter(
    (m) => m.mapping_strength === "DIRECT"
  ).length;
  const inferredCount = mappings.filter(
    (m) => m.mapping_strength === "INFERRED"
  ).length;
  const tangentialCount = mappings.filter(
    (m) => m.mapping_strength === "TANGENTIAL"
  ).length;
  const hasDeltas = deltas.length > 0;

  if (hasDeltas || directCount >= 3) return "HIGH";
  if (directCount >= 1 || inferredCount >= 3) return "MEDIUM";
  if (inferredCount >= 1 || tangentialCount >= 2) return "LOW";
  return "NOT_RELEVANT";
}
