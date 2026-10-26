#!/usr/bin/env python3
"""Static smoke test for the redesigned 12-item collection."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text(encoding="utf-8")
styles = (ROOT / "gallery-v2.css").read_text(encoding="utf-8")
script = (ROOT / "gallery-v2.js").read_text(encoding="utf-8")
expected = {
    "install": "install.html",
    "campaign": "newsletter.html?screen=campaign",
    "subscribers": "newsletter.html?screen=subscribers",
    "import": "newsletter.html?screen=import",
    "offer": "newsletter.html?screen=offer",
    "store": "demo-site.html",
    "share": "share.html",
    "granola": "granola.html",
    "media": "flightcast.html?screen=media",
    "title": "flightcast.html?screen=title",
    "analysis": "flightcast.html?screen=analysis",
    "chat": "flightcast.html?screen=chat",
}
categories = {"modal": 5, "dashboard": 4, "sidebar": 1, "demo": 2}

class GalleryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.cards = []
        self.ids = []
        self.filters = set()
        self.page_links = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"])
        if tag == "article" and "piece" in values.get("class", "").split():
            self.cards.append((values.get("data-id"), values.get("data-category")))
        if tag == "button" and values.get("data-filter"):
            self.filters.add(values["data-filter"])
        if tag == "a":
            self.page_links.append(values.get("href"))

p = GalleryParser()
p.feed(html)
issues = []
if len(p.cards) != 12:
    issues.append(f"Expected 12 cards, found {len(p.cards)}")
if len(p.ids) != len(set(p.ids)):
    issues.append("Duplicate HTML ids")
if set(i for i, c in p.cards) != set(expected):
    issues.append("Card identifiers differ from expected routes")
if Counter(category for _, category in p.cards) != categories:
    issues.append(f"Category counts mismatch: {Counter(c for _, c in p.cards)}")
for page in expected.values():
    if page not in p.page_links:
        issues.append(f"Missing static navigation route: {page}")
for category in (*categories, "favorites", "all"):
    if category not in p.filters:
        issues.append(f"Missing filter: {category}")
for essential in ('id="command-palette"', 'id="search"', 'id="card-grid"', 'id="theme-button"', 'id="visible-count"'):
    if essential not in html:
        issues.append(f"Missing essential control: {essential}")
for feature in ("prefers-reduced-motion", ":focus-visible", "max-width:580px", "data-theme"):
    if feature not in styles:
        issues.append(f"Missing CSS behavior: {feature}")
for feature in ('"ArrowDown"', '"Enter"', '"Escape"', 'localStorage', 'aria-pressed', 'showModal'):
    if feature not in script:
        issues.append(f"Missing interaction behavior: {feature}")
if issues:
    raise SystemExit("\n".join("FAIL: " + issue for issue in issues))
print("OK: 12 static routes, 4 categories, saved filter, theme, keyboard dialog and responsive styles checked.")
