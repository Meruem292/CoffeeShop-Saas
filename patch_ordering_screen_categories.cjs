const fs = require('fs');
let code = fs.readFileSync('src/components/OrderingScreen.tsx', 'utf8');

const oldCode = `  const categories = useMemo(() => {
    let list: string[] = [];
    if (categoriesData && categoriesData.length > 0) {
      list = categoriesData.filter(c => c.isActive !== false).map(c => c.name);
      
      // Also include categories from products that might not be in categoriesData
      const productCats = Array.from(new Set(menu.map(p => p.category)));
      productCats.forEach(pCat => {
        const pCatLower = (pCat || '').trim().toLowerCase();
        
        const isCovered = list.some(cName => {
          const cNameLower = cName.trim().toLowerCase();
          if (cNameLower === pCatLower) return true;
          
          const pParts = pCatLower.split('/').map(s => s.trim());
          if (pParts.includes(cNameLower)) return true;
          
          const cParts = cNameLower.split('/').map(s => s.trim());
          return cParts.some(cp => pParts.includes(cp) || pCatLower === cp);
        });
        
        if (!isCovered && pCat && pCat.trim()) {
          list.push(pCat.trim());
        }
      });
    } else {
      list = Array.from(new Set(menu.map(p => p.category)));
      if (list.length === 0) {
        list = ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food'];
      }
    }
    
    // Show all configured categories, plus any implied by products
    return list;
  }, [categoriesData, menu]);`;

const newCode = `  const categories = useMemo(() => {
    let list: string[] = [];
    if (categoriesData && categoriesData.length > 0) {
      // First, get all active categories
      list = categoriesData.filter(c => c.isActive !== false).map(c => c.name);
      
      // We also need all configured categories (even hidden) to avoid accidentally adding them back
      const allConfiguredCategories = categoriesData.map(c => c.name);
      
      // Also include categories from products that might not be in categoriesData
      const productCats = Array.from(new Set(menu.map(p => p.category)));
      productCats.forEach(pCat => {
        const pCatLower = (pCat || '').trim().toLowerCase();
        
        const isCovered = allConfiguredCategories.some(cName => {
          const cNameLower = cName.trim().toLowerCase();
          if (cNameLower === pCatLower) return true;
          
          const pParts = pCatLower.split('/').map(s => s.trim());
          if (pParts.includes(cNameLower)) return true;
          
          const cParts = cNameLower.split('/').map(s => s.trim());
          return cParts.some(cp => pParts.includes(cp) || pCatLower === cp);
        });
        
        // Only add if it's not configured AT ALL. If it's configured and hidden, skip it.
        if (!isCovered && pCat && pCat.trim()) {
          list.push(pCat.trim());
        }
      });
    } else {
      list = Array.from(new Set(menu.map(p => p.category)));
      if (list.length === 0) {
        list = ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food'];
      }
    }
    
    // Show all configured categories, plus any implied by products
    return list;
  }, [categoriesData, menu]);`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/components/OrderingScreen.tsx', code);
  console.log('Successfully patched OrderingScreen.tsx');
} else {
  console.log('Could not match oldCode.');
}
