with open('src/components/OrderingScreen.tsx', 'r') as f:
    content = f.read()

# Replace indigo colors in renderCart to amber to match theme
content = content.replace("bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]", "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]")
content = content.replace("bg-indigo-600", "bg-amber-500")
content = content.replace("text-indigo-500", "text-amber-500")
content = content.replace("border-indigo-600", "border-amber-500")
content = content.replace("shadow-indigo-600", "shadow-amber-500")
content = content.replace("hover:bg-indigo-500", "hover:bg-amber-400")
content = content.replace("bg-indigo-500", "bg-amber-500")
content = content.replace("text-indigo-600", "text-amber-600")

# Fix layout heights for the main container
content = content.replace(
    "pos: 'flex h-full overflow-hidden bg-transparent',",
    "pos: 'flex flex-1 h-full w-full overflow-hidden bg-transparent',"
)
content = content.replace(
    "kiosk: 'flex flex-col h-full w-full bg-transparent relative',",
    "kiosk: 'flex flex-col flex-1 h-full w-full bg-transparent relative',"
)
content = content.replace(
    "mobile: 'flex flex-col h-full w-full bg-transparent relative',",
    "mobile: 'flex flex-col flex-1 h-full w-full bg-transparent relative',"
)

# Increase horizontal scroll container height
content = content.replace("max-h-[200px]", "max-h-[250px]")
content = content.replace("h-[140px]", "h-[160px]")
content = content.replace("h-[125px]", "h-[145px]")
content = content.replace("w-60", "w-64") # increase width slightly to match new height

with open('src/components/OrderingScreen.tsx', 'w') as f:
    f.write(content)
print("Patched colors and layout in OrderingScreen")
