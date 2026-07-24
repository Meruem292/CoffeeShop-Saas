const fs = require('fs');
let code = fs.readFileSync('src/lib/useFirebase.ts', 'utf8');

const oldCode = `    // Orders Listener
    let qOrders;
    if (isAdmin) {
       qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
    } else {
       qOrders = query(collection(db, 'orders'), where('customerId', '==', userUid));
    }
    
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let o = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      if (!isAdmin) {
         o = o.sort((a, b) => a.createdAt - b.createdAt);
      }`;

const newCode = `    // Orders Listener
    // Always fetch all orders so the public Splash Screen (Order Orbit TV) can display the queue
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
    
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let o = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // No need to sort manually since orderBy does it`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/lib/useFirebase.ts', code);
  console.log('useFirebase patched!');
} else {
  console.log('Could not find old code in useFirebase');
}
