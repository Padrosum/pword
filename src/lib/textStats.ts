export function countWords(text: string): number {
  const trimmed = text.trim()
  if (trimmed === '') return 0
  return trimmed.split(/\s+/).length
}

export function countCharacters(text: string): number {
  // Count what the writer perceives as characters: code points, not UTF-16 units.
  // Iterate instead of spreading into an array — long documents allocate far less.
  let count = 0
  for (const _ of text) count += 1
  return count
}
