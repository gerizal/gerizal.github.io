# gerizal.github.io

Gamified personal profile of **Wage Rizal Solichin** — Senior Fullstack Engineer.
Pure static HTML/CSS/JS, no build step.

## Structure
```
index.html                     # content (edit your CV data here)
assets/style.css               # styles
assets/script.js               # gamification (XP, achievements, sounds, Konami code)
cv/Wage_Rizal_Solichin_CV.pdf  # downloadable CV — replace this file to update
```

## Deploy to GitHub Pages
1. Create a public repo named exactly `gerizal.github.io`.
2. Push these files to the `main` branch root.
3. Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
4. Open https://gerizal.github.io

## Preview locally
```
python3 -m http.server 8000
```
then open http://localhost:8000
