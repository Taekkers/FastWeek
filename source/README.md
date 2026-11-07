# Kildekode til FastWeek

`index.html` i roden er bygget ud fra filerne her. Ret kilden, og byg igen:

```
python3 source/build.py
```

Scriptet skriver kun `index.html`. `config.js`, `data/` og de andre filer i repoet bliver ikke rørt.

| Fil | Indhold |
|---|---|
| `js_core.js` | Data, beregninger, butiks- og tilbudslogik, planlægger |
| `js_art.js` | Retillustrationer |
| `js_ui.js` | Skærme, ark, handlinger |
| `page.css`, `login.css` | Udseende |
| `shell.html` | Sidens skelet (menu, overskrift) |
| `tests/` | Playwright-tests (se nedenfor) |

## Tests

`tests/` er de tests, der er brugt under udviklingen (`t15.js`: menu og indkøb, `t16.js`: butikssammenligning, upload, planlægning efter tilbud). De kan ikke køre alene fra repoet: de bruger en testudgave af appen og testdata, som ikke ligger her, fordi de indeholder private data. Filerne er med som dokumentation af, hvad der er tjekket.
