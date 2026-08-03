from __future__ import annotations

import os
import time
from typing import Any

import httpx
from dotenv import load_dotenv

from models.channel import Channel


load_dotenv()


class TVHeadendChannelService:
    def __init__(self) -> None:
        self.base_url = os.environ["TVH_URL"].rstrip("/")
        self.username = os.environ["TVH_USERNAME"]
        self.password = os.environ["TVH_PASSWORD"]

        self.timeout = httpx.Timeout(10.0)
        self._cache: list[Channel] = []
        self._cache_timestamp = 0.0
        self._cache_ttl = 20.0

    async def get_channels(self) -> list[Channel]:
        if (
            self._cache
            and time.monotonic() - self._cache_timestamp < self._cache_ttl
        ):
            return self._cache

        async with httpx.AsyncClient(
            base_url=self.base_url,
            auth=(self.username, self.password),
            timeout=self.timeout,
        ) as client:
            channel_response = await client.get(
                "/api/channel/grid",
                params={
                    "start": 0,
                    "limit": 10000,
                    "sort": "number",
                    "dir": "ASC",
                },
            )
            self._raise_for_status(channel_response)

            epg_response = await client.get(
                "/api/epg/events/grid",
                params={
                    "mode": "now",
                    "limit": 10000,
                },
            )
            self._raise_for_status(epg_response)

        channel_entries = channel_response.json().get("entries", [])
        epg_entries = epg_response.json().get("entries", [])

        epg_by_uuid = {
            str(event.get("channelUuid", "")): event
            for event in epg_entries
            if event.get("channelUuid")
        }

        now = int(time.time())
        channels: list[Channel] = []

        for entry in channel_entries:
            number = self._to_int(entry.get("number"))

            if not entry.get("enabled", True) or number <= 0:
                continue

            uuid = str(entry.get("uuid", ""))
            event = epg_by_uuid.get(uuid)

            start = self._optional_int(event.get("start")) if event else None
            stop = self._optional_int(event.get("stop")) if event else None

            channels.append(
                Channel(
                uuid=uuid,
                number=number,
                name=str(entry.get("name", "Unbekannter Sender")),
                icon_public_url=str(
                    entry.get("icon_public_url", "")
                ),
                event=str(event.get("title", "")) if event else "",
                event_id=(
                    self._optional_int(event.get("eventId"))
                    if event
                    else None
                ),
                start=start,
                stop=stop,
                progress=self._calculate_progress(start, stop, now),
                recording=bool(event and event.get("dvrState")),
            )
        )

        channels.sort(key=lambda channel: channel.number)

        self._cache = channels
        self._cache_timestamp = time.monotonic()

        return channels

    def _build_icon_url(self, icon_path: str) -> str:
        icon_path = icon_path.strip().lstrip("/")

        if not icon_path:
            return ""

        # Das Bild wird über MoonTV geproxyt, damit keine Zugangsdaten
        # im Browser landen.
        return f"/tvh-image/{icon_path}"

    @staticmethod
    def _calculate_progress(
        start: int | None,
        stop: int | None,
        now: int,
    ) -> int:
        if start is None or stop is None or stop <= start:
            return 0

        value = ((now - start) / (stop - start)) * 100
        return max(0, min(100, round(value)))

    @staticmethod
    def _to_int(value: Any, default: int = 0) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _optional_int(value: Any) -> int | None:
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _raise_for_status(response: httpx.Response) -> None:
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as error:
            status = response.status_code

            if status == 401:
                message = "TVHeadend-Zugangsdaten sind ungültig."
            elif status == 403:
                message = (
                    "Der TVHeadend-Benutzer besitzt nicht die nötigen "
                    "Web-Interface-/Streaming-Rechte."
                )
            else:
                message = (
                    f"TVHeadend antwortete mit HTTP {status} "
                    f"für {response.request.url.path}."
                )

            raise RuntimeError(message) from error
