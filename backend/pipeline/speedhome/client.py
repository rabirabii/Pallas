from __future__ import annotations

import logging
import random
import time
from dataclasses import dataclass

import requests
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from pipeline.speedhome.robots import RobotsCheckResult, assert_robots_allowed

LOGGER = logging.getLogger(__name__)


class SpeedhomeRequestError(RuntimeError):
    pass


class SpeedhomeAccessBlockedError(SpeedhomeRequestError):
    pass


@dataclass(frozen=True)
class SpeedhomeClientConfig:
    user_agent: str = "PropertyPriceIntelligenceAssessment/1.0"
    request_delay_seconds: float = 1.5
    request_timeout_seconds: float = 30
    max_retries: int = 3


@dataclass(frozen=True)
class FetchResult:
    url: str
    status_code: int
    html: str
    elapsed_seconds: float


def _is_retryable_exception(exc: BaseException) -> bool:
    if isinstance(exc, SpeedhomeAccessBlockedError):
        return False

    if isinstance(exc, SpeedhomeRequestError):
        return True

    return isinstance(exc, requests.RequestException)


def _looks_like_cloudflare_challenge(html: str) -> bool:
    lowered = html.lower()
    return "just a moment" in lowered and "cloudflare" in lowered


class SpeedhomeClient:
    def __init__(self, config: SpeedhomeClientConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": config.user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
        )

    def validate_robots(self, target_url: str) -> RobotsCheckResult:
        return assert_robots_allowed(
            target_url=target_url,
            user_agent=self.config.user_agent,
            timeout_seconds=self.config.request_timeout_seconds,
        )

    def polite_delay(self) -> None:
        base_delay = self.config.request_delay_seconds
        jitter = random.uniform(base_delay * -0.3, base_delay * 0.3)
        delay = max(0, base_delay + jitter)

        LOGGER.debug("Sleeping %.2fs before next request", delay)
        time.sleep(delay)

    def fetch_html(self, url: str) -> FetchResult:
        retrying_fetch = retry(
            retry=retry_if_exception(_is_retryable_exception),
            wait=wait_exponential(multiplier=1, min=1, max=20),
            stop=stop_after_attempt(self.config.max_retries),
            before_sleep=before_sleep_log(LOGGER, logging.WARNING),
            reraise=True,
        )(self._fetch_html_once)

        return retrying_fetch(url)

    def _fetch_html_once(self, url: str) -> FetchResult:
        LOGGER.info("Fetching %s", url)
        started = time.monotonic()

        try:
            response = self.session.get(
                url,
                timeout=self.config.request_timeout_seconds,
            )
        except requests.RequestException as exc:
            raise SpeedhomeRequestError(f"Request failed for {url}: {exc}") from exc

        elapsed = time.monotonic() - started
        html = response.text or ""

        if response.status_code == 403 and _looks_like_cloudflare_challenge(html):
            raise SpeedhomeAccessBlockedError(
                "SPEEDHOME returned a Cloudflare challenge page. "
                "The scraper will not bypass challenges or access controls."
            )

        if response.status_code == 429 or response.status_code >= 500:
            raise SpeedhomeRequestError(
                f"Retryable HTTP {response.status_code} while fetching {url}"
            )

        if response.status_code >= 400:
            raise SpeedhomeRequestError(
                f"Non-retryable HTTP {response.status_code} while fetching {url}"
            )

        return FetchResult(
            url=response.url,
            status_code=response.status_code,
            html=html,
            elapsed_seconds=elapsed,
        )