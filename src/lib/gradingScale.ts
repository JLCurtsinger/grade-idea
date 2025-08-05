export function getLetterGrade(score: number): { letter: string; color: string } {
  if (score >= 98) return { letter: "A+", color: "green" };
  if (score >= 92) return { letter: "A", color: "green" };
  if (score >= 90) return { letter: "A-", color: "green" };
  if (score >= 88) return { letter: "B+", color: "lime" };
  if (score >= 82) return { letter: "B", color: "lime" };
  if (score >= 80) return { letter: "B-", color: "yellow" };
  if (score >= 78) return { letter: "C+", color: "yellow" };
  if (score >= 72) return { letter: "C", color: "orange" };
  if (score >= 70) return { letter: "C-", color: "orange" };
  if (score >= 68) return { letter: "D+", color: "red" };
  if (score >= 62) return { letter: "D", color: "red" };
  if (score >= 60) return { letter: "D-", color: "red" };
  return { letter: "F", color: "gray" };
} 