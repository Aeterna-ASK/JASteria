import { state } from './src/store/restaurantStore.js';
console.log(JSON.stringify(state.receipts.slice(0, 5), null, 2));
