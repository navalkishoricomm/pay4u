// Feature flags to control visibility of major flows without removing code.
// Toggle these to show/hide sections in the UI.

export const SHOW_RECHARGES = true; // Mobile/DTH quick actions and routes
export const SHOW_BILL_PAYMENTS = false; // Bill payments quick actions and routes
export const SHOW_MONEY_TRANSFER = false; // Money transfer flow
export const SHOW_AEPS = false; // AEPS flow
export const SHOW_VOUCHERS = true; // Brand vouchers flow

// Optional: if you want to hide routes entirely, you can import these
// flags in App.js and conditionally add <Route> components.