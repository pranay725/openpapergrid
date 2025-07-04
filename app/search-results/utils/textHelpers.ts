// Helper function to deconstruct the inverted index into a readable string
export const deconstructAbstract = (invertedIndex: Record<string, number[]>): string => {
  if (!invertedIndex) return '';
  const wordPositions: { word: string; position: number }[] = [];
  for (const word in invertedIndex) {
    for (const pos of invertedIndex[word]) {
      wordPositions.push({ word, position: pos });
    }
  }
  wordPositions.sort((a, b) => a.position - b.position);
  return wordPositions.map(wp => wp.word).join(' ');
}; 