const admin = require('firebase-admin');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

// Initialize Firebase Admin SDK
let db;
try {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  console.log('\n📋 Setup required:');
  console.log('1. Download serviceAccountKey.json from Firebase Console');
  console.log('   - Go to Project Settings > Service Accounts');
  console.log('   - Click "Generate New Private Key"');
  console.log('   - Save as serviceAccountKey.json in project root');
  console.log('2. Set OPENAI_API_KEY environment variable');
  console.log('   - export OPENAI_API_KEY="your-api-key-here"');
  process.exit(1);
}

// Initialize OpenAI
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✅ OpenAI client initialized successfully');
} catch (error) {
  console.error('❌ OpenAI initialization failed:', error.message);
  console.log('\n📋 Setup required:');
  console.log('Set OPENAI_API_KEY environment variable:');
  console.log('export OPENAI_API_KEY="your-api-key-here"');
  process.exit(1);
}

// Available categories from the codebase
const AVAILABLE_CATEGORIES = [
  { slug: 'ai', name: 'AI', displayName: 'AI' },
  { slug: 'saas', name: 'SaaS', displayName: 'SaaS' },
  { slug: 'ecommerce', name: 'E-commerce', displayName: 'E-commerce' },
  { slug: 'healthtech', name: 'HealthTech', displayName: 'HealthTech' },
  { slug: 'fintech', name: 'FinTech', displayName: 'FinTech' }
];

// Function to fetch top public ideas from Firestore
async function fetchTopPublicIdeas(limit = 5) {
  try {
    console.log('🔍 Fetching top public ideas from Firestore...');
    
    const ideasSnapshot = await db
      .collectionGroup('ideas')
      .where('public', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const ideas = [];
    
    for (const doc of ideasSnapshot.docs) {
      const data = doc.data();
      
      if (!data.ideaText) continue;
      
      // Use baseScores for ranking (original LLM evaluation)
      let baseScores = data.baseScores;
      if (!baseScores && data.initial_scores) {
        baseScores = data.initial_scores;
      }
      if (!baseScores && data.analysis) {
        baseScores = {
          market: data.analysis.market_potential || 0,
          differentiation: data.analysis.competition || 0,
          monetization: data.analysis.monetization || 0,
          execution: data.analysis.execution || 0,
          growth: data.analysis.market_potential || 0,
          overall: data.analysis.overall_score || 0
        };
      }

      if (baseScores && data.ideaText) {
        ideas.push({
          id: doc.id,
          title: data.ideaText.substring(0, 100) + (data.ideaText.length > 100 ? '...' : ''),
          ideaText: data.ideaText,
          baseScores: baseScores,
          createdAt: data.createdAt,
          recommendation: data.analysis?.recommendation || data.grading?.recommendation || null
        });
      }
    }

    // Sort by overall score descending
    ideas.sort((a, b) => {
      if (b.baseScores.overall !== a.baseScores.overall) {
        return b.baseScores.overall - a.baseScores.overall;
      }
      
      const aPerfectScores = Object.values(a.baseScores).filter(score => score === 100).length;
      const bPerfectScores = Object.values(b.baseScores).filter(score => score === 100).length;
      
      return bPerfectScores - aPerfectScores;
    });

    console.log(`✅ Fetched ${ideas.length} public ideas`);
    return ideas.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Error fetching public ideas:', error);
    return [];
  }
}

// Function to generate blog post content using OpenAI
async function generateBlogPost(seedKeyword, publicIdeas, categories) {
  try {
    console.log('🤖 Generating blog post with OpenAI...');
    
    // Prepare public ideas for the prompt
    const publicIdeasList = publicIdeas.map(idea => ({
      title: idea.title,
      url: `/idea/${idea.id}`
    }));
    
    // Prepare categories for the prompt
    const categoriesList = categories.map(cat => ({
      name: cat.displayName,
      url: `/validate/${cat.slug}`
    }));

    const systemPrompt = `You are a senior startup content writer for GradeIdea.cc. You write engaging, informative blog posts that help founders validate their startup ideas. Your writing style is professional yet approachable, with practical insights and actionable advice.`;

    const userPrompt = `Write an SEO blog post for the 'Founders' Learning Hub' at GradeIdea.cc targeting the keyword: "${seedKeyword}".

Include:
- Title under 60 characters
- Meta description under 160 characters  
- Markdown body (1200-1500 words) with H2/H3 headings
- Naturally embed these internal links:
  Public ideas: ${JSON.stringify(publicIdeasList, null, 2)}
  Categories: ${JSON.stringify(categoriesList, null, 2)}

Requirements:
- Keep founder-focused tone
- Encourage readers to try GradeIdea.cc
- Use descriptive anchor text (never "click here")
- Naturally incorporate 2-3 public idea links
- Naturally incorporate 1-2 category page links
- Include practical tips and actionable advice
- End with a strong call-to-action to validate ideas on GradeIdea.cc

Format the response as JSON with this structure:
{
  "title": "SEO Title",
  "description": "Meta Description", 
  "content": "Markdown content with embedded internal links"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const response = completion.choices[0].message.content;
    
    try {
      const parsedResponse = JSON.parse(response);
      console.log('✅ Blog post generated successfully');
      return parsedResponse;
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', parseError);
      console.log('Raw response:', response);
      throw new Error('OpenAI response was not valid JSON');
    }
    
  } catch (error) {
    console.error('❌ Error generating blog post:', error);
    throw error;
  }
}

// Function to convert title to kebab-case slug
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
}

// Function to save blog post as MDX file
async function saveBlogPost(slug, title, description, content) {
  try {
    const contentDir = path.join(__dirname, '..', 'content', 'founders-hub');
    
    // Ensure content directory exists
    await fs.mkdir(contentDir, { recursive: true });
    
    const filePath = path.join(contentDir, `${slug}.mdx`);
    
    // Check if file already exists
    try {
      await fs.access(filePath);
      console.log(`⚠️  File ${slug}.mdx already exists. Skipping...`);
      return false;
    } catch {
      // File doesn't exist, proceed with creation
    }
    
    // Create frontmatter
    const today = new Date().toISOString().split('T')[0];
    const frontmatter = `---
title: "${title}"
description: "${description}"
date: "${today}"
---

`;
    
    // Combine frontmatter and content
    const fullContent = frontmatter + content;
    
    // Save file with UTF-8 encoding
    await fs.writeFile(filePath, fullContent, 'utf8');
    
    console.log(`✅ Blog post saved: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error saving blog post:', error);
    throw error;
  }
}

// Main function
async function generateBlogPostFromKeyword(seedKeyword) {
  try {
    console.log(`🚀 Starting blog post generation for keyword: "${seedKeyword}"`);
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    // Fetch data from Firestore
    const publicIdeas = await fetchTopPublicIdeas(5);
    const categories = AVAILABLE_CATEGORIES;
    
    if (publicIdeas.length === 0) {
      console.log('⚠️  No public ideas found. Consider making some ideas public first.');
    }
    
    // Generate blog post content
    const blogPost = await generateBlogPost(seedKeyword, publicIdeas, categories);
    
    // Create slug from title
    const slug = titleToSlug(blogPost.title);
    
    // Save blog post
    const saved = await saveBlogPost(slug, blogPost.title, blogPost.description, blogPost.content);
    
    if (saved) {
      console.log('\n🎉 Blog post generation completed successfully!');
      console.log(`📁 File: content/founders-hub/${slug}.mdx`);
      console.log(`🔗 Will be available at: /founders-hub/${slug}`);
      console.log(`📝 Title: ${blogPost.title}`);
      console.log(`📋 Description: ${blogPost.description}`);
      console.log(`📊 Word count: ~${blogPost.content.split(' ').length} words`);
    } else {
      console.log('\n⏭️  Blog post generation skipped (file already exists)');
    }
    
  } catch (error) {
    console.error('❌ Blog post generation failed:', error);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  const seedKeyword = process.argv[2];
  
  if (!seedKeyword) {
    console.error('❌ Usage: node scripts/generateBlogPost.js "seed keyword"');
    console.error('Example: node scripts/generateBlogPost.js "how to validate AI startup idea"');
    process.exit(1);
  }
  
  generateBlogPostFromKeyword(seedKeyword)
    .then(() => {
      console.log('\n✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  generateBlogPostFromKeyword,
  fetchTopPublicIdeas,
  generateBlogPost,
  saveBlogPost
};
