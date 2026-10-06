import pypdfium2 as pdfium
import json

pdf = pdfium.PdfDocument(r'C:\Users\yigit.dincoglu.ASINSAAT\.gemini\antigravity\brain\effbe4a4-0fe0-4280-96f9-638e96d69ddb\.user_uploaded\media_1791273498214.pdf')
page = pdf[0]
width, height = page.get_size()
textpage = page.get_textpage()

coords = {}

for apt_prefix in ['A-', 'B-']:
    max_n = 17 if apt_prefix == 'A-' else 25
    for i in range(1, max_n):
        name = f'{apt_prefix}{i}'
        searcher = textpage.search(name)
        match = searcher.get_next()
        if match:
            char_idx, count = match
            boxes = [textpage.get_charbox(char_idx + c) for c in range(count)]
            min_x = min(b[0] for b in boxes)
            min_y = min(b[1] for b in boxes)
            max_x = max(b[2] for b in boxes)
            max_y = max(b[3] for b in boxes)
            mid_x = (min_x + max_x) / 2
            mid_y = (min_y + max_y) / 2
            
            # CSS percentage from top-left of the PDF page
            rel_x = (mid_x / width) * 100
            rel_y = ((height - mid_y) / height) * 100
            
            coords[name] = {
                "x": round(rel_x, 2),
                "y": round(rel_y, 2),
                "left": round(min_x / width * 100, 2),
                "right": round(max_x / width * 100, 2),
                "top": round((height - max_y) / height * 100, 2),
                "bottom": round((height - min_y) / height * 100, 2),
                "width": round((max_x - min_x) / width * 100, 2),
                "height": round((max_y - min_y) / height * 100, 2)
            }

with open('src/data/apartmentCoords.json', 'w', encoding='utf-8') as f:
    json.dump(coords, f, indent=2)

print('Coordinates extracted for', len(coords), 'apartments:')
print(json.dumps(coords, indent=2))
