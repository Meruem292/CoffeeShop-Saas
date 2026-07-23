const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(
`export interface DynamicCategory {
  id: string;
  name: string;
  iconName: string;
}`,
`export interface DynamicCategory {
  id: string;
  name: string;
  iconName: string;
  order?: number;
}`
);
fs.writeFileSync('src/types.ts', code);
