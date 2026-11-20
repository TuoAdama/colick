#!/usr/bin/env python3
"""Check the public preprod HTTP contract against a review or deployed instance."""

import argparse
import subprocess
from collections import defaultdict


HOST = "preprod.coliclic.com"
CSP_REPORT_ONLY = "content-security-policy-report-only"


def require(condition, message):
    if not condition:
        raise SystemExit(message)


def request(url, options, extra=()):
    command = ["curl", "--silent", "--show-error", "--max-time", "20",
               "--dump-header", "-", "--output", "/dev/null"]
    for mapping in options.connect_to:
        command.extend(["--connect-to", mapping])
    if options.insecure:
        command.append("--insecure")
    response = subprocess.check_output([*command, *extra, url], text=True)
    status_line, *fields = response.strip().split("\n\n")[-1].splitlines()
    headers = defaultdict(list)
    for field in fields:
        name, value = field.split(":", 1)
        headers[name.lower()].append(value.strip())
    return int(status_line.split()[1]), headers


def check_https(path, content_type, status_expected, options, *, html=False, extra=()):
    status, headers = request(f"https://{HOST}{path}", options, extra)
    require(status == status_expected, f"{path}: expected {status_expected}, received {status}")
    require(headers["strict-transport-security"] == ["max-age=86400"],
            f"{path}: unexpected HSTS {headers['strict-transport-security']}")
    require("content-security-policy" not in headers, f"{path}: found an enforcing CSP")
    require(any(value.startswith(content_type) for value in headers["content-type"]),
            f"{path}: expected content type {content_type}")
    if html:
        policies = headers[CSP_REPORT_ONLY]
        require(len(policies) == 1 and policies[0], f"{path}: expected one report-only CSP")
    else:
        require(CSP_REPORT_ONLY not in headers, f"{path}: report-only CSP outside SSR HTML")
    print(f"OK HTTPS {path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--connect-to", action="append", default=[], help="curl mapping for a local Traefik")
    parser.add_argument("--insecure", action="store_true", help="accept the local Traefik's self-signed certificate")
    parser.add_argument("--other-host", help="check an unrelated hostname on the same test Traefik")
    options = parser.parse_args()

    path = "/search?mode=all&probe=a%2Bb&probe=2"
    status, headers = request(f"http://{HOST}{path}", options)
    require(status in (301, 308) and headers["location"] == [f"https://{HOST}{path}"],
            f"Unexpected redirect: {status} {headers['location']}")
    require("strict-transport-security" not in headers, "HSTS returned over plain HTTP")
    print(f"OK HTTP {path} → HTTPS ({status})")

    if options.other_host:
        status, headers = request(f"http://{options.other_host}{path}", options)
        require(status == 404 and "location" not in headers,
                f"Unrelated test host routed unexpectedly: {status} {headers['location']}")
        print(f"OK HTTP {options.other_host} (404)")

    for page in ("/", "/login", "/search?mode=all"):
        check_https(page, "text/html", 200, options, html=True)
    check_https("/api/trips/catalog", "application/json", 200, options)
    check_https("/health", "text/plain", 200, options)
    for video in ("parcours-voyageur-v1", "parcours-expediteur-v1"):
        check_https(f"/videos/{video}.mp4", "video/mp4", 206, options, extra=("--range", "0-4095"))


if __name__ == "__main__":
    main()
