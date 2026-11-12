# DigitalWorld

Live site: https://phant0m97.github.io/digital-world/

Source of truth is this repo (`Phant0m97/digital-world`, branch `main`). The public site is the static build on `gh-pages`, published by `.github/workflows/pages.yml` on every push to `main`.

After a user-requested change, commit the source and push `main` so the live site updates. Do not hand-edit `gh-pages`. Keep Vite `base` at `/digital-world/` so assets match the project-site URL.

Do not commit `node_modules`, `.output`, `dist`, or secrets.
