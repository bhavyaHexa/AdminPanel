from playwright.sync_api import sync_playwright


def open_browser():
    playwright = sync_playwright().start()

    browser = playwright.chromium.launch(
        headless=False
    )

    page = browser.new_page()

    page.goto("http://localhost:5174/")

    page.wait_for_load_state("networkidle")

    return playwright, browser, page