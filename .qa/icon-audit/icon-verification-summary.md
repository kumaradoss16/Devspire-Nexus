# Icon verification summary

Generated: 2026-11-06T07:02:30.172Z

## Dataset

- Updated dataset: `.qa/icon-audit/ai-resources-1000.json`
- Original backup: `.qa/icon-audit/backup/ai-resources-1000.original.json`
- Total resources: **1000**
- By type: tool 400 · model 300 · developer_resource 300

## Icon outcome

| Metric | Count |
|---|---:|
| Official website icons | 646 |
| Official manifest icons | 3 |
| GitHub repository avatars | 216 |
| Domain favicons (/favicon.ico) | 93 |
| Existing favicon-service icons retained | 31 |
| Unavailable (null) | 11 |
| Generic favicon placeholders rejected | 0 |
| Broken previous icons detected | 57 |
| Existing icon URLs valid (records) | 943 |
| Existing icon URLs broken (records) | 57 |
| Unique previous URLs valid / broken | 540 / 40 |
| Manual review required | 39 |
| Visually verified | 0 |

## Method

1. Read each record's official domain and, where present, its GitHub owner from the verified link or the record's GitHub evidence sources.
2. Fetch the domain homepage and ordered candidates: apple-touch-icon, rel=icon, mask-icon, web manifest icons, /favicon.ico, common icon paths, the www host, then the existing favicon-service URL.
3. For GitHub-owned records, use `https://github.com/<owner>.png?size=128`.
4. Validate HTTP status, content type, image magic bytes, dimensions (minimum 16x16), size limits, and reject HTML or scripted SVG.
5. Download verified bytes into `assets/img/icons/verified/` and set the JSON `icon` key to the local relative path. No remote hotlinks remain.
6. Records without a validated source get `icon: null`; the frontend category fallback renders them.

## Previous icon audit

The 580 unique original favicon URLs were re-fetched: **540 valid**, **40 broken**. Per-record results are in `previous-icon-audit.json` and the `previous_http_status` / `previous_image_valid` fields of the verification report.

## Honest limitations

- Automated checks prove the asset is a real image served by the record's domain or GitHub owner. They do not prove the logo is visually the correct brand; those rows are marked `visual_review: not_performed`.
- Icons sourced from the favicon service or a platform domain (e.g. github.com itself) are marked `manual_review` rather than presented as official brand logos.
- GitHub owner avatars for personal repositories can be portraits rather than project logos. These are labeled `github_avatar` and remain subject to visual review.
- A 119-icon contact sheet (all 39 manual-review icons plus 80 GitHub avatars) was rendered; all 119 images loaded. This is a visual sample, not a full 1,000-icon visual audit.
- No icon was fabricated. No record fields other than `icon` were changed.
