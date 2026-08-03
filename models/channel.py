from dataclasses import dataclass


@dataclass(slots=True)
class Channel:
    uuid: str
    number: int
    name: str
    icon_public_url: str = ""

    event: str = ""
    event_id: int | None = None
    start: int | None = None
    stop: int | None = None
    progress: int = 0
    recording: bool = False

    @property
    def icon_url(self) -> str:
        url = self.icon_public_url.strip()

        if not url:
            return ""

        if url.startswith(("http://", "https://")):
            return url

        return f"/tvh-image/{url.lstrip('/')}"

    @property
    def stream_url(self) -> str:
        return f"/tvh-stream/{self.uuid}"
