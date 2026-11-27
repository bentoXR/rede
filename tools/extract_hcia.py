#!/usr/bin/env python3
"""Reusable PDF-to-interactive-JSON extractor for Huawei HCIA-Datacom V2.0."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

DEFAULT_PDF_DIR = Path(
    "/home/aluno05/Documentos/Bento - Projetos/PDFs HCIA divididos em caps"
)
DEFAULT_OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "content"
ENRICHMENTS_DIR = Path(__file__).resolve().parent / "enrichments"

DPI = 200
PTS_TO_PX = DPI / 72.0

TOP_BULLETS = {"⚫", "•"}
SUB_BULLETS = {"▫", "", "-"}
DEEP_BULLETS = {"▪"}
ALL_BULLETS = TOP_BULLETS | SUB_BULLETS | DEEP_BULLETS


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return s


def parse_index(pdf_dir: Path) -> list[dict[str, Any]]:
    index_path = pdf_dir / "INDEX.txt"
    if not index_path.exists():
        raise FileNotFoundError(f"INDEX.txt not found at {index_path}")

    chapters: list[dict[str, Any]] = []
    pdf_files = sorted(pdf_dir.glob("*.pdf"))
    pdf_by_num: dict[int, Path] = {}
    for p in pdf_files:
        m = re.match(r"^(\d+)\s*-", p.name)
        if m:
            pdf_by_num[int(m.group(1))] = p

    for raw in index_path.read_text(encoding="utf-8", errors="replace").splitlines():
        m = re.match(r"^\s*(\d+)\s*\|\s*(.+?)\s*\|\s*páginas\s+(\d+-\d+)\s*$", raw)
        if not m:
            continue
        num = int(m.group(1))
        title = m.group(2).strip()
        page_range = m.group(3).strip()
        start_p, end_p = [int(x) for x in page_range.split("-")]
        pdf_path = pdf_by_num.get(num)
        chapters.append(
            {
                "id": f"ch{num:02d}",
                "number": num,
                "slug": f"{num:02d}-{slugify(title)}",
                "title": title,
                "pdfFile": pdf_path.name if pdf_path else f"{num:02d} - {title}.pdf",
                "pageRange": page_range,
                "pageCount": end_p - start_p + 1,
            }
        )
    return chapters


def detect_slide_box(img_rgb: np.ndarray) -> tuple[int, int, int, int] | None:
    """Detect the black border rectangle of a Huawei slide in a rendered RGB page."""
    h, w, _ = img_rgb.shape
    gray = img_rgb.mean(axis=2)
    top_limit = int(h * 0.48)

    # Horizontal dark lines spanning >= 65% of page width
    row_dark = (gray[:top_limit, :] < 95).mean(axis=1)
    border_rows = np.where(row_dark > 0.65)[0]
    if len(border_rows) < 2:
        return None

    y_top = int(border_rows[0])
    # Slide bottom border is typically around 39% of page height (y_pts ~ 303 / 781.68)
    bottom_candidates = border_rows[border_rows > y_top + int(h * 0.22)]
    if len(bottom_candidates) == 0:
        return None
    y_bot = int(bottom_candidates[-1])

    # Vertical dark lines inside y_top..y_bot
    col_dark = (gray[y_top : y_bot + 1, :] < 95).mean(axis=0)
    border_cols = np.where(col_dark > 0.70)[0]
    if len(border_cols) < 2:
        return None

    x_left = int(border_cols[0])
    x_right = int(border_cols[-1])
    if (x_right - x_left) < w * 0.5:
        return None
    return (x_left, y_top, x_right, y_bot)


def parse_bbox_pages(pdf_path: Path) -> list[dict[str, Any]]:
    xml_raw = subprocess.check_output(
        ["pdftotext", "-bbox-layout", str(pdf_path), "-"],
        stderr=subprocess.DEVNULL,
    ).decode("utf-8", errors="replace")
    xml_clean = re.sub(r'\sxmlns="[^"]+"', "", xml_raw, count=1)
    root = ET.fromstring(xml_clean)

    pages: list[dict[str, Any]] = []
    for idx, page_el in enumerate(root.findall(".//page"), 1):
        width = float(page_el.attrib.get("width", "535.2"))
        height = float(page_el.attrib.get("height", "781.68"))
        lines: list[dict[str, Any]] = []
        for line_el in page_el.findall(".//line"):
            words = [
                (w.text or "")
                for w in line_el.findall("word")
                if (w.text or "").strip()
            ]
            if not words:
                continue
            lines.append(
                {
                    "xMin": float(line_el.attrib["xMin"]),
                    "yMin": float(line_el.attrib["yMin"]),
                    "xMax": float(line_el.attrib["xMax"]),
                    "yMax": float(line_el.attrib["yMax"]),
                    "height": float(line_el.attrib["yMax"])
                    - float(line_el.attrib["yMin"]),
                    "text": " ".join(words),
                }
            )
        lines.sort(key=lambda item: (round(item["yMin"], 1), item["xMin"]))
        pages.append(
            {
                "pageNum": idx,
                "widthPts": width,
                "heightPts": height,
                "lines": lines,
            }
        )
    return pages


def extract_slide_title(lines: list[dict[str, Any]]) -> tuple[str, float, list[str]]:
    """Return (title, title_yMax_pts, breadcrumb_labels)."""
    breadcrumbs: list[str] = []
    for ln in lines:
        if ln["yMin"] < 70 and ln["height"] < 9.5 and ln["xMin"] > 150:
            breadcrumbs.append(ln["text"])

    title_lines = [
        ln for ln in lines if 68.0 <= ln["yMin"] <= 106.0 and ln["height"] >= 13.5
    ]
    if not title_lines:
        # Fallback: largest text line inside top header region below breadcrumb
        candidates = [
            ln
            for ln in lines
            if 68.0 <= ln["yMin"] <= 106.0
            and ln["text"] not in ALL_BULLETS
            and ln["height"] >= 10.5
        ]
        if candidates:
            max_h = max(c["height"] for c in candidates)
            title_lines = [c for c in candidates if c["height"] >= max_h - 1.5]

    if not title_lines:
        return ("Untitled Slide", 92.0, breadcrumbs)

    title_lines.sort(key=lambda item: (item["yMin"], item["xMin"]))
    title_text = " ".join(ln["text"] for ln in title_lines).strip()
    title_ymax = max(ln["yMax"] for ln in title_lines)
    return (title_text, title_ymax, breadcrumbs)


def extract_slide_footer_num(lines: list[dict[str, Any]]) -> int | None:
    for ln in lines:
        if 273.0 <= ln["yMin"] <= 305.0 and ln["xMin"] < 140.0:
            m = re.match(r"^(\d{1,3})\b", ln["text"].strip())
            if m:
                return int(m.group(1))
    return None


def join_wrapped_text(prev: str, nxt: str) -> str:
    nxt = nxt.strip()
    if not prev:
        return nxt
    if prev.endswith("-") and not prev.endswith(" -"):
        # Check common compound prefixes vs soft wrap
        lower_tail = prev.rsplit(" ", 1)[-1].lower()
        keep_hyphen = {
            "two-",
            "one-",
            "point-",
            "client-",
            "end-",
            "peer-",
            "high-",
            "low-",
            "full-",
            "half-",
            "multi-",
            "non-",
            "long-",
            "short-",
            "all-",
            "pre-",
            "re-",
            "cross-",
            "mid-",
            "bit-",
            "port-",
            "host-",
            "upper-",
            "lower-",
            "sub-",
            "inter-",
            "intra-",
            "real-",
            "data-",
            "self-",
            "plug-",
            "cost-",
            "job-",
            "well-",
            "human-",
            "machine-",
            "network-",
            "5g-",
            "1st/2nd/3rd/4th/5th-",
            "character-",
            "connection-",
            "application-",
            "routing-",
            "open-",
            "single-",
        }
        if lower_tail in keep_hyphen or re.match(r"^(to|and|or|in|on|of|for|by|at)-", nxt.lower()):
            return prev + nxt
        return prev[:-1] + nxt
    return f"{prev} {nxt}"


def merge_lines_to_notes(
    lines: list[dict[str, Any]], initial_notes: list[dict[str, Any]] | None = None
) -> list[dict[str, Any]]:
    """Group lines with bullet symbols and indent into structured NoteItem list."""
    notes: list[dict[str, Any]] = list(initial_notes) if initial_notes else []

    # Group lines that share virtually the same y coordinate (e.g. bullet symbol + text)
    row_groups: list[list[dict[str, Any]]] = []
    for ln in sorted(lines, key=lambda l: (round(l["yMin"], 1), l["xMin"])):
        if row_groups and abs(ln["yMin"] - row_groups[-1][0]["yMin"]) <= 3.5:
            row_groups[-1].append(ln)
        else:
            row_groups.append([ln])

    for group in row_groups:
        group.sort(key=lambda l: l["xMin"])
        first = group[0]["text"].strip()
        first_x = group[0]["xMin"]
        combined = " ".join(g["text"].strip() for g in group).strip()

        # Strip standalone bullet prefix
        bullet_sym = None
        for sym in ALL_BULLETS:
            if first == sym:
                bullet_sym = sym
                combined = " ".join(g["text"].strip() for g in group[1:]).strip()
                break
            elif combined.startswith(sym + " "):
                bullet_sym = sym
                combined = combined[len(sym) :].strip()
                break

        if not combined:
            continue

        # Detect numbered / lettered sub-items like "1. ...", "A. ..."
        is_numbered = bool(re.match(r"^(?:\d{1,2}|[A-D])\.\s+", combined))

        if bullet_sym in TOP_BULLETS:
            notes.append({"level": 0, "text": combined})
        elif bullet_sym in SUB_BULLETS or (is_numbered and first_x >= 68):
            level = 1 if first_x < 106 else 2
            notes.append({"level": level, "text": combined})
        elif bullet_sym in DEEP_BULLETS:
            notes.append({"level": 2, "text": combined})
        elif is_numbered:
            notes.append({"level": 1, "text": combined})
        else:
            # Continuation of previous note item
            if notes:
                notes[-1]["text"] = join_wrapped_text(notes[-1]["text"], combined)
            else:
                notes.append({"level": 0, "text": combined})

    return notes


def detect_vrp_blocks(notes: list[dict[str, Any]], slide_lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Auto-detect Huawei VRP CLI command sequences for chapters 03-23."""
    cli_lines: list[str] = []
    for item in notes:
        txt = item["text"]
        if re.search(r"(<HUAWEI>|\[HUAWEI|system-view|^\s*display\s+)", txt):
            cli_lines.append(txt)
    for ln in slide_lines:
        txt = ln["text"]
        if re.match(r"^(<HUAWEI>|\[HUAWEI|display\s+|system-view\b|interface\s+|ip\s+address\b)", txt):
            cli_lines.append(txt)

    if not cli_lines:
        return []

    dedup: list[str] = []
    for line in cli_lines:
        if line not in dedup:
            dedup.append(line)

    return [
        {
            "title": "Huawei VRP Command Reference",
            "viewLabel": "VRP CLI",
            "commands": [{"code": c, "tokens": []} for c in dedup[:6]],
        }
    ]


def find_footer_cutoff_pts(lines: list[dict[str, Any]]) -> float:
    """Find the vertical start of the Huawei copyright/page-number footer inside the slide."""
    footer_candidates = [
        ln["yMin"]
        for ln in lines
        if 278.0 <= ln["yMin"] <= 305.0
        and ("copyright" in ln["text"].lower() or re.match(r"^\d{1,3}$", ln["text"].strip()))
    ]
    if footer_candidates:
        return max(276.0, min(footer_candidates) - 3.5)
    return 281.0


def analyze_and_crop_diagram(
    img_rgb: np.ndarray,
    box: tuple[int, int, int, int],
    title: str,
    title_ymax_pts: float,
    footer_cutoff_pts: float,
    slide_lines: list[dict[str, Any]],
    out_webp: Path,
) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
    """
    Separate top plain-text slide bullets from visual diagram/table area.
    Returns (slide_bullets, diagram_metadata_or_none).
    """
    # Pure text slides (Foreword, Objectives, Summary) are always rendered as crisp interactive web text
    if title.strip().lower() in {"foreword", "objectives", "summary"}:
        return (merge_lines_to_notes(slide_lines), None)

    x_left, y_top, x_right, y_bot = box
    inner_x0 = x_left + 8
    inner_x1 = x_right - 8
    title_bot_px = max(y_top + 12, int(round(title_ymax_pts * PTS_TO_PX)) + 8)
    footer_top_px = min(y_bot - 6, int(round(footer_cutoff_pts * PTS_TO_PX)))

    if footer_top_px <= title_bot_px + 20:
        return (merge_lines_to_notes(slide_lines), None)

    region = img_rgb[title_bot_px:footer_top_px, inner_x0:inner_x1].astype(np.int16)
    rh, rw, _ = region.shape

    sat = region.max(axis=2) - region.min(axis=2)
    brightness = region.mean(axis=2)
    is_colored = sat > 24
    # Solid fills (cards, table headers) are >= 8px wide horizontally, unlike 1-2px antialiased text edges
    raw_mid = (brightness > 145) & (brightness < 242) & (sat <= 24)
    solid_mid = (
        raw_mid[:, :-7]
        & raw_mid[:, 1:-6]
        & raw_mid[:, 2:-5]
        & raw_mid[:, 3:-4]
        & raw_mid[:, 4:-3]
        & raw_mid[:, 5:-2]
        & raw_mid[:, 6:-1]
        & raw_mid[:, 7:]
    )
    # Dark solid horizontal rules (table borders, arrows, timelines)
    is_dark_line = (brightness < 120).mean(axis=1) >= 0.42

    row_colored_count = is_colored.sum(axis=1)
    row_solid_mid_count = solid_mid.sum(axis=1)

    visual_rows = np.where(
        (row_colored_count >= 16)
        | (row_solid_mid_count >= int(rw * 0.14))
        | is_dark_line
    )[0]

    # Also detect tall vertical graphic lines (monochrome diagrams)
    col_dark_frac = (brightness < 140).mean(axis=0)
    has_tall_vertical_rule = (col_dark_frac > 0.35).any()

    if len(visual_rows) == 0 and not has_tall_vertical_rule:
        return (merge_lines_to_notes(slide_lines), None)

    first_visual_rel = int(visual_rows[0]) if len(visual_rows) > 0 else 0
    visual_start_px = title_bot_px + first_visual_rel
    visual_start_pts = visual_start_px / PTS_TO_PX

    top_text_lines = [
        ln for ln in slide_lines if ln["yMax"] < (visual_start_pts - 2.5)
    ]
    slide_bullets = merge_lines_to_notes(top_text_lines) if top_text_lines else []

    crop_top_rel = max(0, first_visual_rel - 12)
    if top_text_lines:
        last_top_px = int(round(max(ln["yMax"] for ln in top_text_lines) * PTS_TO_PX)) + 10
        crop_top_rel = max(crop_top_rel, last_top_px - title_bot_px)

    sub = region[crop_top_rel:, :]
    sub_mask = (sub.min(axis=2) < 246)
    ys, xs = np.where(sub_mask)
    if len(ys) == 0 or len(xs) == 0:
        return (merge_lines_to_notes(slide_lines), None)

    y0 = title_bot_px + crop_top_rel + max(0, int(ys.min()) - 6)
    y1 = title_bot_px + crop_top_rel + min(sub.shape[0], int(ys.max()) + 10)
    x0 = inner_x0 + max(0, int(xs.min()) - 8)
    x1 = inner_x0 + min(sub.shape[1], int(xs.max()) + 10)

    if (y1 - y0) < 40 or (x1 - x0) < 80:
        return (merge_lines_to_notes(slide_lines), None)

    cropped = Image.fromarray(img_rgb[y0:y1, x0:x1])
    pad = 16
    canvas = Image.new("RGB", (cropped.width + pad * 2, cropped.height + pad * 2), (255, 255, 255))
    canvas.paste(cropped, (pad, pad))

    out_webp.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_webp, "WEBP", quality=92, method=6)

    diagram_lines = [ln["text"] for ln in slide_lines if ln not in top_text_lines]
    alt_text = " ".join(diagram_lines).strip()
    return (
        slide_bullets,
        {
            "src": f"./content/{out_webp.parent.name}/{out_webp.name}",
            "width": canvas.width,
            "height": canvas.height,
            "altText": alt_text[:1200],
        },
    )


def parse_contents_sections(lines: list[dict[str, Any]]) -> list[str]:
    sections: list[str] = []
    for ln in sorted(lines, key=lambda l: l["yMin"]):
        m = re.match(r"^(\d+)\.\s+(.+)$", ln["text"].strip())
        if m:
            sections.append(m.group(2).strip())
    return sections


def extract_chapter(
    chap_meta: dict[str, Any], pdf_dir: Path, out_dir: Path
) -> dict[str, Any]:
    num = chap_meta["number"]
    chap_id = chap_meta["id"]
    pdf_path = pdf_dir / chap_meta["pdfFile"]
    if not pdf_path.exists():
        raise FileNotFoundError(f"Missing PDF: {pdf_path}")

    bbox_pages = parse_bbox_pages(pdf_path)
    chap_out_dir = out_dir / chap_id
    chap_out_dir.mkdir(parents=True, exist_ok=True)
    for old_img in chap_out_dir.glob("*.webp"):
        old_img.unlink()

    slides: list[dict[str, Any]] = []
    sections: list[str] = []
    current_section_idx = -1

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_prefix = Path(tmpdir) / "page"
        subprocess.run(
            ["pdftoppm", "-png", "-r", str(DPI), str(pdf_path), str(tmp_prefix)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        png_files = sorted(Path(tmpdir).glob("page-*.png"))
        if len(png_files) != len(bbox_pages):
            raise RuntimeError(
                f"Page count mismatch for {pdf_path.name}: {len(png_files)} PNGs vs {len(bbox_pages)} XML pages"
            )

        for page_info, png_path in zip(bbox_pages, png_files):
            page_num = page_info["pageNum"]
            lines = page_info["lines"]
            if page_num == 1 or not lines:
                continue

            img_rgb = np.array(Image.open(png_path).convert("RGB"))
            box = detect_slide_box(img_rgb)

            if box is None:
                # Continuation notes page — merge onto previous slide
                if slides:
                    merged = merge_lines_to_notes(lines, slides[-1]["notes"])
                    slides[-1]["notes"] = merged
                    slides[-1]["pdfPages"].append(page_num)
                continue

            if any("thank you" in ln["text"].strip().lower() for ln in lines if ln["yMin"] < 160):
                continue

            title, title_ymax_pts, breadcrumbs = extract_slide_title(lines)
            if title.lower() == "contents":
                if not sections:
                    sections = parse_contents_sections(lines)
                current_section_idx += 1
                continue

            if title.lower().startswith("thank you"):
                continue

            footer_cutoff_pts = find_footer_cutoff_pts(lines)
            slide_num = extract_slide_footer_num(lines) or page_num
            # Split lines into slide interior (above footer) and speaker notes (y > 306)
            slide_interior_lines = [
                ln
                for ln in lines
                if (title_ymax_pts + 1.5) <= ln["yMin"] < footer_cutoff_pts
            ]
            notes_lines = [ln for ln in lines if ln["yMin"] > 306.0]
            notes = merge_lines_to_notes(notes_lines)

            section_title = (
                sections[current_section_idx]
                if 0 <= current_section_idx < len(sections)
                else ("Overview" if current_section_idx < 0 else f"Section {current_section_idx + 1}")
            )

            is_quiz = title.strip().lower() == "quiz"
            out_webp = chap_out_dir / f"slide-{page_num:02d}.webp"

            if is_quiz:
                quiz_bullets = merge_lines_to_notes(slide_interior_lines)
                slides.append(
                    {
                        "id": f"{chap_id}-p{page_num:02d}",
                        "kind": "official-quiz",
                        "pageNum": page_num,
                        "pdfPages": [page_num],
                        "slideNumber": slide_num,
                        "title": f"Official Huawei Quiz — {chap_meta['title']}",
                        "sectionTitle": section_title,
                        "breadcrumbs": breadcrumbs,
                        "slideBullets": quiz_bullets,
                        "diagram": None,
                        "notes": notes,
                        "vrpBlocks": [],
                    }
                )
                continue

            slide_bullets, diagram = analyze_and_crop_diagram(
                img_rgb, box, title, title_ymax_pts, footer_cutoff_pts, slide_interior_lines, out_webp
            )
            vrp_blocks = detect_vrp_blocks(notes, slide_interior_lines)

            slides.append(
                {
                    "id": f"{chap_id}-p{page_num:02d}",
                    "kind": "slide",
                    "pageNum": page_num,
                    "pdfPages": [page_num],
                    "slideNumber": slide_num,
                    "title": title,
                    "sectionTitle": section_title,
                    "breadcrumbs": breadcrumbs,
                    "slideBullets": slide_bullets,
                    "diagram": diagram,
                    "notes": notes,
                    "vrpBlocks": vrp_blocks,
                }
            )

    # Apply curated enrichment if present, otherwise auto-group into ~5-slide lessons
    enrichment_path = ENRICHMENTS_DIR / f"{chap_id}.json"
    if enrichment_path.exists():
        enrichment = json.loads(enrichment_path.read_text(encoding="utf-8"))
        lessons = build_enriched_lessons(chap_id, slides, enrichment)
        description = enrichment.get("description", f"Interactive study guide for {chap_meta['title']}.")
    else:
        lessons = build_auto_lessons(chap_id, slides)
        description = f"Interactive study guide for {chap_meta['title']}."

    total_steps = sum(len(l["steps"]) for l in lessons)
    total_minutes = sum(l["estimatedMinutes"] for l in lessons)

    chapter_data = {
        "id": chap_id,
        "number": num,
        "title": chap_meta["title"],
        "description": description,
        "pageRange": chap_meta["pageRange"],
        "pageCount": chap_meta["pageCount"],
        "sections": sections,
        "lessons": lessons,
    }

    (chap_out_dir / "chapter.json").write_text(
        json.dumps(chapter_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return {
        "lessonCount": len(lessons),
        "stepCount": total_steps,
        "estimatedMinutes": total_minutes,
        "diagramCount": sum(1 for s in slides if s.get("diagram")),
    }


def build_enriched_lessons(
    chap_id: str, slides: list[dict[str, Any]], enrichment: dict[str, Any]
) -> list[dict[str, Any]]:
    by_page = {s["pageNum"]: s for s in slides}
    used_pages: set[int] = set()
    lessons: list[dict[str, Any]] = []

    challenges_after: dict[int, list[dict[str, Any]]] = {}
    for ch in enrichment.get("challenges", []):
        after_p = int(ch["afterPage"])
        challenges_after.setdefault(after_p, []).append(ch["challenge"])

    vrp_by_page: dict[int, list[dict[str, Any]]] = {
        int(k): v for k, v in enrichment.get("vrpOverrides", {}).items()
    }

    for idx, l_def in enumerate(enrichment.get("lessons", []), 1):
        steps: list[dict[str, Any]] = []
        for p in l_def["pages"]:
            slide = by_page.get(p)
            if not slide:
                continue
            used_pages.add(p)
            if p in vrp_by_page:
                slide = {**slide, "vrpBlocks": vrp_by_page[p]}
            steps.append(slide)
            for ch in challenges_after.get(p, []):
                steps.append(
                    {
                        "id": ch["id"],
                        "kind": "challenge",
                        "sectionTitle": l_def["sectionTitle"],
                        "challenge": ch,
                    }
                )
        if not steps:
            continue
        lessons.append(
            {
                "id": l_def["id"],
                "number": f"{int(chap_id[2:])}.{idx}",
                "title": l_def["title"],
                "sectionTitle": l_def["sectionTitle"],
                "summary": l_def["summary"],
                "estimatedMinutes": l_def.get("estimatedMinutes", max(4, round(len(steps) * 0.8))),
                "steps": steps,
            }
        )

    # Append any slides not listed in enrichment to final lesson as safety net
    leftover = [s for s in slides if s["pageNum"] not in used_pages]
    if leftover and lessons:
        lessons[-1]["steps"].extend(leftover)

    return lessons


def build_auto_lessons(chap_id: str, slides: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Fallback grouping by official section into ~5-slide bite-sized lessons."""
    lessons: list[dict[str, Any]] = []
    chap_num = int(chap_id[2:])
    grouped: list[tuple[str, list[dict[str, Any]]]] = []
    for s in slides:
        sec = s.get("sectionTitle", "Overview")
        if not grouped or grouped[-1][0] != sec:
            grouped.append((sec, [s]))
        else:
            grouped[-1][1].append(s)

    lesson_idx = 1
    for sec_title, sec_slides in grouped:
        chunk_size = 5
        for i in range(0, len(sec_slides), chunk_size):
            chunk = sec_slides[i : i + chunk_size]
            part_suffix = (
                f" (Part {i // chunk_size + 1})" if len(sec_slides) > chunk_size else ""
            )
            lessons.append(
                {
                    "id": f"{chap_id}-l{lesson_idx}",
                    "number": f"{chap_num}.{lesson_idx}",
                    "title": f"{sec_title}{part_suffix}",
                    "sectionTitle": sec_title,
                    "summary": f"Covers {chunk[0]['title']} through {chunk[-1]['title']}.",
                    "estimatedMinutes": max(3, len(chunk)),
                    "steps": chunk,
                }
            )
            lesson_idx += 1
    return lessons


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract Huawei HCIA PDFs to HCIA Studio content.")
    parser.add_argument("--pdf-dir", type=Path, default=DEFAULT_PDF_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--chapters", type=int, nargs="*", help="Chapter numbers to extract (e.g. 1 2)")
    parser.add_argument("--all", action="store_true", help="Extract all 23 chapters")
    args = parser.parse_args()

    chapters = parse_index(args.pdf_dir)
    if args.all:
        targets = {c["number"] for c in chapters}
    elif args.chapters:
        targets = set(args.chapters)
    else:
        targets = {1, 2}

    args.out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = args.out_dir / "manifest.json"
    existing_manifest: dict[str, Any] = {}
    if manifest_path.exists():
        try:
            old = json.loads(manifest_path.read_text(encoding="utf-8"))
            existing_manifest = {c["number"]: c for c in old.get("chapters", [])}
        except Exception:
            existing_manifest = {}

    manifest_chapters: list[dict[str, Any]] = []
    for chap in chapters:
        num = chap["number"]
        if num in targets:
            print(f"Extracting Chapter {num:02d}: {chap['title']}...", flush=True)
            stats = extract_chapter(chap, args.pdf_dir, args.out_dir)
            print(
                f"  -> {stats['lessonCount']} lessons, {stats['stepCount']} steps, {stats['diagramCount']} WebP diagrams",
                flush=True,
            )
            manifest_chapters.append({**chap, "ready": True, **stats})
        else:
            prev = existing_manifest.get(num, {})
            chap_json = args.out_dir / chap["id"] / "chapter.json"
            if chap_json.exists() and prev.get("ready"):
                manifest_chapters.append(prev)
            else:
                manifest_chapters.append(
                    {
                        **chap,
                        "ready": False,
                        "lessonCount": 0,
                        "stepCount": 0,
                        "estimatedMinutes": max(15, round(chap["pageCount"] * 0.6)),
                    }
                )

    manifest = {
        "courseTitle": "HCIA-Datacom V2.0",
        "subtitle": "Interactive Huawei Networking Curriculum · 23 Chapters",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "chapters": manifest_chapters,
    }
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Wrote manifest to {manifest_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
