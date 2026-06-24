from pipeline.speedhome.robots import check_robots_allowed, robots_url_for


def test_robots_url_for_speedhome_target():
    assert (
        robots_url_for("https://speedhome.com/rent/mont-kiara")
        == "https://speedhome.com/robots.txt"
    )


def test_check_robots_allowed_uses_robotparser(monkeypatch):
    robots_text = """
User-agent: *
Allow: /
Disallow: /dashboard/
"""

    def fake_fetch_robots_txt(robots_url, user_agent, timeout_seconds):
        return robots_text

    monkeypatch.setattr(
        "pipeline.speedhome.robots.fetch_robots_txt",
        fake_fetch_robots_txt,
    )

    allowed = check_robots_allowed(
        target_url="https://speedhome.com/rent/mont-kiara",
        user_agent="PropertyPriceIntelligenceAssessment/1.0",
    )

    disallowed = check_robots_allowed(
        target_url="https://speedhome.com/dashboard/example",
        user_agent="PropertyPriceIntelligenceAssessment/1.0",
    )

    assert allowed.allowed is True
    assert disallowed.allowed is False