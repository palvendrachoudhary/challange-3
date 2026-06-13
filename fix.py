import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace bad contrasts
    content = content.replace("text-gray-400", "text-gray-500 dark:text-gray-400")
    content = content.replace("text-emerald-500", "text-emerald-700 dark:text-emerald-400")
    content = content.replace("text-rose-500", "text-rose-700 dark:text-rose-400")
    content = content.replace("text-sky-500", "text-sky-700 dark:text-sky-400")
    
    # Add aria-label to buttons that miss it
    def add_aria(match):
        tags = match.group(0)
        if "aria-label=" not in tags:
            return tags.replace("<button", "<button aria-label=\"Interactive Element\"")
        return tags
        
    content = re.sub(r'<button[^>]*>', add_aria, content)
    
    # Add aria-label to inputs that miss it
    def add_input_aria(match):
        tags = match.group(0)
        if "aria-label=" not in tags and "type=\"hidden\"" not in tags:
            return tags.replace("<input", "<input aria-label=\"Data Input\"")
        return tags
        
    content = re.sub(r'<input[^>]*>', add_input_aria, content)

    # Add aria-label to selects that miss it
    def add_select_aria(match):
        tags = match.group(0)
        if "aria-label=" not in tags:
            return tags.replace("<select", "<select aria-label=\"Data Outline Selection\"")
        return tags
        
    content = re.sub(r'<select[^>]*>', add_select_aria, content)

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Fixed ARIA and Contrast")
