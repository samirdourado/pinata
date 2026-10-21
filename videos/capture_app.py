"""Capture the Pinata app screens used by generate_demo_videos.py.

Start the app first (for example `npm run build && npm run start` in pinata_front),
then run:

    python videos/capture_app.py --url http://localhost:3000

The script uses a fresh browser profile, so every account it creates lives only in
that temporary localStorage. Wallet connection and SOL amounts are simulated by the app.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parent
RENDERED = ROOT / "rendered"
VIEWPORT = {"width": 1440, "height": 810}
SCALE = 1920 / 1440

CREATOR = {
    "displayName": "Maria Silva",
    "username": "mariasilva",
    "email": "maria@pinata.demo",
    "bio": "Solana builder sharing notes on SocialFi and creator economies.",
    "password": "pinata123",
}
COMMENTER = {
    "displayName": "Lucas Rocha",
    "username": "lucasrocha",
    "email": "lucas@pinata.demo",
    "bio": "",
    "password": "pinata456",
}
CREATOR_POST = (
    "Shipping Pinata on Solana: every comment carries a tiny fee, creators get paid, "
    "and the community fills a Piñata that pops back to the people who showed up. "
    "What would you build on top of it?"
)
COMMENT = (
    "Love this model. Paying a small fee to comment made me write something useful "
    "instead of a quick emoji. Count me in for the next Piñata!"
)


def shot(page: Page, name: str, scroll_y: int = 0) -> None:
    page.evaluate("y => window.scrollTo(0, y)", scroll_y)
    page.wait_for_timeout(450)
    page.screenshot(path=str(RENDERED / name))
    print(f"captured {name}")


def fill_registration(page: Page, account: dict[str, str]) -> None:
    page.fill("#displayName", account["displayName"])
    page.fill("#username", account["username"])
    page.fill("#email", account["email"])
    if account["bio"]:
        page.fill("#bio", account["bio"])
    page.fill("#password", account["password"])
    page.fill("#confirmPassword", account["password"])


def sign_out(page: Page, base: str) -> None:
    page.get_by_role("button", name="Sign out").click()
    page.wait_for_url(f"{base}/login")


def capture(base: str, channel: str) -> None:
    RENDERED.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel=channel)
        context = browser.new_context(viewport=VIEWPORT, device_scale_factor=SCALE, color_scheme="light")
        page = context.new_page()

        page.goto(f"{base}/")
        page.wait_for_load_state("networkidle")
        shot(page, "guest-home.png")

        page.goto(f"{base}/register")
        page.wait_for_selector("#displayName")
        shot(page, "register.png")
        fill_registration(page, CREATOR)
        shot(page, "register-filled.png")
        page.get_by_role("button", name="Create account").click()
        page.wait_for_url(f"{base}/")
        page.wait_for_load_state("networkidle")
        shot(page, "home.png")

        page.get_by_role("button", name="Connect Wallet").click()
        page.wait_for_timeout(300)
        shot(page, "wallet.png")

        page.goto(f"{base}/profile/{CREATOR['username']}")
        page.wait_for_load_state("networkidle")
        shot(page, "creator-empty.png")

        page.goto(f"{base}/trending")
        page.wait_for_load_state("networkidle")
        shot(page, "trending.png")

        page.get_by_role("button", name="Open post by").first.click()
        page.wait_for_timeout(500)
        shot(page, "post-detail.png")

        # The creator publishes a post through the app's own store, the same call the UI uses.
        page.goto(f"{base}/profile/{CREATOR['username']}")
        page.wait_for_load_state("networkidle")
        _publish_post(page, CREATOR_POST)
        page.reload()
        page.wait_for_load_state("networkidle")
        shot(page, "creator-post.png")

        sign_out(page, base)
        shot(page, "login.png")

        page.goto(f"{base}/register")
        page.wait_for_selector("#displayName")
        fill_registration(page, COMMENTER)
        page.get_by_role("button", name="Create account").click()
        page.wait_for_url(f"{base}/")

        page.goto(f"{base}/profile/{CREATOR['username']}")
        page.wait_for_load_state("networkidle")
        page.get_by_role("button", name="Open post by").first.click()
        page.wait_for_timeout(500)
        dialog = page.get_by_role("dialog")
        dialog.get_by_label("New comment").first.fill(COMMENT)
        amount = dialog.get_by_label("Comment value in SOL")
        amount.fill("1.5")
        page.wait_for_timeout(300)
        shot(page, "composer.png")
        dialog.get_by_role("button", name=re.compile(r"^Comment")).click()
        page.wait_for_timeout(600)
        shot(page, "comment-posted.png")
        page.keyboard.press("Escape")

        page.goto(f"{base}/dashboard")
        page.wait_for_load_state("networkidle")
        shot(page, "dashboard-commenter.png")
        sign_out(page, base)

        page.fill("#identifier", CREATOR["email"])
        page.fill("#password", CREATOR["password"])
        shot(page, "login-filled.png")
        page.get_by_role("button", name="Sign in").click()
        page.wait_for_url(f"{base}/dashboard")
        page.wait_for_load_state("networkidle")
        shot(page, "dashboard.png")
        page.get_by_role("button", name="Burst Piñata").click()
        page.wait_for_timeout(500)
        shot(page, "dashboard-burst.png")

        page.goto(f"{base}/profile/{CREATOR['username']}")
        page.wait_for_load_state("networkidle")
        shot(page, "creator.png")

        context.close()
        browser.close()


def _publish_post(page: Page, content: str) -> None:
    page.get_by_placeholder("Share something with the community...").fill(content)
    shot(page, "creator-compose.png")
    page.get_by_role("button", name="Publish").click()
    page.wait_for_timeout(400)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://localhost:3000")
    parser.add_argument("--channel", default="msedge", help="Installed Chromium browser: msedge or chrome")
    args = parser.parse_args()
    capture(args.url.rstrip("/"), args.channel)


if __name__ == "__main__":
    main()
