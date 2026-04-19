import re, glob
for file in glob.glob('e:/青九教务系统-三端（重构）/*.html'):
    if 'raw_' in file: continue
    with open(file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Strip out the main tag completely to easily find what's outside of it
    html_no_main = re.sub(r'<main.*?</main>', '', html, flags=re.DOTALL | re.IGNORECASE)
    
    # Look for anything that has "dialog", "modal" or is a hidden div
    modals = re.findall(r'<div[^>]*class=[\"\' ]?[^>]*?(?:modal|overlay|dialog|popup)[^>]*?>.*?</div>\s*</div>', html_no_main, re.IGNORECASE | re.DOTALL)
    
    if modals:
        print(f'{file}: Found {len(modals)} modals.')
    
    # Also just find all <dialog> tags if they used native dialogs
    native_dialogs = re.findall(r'<dialog[^>]*>.*?</dialog>', html_no_main, re.IGNORECASE | re.DOTALL)
    if native_dialogs:
        print(f'{file}: Found {len(native_dialogs)} native dialogs.')
