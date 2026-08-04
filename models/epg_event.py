from dataclasses import asdict, dataclass


@dataclass(slots=True)
class EPGEvent:
    event_id: int
    channel_uuid: str
    title: str
    subtitle: str
    description: str
    start: int
    stop: int
    recording: bool = False

    def to_dict(self) -> dict:
        return asdict(self)