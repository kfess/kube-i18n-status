from datetime import datetime


def convert_keys_to_camel_case(obj: object) -> object:
    """Recursively convert all dictionary keys from snake_case to camelCase.

    Args:
    ----
        obj (Any): Object to convert (dict, list, or primitive).

    Returns:
    -------
        Any: Object with camelCase keys.

    """

    def _snake_to_camel(key: str) -> str:
        """Convert a single snake_case key to camelCase."""
        return "".join(
            word.capitalize() if i > 0 else word
            for i, word in enumerate(key.split("_"))
        )

    if isinstance(obj, dict):
        return {
            _snake_to_camel(key): convert_keys_to_camel_case(value)
            for key, value in obj.items()
        }
    elif isinstance(obj, list):
        return [convert_keys_to_camel_case(item) for item in obj]
    else:
        return obj


def serialize_datetime(obj: object) -> str:
    """JSON serializer for datetime objects.

    Args:
    ----
        obj (Any): The object to serialize.

    Returns:
    -------
        str: ISO format string if obj is a datetime, otherwise raises TypeError.

    """
    if isinstance(obj, datetime):
        return obj.isoformat()

    msg = f"Object of type {type(obj)} is not JSON serializable"
    raise TypeError(msg)
