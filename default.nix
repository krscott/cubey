{
  lib,
  stdenv,
}:

stdenv.mkDerivation {
  name = "cubey";

  dontUnpack = true;

  installPhase = ''
    runHook preInstall

    mkdir -p "$out/bin"
    printf '%s\n' \
      '#!/usr/bin/env bash' \
      'set -euo pipefail' \
      'echo "Hello from cubey"' \
      >"$out/bin/cubey"
    chmod +x "$out/bin/cubey"

    runHook postInstall
  '';

  meta.mainProgram = "cubey";
}
