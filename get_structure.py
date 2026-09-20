import re

with open('src/components/OrderingScreen.tsx', 'r') as f:
    content = f.read()

start = content.find('  const renderMenuGrid = () => (')
end = content.find('  const renderCart = () => (')
print(content[start:end])
