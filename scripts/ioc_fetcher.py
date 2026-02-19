"""
IOC Fetcher (build-time)
Fetches real-world malicious indicators for your lab without bundling malware.
Sources:
- URLhaus: plain-text URL list (public)
- MalwareBazaar: recent SHA256 export (public endpoint may vary)
Writes: ioc_library.csv and ioc_library.json

NOTE: respect abuse.ch fair use principles / ToS.
"""

import csv, json, re, sys
from datetime import datetime, timezone
from urllib.request import urlopen, Request

URLHAUS_TEXT = "https://urlhaus.abuse.ch/downloads/text/"
MALWAREBAZAAR_SHA256_RECENT = "https://bazaar.abuse.ch/export/txt/sha256/recent"

def fetch_text(url: str) -> str:
    req = Request(url, headers={"User-Agent": "soc-lab-ioc-fetcher/1.0"})
    with urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")

def extract_urls(text: str, limit: int = 200):
    urls = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # basic sanity
        if line.startswith("http://") or line.startswith("https://"):
            urls.append(line)
        if len(urls) >= limit:
            break
    return urls

def extract_sha256(text: str, limit: int = 200):
    hashes = []
    for m in re.finditer(r"\b[a-fA-F0-9]{64}\b", text):
        hashes.append(m.group(0).lower())
        if len(hashes) >= limit:
            break
    return hashes

def host_from_url(u: str):
    # naive parse without urllib (keep it simple)
    u = re.sub(r"^https?://", "", u)
    host = u.split("/")[0].split(":")[0]
    return host.lower()

def main():
    now = datetime.now(timezone.utc).isoformat().replace("+00:00","Z")

    urlhaus = fetch_text(URLHAUS_TEXT)
    urls = extract_urls(urlhaus, limit=250)

    mb = fetch_text(MALWAREBAZAAR_SHA256_RECENT)
    sha256 = extract_sha256(mb, limit=250)

    # Derive domains and IPs from URLhaus URLs
    domains=set()
    ips=set()
    for u in urls:
        h = host_from_url(u)
        if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", h):
            ips.add(h)
        else:
            domains.add(h)

    iocs = []
    for u in urls:
        iocs.append({"type":"url","value":u,"source":"urlhaus","fetched_at":now})
    for d in sorted(domains):
        iocs.append({"type":"domain","value":d,"source":"urlhaus","fetched_at":now})
    for ip in sorted(ips):
        iocs.append({"type":"ip","value":ip,"source":"urlhaus","fetched_at":now})
    for h in sha256:
        iocs.append({"type":"sha256","value":h,"source":"malwarebazaar","fetched_at":now})

    # de-dupe
    seen=set()
    dedup=[]
    for x in iocs:
        k=(x["type"], x["value"])
        if k in seen: 
            continue
        seen.add(k)
        dedup.append(x)

    with open("ioc_library.csv","w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f, fieldnames=["type","value","source","fetched_at"])
        w.writeheader()
        w.writerows(dedup)

    with open("ioc_library.json","w",encoding="utf-8") as f:
        json.dump(dedup,f,indent=2)

    print(f"Wrote {len(dedup)} IOCs to ioc_library.csv and ioc_library.json")

if __name__ == "__main__":
    main()
