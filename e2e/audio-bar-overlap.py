"""E2E: the last verse and the attribution line must never sit behind the
fixed audio bar on narrow (phone) viewports.

Run with: bun run test:e2e   (or: python3 e2e/audio-bar-overlap.py)
"""

import asyncio
import os
import sys

from playwright.async_api import async_playwright

BASE = os.environ.get("E2E_BASE_URL", "http://localhost:8080")
VIEWPORTS = [
    {"width": 320, "height": 640},  # smallest supported phone
    {"width": 390, "height": 844},  # iPhone 14
]
ROUTES = ["/john/1", "/genesis/1"]


async def check(page, route, viewport):
    await page.goto(f"{BASE}{route}", wait_until="domcontentloaded")
    await page.wait_for_selector("article", state="attached", timeout=30000)
    await page.wait_for_timeout(4000)  # let scripture + audio bar settle
    later = page.get_by_role("button", name="Maybe later")
    if await later.count() > 0:
        await later.first.click()
        await page.wait_for_timeout(300)

    bar = page.locator(
        'div.fixed.bottom-0:has(button[aria-label="Play chapter audio"]),'
        ' div.fixed.bottom-0:has(button[aria-label="Pause chapter audio"])'
    ).first
    if await bar.count() == 0:
        return [f"{route} @{viewport['width']}: audio bar not rendered"]

    bar_box = await bar.bounding_box()
    problems = []

    # Scroll to the very bottom of the page — worst case for occlusion.
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(500)

    targets = {
        "last verse": page.locator("article p, article span").last,
        "attribution": page.locator("article p").last,
    }
    for name, loc in targets.items():
        if await loc.count() == 0:
            continue
        box = await loc.bounding_box()
        if not box:
            continue
        if box["y"] + box["height"] > bar_box["y"] + 1:
            problems.append(
                f"{route} @{viewport['width']}px: {name} bottom "
                f"{box['y'] + box['height']:.0f} overlaps audio bar top {bar_box['y']:.0f}"
            )

    # The compact bar must stay a single row on phones.
    if bar_box["height"] > 96:
        problems.append(
            f"{route} @{viewport['width']}px: audio bar is {bar_box['height']:.0f}px tall (expected <= 96)"
        )
    return problems


async def main():
    failures = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for viewport in VIEWPORTS:
            context = await browser.new_context(viewport=viewport)
            page = await context.new_page()
            for route in ROUTES:
                failures += await check(page, route, viewport)
            await context.close()
        await browser.close()

    if failures:
        print("FAIL")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("PASS: end-of-chapter content clears the audio bar on narrow viewports")


asyncio.run(main())
