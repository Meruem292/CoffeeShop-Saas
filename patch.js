const fs = require('fs');
let code = fs.readFileSync('src/components/CashierView.tsx', 'utf8');

code = code.replace(
`  const handleMarkPaid = (order: Order) => {
    onUpdateStatus(order.id!, 'pending');
    if (printMode === 'serial') {
      printToSerial(order);
    } else {
      setPrintingOrder(order);
      setTimeout(() => {
        window.print();
        setPrintingOrder(null);
      }, 250);
    }
  };`,
`  const handleInitiatePayment = (order: Order) => {
    setPayingOrder(order);
    setAmountTendered('');
  };

  const handleConfirmPayment = () => {
    if (!payingOrder) return;
    
    // Save tendered amount and change internally if needed, but for now we just mark paid
    const orderToProcess = payingOrder;
    setPayingOrder(null);
    setAmountTendered('');

    onUpdateStatus(orderToProcess.id!, 'pending');
    if (printMode === 'serial') {
      printToSerial(orderToProcess);
    } else {
      setPrintingOrder(orderToProcess);
      setTimeout(() => {
        window.print();
        setPrintingOrder(null);
      }, 250);
    }
  };`
);
code = code.replace(
`onClick={() => handleMarkPaid(order)}`,
`onClick={() => handleInitiatePayment(order)}`
);

fs.writeFileSync('src/components/CashierView.tsx', code);
