import os, re, json
root = os.path.abspath('.')
paths = []
for base in ['apps/web', 'packages/db']:
    for dirpath, dirnames, filenames in os.walk(os.path.join(root, base)):
        for fn in filenames:
            if fn.endswith(('.ts','.tsx','.js','.jsx')):
                paths.append(os.path.join(dirpath, fn))
paths = sorted(paths)
string_re = re.compile(r'(?P<quote>["\'`])(?P<text>(?:\\.|(?!\1).)*?)\1', re.DOTALL)
jxs_text_re = re.compile(r'>([^<>]*?[A-Za-z][^<>]*?)<')
english_terms = re.compile(r'\b(the|and|or|search|save|cancel|new|edit|delete|dashboard|appointment|invoice|billing|settings|login|register|clinic|practice|openvpm|patient|client|owner|billing|agent|assistant|report|reports|demo|note|notes|email|phone|address|status)\b', re.I)
fr_terms = re.compile(r'\b(le|la|les|de|des|un|une|et|ou|en|pour|avec|dans|est|êtes|vous|du|au|aujourd|hui|bonjour|client|patient|propriétaire|facturation|nouveau|nouvelle|enregistrer|connexion|mot de passe|adresse|téléphone|ville|statut|rendez-vous|paramètres|rapport|rapports|assistant|substances|contrôlées)\b', re.I)
issues = []
for p in paths:
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()
    keys = set()
    for m in string_re.finditer(text):
        s = m.group('text').strip()
        if not s or len(s) > 120 or '\n' in s:
            continue
        if s.startswith(('/', './', '../')):
            continue
        if re.match(r'^[A-Za-z_][A-Za-z0-9_-]*$', s):
            continue
        if re.match(r'^[^A-Za-z]*$', s):
            continue
        if s.lower() in ('true','false','null','undefined'):
            continue
        if len(re.findall(r'[A-Za-z]', s)) < 2:
            continue
        keys.add(s)
    if p.endswith(('.tsx','.jsx')):
        for m in jxs_text_re.finditer(text):
            s = m.group(1).strip()
            if not s or len(s) > 120 or '\n' in s:
                continue
            if re.match(r'^[^A-Za-z]*$', s):
                continue
            keys.add(s)
    if not keys:
        continue
    for s in sorted(keys):
        issues.append((p, s, bool(english_terms.search(s)), bool(fr_terms.search(s))))
# Filter likely English UI strings in apps/web
candidates = [(p,s,e,f) for (p,s,e,f) in issues if p.startswith(os.path.join(root,'apps/web')) and e and not (f and not e)]
# include obvious English strings too
candidates += [(p,s,e,f) for (p,s,e,f) in issues if p.startswith(os.path.join(root,'apps/web')) and ('OpenVPM' in s or 'USD' in s or 'EUR' in s or '$' in s or '€' in s or 'Assets' in s or 'Notes' in s or 'Settings' in s)]
seen = set(); rows=[]
for p,s,e,f in candidates:
    key=(p,s)
    if key in seen: continue
    seen.add(key)
    rows.append((p,s,e,f))
print('TOTAL_CANDIDATES', len(rows))
for p,s,e,f in rows[:300]:
    print(json.dumps({'path': os.path.relpath(p, root), 'text': s, 'english': e, 'french': f}, ensure_ascii=False))
openvpm=[]; currency=[]; us_seed=[]
for p in paths:
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()
    if 'OpenVPM' in text or 'openvpm' in text or 'Open VPM' in text:
        openvpm.append(p)
    if 'USD' in text or 'EUR' in text or '$' in text or '€' in text:
        currency.append(p)
    if p.endswith('packages/db/seed.ts'):
        if re.search(r'\b(New York|Los Angeles|Chicago|San Francisco|Houston|Seattle|Boston|Denver|Atlanta|Miami|NY|CA|TX|WA|USA|United States|American|Algeria|Algerien|DZ)\b', text, re.I):
            us_seed.append(p)
print('OPENVPM_FILES', len(set(openvpm)))
print('CURRENCY_FILES', len(set(currency)))
print('US_SEED_FILES', len(set(us_seed)))
