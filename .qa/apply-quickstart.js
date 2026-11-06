'use strict';

const fs = require('fs');
const path = require('path');
const quickstarts = require('./quickstart-definitions.js');

function enrichDevRecord(record) {
  const cid = record.canonical_id;
  const qs = quickstarts[cid];
  const updated = {};
  for (const [key, val] of Object.entries(record)) {
    updated[key] = val;
    if (key === 'technical_tags') {
      if (qs) {
        updated.developer_quick_start = qs;
      } else {
        updated.developer_quick_start = {
          available: false,
          verification_status: "unavailable",
          reason: "Official installation command and code example reference awaiting verification."
        };
      }
    }
  }
  if (updated.developer_quick_start === undefined) {
    if (qs) {
      updated.developer_quick_start = qs;
    } else {
      updated.developer_quick_start = {
        available: false,
        verification_status: "unavailable",
        reason: "Official installation command and code example reference awaiting verification."
      };
    }
  }
  return updated;
}

function processDevArrayFile(filePath) {
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
  let verifiedCount = 0;
  const newArr = arr.map(rec => {
    const updated = enrichDevRecord(rec);
    if (updated.developer_quick_start && updated.developer_quick_start.available) {
      verifiedCount++;
    }
    return updated;
  });
  fs.writeFileSync(filePath, JSON.stringify(newArr, null, 2) + '\n', 'utf8');
  console.log(`Updated ${arr.length} records (${verifiedCount} verified QuickStarts) in: ${filePath}`);
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
  let verifiedCount = 0;
  let devCount = 0;
  const newArr = arr.map(rec => {
    if (rec.resource_type === 'developer_resource' || (rec.canonical_id && rec.canonical_id.startsWith('developer_resource:'))) {
      devCount++;
      const updated = enrichDevRecord(rec);
      if (updated.developer_quick_start && updated.developer_quick_start.available) {
        verifiedCount++;
      }
      return updated;
    }
    return rec;
  });
  fs.writeFileSync(filePath, JSON.stringify(newArr, null, 2) + '\n', 'utf8');
  console.log(`Updated ${devCount} dev records (${verifiedCount} verified QuickStarts) in combined: ${filePath}`);
}

// 1. Target files for developer-resources.json
const devFiles = [
  'G:/Downloads/developer-resources.json',
  path.join(__dirname, 'source/developer-resources.json'),
  path.resolve(__dirname, '../developer-resources.json')
];

devFiles.forEach(f => {
  if (f.endsWith('developer-resources.json') && !fs.existsSync(f) && f.includes('Devspirehub AI')) {
    const sourceCopy = path.join(__dirname, 'source/developer-resources.json');
    if (fs.existsSync(sourceCopy)) {
      fs.copyFileSync(sourceCopy, f);
    }
  }
  processDevArrayFile(f);
});

// 2. Target files for combined ai-resources-1000.json
const combinedFiles = [
  'G:/Downloads/ai-resources-1000.json',
  path.resolve(__dirname, '../ai-resources-1000.json')
];

combinedFiles.forEach(f => {
  processCombinedFile(f);
});

console.log('Developer Quick Start data integration completed.');
