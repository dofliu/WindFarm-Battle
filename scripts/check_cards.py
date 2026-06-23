import json
with open('src/data/cards.json') as f:
    data = json.load(f)
cards = data['cards']
for cid in ['C02', 'UP02', 'UP03', 'F07', 'W05']:
    c = cards[cid]
    print(f'{cid}: cost={c.get("cost")}, type={c.get("type")}, rarity={c.get("rarity")}')
    for ab in c.get('abilities', []):
        print(f'  ability: {ab}')
    if 'stats' in c:
        print(f'  stats: {c["stats"]}')
