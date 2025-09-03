// Debug script to check beneficiary data in the frontend
// Run this in the browser console after navigating to the beneficiaries tab

const checkBeneficiaryData = () => {
  console.log('=== Checking Beneficiary Data and UI ===');
  
  // Check if React DevTools is available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('React DevTools detected');
  }
  
  // Check for beneficiary cards in DOM
  const cards = document.querySelectorAll('.beneficiary-card');
  console.log(`Found ${cards.length} beneficiary cards in DOM`);
  
  if (cards.length === 0) {
    console.error('❌ No beneficiary cards found!');
    console.log('Possible issues:');
    console.log('1. Beneficiaries not loaded from API');
    console.log('2. Component not rendering');
    console.log('3. CSS class names changed');
    return;
  }
  
  // Check each card
  cards.forEach((card, index) => {
    console.log(`\n--- Card ${index + 1} ---`);
    
    // Check beneficiary info
    const name = card.querySelector('h4')?.textContent;
    const account = card.querySelector('p:nth-child(2)')?.textContent;
    console.log('Name:', name);
    console.log('Account:', account);
    
    // Check status badges
    const statusBadges = card.querySelectorAll('.status-badge');
    console.log(`Status badges: ${statusBadges.length}`);
    statusBadges.forEach((badge, i) => {
      console.log(`  Badge ${i + 1}: ${badge.textContent} (${badge.className})`);
    });
    
    // Check buttons
    const verifyBtn = card.querySelector('.btn-verify');
    const deleteBtn = card.querySelector('.btn-delete');
    
    console.log('Verify button:', verifyBtn ? 'Found' : 'Not found');
    if (verifyBtn) {
      console.log('  - Text:', verifyBtn.textContent);
      console.log('  - Disabled:', verifyBtn.disabled);
      console.log('  - Style display:', getComputedStyle(verifyBtn).display);
      console.log('  - Style visibility:', getComputedStyle(verifyBtn).visibility);
    }
    
    console.log('Delete button:', deleteBtn ? 'Found' : 'Not found');
    if (deleteBtn) {
      console.log('  - Text:', deleteBtn.textContent);
      console.log('  - Disabled:', deleteBtn.disabled);
      console.log('  - Style display:', getComputedStyle(deleteBtn).display);
      console.log('  - Style visibility:', getComputedStyle(deleteBtn).visibility);
    }
    
    // Test button clicks
    if (verifyBtn && !verifyBtn.disabled) {
      console.log('🧪 Testing verify button click...');
      // Add a temporary click listener to see if events work
      const testHandler = (e) => {
        console.log('✅ Verify button click event fired!', e);
        e.stopPropagation();
      };
      verifyBtn.addEventListener('click', testHandler, { once: true });
      
      // Simulate click
      setTimeout(() => {
        verifyBtn.click();
        // Remove handler after test
        setTimeout(() => {
          verifyBtn.removeEventListener('click', testHandler);
        }, 100);
      }, 100);
    }
  });
  
  // Check for React components in DOM
  console.log('\n=== React Component Check ===');
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactInternalFiber) {
    console.log('React fiber found on root');
  } else if (reactRoot && reactRoot._reactInternalInstance) {
    console.log('React instance found on root');
  } else {
    console.log('No React internals found on root');
  }
  
  // Check for console errors
  console.log('\n=== Console Error Check ===');
  console.log('Check browser console for any red error messages');
  console.log('Common issues to look for:');
  console.log('- Uncaught TypeError');
  console.log('- Cannot read property of undefined');
  console.log('- Network errors');
  console.log('- React warnings');
};

// Instructions
console.log(`
=== INSTRUCTIONS ===
1. Navigate to Money Transfer page
2. Enter mobile: 9876543210 and verify
3. Go to Beneficiaries tab
4. Wait for beneficiaries to load
5. Run: checkBeneficiaryData()
6. Check the output for issues
`);

// Export for console use
if (typeof window !== 'undefined') {
  window.checkBeneficiaryData = checkBeneficiaryData;
}

export default checkBeneficiaryData;