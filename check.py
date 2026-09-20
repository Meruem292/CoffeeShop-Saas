with open('src/components/OrderingScreen.tsx', 'r') as f:
    lines = f.readlines()

div_bal = 0
brace_bal = 0
paren_bal = 0

for i, line in enumerate(lines):
    # This is a very rough heuristic
    open_divs = line.count('<div')
    close_divs = line.count('</div')
    div_bal += open_divs - close_divs
    
    brace_bal += line.count('{') - line.count('}')
    paren_bal += line.count('(') - line.count(')')

print(f"End of file: div_bal={div_bal}, brace_bal={brace_bal}, paren_bal={paren_bal}")
