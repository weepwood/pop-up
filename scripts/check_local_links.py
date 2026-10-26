#!/usr/bin/env python3
"""Verify that local links and static assets in the published HTML exist."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
PAGES = [
    "index.html",
    "install.html",
    "newsletter.html",
    "demo-site.html",
    "share.html",
    "granola.html",
    "flightcast.html",
]


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag in {"a", "link"} and attributes.get("href"):
            self.links.append(attributes["href"])
        if tag in {"script", "img"} and attributes.get("src"):
            self.links.append(attributes["src"])


errors = []
for page in PAGES:
    file = ROOT / page
    if not file.is_file():
        errors.append(f"{page}: page is missing")
        continue

    parser = Links()
    parser.feed(file.read_text(encoding="utf-8"))
    for url in parser.links:
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc or not parsed.path or parsed.path.startswith("/"):
            continue
        path = unquote(parsed.path)
        dest = file.parent / path
        if dest.is_dir():
            dest /= "index.html"
        if not dest.is_file():
            errors.append(f"{page}: {url} -> missing {dest.relative_to(ROOT)}")

index = (ROOT / "index.html").read_text(encoding="utf-8")
required = [
    'href="install.html"',
    'href="newsletter.html?screen=campaign"',
    'href="newsletter.html?screen=subscribers"',
    'href="newsletter.html?screen=import"',
    'href="newsletter.html?screen=offer"',
    'href="demo-site.html"',
    'href="share.html"',
    'href="granola.html"',
    'href="flightcast.html?screen=media"',
    'href="flightcast.html?screen=title"',
    'href="flightcast.html?screen=analysis"',
    'href="flightcast.html?screen=chat"',
]
for link in required:
    if link not in index:
        errors.append(f"Homepage is missing route {link}")

if errors:
    for message in errors:
        print("ERROR:", message)
    raise SystemExit(1)
print("OK: all local links and twelve homepage entry routes resolve.")
