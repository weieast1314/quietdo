#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${APP_DIR}/../.." && pwd)"
APP_VERSION="${QUIETDO_VERSION:-}"
if [[ -z "${APP_VERSION}" ]]; then
  APP_VERSION="$(node -e "const fs=require('fs'); console.log(JSON.parse(fs.readFileSync('${APP_DIR}/src-tauri/tauri.conf.json','utf8')).version)")"
fi
ANDROID_HOME="${ANDROID_HOME:-${HOME}/Library/Android/sdk}"
BUILD_TOOLS_VERSION="${ANDROID_BUILD_TOOLS_VERSION:-35.0.0}"
BUILD_TOOLS="${ANDROID_HOME}/build-tools/${BUILD_TOOLS_VERSION}"
KEYSTORE="${ANDROID_TEST_KEYSTORE:-${HOME}/.android/debug.keystore}"
UNSIGNED="${APP_DIR}/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"
OUTPUT="${QUIETDO_ANDROID_OUTPUT:-${REPO_ROOT}/releases/QuietDo-${APP_VERSION}-android-preview-arm.apk}"

if [[ -n "${JAVA_HOME:-}" ]]; then
  export PATH="${JAVA_HOME}/bin:${PATH}"
fi

if [[ ! -f "${KEYSTORE}" ]]; then
  mkdir -p "$(dirname "${KEYSTORE}")"
  keytool -genkeypair -v \
    -keystore "${KEYSTORE}" \
    -storetype PKCS12 \
    -storepass android \
    -keypass android \
    -alias androiddebugkey \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "C=US,O=Android,CN=Android Debug"
fi

mkdir -p "$(dirname "${OUTPUT}")"

cd "${APP_DIR}"
./node_modules/.bin/tauri android build --target aarch64 --target armv7 --apk
"${BUILD_TOOLS}/zipalign" -p -f 4 "${UNSIGNED}" "${OUTPUT}"
"${BUILD_TOOLS}/apksigner" sign \
  --ks "${KEYSTORE}" \
  --ks-type PKCS12 \
  --ks-key-alias androiddebugkey \
  --ks-pass pass:android \
  --key-pass pass:android \
  "${OUTPUT}"
"${BUILD_TOOLS}/apksigner" verify --verbose "${OUTPUT}"

echo "Android test APK: ${OUTPUT}"
