// Test script for analyzeIdea API route
// Run this with: node test-analyze-idea.js

const testAnalyzeIdea = async () => {
  const testData = {
    ideaText: "A mobile app that helps people find and book local fitness classes with real-time availability and instant booking.",
    idToken: "test_token_placeholder" // Replace with actual Firebase ID token
  };

  try {
    const response = await fetch('http://localhost:3000/api/analyzeIdea', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ API test successful!');
      console.log('Idea ID:', result.ideaId);
    } else {
      console.log('❌ API test failed');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  console.log('🧪 Testing analyzeIdea API route...');
  console.log('Make sure your development server is running on port 3000');
  console.log('And you have OPENAI_API_KEY set in your .env.local file');
  console.log('');
  
  testAnalyzeIdea();
}

module.exports = { testAnalyzeIdea }; 