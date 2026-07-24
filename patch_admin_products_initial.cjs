const fs = require('fs');
let code = fs.readFileSync('src/components/AdminProducts.tsx', 'utf8');
code = code.replace(
`  const initialCategoryState = {
    name: '',
    iconName: 'Coffee'
  };`,
`  const initialCategoryState = {
    name: '',
    iconName: 'Coffee',
    isActive: true
  };`
);
fs.writeFileSync('src/components/AdminProducts.tsx', code);
