import json
import os

with open('src/data/cards.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cards = data['cards']
updated = 0
missing = []

for card_id, card in cards.items():
    # 圖片路徑對應：OS8, OS10, OS12 特殊處理
    image_filename = f"{card_id}.jpg"
    image_path = f"public/cards/{image_filename}"
    
    if os.path.exists(image_path):
        card['image'] = f"cards/{image_filename}"
        updated += 1
    else:
        missing.append(card_id)

print(f"Updated: {updated} cards")
print(f"Missing images: {missing}")

with open('src/data/cards.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("cards.json updated successfully!")
