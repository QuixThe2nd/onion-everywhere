#!/usr/bin/env bash

main () {
    cd "$(realpath $(dirname "$0"))"

    # Find ffmpeg binary
    local ffmpeg_binary;
    ffmpeg_binary="ffmpeg"
    if command -v ffmpeg7 >/dev/null 2>&1; then
        ffmpeg_binary="ffmpeg7"
    elif command -v ffmpeg6 >/dev/null 2>&1; then
        ffmpeg_binary="ffmpeg6"
    elif command -v ffmpeg5 >/dev/null 2>&1; then
        ffmpeg_binary="ffmpeg5"
    fi

    # Don't want any errors for dir not existing
    [ -f ../icons ] || mkdir -p ../icons

    # Create icon files
    "$ffmpeg_binary" -i ./batch_Normal.png  -vf scale=48:48 -y ../icons/icon-48.png
    "$ffmpeg_binary" -i ./batch_Enabled.png  -vf scale=19:19 -y ../icons/icon-enabled-19.png
    "$ffmpeg_binary" -i ./batch_Enabled.png  -vf scale=38:38 -y ../icons/icon-enabled-38.png
    "$ffmpeg_binary" -i ./batch_Disabled.png -vf scale=19:19 -y ../icons/icon-disabled-19.png
    "$ffmpeg_binary" -i ./batch_Disabled.png -vf scale=38:38 -y ../icons/icon-disabled-38.png

    # Strip metadata
    exiftool -all= -overwrite_original ../icons/icon-*.png
}

main
