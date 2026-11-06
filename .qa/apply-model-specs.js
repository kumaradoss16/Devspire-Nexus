'use strict';

const fs = require('fs');
const path = require('path');
const specs = require('./generate-all-model-specs.js');

function enrichModelRecord(record, spec) {
  if (!spec) return record;
  const updated = {};
  for (const [key, val] of Object.entries(record)) {
    updated[key] = val;
    if (key === 'technical_tags') {
      updated.params = spec.params !== undefined ? spec.params : null;
      updated.context = spec.context !== undefined ? spec.context : null;
      updated.context_k = spec.context_k !== undefined ? spec.context_k : null;
      updated.license = spec.license !== undefined ? spec.license : null;
      updated.license_group = spec.license_group !== undefined ? spec.license_group : null;
      updated.moe = (spec.params && /moe/i.test(spec.params)) ? true : false;
    }
  }
  if (updated.params === undefined) updated.params = spec.params !== undefined ? spec.params : null;
  if (updated.context === undefined) updated.context = spec.context !== undefined ? spec.context : null;
  if (updated.context_k === undefined) updated.context_k = spec.context_k !== undefined ? spec.context_k : null;
  if (updated.license === undefined) updated.license = spec.license !== undefined ? spec.license : null;
  if (updated.license_group === undefined) updated.license_group = spec.license_group !== undefined ? spec.license_group : null;
  if (updated.moe === undefined) updated.moe = (spec.params && /moe/i.test(spec.params)) ? true : false;
  return updated;
}

function processModelArrayFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist, skipping:', filePath);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) {
    console.log('Not an array, skipping:', filePath);
    return;
  }
  let updatedCount = 0;
  const newArr = arr.map(rec => {
    const cid = rec.canonical_id;
    if (specs[cid]) {
      updatedCount++;
      return enrichModelRecord(rec, specs[cid]);
    }
    return rec;
  });
  fs.writeFileSync(filePath, JSON.stringify(newArr, null, 2) + '\n', 'utf8');
  console.log(`Updated ${updatedCount}/${arr.length} records in: ${filePath}`);
}

function processCombinedFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist, skipping:', filePath);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) {
    console.log('Not an array, skipping:', filePath);
    return;
  }
  let updatedCount = 0;
  const newArr = arr.map(rec => {
    if (rec.resource_type === 'model' || (rec.canonical_id && rec.canonical_id.startsWith('model:'))) {
      const cid = rec.canonical_id;
      if (specs[cid]) {
        updatedCount++;
        return enrichModelRecord(rec, specs[cid]);
      }
    }
    return rec;
  });
  fs.writeFileSync(filePath, JSON.stringify(newArr, null, 2) + '\n', 'utf8');
  console.log(`Updated ${updatedCount}/${arr.length} model records in combined file: ${filePath}`);
}

// 1. Target files for ai-models.json
const modelFiles = [
  'C:/Users/BALSAM/.gemini/antigravity/brain/c93ef0bb-d487-4dd9-9648-6347f224ea0f/.user_uploaded/media_1793960923107_352e4f0d.json',
  'C:/Users/BALSAM/.gemini/antigravity/brain/c93ef0bb-d487-4dd9-9648-6347f224ea0f/.user_uploaded/media_1793953292562_6c7bcb0d.json',
  'G:/Downloads/ai-models.json',
  path.join(__dirname, 'source/ai-models.json'),
  path.resolve(__dirname, '../ai-models.json')
];

modelFiles.forEach(f => {
  if (f.endsWith('ai-models.json') && !fs.existsSync(f) && f.includes('Devspirehub AI')) {
    // Also write a copy to root ai-models.json
    const sourceCopy = path.join(__dirname, 'source/ai-models.json');
    if (fs.existsSync(sourceCopy)) {
      fs.copyFileSync(sourceCopy, f);
    }
  }
  processModelArrayFile(f);
});

// 2. Target files for combined ai-resources-1000.json
const combinedFiles = [
  'G:/Downloads/ai-resources-1000.json',
  path.resolve(__dirname, '../ai-resources-1000.json')
];

combinedFiles.forEach(f => {
  processCombinedFile(f);
});

console.log('Model specs application completed.');
