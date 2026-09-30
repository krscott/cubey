{
  lib,
  stdenvNoCC,
  makeWrapper,
  python3,
}:

stdenvNoCC.mkDerivation {
  pname = "cubey";
  version = "0.1.0";
  src = ./site;
  nativeBuildInputs = [ makeWrapper ];
  installPhase = ''
    runHook preInstall
    mkdir -p "$out/share/cubey" "$out/bin"
    cp -r ./. "$out/share/cubey/"
    makeWrapper ${python3}/bin/python3 "$out/bin/cubey" \
      --add-flags "-m http.server --bind 127.0.0.1 --directory $out/share/cubey"
    runHook postInstall
  '';

  meta = {
    description = "Perspective drawing references from random boxes";
    mainProgram = "cubey";
    platforms = lib.platforms.all;
  };
}
