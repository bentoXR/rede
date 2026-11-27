#!/usr/bin/env python3
"""Merge handcrafted PT-BR overlays onto extracted English chapter.json files."""

from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "public" / "content"
TRANS_DIR = ROOT / "tools" / "translations"


def apply_chapter_translation(chap_id: str) -> None:
    src_path = CONTENT_DIR / chap_id / "chapter.json"
    tr_path = TRANS_DIR / f"{chap_id}.pt.json"
    out_path = CONTENT_DIR / chap_id / "chapter.pt.json"

    data = json.loads(src_path.read_text(encoding="utf-8"))
    tr = json.loads(tr_path.read_text(encoding="utf-8"))
    pt = copy.deepcopy(data)

    if "title" in tr:
        pt["title"] = tr["title"]
    if "description" in tr:
        pt["description"] = tr["description"]

    lessons_tr = tr.get("lessons", {})
    slides_tr = tr.get("slides", {})
    challenges_tr = tr.get("challenges", {})

    for lesson in pt["lessons"]:
        ltr = lessons_tr.get(lesson["id"], {})
        if "title" in ltr:
            lesson["title"] = ltr["title"]
        if "sectionTitle" in ltr:
            lesson["sectionTitle"] = ltr["sectionTitle"]
        if "summary" in ltr:
            lesson["summary"] = ltr["summary"]

        for step in lesson["steps"]:
            if step["kind"] == "challenge":
                ch = step["challenge"]
                ctr = challenges_tr.get(ch["id"], {})
                for field in ("prompt", "explanation", "options", "items", "pairs", "template", "bank", "correctTokens"):
                    if field in ctr:
                        ch[field] = ctr[field]
                if "sectionTitle" in ltr:
                    step["sectionTitle"] = ltr["sectionTitle"]
            else:
                str_data = slides_tr.get(step["id"], {})
                if "title" in str_data:
                    step["title"] = str_data["title"]
                if "slideBullets" in str_data:
                    old_bullets = step.get("slideBullets", [])
                    new_bullets = []
                    for i, txt in enumerate(str_data["slideBullets"]):
                        lvl = old_bullets[i]["level"] if i < len(old_bullets) else 0
                        new_bullets.append({"level": lvl, "text": txt})
                    step["slideBullets"] = new_bullets
                if "notes" in str_data:
                    old_notes = step.get("notes", [])
                    new_notes = []
                    for i, txt in enumerate(str_data["notes"]):
                        lvl = old_notes[i]["level"] if i < len(old_notes) else 0
                        new_notes.append({"level": lvl, "text": txt})
                    step["notes"] = new_notes
                if "vrpBlocks" in str_data:
                    step["vrpBlocks"] = str_data["vrpBlocks"]

    out_path.write_text(json.dumps(pt, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Generated {out_path}")


if __name__ == "__main__":
    for cid in ("ch01", "ch02"):
        apply_chapter_translation(cid)
