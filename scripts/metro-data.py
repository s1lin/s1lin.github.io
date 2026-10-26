"""Fetch metro networks from OpenStreetMap for the Metro2Line player.

This site player uses the same route types as the standalone Metro2Line app:
subway, light-rail and monorail routes from the Overpass API in a city's box.
It then keeps only what the player draws: each line's track, one
end-to-end path for its trains, and where those trains stop. Coordinates are
metres from the box centre, simplified, so a city is tens of kilobytes.

Usage: python3 -I scripts/metro-data.py [slug ...]   (default: every city)
Writes public/data/metro/<slug>.json, and src/content/metro-cities.ts listing
every city that has data.
Data © OpenStreetMap contributors, ODbL.
"""
import json
import math
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

OVERPASS = "https://overpass-api.de/api/interpreter"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "metro"
INDEX = ROOT / "src" / "content" / "metro-cities.ts"
TOLERANCE = 15  # metres, Douglas-Peucker
JOIN = 40  # metres: way ends closer than this connect

# slug, name, (south, west, north, east): the frame the player shows
CITIES = [
    ("montreal", "Montréal", (45.42, -73.92, 45.62, -73.45)),
    ("tokyo", "Tokyo", (35.60, 139.60, 35.80, 139.90)),
    ("paris", "Paris", (48.79, 2.22, 48.93, 2.48)),
    ("london", "London", (51.40, -0.40, 51.65, 0.15)),
    ("new-york", "New York", (40.56, -74.08, 40.90, -73.74)),
    ("chengdu", "Chengdu", (30.50, 103.90, 30.82, 104.25)),
    ("shanghai", "Shanghai", (31.05, 121.25, 31.42, 121.75)),
    ("beijing", "Beijing", (39.78, 116.20, 40.08, 116.60)),
    ("hong-kong", "Hong Kong", (22.24, 113.92, 22.45, 114.30)),
    ("berlin", "Berlin", (52.40, 13.20, 52.62, 13.62)),
    ("madrid", "Madrid", (40.33, -3.80, 40.52, -3.57)),
    ("toronto", "Toronto", (43.62, -79.56, 43.80, -79.20)),
]


def overpass(bbox):
    s, w, n, e = bbox
    query = f"""[out:json][timeout:180];
relation["route"~"^(subway|light_rail|monorail)$"]({s},{w},{n},{e})->.routes;
.routes out geom;
rel(br.routes)["route_master"]->.masters;
.masters out body;"""
    body = urllib.parse.urlencode({"data": query}).encode()
    for attempt in range(4):
        try:
            req = urllib.request.Request(OVERPASS, data=body, headers={"User-Agent": "s1lin.github.io metro-data/1.0"})
            with urllib.request.urlopen(req, timeout=240) as r:
                return json.load(r)
        except Exception as err:  # 429 / 504 from a busy server: wait and retry
            print(f"  overpass: {err}; retry {attempt + 1}")
            time.sleep(20 * (attempt + 1))
    raise SystemExit("overpass failed")


def projector(bbox):
    s, w, n, e = bbox
    lat0, lon0 = (s + n) / 2, (w + e) / 2
    kx = 111320 * math.cos(math.radians(lat0))
    ky = 110540

    def project(lat, lon):
        return ((lon - lon0) * kx, (lat0 - lat) * ky)

    return project


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def simplify(pts, tol=TOLERANCE):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        (ax, ay), (bx, by) = pts[i], pts[j]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1e-9
        best, far = -1.0, -1
        for k in range(i + 1, j):
            px, py = pts[k]
            d = abs(dy * (px - ax) - dx * (py - ay)) / norm
            if d > best:
                best, far = d, k
        if best > tol:
            keep[far] = True
            stack += [(i, far), (far, j)]
    return [p for p, k in zip(pts, keep) if k]


def length(pts):
    return sum(dist(a, b) for a, b in zip(pts, pts[1:]))


def stitch(ways):
    """Chain a route's ways end to end; return the longest unbroken piece."""
    pieces, chain = [], []
    for g in ways:
        if not chain:
            chain = list(g)
            continue
        if dist(chain[-1], g[0]) < JOIN:
            chain += g[1:]
        elif dist(chain[-1], g[-1]) < JOIN:
            chain += g[::-1][1:]
        elif dist(chain[0], g[0]) < JOIN:
            chain = chain[::-1] + g[1:]
        elif dist(chain[0], g[-1]) < JOIN:
            chain = chain[::-1] + g[::-1][1:]
        else:
            pieces.append(chain)
            chain = list(g)
    pieces.append(chain)
    return max(pieces, key=length)


def along(path, p):
    """Distance along `path` of the point nearest to `p`, and how far off it is."""
    best, at, run = float("inf"), 0.0, 0.0
    for a, b in zip(path, path[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        seg = math.hypot(dx, dy)
        t = 0.0 if seg == 0 else max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / seg**2))
        d = math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1])
        if d < best:
            best, at = d, run + t * seg
        run += seg
    return at, best


def flat(pts):
    return [round(v) for p in pts for v in p]


def colour(tags):
    c = (tags.get("colour") or "").strip()
    if c.startswith("#") and len(c) in (4, 7):
        return c.upper()
    return None


def merge(lines):
    """One line per ref and colour. OpenStreetMap often files a line as several
    services (New York's shuttles, Hudson-Bergen's branches) that read as one."""
    groups = {}
    for line in lines:
        key = (line["ref"], line["colour"], line["type"]) if line["ref"] else id(line)
        groups.setdefault(key, []).append(line)
    out = []
    for group in groups.values():
        def km(l):
            return length(list(zip(l["path"][0::2], l["path"][1::2])))

        main = max(group, key=km)
        names = {l["name"] for l in group}
        out.append({**main, "name": main["name"] if len(names) == 1 else main["ref"],
                    "track": [t for l in group for t in l["track"]]})
    return out


def build(slug, name, bbox):
    data = overpass(bbox)
    project = projector(bbox)
    routes = {el["id"]: el for el in data["elements"] if el["type"] == "relation" and "route" in el.get("tags", {})}
    masters = [el for el in data["elements"] if el["type"] == "relation" and "route_master" in el.get("tags", {})]

    # One line per route master; routes without one are grouped by ref and colour.
    groups = {}
    claimed = set()
    for m in masters:
        ids = [mem["ref"] for mem in m.get("members", []) if mem["type"] == "relation" and mem["ref"] in routes]
        if ids:
            groups[("m", m["id"])] = (m["tags"], ids)
            claimed.update(ids)
    for rid, r in routes.items():
        if rid in claimed:
            continue
        t = r["tags"]
        key = ("r", t.get("ref") or t.get("name"), colour(t))
        groups.setdefault(key, (t, []))[1].append(rid)

    lines = []
    for tags, ids in groups.values():
        track, seen = [], set()
        best_path, best_len, best_stops = None, 0.0, []
        for rid in ids:
            r = routes[rid]
            ways, stops = [], []
            for mem in r.get("members", []):
                role = mem.get("role", "")
                if mem["type"] == "way" and "geometry" in mem and not role.startswith("platform"):
                    g = [project(p["lat"], p["lon"]) for p in mem["geometry"] if p]
                    if len(g) > 1:
                        ways.append(g)
                        if mem["ref"] not in seen:
                            seen.add(mem["ref"])
                            track.append(g)
                elif mem["type"] == "node" and role.startswith("stop") and "lat" in mem:
                    stops.append(project(mem["lat"], mem["lon"]))
            if not ways:
                continue
            path = stitch(ways)
            if length(path) > best_len:
                best_path, best_len, best_stops = path, length(path), stops
        if not track or best_len < 500:
            continue
        rt = routes[ids[0]]["tags"]
        path = simplify(best_path, 6)
        stops = sorted({round(a) for a, off in (along(path, s) for s in best_stops) if off < 120})
        lines.append(
            {
                "ref": tags.get("ref") or rt.get("ref") or "",
                "name": tags.get("name:en") or tags.get("name") or rt.get("name:en") or rt.get("name") or "",
                "colour": colour(tags) or colour(rt),
                "type": rt.get("route"),
                "track": [flat(simplify(g)) for g in track],
                "path": flat(path),
                "stops": stops,
            }
        )

    lines = merge(lines)

    def order(line):
        ref = line["ref"]
        digits = "".join(ch for ch in ref if ch.isdigit())
        return (line["type"] != "subway", int(digits) if digits else 999, ref, line["name"])

    lines.sort(key=order)
    s, w, n, e = bbox
    x0, y0 = project(n, w)
    x1, y1 = project(s, e)
    out = {
        "slug": slug,
        "name": name,
        "view": [round(x0), round(y0), round(x1), round(y1)],
        "lines": lines,
        "source": "© OpenStreetMap contributors, ODbL",
        "fetched": time.strftime("%Y-%m-%d"),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{slug}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    km = sum(length(list(zip(l["path"][0::2], l["path"][1::2]))) for l in lines) / 1000
    print(f"{slug}: {len(lines)} lines, {km:.0f} km of train paths, {(OUT / f'{slug}.json').stat().st_size // 1024} KB")


def main():
    wanted = set(sys.argv[1:])
    for slug, name, bbox in CITIES:
        if wanted and slug not in wanted:
            continue
        build(slug, name, bbox)
        time.sleep(5)
    rows = "".join(
        f'  {{ slug: "{s}", name: "{n}" }},\n' for s, n, _ in CITIES if (OUT / f"{s}.json").exists()
    )
    INDEX.write_text(
        "// Written by scripts/metro-data.py: the cities with a network in public/data/metro/.\n"
        f"export const METRO_CITIES = [\n{rows}];\n"
    )


if __name__ == "__main__":
    main()
