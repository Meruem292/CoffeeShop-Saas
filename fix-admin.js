const fs = require('fs');
const content = fs.readFileSync('src/components/AdminProducts.tsx', 'utf8');

const replacement = `  // Get categories list from prop, fallback to defaults if empty
  const availableCategories = useMemo(() => {
    let list = categories && categories.length > 0 
      ? categories.map(c => c.name) 
      : ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food'];
      
    // Include any categories already used by products to prevent orphaned products from losing their category
    const productCats = Array.from(new Set(products.map(p => p.category)));
    productCats.forEach(pCat => {
      if (pCat && !list.find(c => c.toLowerCase() === pCat.toLowerCase())) {
        list.push(pCat);
      }
    });
    
    return list;
  }, [categories, products]);`;

console.log(replacement);
