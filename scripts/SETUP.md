# Blog Post Generation Script Setup

This guide will help you set up the `generateBlogPost.js` script to generate SEO-optimized blog posts for GradeIdea.cc.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Firebase project** with Firestore database
3. **OpenAI API account** with API key

## Step 1: Firebase Setup

### Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the downloaded file as `serviceAccountKey.json` in your project root
6. **Important**: Add `serviceAccountKey.json` to your `.gitignore` file

### Alternative: Environment Variables

If you prefer not to use a service account file, you can set environment variables:

```bash
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_CLIENT_EMAIL="your-client-email"
export FIREBASE_PRIVATE_KEY="your-private-key"
```

## Step 2: OpenAI Setup

### Get API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the generated API key

### Set Environment Variable

```bash
export OPENAI_API_KEY="your-api-key-here"
```

**For permanent setup, add to your shell profile:**

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
echo 'export OPENAI_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

## Step 3: Verify Setup

### Test Firebase Connection

```bash
# Test if Firebase is accessible
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
console.log('Firebase connection successful');
"
```

### Test OpenAI Connection

```bash
# Test if OpenAI is accessible
node -e "
const OpenAI = require('openai');
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
console.log('OpenAI connection successful');
"
```

## Step 4: Run the Script

### Basic Usage

```bash
# Using npm script
npm run generate-blog "your seed keyword"

# Direct execution
node scripts/generateBlogPost.js "your seed keyword"
```

### Examples

```bash
# Generate blog post about AI startup validation
npm run generate-blog "how to validate AI startup idea"

# Generate blog post about SaaS business models
npm run generate-blog "SaaS business model validation strategies"

# Generate blog post about fintech market research
npm run generate-blog "fintech startup market research guide"
```

## Troubleshooting

### Common Issues

1. **"Firebase Admin SDK initialization failed"**
   - Check if `serviceAccountKey.json` exists in project root
   - Verify the file contains valid JSON
   - Ensure you have Firestore read permissions

2. **"OPENAI_API_KEY environment variable not set"**
   - Set the environment variable: `export OPENAI_API_KEY="your-key"`
   - Restart your terminal after setting the variable

3. **"No public ideas found"**
   - Make sure you have ideas marked as public in your database
   - Run the `fix-public-ideas` script first if needed

4. **"Failed to parse OpenAI response as JSON"**
   - This usually means the API response was malformed
   - Check your OpenAI API key and quota
   - Try running the script again

### Debug Mode

To see more detailed logs, you can modify the script to add more console.log statements or run with Node.js debug flags:

```bash
NODE_OPTIONS="--trace-warnings" node scripts/generateBlogPost.js "test keyword"
```

## Security Notes

- **Never commit** `serviceAccountKey.json` to version control
- **Keep your OpenAI API key** secure and private
- **Monitor API usage** to avoid unexpected charges
- **Use environment variables** in production environments

## Next Steps

After successful setup:

1. **Generate your first blog post** with a test keyword
2. **Review the generated content** for quality and accuracy
3. **Check internal links** to ensure they work correctly
4. **Customize the script** if you need different content styles
5. **Automate generation** by running the script regularly

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify all prerequisites are met
3. Test individual components (Firebase, OpenAI) separately
4. Check the main README.md for additional troubleshooting tips
