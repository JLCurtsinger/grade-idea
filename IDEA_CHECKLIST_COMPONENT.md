# IdeaChecklist Component

## Overview

The `IdeaChecklist` component is an interactive checklist that allows users to track actionable suggestions for improving their graded startup ideas. It displays suggestions organized by scoring categories with checkboxes, progress tracking, and smooth animations.

## Features

- **Interactive Checkboxes**: Click to mark suggestions as completed
- **Progress Tracking**: Visual progress bars and completion counts
- **Score Display**: Shows category scores with color-coded indicators
- **Smooth Animations**: Hover effects and transitions for better UX
- **Keyboard Accessible**: Full keyboard navigation support
- **Responsive Design**: Works on all screen sizes
- **Dark Theme Compatible**: Matches the existing design system

## Usage

```tsx
import { IdeaChecklist, mockChecklistData } from "@/components/IdeaChecklist";

// Use with mock data
<IdeaChecklist checklistData={mockChecklistData} />

// Or with your own data
const customData = {
  marketPotential: {
    score: 4,
    suggestions: [
      { id: 'mkt-1', text: 'Research market size', completed: false },
      { id: 'mkt-2', text: 'Validate with customers', completed: true }
    ]
  },
  // ... other sections
};

<IdeaChecklist checklistData={customData} />
```

## Data Structure

```typescript
interface ChecklistSuggestion {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistSection {
  score: number;
  suggestions: ChecklistSuggestion[];
}

interface ChecklistData {
  marketPotential: ChecklistSection;
  monetizationClarity: ChecklistSection;
  executionDifficulty: ChecklistSection;
}
```

## Props

- `checklistData: ChecklistData` - The checklist data to display

## Sections

The component supports three main sections:

1. **Market Potential** - Suggestions for market research and validation
2. **Monetization Clarity** - Pricing and revenue model suggestions
3. **Execution Difficulty** - Technical and implementation suggestions

## Styling

- Uses Tailwind CSS classes
- Matches the existing dark theme
- Smooth transitions and hover effects
- Color-coded scores (green/yellow/red)
- Progress bars with gradient backgrounds

## Integration

The component is currently integrated into `IdeaDetailModal.tsx` and can be used anywhere in the application by importing it and passing the appropriate data.

## Future Enhancements

- Persist checklist state to database
- Add due dates for suggestions
- Export checklist as PDF
- Share checklist with team members
- Add priority levels for suggestions 