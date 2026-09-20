tq = b'""\"'
with open('main.py', 'rb') as f:
    data = f.read()

n = len(tq)
i = 0
count = 0
while i <= len(data) - n:
    if data[i:i+n] == tq:
        line = data[:i].count(b'\n') + 1
        snippet = data[i:i+60].replace(b'\r',b'').replace(b'\n',b' ')
        print(f"TQ #{count}: byte={i} line={line} -> {snippet}")
        count += 1
        i += n
    else:
        i += 1

print(f"\nTotal triple-quotes found: {count}")
