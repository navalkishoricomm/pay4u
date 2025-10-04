const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting amount input debug test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
  
  try {
    // Navigate to the frontend
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    console.log('Page loaded successfully');
    
    // Wait a bit for the page to fully load
    await page.waitForTimeout(3000);
    
    // Check if there are any input fields with type="number"
    const amountInputs = await page.$$('input[type="number"]');
    console.log(`Found ${amountInputs.length} number input fields`);
    
    // Check if there are any disabled or readonly inputs
    const disabledInputs = await page.$$('input[disabled]');
    const readonlyInputs = await page.$$('input[readonly]');
    console.log(`Found ${disabledInputs.length} disabled inputs`);
    console.log(`Found ${readonlyInputs.length} readonly inputs`);
    
    // Try to find the amount input specifically
    const amountInput = await page.$('input[name="amount"]');
    if (amountInput) {
      console.log('Found amount input field');
      
      // Check its properties
      const isDisabled = await page.evaluate(el => el.disabled, amountInput);
      const isReadonly = await page.evaluate(el => el.readOnly, amountInput);
      const maxValue = await page.evaluate(el => el.max, amountInput);
      const minValue = await page.evaluate(el => el.min, amountInput);
      
      console.log('Amount input properties:');
      console.log('- Disabled:', isDisabled);
      console.log('- Readonly:', isReadonly);
      console.log('- Max value:', maxValue);
      console.log('- Min value:', minValue);
      
      // Try to type in the input
      try {
        await amountInput.click();
        await amountInput.type('100');
        const value = await page.evaluate(el => el.value, amountInput);
        console.log('Successfully typed, current value:', value);
      } catch (error) {
        console.log('Error typing in amount input:', error.message);
      }
    } else {
      console.log('Amount input field not found');
    }
    
  } catch (error) {
    console.log('Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();