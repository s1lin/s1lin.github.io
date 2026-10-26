"""Fetch a year of GitHub contributions for the heatmap under the contents.

Reads the calendar GitHub draws on a profile page, from the page fragment at
https://github.com/users/<login>/contributions (public, no token), and keeps
only what the heatmap draws: each day's count, GitHub's shade for it (0 to 4)
and the year's total. Nothing else on the page is kept: no name, no avatar.

Usage: python3 -I scripts/github-data.py [login]   (default: s1lin)
Writes src/content/github.json. If GitHub is unreachable or the page is not
what this script expects, it writes nothing and exits 1, and the build keeps
the snapshot already in the repo.
"""
import datetime as dt
import json
import re
import sys
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

LOGIN = "s1lin"
PAGE = "https://github.com/users/{}/contributions"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "content" / "github.json"
MAX_BYTES = 2_000_000
TIP = re.compile(r"(No|\d[\d,]*) contributions? on ")
TOTAL = re.compile(r"([\d,]+) contributions? in the last year")


class Calendar(HTMLParser):
    """The calendar's day squares, the tooltip under each, and the heading over them."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.days = {}  # square id -> (date, level)
        self.tips = {}  # square id -> tooltip text
        self.heading = ""
        self._tip = None
        self._in_heading = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "td" and "ContributionCalendar-day" in (a.get("class") or "").split() and a.get("data-date"):
            self.days[a.get("id")] = (a["data-date"], a.get("data-level"))
        elif tag == "tool-tip" and a.get("for"):
            self._tip = a["for"]
            self.tips[self._tip] = ""
        elif tag == "h2" and a.get("id") == "js-contribution-activity-description":
            self._in_heading = True

    def handle_endtag(self, tag):
        if tag == "tool-tip":
            self._tip = None
        elif tag == "h2":
            self._in_heading = False

    def handle_data(self, data):
        if self._tip:
            self.tips[self._tip] += data
        if self._in_heading:
            self.heading += data


def fetch(login):
    req = urllib.request.Request(PAGE.format(login), headers={"User-Agent": "s1lin.github.io github-data/1.0"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                if "text/html" not in r.headers.get("Content-Type", ""):
                    raise SystemExit(f"github-data: expected HTML, got {r.headers.get('Content-Type')}")
                body = r.read(MAX_BYTES + 1)
                if len(body) > MAX_BYTES:
                    raise SystemExit("github-data: page larger than expected")
                return body.decode("utf-8")
        except SystemExit:
            raise
        except Exception as err:  # a busy or unreachable github.com: wait and retry
            print(f"  github: {err}; retry {attempt + 1}")
            time.sleep(10 * (attempt + 1))
    raise SystemExit("github-data: github.com unreachable")


def parse(html):
    """Days in order as (date, count, level), and the total GitHub states."""
    cal = Calendar()
    cal.feed(html)
    days = []
    for square, (date, level) in cal.days.items():
        tip = TIP.match(" ".join(cal.tips.get(square, "").split()))
        if not tip:
            raise SystemExit(f"github-data: no count for {date}")
        if level not in {"0", "1", "2", "3", "4"}:
            raise SystemExit(f"github-data: odd level {level!r} on {date}")
        count = 0 if tip[1] == "No" else int(tip[1].replace(",", ""))
        days.append((dt.date.fromisoformat(date), count, int(level)))
    days.sort()
    total = TOTAL.search(" ".join(cal.heading.split()))
    return days, int(total[1].replace(",", "")) if total else None


def check(days, total):
    """The shape the heatmap expects: a year of days in a row, no gaps, sane counts."""
    if not 350 <= len(days) <= 380:
        raise SystemExit(f"github-data: {len(days)} days, expected about a year")
    for (a, *_), (b, *_) in zip(days, days[1:]):
        if b - a != dt.timedelta(days=1):
            raise SystemExit(f"github-data: calendar jumps from {a} to {b}")
    for date, count, level in days:
        if not 0 <= count <= 10_000 or (count == 0) != (level == 0):
            raise SystemExit(f"github-data: {count} contributions at level {level} on {date}")
    today = dt.datetime.now(dt.timezone.utc).date()
    if abs((days[-1][0] - today).days) > 2:
        raise SystemExit(f"github-data: calendar ends {days[-1][0]}, today is {today}")
    if total is not None and not 0 <= total <= 1_000_000:
        raise SystemExit(f"github-data: odd total {total}")


def main():
    login = sys.argv[1] if len(sys.argv) > 1 else LOGIN
    if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})", login):
        raise SystemExit(f"github-data: not a GitHub login: {login!r}")
    days, total = parse(fetch(login))
    check(days, total)
    counted = sum(c for _, c, _ in days)
    if total is None:
        total = counted
    elif total != counted:
        print(f"  note: GitHub says {total}, the squares add up to {counted}; keeping GitHub's")
    out = {
        "login": login,
        "source": PAGE.format(login),
        "fetched": dt.datetime.now(dt.timezone.utc).date().isoformat(),
        "total": total,
        "start": days[0][0].isoformat(),
        "counts": [c for _, c, _ in days],
        "levels": [lv for _, _, lv in days],
    }
    tmp = OUT.with_suffix(".tmp")
    tmp.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    tmp.replace(OUT)
    print(f"{login}: {total:,} contributions, {days[0][0]} to {days[-1][0]} ({len(days)} days), {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
