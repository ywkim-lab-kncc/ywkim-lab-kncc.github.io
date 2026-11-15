#!/usr/bin/env python3
"""
Add publications to src/_data/publications.yml from PubMed IDs.

    python3 scripts/add_publication.py 32024997 32025015
    python3 scripts/add_publication.py --selected 32024997
    python3 scripts/add_publication.py --replace 32025015   # refresh an existing entry

Runs automatically from GitHub Actions ("Add publication from PubMed").
Uses only the Python standard library. Existing PMIDs are skipped, and new
entries are inserted at the top of the file without touching existing entries
or comments.
"""
import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

PUBS = Path(__file__).resolve().parent.parent / "src" / "_data" / "publications.yml"
ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"


def fetch_summaries(pmids):
    q = urllib.parse.urlencode({"db": "pubmed", "retmode": "json", "id": ",".join(pmids), "tool": "lab-website"})
    req = urllib.request.Request(f"{ESUMMARY}?{q}", headers={"User-Agent": "lab-website/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def q(s):
    """YAML double-quoted string."""
    s = str(s).replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'


SMALL = {"of", "and", "the", "in", "for", "on", "a", "an", "to", "at", "by", "with", "&"}


def journal_name(rec):
    """PubMed gives e.g. 'Nature communications' → 'Nature Communications'."""
    name = (rec.get("fulljournalname") or rec.get("source") or "").strip()
    name = re.sub(r"\s*\(.*?\)\s*$", "", name)  # drop '(London, England)' style suffixes
    words = name.split()
    out = []
    for i, w in enumerate(words):
        if w.isupper() and len(w) > 1:
            out.append(w)               # keep acronyms like JAMA, BMC
        elif i > 0 and w.lower() in SMALL:
            out.append(w.lower())
        else:
            out.append(w[:1].upper() + w[1:])
    return " ".join(out)


def to_entry(rec, selected=False):
    title = re.sub(r"\.$", "", (rec.get("title") or "").strip())
    authors = [a["name"] for a in rec.get("authors", []) if a.get("authtype", "Author") == "Author"]
    year = (rec.get("pubdate") or rec.get("epubdate") or "")[:4]
    doi = next((a["value"] for a in rec.get("articleids", []) if a.get("idtype") == "doi"), "")
    vol = rec.get("volume") or ""
    if vol and rec.get("issue"):
        vol = f"{vol}({rec['issue']})"
    types = [t.lower() for t in rec.get("pubtype", [])]
    ptype = "review" if "review" in types else "preprint" if "preprint" in types else "article"

    lines = [f"- title: {q(title)}", f"  authors: [{', '.join(q(a) for a in authors)}]",
             f"  journal: {q(journal_name(rec))}"]
    if year.isdigit():
        lines.append(f"  year: {year}")
    if vol:
        lines.append(f"  volume: {q(vol)}")
    if rec.get("pages"):
        lines.append(f"  pages: {q(rec['pages'])}")
    if doi:
        lines.append(f"  doi: {q(doi)}")
    lines.append(f"  pmid: {q(rec['uid'])}")
    lines.append(f"  type: {ptype}")
    if selected:
        lines.append("  selected: true")
    return "\n".join(lines) + "\n"


def existing_pmids(text):
    return set(re.findall(r'^\s*pmid:\s*"?(\d+)"?', text, flags=re.M))


def remove_entry(text, pmid):
    """Remove the whole '- title:' block that contains this PMID (used by --replace)."""
    blocks = re.split(r"(?m)^(?=- )", text)
    keep = [b for b in blocks if not re.search(r'^\s*pmid:\s*"?%s"?\s*(#.*)?$' % pmid, b, flags=re.M)]
    return "".join(keep)


def insert_entries(text, entries):
    """Insert after the header comment block (before the first '- ' entry)."""
    m = re.search(r"^- ", text, flags=re.M)
    block = "\n".join(entries) + "\n"
    if not m:
        return text.rstrip() + "\n\n" + block
    return text[: m.start()] + block + text[m.start():]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pmids", nargs="+", help="PubMed IDs (space or comma separated)")
    ap.add_argument("--selected", action="store_true", help="mark as selected publication")
    ap.add_argument("--replace", action="store_true",
                    help="re-import PMIDs that are already in the file (overwrites those entries)")
    ap.add_argument("--from-file", help="read esummary JSON from a file instead of the network (testing)")
    args = ap.parse_args()

    pmids = [p for raw in args.pmids for p in re.split(r"[\s,]+", raw) if p]
    bad = [p for p in pmids if not p.isdigit()]
    if bad:
        sys.exit(f"Not a PMID (digits only): {', '.join(bad)}")

    text = PUBS.read_text(encoding="utf-8")
    have = existing_pmids(text)
    if args.replace:
        have = set()
    todo = [p for p in pmids if p not in have]
    for p in pmids:
        if p in have:
            print(f"skip  {p}  (already in publications.yml)")
    if not todo:
        print("Nothing to add.")
        return

    if args.from_file:
        data = json.loads(Path(args.from_file).read_text())
    else:
        for attempt in range(3):
            try:
                data = fetch_summaries(todo)
                break
            except Exception as e:  # network hiccup → retry
                if attempt == 2:
                    sys.exit(f"Could not reach PubMed: {e}")
                time.sleep(3)

    result = data.get("result", {})
    entries = []
    for p in todo:
        rec = result.get(p)
        if not rec or rec.get("error"):
            print(f"error {p}  not found on PubMed — check the number")
            continue
        entries.append(to_entry(rec, args.selected))
        print(f"add   {p}  {rec.get('title', '')[:70]}")

    if entries:
        if args.replace:
            for p in todo:
                text = remove_entry(text, p)
        PUBS.write_text(insert_entries(text, entries), encoding="utf-8")
        print(f"\n{len(entries)} publication(s) added to {PUBS.relative_to(PUBS.parent.parent.parent)}")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
