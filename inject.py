import os
import glob

# Get all HTML files in the directory
html_files = glob.glob('*.html')

script_tag = '<script src="wordbank-utils.js"></script>'

for file_path in html_files:
    if file_path in ['index.html', 'wordbank.html']:
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if script_tag not in content:
        # Insert before </body> if it exists, otherwise append to end
        if '</body>' in content:
            new_content = content.replace('</body>', f'{script_tag}\n</body>')
        else:
            new_content = content + f'\n{script_tag}'
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Injected into {file_path}")
    else:
        print(f"Already injected in {file_path}")

print("Done injecting!")
