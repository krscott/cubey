# cubey

Random shaded boxes for perspective drawing practice. Press the circular arrow button to generate another reference.

[Open the demo](https://krscott.github.io/cubey/)

Box dimensions and camera distance follow bounded normal distributions. Orientation and light position also vary. Camera distance changes perspective strength; fitting the projected box to the drawing area keeps references centered and comfortably sized. The light stays above and behind the camera.

Transitions take 420 ms and are disabled when the browser requests reduced motion. The button supports keyboard activation and has an accessible label. The page has no visible text during normal use.

## Development

Enter the development shell with `nix develop`, then run:

```sh
just build
just run
just test
just format
just check
```

`just build` copies the static site to `dist`. `just run` serves it at <http://127.0.0.1:8000>. No JavaScript dependencies or bundler are required.

`nix build` packages the site and a local server. `nix run` starts that server on port 8000; use `nix run . -- 8080` for another port.

`just test` runs the geometry tests with Node.js. `just check` also checks formatting, runs ShellCheck, and validates the flake without rewriting source files. Formatting and shell checks cover tracked files; stage new files with `git add` to include them.

Install the formatting hook with `just install-hooks`. It formats fully staged files and leaves partially staged files alone.

Update dependencies with `nix flake update`.

## Deployment

GitHub Pages deploys `site/` through GitHub Actions after a push to `main`. The repository's Pages source must be set to GitHub Actions. Pull requests run the Nix checks, geometry tests, package build, and a local server smoke test.
