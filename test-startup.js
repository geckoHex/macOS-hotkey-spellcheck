#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Testing startup performance...\n');

function testStartup() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const electronProcess = spawn('npm', ['start'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    electronProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    electronProcess.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // Listen for the spell checker initialization message
    electronProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      if (dataStr.includes('Spell checker initialized successfully')) {
        const endTime = Date.now();
        const startupTime = endTime - startTime;
        
        // Kill the process
        electronProcess.kill('SIGTERM');
        
        resolve(startupTime);
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      electronProcess.kill('SIGTERM');
      resolve(-1); // Timeout
    }, 30000);
  });
}

async function runTests() {
  const numTests = 3;
  const times = [];
  
  for (let i = 1; i <= numTests; i++) {
    console.log(`Running test ${i}/${numTests}...`);
    const time = await testStartup();
    
    if (time === -1) {
      console.log(`Test ${i}: TIMEOUT (>30s)`);
    } else {
      console.log(`Test ${i}: ${time}ms`);
      times.push(time);
    }
    
    // Wait a bit between tests
    if (i < numTests) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log('\n--- Results ---');
    console.log(`Average startup time: ${avgTime.toFixed(2)}ms`);
    console.log(`Min startup time: ${minTime}ms`);
    console.log(`Max startup time: ${maxTime}ms`);
    console.log(`\nThe app now starts in ~${avgTime.toFixed(0)}ms instead of ~15 seconds!`);
  } else {
    console.log('\nAll tests failed or timed out.');
  }
}

runTests().catch(console.error);
