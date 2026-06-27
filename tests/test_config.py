# tests/test_config.py
import os
import pytest
from biorxiv_mcp import config


def test_server_constants():
    assert config.SERVER == "biorxiv"
    assert config.BUCKET == "biorxiv-src-monthly"
    assert config.API_HOST == "api.biorxiv.org"
    assert config.PUBLISHER == "bioRxiv"


def test_cache_path_uses_env(tmp_path, monkeypatch):
    monkeypatch.setenv("RXIV_CACHE_DIR", str(tmp_path))
    p = config.cache_path()
    assert p == tmp_path / "biorxiv.sqlite"


def test_scan_concurrency_default(monkeypatch):
    monkeypatch.delenv("RXIV_SCAN_CONCURRENCY", raising=False)
    assert config.SCAN_CONCURRENCY == 16


def test_s3_client_without_creds_raises(monkeypatch):
    for k in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_PROFILE"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setattr(config, "_creds_present", lambda: False)
    with pytest.raises(RuntimeError, match="AWS"):
        config.s3_client()
