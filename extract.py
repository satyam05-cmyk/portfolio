import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

css_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
if css_match:
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(css_match.group(1).strip())

js_match = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
if js_match:
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(js_match.group(1).strip())

html = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="styles.css">', html, flags=re.DOTALL)
html = re.sub(r'<script>.*?</script>', '<script type="module" src="main.js"></script>', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
