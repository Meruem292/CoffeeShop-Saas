const categoriesData = [{name: 'Non-Coffee'}, {name: 'Frappe'}];
const menu = [
  { category: 'COLD COFFEE' },
  { category: 'HOT COFFEE' },
  { category: 'MATCHA/NON-COFFEE' }
];

let list = [];
if (categoriesData && categoriesData.length > 0) {
  list = categoriesData.map(c => c.name);
  
  // Also include categories from products that are not explicitly in categoriesData
  const productCats = Array.from(new Set(menu.map(p => p.category)));
  
  productCats.forEach(pCat => {
    const pCatLower = (pCat || '').trim().toLowerCase();
    
    // Check if this product category is already covered by the list
    const isCovered = list.some(cName => {
      const cNameLower = cName.trim().toLowerCase();
      if (cNameLower === pCatLower) return true;
      
      const pParts = pCatLower.split('/').map(s => s.trim());
      if (pParts.includes(cNameLower)) return true;
      
      const cParts = cNameLower.split('/').map(s => s.trim());
      return cParts.some(cp => pParts.includes(cp) || pCatLower === cp);
    });
    
    if (!isCovered && pCat.trim()) {
      list.push(pCat.trim());
    }
  });
} else {
  list = Array.from(new Set(menu.map(p => p.category)));
}
console.log(list);
