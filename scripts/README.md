# Scripts

This directory contains utility scripts for managing and maintaining the GradeIdea.cc application.

## fix-public-ideas-structure.js

A one-time script to scan and fix Firestore data structure for public ideas.

### Purpose

This script ensures that all ideas in Firestore have the proper structure for the public ideas feature to work correctly.

### What it does

1. **Scans all ideas** - checks every idea across all users
2. **Adds missing public fields** - sets `public: false` for ideas without the field
3. **Validates public ideas** - ensures public ideas have valid score structures
4. **Fixes legacy data** - explicitly sets `public: true` for legacy public ideas

### Usage

```bash
# Using npm script
npm run fix-public-ideas

# Or directly with node
node scripts/fix-public-ideas-structure.js
```

### Requirements

- Firebase Admin SDK credentials (`serviceAccountKey.json`)
- Access to Firestore database

### Output

- Console logs showing progress and results
- Summary of total ideas scanned and updated
- List of any malformed entries that need manual review

### After running

1. **Verify the script completed** without errors
2. **Check the summary** to see how many documents were updated
3. **Review any malformed entries** that were flagged
4. **Verify the public ideas feature** works correctly on the `/examples` page

---

## generateBlogPost.js

A script to automatically generate SEO-optimized blog posts from seed keywords, with automatic internal linking to public ideas and category pages.

### Purpose

This script helps content creators generate high-quality blog posts for the Founders' Learning Hub that are:
- SEO-optimized for target keywords
- Automatically linked to relevant public ideas
- Connected to category validation pages
- Saved in proper MDX format with frontmatter

### What it does

1. **Fetches top public ideas** from Firestore (ordered by score)
2. **Gets available categories** from the codebase
3. **Generates blog post content** using OpenAI GPT-4
4. **Automatically adds internal links** to public ideas and category pages
5. **Saves as MDX file** with proper frontmatter in `/content/founders-hub`

### Usage

```bash
# Using npm script
npm run generate-blog "seed keyword"

# Or directly with node
node scripts/generateBlogPost.js "seed keyword"

# Examples
npm run generate-blog "how to validate AI startup idea"
npm run generate-blog "SaaS business model validation"
npm run generate-blog "fintech startup market research"
```

### Requirements

- Firebase Admin SDK credentials (`serviceAccountKey.json`)
- OpenAI API key (`OPENAI_API_KEY` environment variable)
- Access to Firestore database
- Existing public ideas in the database

### Features

- **Smart linking**: Automatically incorporates 2-3 public idea links and 1-2 category page links
- **SEO optimization**: Generates title under 60 chars and description under 160 chars
- **Content quality**: 1200-1500 word articles with proper H2/H3 structure
- **Duplicate prevention**: Skips generation if file already exists
- **Automatic slugging**: Converts titles to kebab-case URLs

### Output

- MDX file saved to `/content/founders-hub/{slug}.mdx`
- Console output showing generation progress
- File path and URL information
- Word count and metadata summary

### File structure

Generated files include:
```mdx
---
title: "SEO Title"
description: "Meta Description"
date: "YYYY-MM-DD"
---

# Blog post content with internal links

## Section with H2 headings

Content that naturally incorporates links like:
[AI Startup Validation](/idea/abc123) and [SaaS Category](/validate/saas)

### Subsection with H3 headings

More content...
```

### After running

1. **Check the generated file** in `/content/founders-hub/`
2. **Verify internal links** are working correctly
3. **Review content quality** and make any necessary edits
4. **Test the live page** at `/founders-hub/{slug}`

### Tips for best results

- Use specific, descriptive seed keywords
- Ensure you have quality public ideas in the database
- Review generated content for accuracy and tone
- Consider running multiple times with different keywords to build content library 