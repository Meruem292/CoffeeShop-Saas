with open('src/components/OrderingScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="flex-1 overflow-y-auto">\n                    {renderCart()}\n                  </div>',
    '<div className="flex-1 flex flex-col min-h-0">\n                    {renderCart()}\n                  </div>'
)

with open('src/components/OrderingScreen.tsx', 'w') as f:
    f.write(content)
