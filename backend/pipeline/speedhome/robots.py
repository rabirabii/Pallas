from __future__ import annotations

import logging
from dataclasses import dataclass
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import requests

from pipeline.utils import SPEEDHOME_BASE_URL

LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class RobotsCheckResult:
    robots_url: str
    target_url: str
    user_agent: str
    allowed: bool
    reason: str


class RobotsTxtError(RuntimeError):
    pass


def robots_url_for(target_url: str) -> str:
    parsed = urlparse(target_url)
    if not parsed.scheme or not parsed.netloc:
        return f"{SPEEDHOME_BASE_URL}/robots.txt"

    return f"{parsed.scheme}://{parsed.netloc}/robots.txt"


def fetch_robots_txt(robots_url: str, user_agent: str, timeout_seconds: float) -> str:
    response = requests.get(
        robots_url,
        headers={"User-Agent": user_agent},
        timeout=timeout_seconds,
    )
    response.raise_for_status()
    return response.text

def _path_allowed_by_longest_rule(robots_text: str, target_url: str, user_agent: str) -> bool | None:
    target_path = urlparse(target_url).path or "/"
    requested_agent = user_agent.lower()

    groups: list[tuple[list[str], list[tuple[str, str]]]] = []
    current_agents: list[str] = []
    current_rules: list[tuple[str, str]] = []

    for raw_line in robots_text.splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line or ":" not in line:
            continue

        key, value = line.split(":", 1)
        key = key.strip().lower()
        value = value.strip()

        if key == "user-agent":
            if current_agents or current_rules:
                groups.append((current_agents, current_rules))
            current_agents = [value.lower()]
            current_rules = []
        elif key in {"allow", "disallow"} and current_agents:
            current_rules.append((key, value))

    if current_agents or current_rules:
        groups.append((current_agents, current_rules))

    matching_rules: list[tuple[str, str]] = []

    for agents, rules in groups:
        if requested_agent in agents or "*" in agents:
            matching_rules.extend(rules)

    matched: list[tuple[int, str, str]] = []
    for directive, path in matching_rules:
        if path == "":
            continue
        if target_path.startswith(path):
            matched.append((len(path), directive, path))

    if not matched:
        return None

    matched.sort(key=lambda item: item[0], reverse=True)
    longest_length = matched[0][0]
    longest_matches = [item for item in matched if item[0] == longest_length]

    if any(directive == "allow" for _, directive, _ in longest_matches):
        return True

    return False

def check_robots_allowed(
    target_url: str,
    user_agent: str,
    timeout_seconds: float = 30,
) -> RobotsCheckResult:
    robots_url = robots_url_for(target_url)

    try:
        robots_text = fetch_robots_txt(
            robots_url=robots_url,
            user_agent=user_agent,
            timeout_seconds=timeout_seconds,
        )
    except requests.RequestException as exc:
        raise RobotsTxtError(f"Unable to fetch robots.txt from {robots_url}: {exc}") from exc

    parser = RobotFileParser()
    parser.set_url(robots_url)
    parser.parse(robots_text.splitlines())

    strict_allowed = _path_allowed_by_longest_rule(
    robots_text=robots_text,
    target_url=target_url,
    user_agent=user_agent,
)

    if strict_allowed is None:
      allowed = parser.can_fetch(user_agent, target_url)
    else:
      allowed = strict_allowed

    reason = (
        f"robots.txt allows {target_url} for {user_agent}"
        if allowed
        else f"robots.txt disallows {target_url} for {user_agent}"
    )

    LOGGER.info(reason)

    return RobotsCheckResult(
        robots_url=robots_url,
        target_url=target_url,
        user_agent=user_agent,
        allowed=allowed,
        reason=reason,
    )


def assert_robots_allowed(
    target_url: str,
    user_agent: str,
    timeout_seconds: float = 30,
) -> RobotsCheckResult:
    result = check_robots_allowed(
        target_url=target_url,
        user_agent=user_agent,
        timeout_seconds=timeout_seconds,
    )

    if not result.allowed:
        raise RobotsTxtError(result.reason)

    return result