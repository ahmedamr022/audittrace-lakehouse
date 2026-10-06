"""
FinFlow Lakehouse – Structured JSON Logging Configuration
Provides a consistent, production-grade logging setup across all modules.
"""

import logging
import logging.config
import json
import sys
from datetime import datetime, timezone
from typing import Any


class _JSONFormatter(logging.Formatter):
    """Emit log records as single-line JSON objects for log aggregators (e.g. Datadog, CloudWatch)."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Attach exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Attach any extra fields passed via `extra=` kwarg
        for key, value in record.__dict__.items():
            if key not in {
                "name", "msg", "args", "levelname", "levelno", "pathname",
                "filename", "module", "exc_info", "exc_text", "stack_info",
                "lineno", "funcName", "created", "msecs", "relativeCreated",
                "thread", "threadName", "processName", "process", "message",
                "taskName",
            } and not key.startswith("_"):
                log_entry[key] = value

        return json.dumps(log_entry, default=str)


class _TextFormatter(logging.Formatter):
    """Human-readable log format for local development."""

    FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

    def __init__(self) -> None:
        super().__init__(fmt=self.FORMAT, datefmt=self.DATE_FORMAT)


def configure_logging(level: str = "INFO", fmt: str = "json") -> None:
    """
    Configure the root logger.

    Args:
        level: Log level string – DEBUG, INFO, WARNING, ERROR, CRITICAL.
        fmt:   'json' for structured output, 'text' for human-readable.
    """
    formatter: logging.Formatter = (
        _JSONFormatter() if fmt.lower() == "json" else _TextFormatter()
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Avoid adding duplicate handlers on re-import
    if root_logger.handlers:
        root_logger.handlers.clear()

    root_logger.addHandler(handler)

    # Quiet down noisy third-party loggers
    for noisy in ("kafka", "urllib3", "botocore", "boto3", "s3transfer"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger. Call configure_logging() once at app entry point."""
    return logging.getLogger(name)
