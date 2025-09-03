// Debug script to test beneficiary button functionality
// This can be run in the browser console to test button interactions

const testBeneficiaryButtons = () => {
  console.log('=== Testing Beneficiary Button Functionality ===');
  
  // Check if beneficiaries are rendered
  const beneficiaryCards = document.querySelectorAll('.beneficiary-card');
  console.log(`Found ${beneficiaryCards.length} beneficiary cards`);
  
  if (beneficiaryCards.length === 0) {
    console.error('No beneficiary cards found! Check if beneficiaries are being rendered.');
    return;
  }
  
  // Test each beneficiary card
  beneficiaryCards.forEach((card, index) => {
    console.log(`\n--- Testing Beneficiary Card ${index + 1} ---`);
    
    // Check for verify button
    const verifyBtn = card.querySelector('.btn-verify');
    if (verifyBtn) {
      console.log('Verify button found:', verifyBtn);
      console.log('Verify button disabled:', verifyBtn.disabled);
      console.log('Verify button onclick:', verifyBtn.onclick);
      
      // Test click event
      console.log('Simulating verify button click...');
      verifyBtn.click();
    } else {
      console.log('No verify button found (might be already verified)');
    }
    
    // Check for delete button
    const deleteBtn = card.querySelector('.btn-delete');
    if (deleteBtn) {
      console.log('Delete button found:', deleteBtn);
      console.log('Delete button disabled:', deleteBtn.disabled);
      console.log('Delete button onclick:', deleteBtn.onclick);
      
      // Test click event (but don't actually click to avoid confirmation)
      console.log('Delete button is available for testing');
    } else {
      console.log('No delete button found');
    }
    
    // Check beneficiary data
    const nameElement = card.querySelector('h4');
    if (nameElement) {
      console.log('Beneficiary name:', nameElement.textContent);
    }
  });
  
  // Check for React event listeners
  console.log('\n--- Checking React Event Listeners ---');
  const verifyButtons = document.querySelectorAll('.btn-verify');
  const deleteButtons = document.querySelectorAll('.btn-delete');
  
  console.log(`Total verify buttons: ${verifyButtons.length}`);
  console.log(`Total delete buttons: ${deleteButtons.length}`);
  
  // Check if buttons have React event listeners (they won't show onclick in DOM)
  verifyButtons.forEach((btn, index) => {
    console.log(`Verify button ${index + 1} has React props:`, btn._reactInternalFiber || btn._reactInternalInstance || 'Not found');
  });
  
  deleteButtons.forEach((btn, index) => {
    console.log(`Delete button ${index + 1} has React props:`, btn._reactInternalFiber || btn._reactInternalInstance || 'Not found');
  });
};

// Instructions for manual testing
console.log(`
=== MANUAL TESTING INSTRUCTIONS ===
1. Open browser console (F12)
2. Navigate to Money Transfer page
3. Enter mobile: 9876543210
4. Click Verify Mobile
5. Go to Beneficiaries tab
6. Run: testBeneficiaryButtons()
7. Try clicking verify/delete buttons manually
8. Check console for logs
`);

// Export for use in console
if (typeof window !== 'undefined') {
  window.testBeneficiaryButtons = testBeneficiaryButtons;
}

export default testBeneficiaryButtons;