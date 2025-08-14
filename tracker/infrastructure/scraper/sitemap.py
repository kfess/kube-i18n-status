import xml.etree.ElementTree as ET
from urllib.parse import urljoin

import requests
from tracker.const import LANGUAGE_CODES
from tracker.infrastructure.log.logger import logger


class SitemapScraper:
    """A class to scrape URLs from the Kubernetes sitemap."""

    SITEMAP_NAMESPACE = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    REQUEST_TIMEOUT = 10

    def __init__(self) -> None:
        """Initialize the SitemapScraper."""
        self.base_url = "https://kubernetes.io"

    def get_urls(self) -> set[str]:
        """Get existing URLs from the sitemap.

        Return:
        ------
            A set of URLs found in the sitemap.

        """
        urls: set[str] = set()

        for lang in LANGUAGE_CODES:
            sitemap_url = urljoin(self.base_url, f"{lang}/sitemap.xml")
            try:
                response = requests.get(sitemap_url, timeout=10)
                response.raise_for_status()

                root = ET.fromstring(response.text)  # noqa: S314
                for url_elem in root.findall(f".//{self.SITEMAP_NAMESPACE}loc"):
                    urls.add(url_elem.text.strip())

            except requests.RequestException:
                logger.warning("Failed to fetch sitemap for language: %s", lang)
            except ET.ParseError:
                logger.warning("Failed to parse sitemap XML for language: %s", lang)
            except Exception:
                logger.exception(
                    "Unexpected error processing sitemap for language: %s", lang
                )

        return urls


if __name__ == "__main__":
    scraper = SitemapScraper()
    urls = scraper.get_urls()
    print(f"Found {len(urls)} URLs in the sitemap.")
