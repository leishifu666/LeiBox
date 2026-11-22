"""Identify only the stable URLs owned by a removed animation component."""
import re


DETAIL = re.compile(r'out/docs/animations/([a-z0-9-]+)\.html')


def component_paths(slug):
    detail = f'out/docs/animations/{slug}'
    files = {
        f'{detail}.html',
        f'{detail}.txt',
        f'{detail}/index.html',
        f'out/motion/{slug}.html',
        f'out/assets/components/{slug}.png',
        f'out/ai/components/{slug}.json',
        f'out/ai/components/{slug}.md',
    }
    trees = ((detail, '*.txt'), (f'out/ai/packages/{slug}', '*.json'))
    return files, trees


def plan_retirements(previous, incoming):
    incoming_paths = {item['path'] for item in incoming}
    previous_by_path = {item['path']: item['sha256'] for item in previous}
    removed_slugs = {
        match[1]
        for name in previous_by_path.keys() - incoming_paths
        if (match := DETAIL.fullmatch(name))
    }
    owned = set()
    for slug in removed_slugs:
        files, trees = component_paths(slug)
        owned.update(files)
        owned.update(
            name
            for name in previous_by_path
            if any(name.startswith(f'{prefix}/') and name.endswith(pattern[1:])
                   for prefix, pattern in trees)
        )
    return [
        {'path': name, 'sha256': previous_by_path[name]}
        for name in sorted((owned & previous_by_path.keys()) - incoming_paths)
    ]
