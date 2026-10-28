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
        rejected.get_by_text('Subscription could not be completed. Please try again later.' if kind == 'torah' else 'Newsletter signup is not yet available. Your information has not been saved.').wait_for()
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
    # Public unsubscribe flow is exercised with mocked API only.
    unsub = browser.new_page()
    requests = []
    def mock_unsubscribe(route):
        requests.append((route.request.url, route.request.post_data_json))
        route.fulfill(status=200, content_type='application/json',
                      body='{"ok":true,"message":"If that address is subscribed, a confirmation link has been emailed."}')
    unsub.route('**/unsubscribe/request', mock_unsubscribe)
    unsub.goto((ROOT / 'unsubscribe.html').as_uri())
    unsub.locator('#email').fill('browser-test@example.invalid')
    unsub.locator('#send').click()
    unsub.get_by_text('If that address is subscribed, a confirmation link has been emailed.').wait_for()
    assert requests == [('https://cti-admin-api.bluetallitot.workers.dev/unsubscribe/request',
                         {'email': 'browser-test@example.invalid'})]
    assert unsub.locator('#send').is_enabled()
    print('PASS unsubscribe: request payload, status, button reset')
    unsub.close()

    confirmed_unsub = browser.new_page()
    confirm_calls = []
    def mock_unsub_confirm(route):
        confirm_calls.append(route.request.post_data_json)
        route.fulfill(status=200, content_type='application/json',
                      body='{"ok":true,"message":"You have been unsubscribed."}')
    confirmed_unsub.route('**/unsubscribe/confirm', mock_unsub_confirm)
    confirmed_unsub.goto((ROOT / 'unsubscribe.html').as_uri() + '?token=browser-test-token')
    assert confirmed_unsub.locator('#request').is_hidden()
    confirmed_unsub.locator('#finish').click()
    confirmed_unsub.get_by_text('You have been unsubscribed.').wait_for()
    assert confirm_calls == [{'token': 'browser-test-token'}]
    assert confirmed_unsub.locator('#confirm').is_hidden()
    print('PASS unsubscribe: confirmation payload and completion')
    confirmed_unsub.close()

    rejected_unsub = browser.new_page()
    def mock_unsub_error(route):
        route.fulfill(status=400, content_type='application/json',
                      body='{"error":"Invalid or expired confirmation link"}')
    rejected_unsub.route('**/unsubscribe/confirm', mock_unsub_error)
    rejected_unsub.goto((ROOT / 'unsubscribe.html').as_uri() + '?token=expired-browser-test')
    rejected_unsub.locator('#finish').click()
    rejected_unsub.get_by_text('Invalid or expired confirmation link').wait_for()
    assert rejected_unsub.locator('#finish').is_enabled()
    assert rejected_unsub.locator('#confirm').is_visible()
    print('PASS unsubscribe: invalid confirmation permits retry')
    rejected_unsub.close()
    browser.close()
