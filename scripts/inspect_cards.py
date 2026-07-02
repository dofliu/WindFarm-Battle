import json

with open('src/data/cards.json') as f:
    data = json.load(f)

print('Type:', type(data))
if isinstance(data, dict):
    print('Keys:', list(data.keys()))
    cats = data.get('categories', [])
    print('Categories type:', type(cats))
    if isinstance(cats, list) and len(cats) > 0:
        print('First category type:', type(cats[0]))
        print('First category:', cats[0] if not isinstance(cats[0], dict) else list(cats[0].keys()))
    elif isinstance(cats, dict):
        print('Categories keys:', list(cats.keys()))
        # Try first value
        first_key = list(cats.keys())[0]
        print('First category key:', first_key)
        print('First category value type:', type(cats[first_key]))
        if isinstance(cats[first_key], list) and len(cats[first_key]) > 0:
            print('First card:', cats[first_key][0])
elif isinstance(data, list):
    print('List length:', len(data))
    if len(data) > 0:
        print('First item keys:', list(data[0].keys()))
        print('First item:', data[0])
