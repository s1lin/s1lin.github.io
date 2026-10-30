"""Count the editor's tokens from cc-switch, for the skyline under the GitHub heatmap.

cc-switch keeps the usage of Claude Code, Codex, Pi and the rest in an SQLite
database: recent requests one row each (proxy_request_logs), older days rolled
up (usage_daily_rollups). This reads one or more of those databases, on this
machine or another over SSH, and writes src/content/tokens.json with tokens
per agent per day, per model family per day, and per agent per kind, and
nothing else: no providers, model ids, costs or hosts.

Usage:
  python3 -I scripts/token-data.py SOURCE [SOURCE ...] [--sync] [--cursor CSV ...]

A SOURCE is a path to a cc-switch.db, or ssh://user@host[:port]/path/to/cc-switch.db
for one on another machine (the script runs itself there with python3, so
nothing is copied). --sync first runs `cc-switch sessions sync-usage --all` on
each source, to bring in session logs written since cc-switch last looked.

--cursor adds Cursor, which cc-switch does not see, from the usage CSVs its
dashboard exports (cursor.com/dashboard, Usage, Export CSV, by tokens): one
or more files, rows found in more than one counted once. Cursor's columns map
to the same four kinds: "Input (w/o Cache Write)" is fresh input, "Input (w/
Cache Write)" the cache writes, then cache reads and output; they add up to
its Total. Cursor bills most of it within a plan and prices none of it at
list price, so its tokens count and its money stays at $0, a floor like the
rest.

Money is the value at API list prices, in US dollars: the cost cc-switch
recorded, and for rows it left at $0 because its price table lacked the model,
the tokens priced from the fullest price table among the sources. Models no
table knows stay at $0, so the money, like the tokens, is a floor.

Counting, per database, as cc-switch does:
- Tokens are fresh input + output + cache reads + cache writes.
- Fresh input: rows marked semantics 2 store it as is. Otherwise apps that
  report input with the cache inside it (Codex and the other OpenAI-style
  apps) have the cache taken out; Claude reports it fresh already.
- A day can be in both tables (cc-switch re-imports session logs it had
  already rolled up). Then the larger of the two counts, never their sum, so
  the total is a floor and not a double count.
Machines are added together.
"""
import json
import os
import sqlite3
import subprocess
import sys
from datetime import date

INCLUDES_CACHE = ("codex", "gemini", "opencode", "open-code")
FRESH = f"""CASE
  WHEN input_token_semantics = 2 THEN input_tokens
  WHEN app_type IN ({",".join(f"'{a}'" for a in INCLUDES_CACHE)})
       AND input_tokens >= cache_read_tokens + cache_creation_tokens
    THEN input_tokens - cache_read_tokens - cache_creation_tokens
  ELSE input_tokens END"""
PARTS = ("input", "output", "cacheRead", "cacheWrite")

# Models, with the company that makes each, in the order the treemap stacks
# them: a company to a hue, its models in shades of it (TokenSkyline.tsx).
# Claude is named model by model; the first pattern a model id matches wins,
# and anything none matches is Other. Keep the order fixed, so a model keeps
# its colour as the counts change.
FAMILIES = (
    ("GPT-5", "OpenAI", r"^gpt-5|codex"),
    ("GPT-6", "OpenAI", r"^gpt-6"),
    ("Claude Opus 5.5", "Anthropic", r"claude-opus-5-5"),
    ("Claude Opus 5", "Anthropic", r"claude-opus-5(?!-5)"),
    ("Claude Sonnet 5", "Anthropic", r"claude-sonnet-5(?![-.]\d)"),
    ("Claude Fable 5.1", "Anthropic", r"claude-fable-5-1"),
    ("Claude, other", "Anthropic", r"claude"),
    ("DeepSeek", "DeepSeek", r"deepseek"),
    ("Qwen", "Alibaba", r"qwen"),
    ("GLM", "Zhipu", r"glm"),
    ("Grok", "xAI", r"grok"),
    ("Gemini", "Google", r"gemini"),
    ("Cursor Auto", "Cursor", r"^auto$"),
    ("Composer", "Cursor", r"^composer"),
)
MODELS = [name for name, _, _ in FAMILIES] + ["Other"]
MAKERS = [maker for _, maker, _ in FAMILIES] + ["Other"]


def family(model):
    """The named model a model id counts as, or Other."""
    import re
    return next((name for name, _, rx in FAMILIES if re.search(rx, model or "")), "Other")


MODEL = "COALESCE(NULLIF(pricing_model, ''), NULLIF(model, ''), NULLIF(request_model, ''), '')"
# Per (app, day, model): fresh input, output, cache reads, cache writes, recorded USD, and the
# same five over the rows cc-switch left unpriced (recorded at $0 with tokens in them).
SUMS = f"""SUM({FRESH}), SUM(output_tokens), SUM(cache_read_tokens), SUM(cache_creation_tokens),
  SUM(total_cost_usd),
  SUM(CASE WHEN total_cost_usd = 0 THEN {FRESH} ELSE 0 END),
  SUM(CASE WHEN total_cost_usd = 0 THEN output_tokens ELSE 0 END),
  SUM(CASE WHEN total_cost_usd = 0 THEN cache_read_tokens ELSE 0 END),
  SUM(CASE WHEN total_cost_usd = 0 THEN cache_creation_tokens ELSE 0 END)"""


def tally(path):
    """One database's usage, grouped by table, app, day and model, and its price table."""
    db = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    logs = db.execute(f"SELECT app_type, date(created_at, 'unixepoch'), {MODEL}, {SUMS} FROM proxy_request_logs GROUP BY 1, 2, 3").fetchall()
    rollups = db.execute(f"SELECT app_type, date, {MODEL}, {SUMS} FROM usage_daily_rollups GROUP BY 1, 2, 3").fetchall()
    prices = {
        m: [float(x or 0) for x in rest]
        for m, *rest in db.execute(
            "SELECT model_id, input_cost_per_million, output_cost_per_million, cache_read_cost_per_million, cache_creation_cost_per_million FROM model_pricing"
        )
    }
    return {"logs": logs, "rollups": rollups, "prices": prices}


def per_day(rows, prices):
    """{app: {day: [input, output, cacheRead, cacheWrite, usd, {family: tokens}]}} from one table's groups, unpriced rows priced."""
    out = {}
    for app, day, model, *n in rows:
        n = [float(x or 0) for x in n]
        tokens, usd, unpriced = n[:4], n[4], n[5:]
        if any(unpriced) and model in prices:
            usd += sum(t * p for t, p in zip(unpriced, prices[model])) / 1e6
        cell = out.setdefault(app, {}).setdefault(day, [0, 0, 0, 0, 0.0, {}])
        for k in range(4):
            cell[k] += int(tokens[k])
        cell[4] += usd
        fam = family(model)
        cell[5][fam] = cell[5].get(fam, 0) + sum(int(t) for t in tokens)
    return out


def merge(counts, prices):
    """A database's days, a day in both tables counted once: the table with more tokens that day."""
    logs, rollups = per_day(counts["logs"], prices), per_day(counts["rollups"], prices)
    for app, days in rollups.items():
        for day, cell in days.items():
            mine = logs.setdefault(app, {})
            if day not in mine or sum(cell[:4]) > sum(mine[day][:4]):
                mine[day] = cell
    return logs


def cursor_csv(paths):
    """{"cursor": {day: [input, output, cacheRead, cacheWrite, usd, {family: tokens}]}} from Cursor's usage exports."""
    import csv
    num = lambda v: int(float(v)) if v not in ("", None) else 0
    seen, out = set(), {}
    for path in paths:
        with open(os.path.expanduser(path), newline="", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                key = tuple(r.values())
                if key in seen:
                    continue
                seen.add(key)
                tokens = [num(r["Input (w/o Cache Write)"]), num(r["Output Tokens"]), num(r["Cache Read"]), num(r["Input (w/ Cache Write)"])]
                if not any(tokens):
                    continue
                cell = out.setdefault(r["Date"][:10], [0, 0, 0, 0, 0.0, {}])
                for k in range(4):
                    cell[k] += tokens[k]
                fam = family(r["Model"])
                cell[5][fam] = cell[5].get(fam, 0) + sum(tokens)
    return {"cursor": out} if out else {}


def run_remote(spec, sync):
    """Run this script on the machine in an ssh:// SOURCE and return its tally."""
    rest = spec[len("ssh://"):]
    target, _, path = rest.partition("/")
    host, _, port = target.partition(":")
    ssh = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15"] + (["-p", port] if port else []) + [host]
    if sync:
        subprocess.run(ssh + ["cc-switch sessions sync-usage --all --json"], check=True, stdout=subprocess.DEVNULL, stdin=subprocess.DEVNULL)
    with open(__file__, "rb") as me:
        done = subprocess.run(ssh + ["python3", "-I", "-", "--tally", "/" + path], stdin=me, capture_output=True, check=True)
    return json.loads(done.stdout)


def main(argv):
    if argv[:1] == ["--tally"]:
        print(json.dumps(tally(argv[1])))
        return 0
    sync = "--sync" in argv
    cursor = [a for i, a in enumerate(argv) if i > 0 and argv[i - 1] == "--cursor"]
    sources = [a for i, a in enumerate(argv) if a not in ("--sync", "--cursor") and not (i > 0 and argv[i - 1] == "--cursor")]
    if not sources:
        print(__doc__.strip().split("\n\n")[1], file=sys.stderr)
        return 2

    tallies = []
    for source in sources:
        if source.startswith("ssh://"):
            tallies.append(run_remote(source, sync))
        else:
            if sync:
                subprocess.run(["cc-switch", "sessions", "sync-usage", "--all", "--json"], check=True, stdout=subprocess.DEVNULL, stdin=subprocess.DEVNULL)
            tallies.append(tally(os.path.expanduser(source)))
    # One price table for every machine: the fullest, filled out by the others.
    prices = {}
    for t in sorted(tallies, key=lambda t: len(t["prices"])):
        prices.update({m: p for m, p in t["prices"].items() if any(p)})

    days = {}  # day -> {app: [tokens, usd]}
    model_days = {}  # day -> {family: tokens}, from the same table as the day's agents
    parts = dict.fromkeys(PARTS, 0)
    parts_by_app = {}  # app -> the four kinds, for the flow from agents to kinds
    for by_app in [merge(t, prices) for t in tallies] + [cursor_csv(cursor)]:
        for app, by_day in by_app.items():
            for day, cell in by_day.items():
                mine = days.setdefault(day, {}).setdefault(app, [0, 0.0])
                mine[0] += sum(cell[:4])
                mine[1] += cell[4]
                for fam, n in cell[5].items():
                    by_fam = model_days.setdefault(day, {})
                    by_fam[fam] = by_fam.get(fam, 0) + n
                for k, v in zip(PARTS, cell[:4]):
                    parts[k] += v
                    parts_by_app.setdefault(app, dict.fromkeys(PARTS, 0))[k] += v

    apps = sorted({a for cell in days.values() for a in cell}, key=lambda a: -sum(c.get(a, [0])[0] for c in days.values()))
    rows = [
        [
            day,
            [days[day].get(a, [0, 0])[0] for a in apps],
            [round(days[day].get(a, [0, 0])[1], 2) for a in apps],
            [model_days.get(day, {}).get(m, 0) for m in MODELS],
        ]
        for day in sorted(days)
        if sum(v[0] for v in days[day].values()) > 0
    ]
    data = {
        "fetched": date.today().isoformat(),
        "machines": len(sources),
        "cursor": bool(cursor),
        "apps": apps,
        "total": sum(sum(r[1]) for r in rows),
        "byApp": {a: sum(r[1][i] for r in rows) for i, a in enumerate(apps)},
        "usd": round(sum(sum(r[2]) for r in rows), 2),
        "usdByApp": {a: round(sum(r[2][i] for r in rows), 2) for i, a in enumerate(apps)},
        "models": MODELS,
        "makers": MAKERS,
        "byModel": {m: sum(r[3][i] for r in rows) for i, m in enumerate(MODELS)},
        "parts": parts,
        "partsByApp": {a: parts_by_app[a] for a in apps},
        "since": rows[0][0] if rows else None,
        "days": rows,
    }
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "content", "tokens.json")
    with open(out, "w") as f:
        json.dump(data, f, separators=(",", ":"))
        f.write("\n")
    print(f"{data['total']:,} tokens, ${data['usd']:,.2f}, from {len(sources)} machine(s), {len(rows)} days since {data['since']}: " + ", ".join(f"{a} {n:,} (${data['usdByApp'][a]:,.2f})" for a, n in data["byApp"].items()))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
