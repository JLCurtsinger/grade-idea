const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to add your service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixPublicIdeasStructure() {
  console.log('=== Starting Public Ideas Structure Fix ===');
  
  let totalScanned = 0;
  let documentsUpdated = 0;
  let skippedEntries = [];
  let malformedEntries = [];

  try {
    // Get all ideas from all users using collectionGroup query
    const ideasSnapshot = await db.collectionGroup('ideas').get();
    
    console.log(`Found ${ideasSnapshot.size} total ideas to scan...`);

    for (const doc of ideasSnapshot.docs) {
      totalScanned++;
      const data = doc.data();
      const uid = doc.ref.parent.parent.id; // Extract UID from path
      const ideaId = doc.id;
      
      let needsUpdate = false;
      const updates = {};

      // 1. Check if document contains a public field
      if (data.public === undefined) {
        console.log(`[${uid}/${ideaId}] Missing public field, adding public: false`);
        updates.public = false;
        needsUpdate = true;
      }

      // 2. Check if document is marked public: true
      if (data.public === true) {
        console.log(`[${uid}/${ideaId}] Public idea found, checking score structure...`);
        
        // Check for valid score structures
        const hasInitialScores = data.initial_scores && 
          typeof data.initial_scores === 'object' && 
          Object.keys(data.initial_scores).length > 0;
        
        const hasAnalysisScoreBreakdown = data.analysis && 
          data.analysis.scoreBreakdown && 
          typeof data.analysis.scoreBreakdown === 'object';
        
        const hasAnalysisDirect = data.analysis && 
          data.analysis.market_potential !== undefined &&
          data.analysis.competition !== undefined &&
          data.analysis.monetization !== undefined &&
          data.analysis.execution !== undefined &&
          data.analysis.overall_score !== undefined;

        if (!hasInitialScores && !hasAnalysisScoreBreakdown && !hasAnalysisDirect) {
          console.log(`[${uid}/${ideaId}] ⚠️  Public idea missing valid score structure - skipping`);
          malformedEntries.push({
            uid,
            ideaId,
            reason: 'Public idea missing valid score structure',
            data: {
              hasInitialScores,
              hasAnalysisScoreBreakdown,
              hasAnalysisDirect,
              ideaText: data.ideaText?.substring(0, 100) + '...',
              createdAt: data.createdAt
            }
          });
          continue; // Skip this document
        }

        // 4. For ideas that are public but missing the public field (legacy data)
        if (data.public === true && !doc.data().hasOwnProperty('public')) {
          console.log(`[${uid}/${ideaId}] Legacy public idea - explicitly setting public: true`);
          updates.public = true;
          needsUpdate = true;
        }
      }

      // Apply updates if needed
      if (needsUpdate) {
        try {
          await doc.ref.update(updates);
          documentsUpdated++;
          console.log(`[${uid}/${ideaId}] ✅ Updated successfully`);
        } catch (error) {
          console.error(`[${uid}/${ideaId}] ❌ Failed to update:`, error.message);
          skippedEntries.push({
            uid,
            ideaId,
            reason: 'Update failed',
            error: error.message
          });
        }
      }
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total ideas scanned: ${totalScanned}`);
    console.log(`Documents updated: ${documentsUpdated}`);
    console.log(`Skipped entries: ${skippedEntries.length}`);
    console.log(`Malformed entries: ${malformedEntries.length}`);

    if (skippedEntries.length > 0) {
      console.log('\n=== SKIPPED ENTRIES ===');
      skippedEntries.forEach(entry => {
        console.log(`[${entry.uid}/${entry.ideaId}]: ${entry.reason} - ${entry.error}`);
      });
    }

    if (malformedEntries.length > 0) {
      console.log('\n=== MALFORMED ENTRIES (Manual Review Required) ===');
      malformedEntries.forEach(entry => {
        console.log(`[${entry.uid}/${entry.ideaId}]: ${entry.reason}`);
        console.log(`  Data:`, entry.data);
      });
    }

    console.log('\n=== Public Ideas Structure Fix Complete ===');

  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  fixPublicIdeasStructure()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixPublicIdeasStructure }; 