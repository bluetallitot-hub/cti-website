#!/usr/bin/env python3
"""Browser interaction tests with mocked Worker responses; no real subscribers or email."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for kind, filename in [('torah', 'subscribe-torah.html'), ('newsletter', 'subscribe-newsletter.html')]:
        page = browser.new_page()
        calls = []
        def intercept(route):
            calls.append((route.request.url, route.request.post_data_json))
            route.fulfill(status=200, content_type='application/json', body='{"ok":true}')
        page.route('**/subscriptions/*', intercept)
        page.goto((ROOT / filename).as_uri())
        page.locator('input[name="name"]').fill('CTI Browser Test')
        page.locator('input[name="email"]').fill('browser-test@example.invalid')
        page.locator('input[name="consent"]').check()
        page.locator('button[type="submit"]').click()
        page.get_by_text('Please check your email to confirm your subscription.').wait_for()
        assert calls == [('https://cti-admin-api.bluetallitot.workers.dev/subscriptions/request', {
            'kind': kind, 'name': 'CTI Browser Test', 'email': 'browser-test@example.invalid', 'consent': True,
        })], (kind, calls)
        assert page.locator('input[name="email"]').input_value() == ''
        print(f'PASS {kind}: form submission, payload, feedback, reset')
        page.close()
        confirm = browser.new_page()
        confirmed = []
        def intercept_confirmation(route):
            confirmed.append(route.request.post_data_json)
            route.fulfill(status=200, content_type='application/json', body='{"ok":true}')
        confirm.route('**/subscriptions/*', intercept_confirmation)
        confirm.goto((ROOT / filename).as_uri() + '?confirm=browser-test-token')
        confirm.get_by_text('Your subscription is confirmed.').wait_for()
        assert confirmed == [{'token': 'browser-test-token'}]
        assert confirm.locator('#subscribe-form').is_visible()
        assert not confirm.locator('input[name="email"]').is_visible()
        assert not confirm.locator('button[type="submit"]').is_visible()
        print(f'PASS {kind}: confirmation token, feedback, hidden form')
        confirm.close()
        # Negative path: Worker rejects a request; do not clear the form.
        rejected = browser.new_page()
        def reject_request(route):
            route.fulfill(status=503, content_type='application/json', body='{"error":"Service temporarily unavailable"}')
        rejected.route('**/subscriptions/*', reject_request)
        rejected.goto((ROOT / filename).as_uri())
        rejected.locator('input[name="name"]').fill('CTI Browser Test')
        rejected.locator('input[name="email"]').fill('browser-test@example.invalid')
        rejected.locator('input[name="consent"]').check()
        rejected.locator('button[type="submit"]').click()
        rejected.get_by_text('Service temporarily unavailable').wait_for()
        assert rejected.locator('input[name="email"]').input_value() == 'browser-test@example.invalid'
        assert rejected.locator('button[type="submit"]').is_enabled()
        print(f'PASS {kind}: API rejection preserves form and permits retry')
        rejected.close()
        expired = browser.new_page()
        def expire_confirmation(route):
            route.fulfill(status=410, content_type='application/json', body='{"error":"Confirmation link expired or already used"}')
        expired.route('**/subscriptions/*', expire_confirmation)
        expired.goto((ROOT / filename).as_uri() + '?confirm=expired-browser-test-token')
        expired.get_by_text('Confirmation link expired or already used').wait_for()
        print(f'PASS {kind}: expired confirmation displays error')
        expired.close()
    browser.close()
