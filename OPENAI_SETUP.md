# OpenAI API Setup for analyzeIdea Function

## Overview

The `analyzeIdea` API route requires an OpenAI API key to function. This document explains how to set up the required environment variable.

## Environment Variable

Add the following environment variable to your `.env.local` file:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to "API Keys" in the left sidebar
4. Click "Create new secret key"
5. Give your key a name (e.g., "GradeIdea Analysis")
6. Copy the generated key and add it to your `.env.local` file

## Vercel Deployment

If deploying to Vercel, add the environment variable in your Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add `OPENAI_API_KEY` with your API key value
4. Redeploy your application

## API Usage

The `analyzeIdea` function uses GPT-4o model with the following parameters:
- Temperature: 0.7
- Max tokens: Default (model limit)
- Model: gpt-4o

## Cost Estimation

Each idea analysis consumes approximately:
- 1 API call to OpenAI
- Estimated cost: $0.01-0.03 per analysis (depending on idea length)

## Security Notes

- Never commit your API key to version control
- The API key is only used server-side in the API route
- All requests are authenticated via Firebase Auth
- Token balance is validated before each analysis

## Testing

To test the API locally:

1. Ensure your `.env.local` file contains the `OPENAI_API_KEY`
2. Start the development server: `npm run dev`
3. Make a POST request to `/api/analyzeIdea` with:
   ```json
   {
     "ideaText": "Your startup idea here",
     "idToken": "firebase_id_token"
   }
   ```

## Error Handling

The function includes comprehensive error handling for:
- Missing or invalid API key
- OpenAI API errors
- Invalid response format
- Authentication failures
- Insufficient token balance 