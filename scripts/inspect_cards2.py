import json

with open('src/data/cards.json') as f:
    data = json.load(f)

cats = data['categories']
# turbine category
turbine = cats['turbine']
print('Turbine type:', type(turbine))
print('Turbine keys:', list(turbine.keys()) if isinstance(turbine, dict) else 'list')

# Try cards array
cards = data.get('cards', [])
print('\nCards type:', type(cards))
if isinstance(cards, list) and len(cards) > 0:
    print('Cards count:', len(cards))
    print('First card keys:', list(cards[0].keys()))
    print('First card:', json.dumps(cards[0], indent=2, ensure_ascii=False))
elif isinstance(cards, dict):
    print('Cards keys:', list(cards.keys())[:5])
    first_key = list(cards.keys())[0]
    first_val = cards[first_key]
    print('First card type:', type(first_val))
    print('First card:', json.dumps(first_val, indent=2, ensure_ascii=False))
