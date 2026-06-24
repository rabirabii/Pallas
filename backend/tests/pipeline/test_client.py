import pytest
import requests

from pipeline.speedhome.client import (
    SpeedhomeAccessBlockedError,
    SpeedhomeClient,
    SpeedhomeClientConfig,
)


class FakeResponse:
    def __init__(self, status_code, text, url="https://speedhome.com/rent/mont-kiara"):
        self.status_code = status_code
        self.text = text
        self.url = url


def test_client_sets_user_agent():
    client = SpeedhomeClient(
        SpeedhomeClientConfig(user_agent="TestAgent/1.0")
    )

    assert client.session.headers["User-Agent"] == "TestAgent/1.0"


def test_fetch_html_returns_success(monkeypatch):
    client = SpeedhomeClient(
        SpeedhomeClientConfig(max_retries=1)
    )

    def fake_get(url, timeout):
        return FakeResponse(200, "<html>ok</html>", url=url)

    monkeypatch.setattr(client.session, "get", fake_get)

    result = client.fetch_html("https://speedhome.com/rent/mont-kiara")

    assert result.status_code == 200
    assert result.html == "<html>ok</html>"


def test_fetch_html_detects_cloudflare_challenge(monkeypatch):
    client = SpeedhomeClient(
        SpeedhomeClientConfig(max_retries=1)
    )

    def fake_get(url, timeout):
        return FakeResponse(
            403,
            "<html><title>Just a moment...</title>cloudflare</html>",
            url=url,
        )

    monkeypatch.setattr(client.session, "get", fake_get)

    with pytest.raises(SpeedhomeAccessBlockedError):
        client.fetch_html("https://speedhome.com/rent/mont-kiara")


def test_fetch_html_retries_429(monkeypatch):
    client = SpeedhomeClient(
        SpeedhomeClientConfig(max_retries=2)
    )
    calls = {"count": 0}

    def fake_get(url, timeout):
        calls["count"] += 1
        if calls["count"] == 1:
            return FakeResponse(429, "rate limited", url=url)
        return FakeResponse(200, "<html>ok</html>", url=url)

    monkeypatch.setattr(client.session, "get", fake_get)

    result = client.fetch_html("https://speedhome.com/rent/mont-kiara")

    assert result.status_code == 200
    assert calls["count"] == 2


def test_fetch_html_wraps_request_exception(monkeypatch):
    client = SpeedhomeClient(
        SpeedhomeClientConfig(max_retries=1)
    )

    def fake_get(url, timeout):
        raise requests.Timeout("too slow")

    monkeypatch.setattr(client.session, "get", fake_get)

    with pytest.raises(RuntimeError):
        client.fetch_html("https://speedhome.com/rent/mont-kiara")