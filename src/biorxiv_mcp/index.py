import re

# DOI suffix looks like 2023.09.01.555889 inside reference=".../<suffix>.atom"
_DOI_RE = re.compile(rb'reference="[^"]*?/(\d{4}\.\d{2}\.\d{2}\.\d+)')


def doi_suffix_from_tail(tail: bytes) -> str | None:
    """Recover the DOI suffix from a .meca ZIP tail by reading transfer.xml.

    transfer.xml is tiny (~0.5 KB compressed) and lives near the end of the
    archive, so its bytes are almost always inside the 64 KB tail window. The
    `reference` attribute carries the DOI suffix. We regex the raw (possibly
    deflated) tail; if transfer.xml was stored compressed we also try inflating
    any local entry whose name ends in transfer.xml.
    """
    if not tail or b"PK" not in tail:
        return None
    m = _DOI_RE.search(tail)
    if m:
        return m.group(1).decode()
    raw = _inflate_transfer(tail)
    if raw:
        m = _DOI_RE.search(raw)
        if m:
            return m.group(1).decode()
    return None


def _inflate_transfer(tail: bytes) -> bytes | None:
    """Find a local file header for transfer.xml in the tail and inflate it."""
    import struct, zlib
    idx = tail.find(b"PK\x03\x04")
    while idx != -1 and idx + 30 <= len(tail):
        method = struct.unpack("<H", tail[idx+8:idx+10])[0]
        comp_size = struct.unpack("<I", tail[idx+18:idx+22])[0]
        nlen = struct.unpack("<H", tail[idx+26:idx+28])[0]
        elen = struct.unpack("<H", tail[idx+28:idx+30])[0]
        name = tail[idx+30:idx+30+nlen]
        if name.endswith(b"transfer.xml"):
            start = idx + 30 + nlen + elen
            blob = tail[start:start+comp_size] if comp_size else tail[start:]
            try:
                return blob if method == 0 else zlib.decompress(blob, -15)
            except Exception:
                return None
        idx = tail.find(b"PK\x03\x04", idx + 4)
    return None
