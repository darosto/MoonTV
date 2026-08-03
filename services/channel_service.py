from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from models.channel import Channel


class MockChannelService:
    """
    Lädt Sender und EPG-Einträge aus den vorhandenen TVHeadend-Mockdateien.

    Da die EPG-Datei historische Zeitstempel enthält, wird automatisch ein
    Referenzzeitpunkt gesucht, an dem möglichst viele Sender gleichzeitig
    ein laufendes Programm besitzen.
    """

    def __init__(
        self,
        channels_file: str | Path = "data/channels.json",
        epg_file: str | Path = "data/epg.json",
        image_base_url: str = "",
    ) -> None:
        self.channels_file = Path(channels_file)
        self.epg_file = Path(epg_file)
        self.image_base_url = image_base_url.rstrip("/")

        self._channels_data: list[dict[str, Any]] | None = None
        self._epg_data: list[dict[str, Any]] | None = None
        self._reference_time: int | None = None

    def get_channels(self) -> list[Channel]:
        channel_entries = self._load_channels()
        epg_entries = self._load_epg()

        numbered_channels = [
            entry
            for entry in channel_entries
            if entry.get("enabled", True)
            and self._to_int(entry.get("number")) > 0
        ]

        numbered_channels.sort(
            key=lambda entry: self._to_int(entry.get("number"))
        )

        channel_uuids = {
            str(entry.get("uuid", ""))
            for entry in numbered_channels
        }

        relevant_events = [
            event
            for event in epg_entries
            if str(event.get("channelUuid", "")) in channel_uuids
        ]

        reference_time = self._get_reference_time(relevant_events)
        current_events = self._index_current_events(
            relevant_events,
            reference_time,
        )

        channels: list[Channel] = []

        for entry in numbered_channels:
            uuid = str(entry.get("uuid", ""))
            event = current_events.get(uuid)

            start = self._optional_int(event.get("start")) if event else None
            stop = self._optional_int(event.get("stop")) if event else None

            channels.append(
                Channel(
                    uuid=uuid,
                    number=self._to_int(entry.get("number")),
                    name=str(entry.get("name", "Unbekannter Sender")),
                    icon=self._build_icon_url(
                        str(entry.get("icon_public_url", ""))
                    ),
                    event=str(event.get("title", "")) if event else "",
                    event_id=(
                        self._optional_int(event.get("eventId"))
                        if event
                        else None
                    ),
                    start=start,
                    stop=stop,
                    progress=self._calculate_progress(
                        start=start,
                        stop=stop,
                        now=reference_time,
                    ),
                    recording=False,
                )
            )

        return channels

    def get_reference_time(self) -> int:
        """
        Gibt den verwendeten simulierten EPG-Zeitpunkt zurück.
        """

        if self._reference_time is None:
            self.get_channels()

        return self._reference_time or int(time.time())

    def _load_channels(self) -> list[dict[str, Any]]:
        if self._channels_data is not None:
            return self._channels_data

        data = self._read_json(self.channels_file)

        try:
            entries = data["result"]["entries"]
        except (KeyError, TypeError) as error:
            raise ValueError(
                f"Ungültige Senderdatei: {self.channels_file}"
            ) from error

        if not isinstance(entries, list):
            raise ValueError(
                f"'result.entries' ist keine Liste: {self.channels_file}"
            )

        self._channels_data = entries
        return entries

    def _load_epg(self) -> list[dict[str, Any]]:
        if self._epg_data is not None:
            return self._epg_data

        data = self._read_json(self.epg_file)
        entries = data.get("entries")

        if not isinstance(entries, list):
            raise ValueError(
                f"'entries' ist keine Liste: {self.epg_file}"
            )

        self._epg_data = entries
        return entries

    @staticmethod
    def _read_json(path: Path) -> dict[str, Any]:
        if not path.exists():
            raise FileNotFoundError(
                f"JSON-Datei wurde nicht gefunden: {path.resolve()}"
            )

        try:
            with path.open("r", encoding="utf-8") as file:
                data = json.load(file)
        except json.JSONDecodeError as error:
            raise ValueError(
                f"Ungültiges JSON in {path.resolve()}: {error}"
            ) from error

        if not isinstance(data, dict):
            raise ValueError(
                f"Die oberste JSON-Struktur muss ein Objekt sein: {path}"
            )

        return data

    def _get_reference_time(
        self,
        events: list[dict[str, Any]],
    ) -> int:
        if self._reference_time is not None:
            return self._reference_time

        now = int(time.time())

        if any(
            self._event_is_active(event, now)
            for event in events
        ):
            self._reference_time = now
            return now

        self._reference_time = self._find_best_mock_time(events)
        return self._reference_time

    def _find_best_mock_time(
        self,
        events: list[dict[str, Any]],
    ) -> int:
        """
        Sucht den Zeitpunkt, an dem die meisten verschiedenen Sender
        gleichzeitig einen aktiven EPG-Eintrag besitzen.
        """

        valid_events = [
            event
            for event in events
            if self._optional_int(event.get("start")) is not None
            and self._optional_int(event.get("stop")) is not None
        ]

        if not valid_events:
            return int(time.time())

        candidate_times = sorted(
            {
                self._to_int(event.get("start"))
                for event in valid_events
            }
        )

        best_time = candidate_times[0]
        best_channel_count = -1

        for candidate in candidate_times:
            active_channels = {
                str(event.get("channelUuid", ""))
                for event in valid_events
                if self._event_is_active(event, candidate)
            }

            if len(active_channels) > best_channel_count:
                best_channel_count = len(active_channels)
                best_time = candidate

        return best_time

    def _index_current_events(
        self,
        events: list[dict[str, Any]],
        reference_time: int,
    ) -> dict[str, dict[str, Any]]:
        current_events: dict[str, dict[str, Any]] = {}

        for event in events:
            if not self._event_is_active(event, reference_time):
                continue

            channel_uuid = str(event.get("channelUuid", ""))

            if not channel_uuid:
                continue

            existing = current_events.get(channel_uuid)

            if existing is None:
                current_events[channel_uuid] = event
                continue

            existing_start = self._to_int(existing.get("start"))
            new_start = self._to_int(event.get("start"))

            if new_start > existing_start:
                current_events[channel_uuid] = event

        return current_events

    @staticmethod
    def _event_is_active(
        event: dict[str, Any],
        timestamp: int,
    ) -> bool:
        start = MockChannelService._optional_int(event.get("start"))
        stop = MockChannelService._optional_int(event.get("stop"))

        if start is None or stop is None:
            return False

        return start <= timestamp < stop

    @staticmethod
    def _calculate_progress(
        start: int | None,
        stop: int | None,
        now: int,
    ) -> int:
        if start is None or stop is None or stop <= start:
            return 0

        progress = ((now - start) / (stop - start)) * 100

        return max(0, min(100, round(progress)))

    def _build_icon_url(self, icon_path: str) -> str:
        icon_path = icon_path.strip().lstrip("/")

        if not icon_path:
            return ""

        if icon_path.startswith(("http://", "https://")):
            return icon_path

        if not self.image_base_url:
            return ""

        return f"{self.image_base_url}/{icon_path}"

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
