const list = ['Hot Coffee', 'Cold Coffee', 'Matcha/Non-Coffee', 'Frappe'];
const menu = [
  { category: 'COLD COFFEE' },
  { category: 'HOT COFFEE' },
  { category: 'MATCHA/NON-COFFEE' }
];

const filtered = list.filter(catName => {
  const catNameLower = catName.trim().toLowerCase();
  return menu.some(p => {
    const productCatLower = (p.category || '').trim().toLowerCase();
    if (productCatLower === catNameLower) return true;
    
    const productParts = productCatLower.split('/').map(s => s.trim());
    if (productParts.includes(catNameLower)) return true;
    
    const catParts = catNameLower.split('/').map(s => s.trim());
    return catParts.some(cp => productParts.includes(cp) || productCatLower === cp);
  });
});
console.log(filtered);
