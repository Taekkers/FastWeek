"""Bygger ../index.html ud fra kildefilerne i denne mappe.

Brug:  python3 source/build.py
Rører ikke config.js, data/ eller de andre filer i repoet. Kun index.html skrives.
"""
import os
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
rd = lambda f: open(os.path.join(here, f), encoding='utf-8').read()
app = rd('js_core.js') + '\n' + rd('js_art.js') + '\n' + rd('js_ui.js')
shell = rd('shell.html').replace('Uge<i>kurv</i>', 'Fast<i>Week</i>')
body = shell[shell.find('</style>') + len('</style>'):shell.find('<script>')]
css = rd('page.css') + '\n' + rd('login.css')
FB = 'https://www.gstatic.com/firebasejs/10.12.2/'
head = '''<!doctype html>
<html lang="da"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>FastWeek</title>
<meta name="description" content="Ugens madplan, lager og indkøbsliste med tilbud">
<meta name="theme-color" content="#1B5E43">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="FastWeek"><meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png"><link rel="icon" href="icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Titillium+Web:wght@400;600;700;900&display=swap">
<style>
:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",sans-serif}
img{max-width:100%}
[hidden]{display:none!important}
</style>
<style>
''' + css + '</style></head><body>'
tail = '''
<script src="config.js"></script>
<script src="''' + FB + '''firebase-app-compat.js"></script>
<script src="''' + FB + '''firebase-auth-compat.js"></script>
<script src="''' + FB + '''firebase-firestore-compat.js"></script>
<script src="platform-web.js"></script>
<script>
''' + app + '''
</script>
</body></html>
'''
out = head + body + tail
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(out)
print(len(out), 'bytes -> index.html')
