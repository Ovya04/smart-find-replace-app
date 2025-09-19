const express = require('express');
const router = express.Router();

const contentstackService = require('../services/contentstackService');
const nlpService = require('../services/nlpService');
const brandkitService = require('../services/brandkitService');
const ReplacementLog = require('../models/ReplacementLog');

// Scan and preview replacements
router.post('/scan', async (req, res) => {
  try {
    const {
      authtoken,
      apiKey,
      findTerm,
      replaceTerm,
      contentTypes,
      options,
      brandKitId
    } = req.body;

    // Initialize services
    contentstackService.initialize(authtoken, apiKey);
    if (brandKitId) {
      brandkitService.initialize(authtoken);
    }

    // Fetch entries
    const entries = await contentstackService.fetchAllEntries(contentTypes);
    
    const results = [];
    
    for (const entry of entries) {
      const entryResults = await processEntry(entry, findTerm, replaceTerm, options, brandKitId);
      if (entryResults.changes.length > 0) {
        results.push(entryResults);
      }
    }

    res.json({
      success: true,
      totalEntries: entries.length,
      entriesWithChanges: results.length,
      results,
      preview: results.slice(0, 10) // First 10 for preview
    });

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply replacements
router.post('/apply', async (req, res) => {
  try {
    const {
      authtoken,
      apiKey,
      selectedChanges,
      options
    } = req.body;

    contentstackService.initialize(authtoken, apiKey);

    const results = [];
    
    for (const change of selectedChanges) {
      try {
        const response = await contentstackService.updateEntry(
          change.contentTypeUid,
          change.entryUid,
          change.updatedData
        );
        
        results.push({
          entryUid: change.entryUid,
          success: true,
          response
        });

        // Log the change
        if (process.env.MONGODB_URI) {
          await ReplacementLog.create({
            entryUid: change.entryUid,
            contentTypeUid: change.contentTypeUid,
            changes: change.changes,
            timestamp: new Date(),
            userId: req.headers['user-id'] || 'unknown'
          });
        }

      } catch (error) {
        results.push({
          entryUid: change.entryUid,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      appliedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to process individual entry
async function processEntry(entry, findTerm, replaceTerm, options, brandKitId) {
  const changes = [];
  const updatedEntry = { ...entry };

  // Process each field
  for (const [fieldKey, fieldValue] of Object.entries(entry)) {
    if (shouldProcessField(fieldKey, fieldValue)) {
      const processedField = await processField(
        fieldKey,
        fieldValue,
        findTerm,
        replaceTerm,
        options,
        brandKitId
      );

      if (processedField.hasChanges) {
        changes.push({
          field: fieldKey,
          before: fieldValue,
          after: processedField.value,
          changeCount: processedField.changeCount
        });
        updatedEntry[fieldKey] = processedField.value;
      }
    }
  }

  return {
    entryUid: entry.uid,
    contentTypeUid: entry.content_type_uid,
    title: entry.title || 'Untitled',
    changes,
    updatedData: updatedEntry
  };
}

// Process individual field
async function processField(fieldKey, fieldValue, findTerm, replaceTerm, options, brandKitId) {
  let hasChanges = false;
  let changeCount = 0;
  let processedValue = fieldValue;

  // Handle different field types
  if (typeof fieldValue === 'string') {
    // Simple text field
    const originalValue = fieldValue;
    
    if (options.contextAware) {
      processedValue = nlpService.contextAwareReplace(fieldValue, findTerm, replaceTerm);
    } else {
      const regex = new RegExp(`\\b${escapeRegex(findTerm)}\\b`, 'gi');
      processedValue = fieldValue.replace(regex, replaceTerm);
    }
    
    if (processedValue !== originalValue) {
      hasChanges = true;
      changeCount = (originalValue.match(new RegExp(`\\b${escapeRegex(findTerm)}\\b`, 'gi')) || []).length;
    }

  } else if (fieldValue && typeof fieldValue === 'object') {
    // Rich text or complex object
    if (isRichTextField(fieldValue)) {
      const originalValue = JSON.stringify(fieldValue);
      processedValue = contentstackService.processRichText(fieldValue, findTerm, replaceTerm, options);
      
      if (JSON.stringify(processedValue) !== originalValue) {
        hasChanges = true;
        changeCount = 1; // Simplified for complex fields
      }
    } else if (Array.isArray(fieldValue)) {
      // Handle arrays
      processedValue = [];
      for (let i = 0; i < fieldValue.length; i++) {
        const itemResult = await processField(`${fieldKey}[${i}]`, fieldValue[i], findTerm, replaceTerm, options, brandKitId);
        processedValue.push(itemResult.value);
        if (itemResult.hasChanges) {
          hasChanges = true;
          changeCount += itemResult.changeCount;
        }
      }
    }
  }

  return {
    value: processedValue,
    hasChanges,
    changeCount
  };
}

// Helper functions
function shouldProcessField(fieldKey, fieldValue) {
  // Skip system fields
  const systemFields = ['uid', '_version', 'created_at', 'updated_at', 'created_by', 'updated_by'];
  if (systemFields.includes(fieldKey)) return false;
  
  // Skip null/undefined values
  if (fieldValue === null || fieldValue === undefined) return false;
  
  return true;
}

function isRichTextField(value) {
  return value && 
         typeof value === 'object' && 
         (value.type === 'doc' || 
          (value.children && Array.isArray(value.children)));
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = router;
