"""Translation-aware search check: KJV, NIV, Yoruba and an unsupported version."""
import asyncio, sys
from playwright.async_api import async_playwright

CASES = [("kjv", "mercy"), ("niv", "mercy"), ("yoruba", "ife"), ("darby", "mercy")]

async def search(page, term):
    await page.get_by_label("Search the Bible").click()
    await page.get_by_label("Search the Bible text or jump to a reference").fill(term)
    await page.wait_for_timeout(4500)
    text = await page.locator("div.max-h-\\[60vh\\]").inner_text()
    await page.keyboard.press("Escape")
    return text

async def main():
    failures = []
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        pg = await (await b.new_context(viewport={"width": 1280, "height": 1800})).new_page()
        await pg.goto("http://localhost:8080/genesis/1", wait_until="domcontentloaded")
        await pg.wait_for_timeout(2500)
        for tid, term in CASES:
            await pg.evaluate(
                "(id)=>{const k='bible-atlas:settings';const s=JSON.parse(localStorage.getItem(k)||'{}');"
                "s.translation=id;localStorage.setItem(k,JSON.stringify(s));}", tid)
            await pg.reload(wait_until="domcontentloaded")
            await pg.wait_for_timeout(2500)
            out = await search(pg, term)
            if tid == "darby":
                ok = "isn’t available" in out
            else:
                ok = ":" in out and "No verses found" not in out
            if tid == "kjv":
                ok = ok and not any(w in out for w in ("mercy26", "<S>"))
            print(("PASS " if ok else "FAIL ") + f"{tid} '{term}': " + out.replace("\n", " | ")[:140])
            if not ok:
                failures.append(tid)
        await b.close()
    sys.exit(1 if failures else 0)

asyncio.run(main())
