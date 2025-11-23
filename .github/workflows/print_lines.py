p='.github/workflows/ci.yml'
with open(p,'r',encoding='utf-8') as f:
    for i,l in enumerate(f, start=1):
        print(f"{i:04d}: {l.rstrip()}")
