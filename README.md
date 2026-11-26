# Ayrton Senna — 7 Portais do Legado

Landing page 3D interativa, cinematográfica e jogável para Desktop em homenagem a Ayrton Senna, construída com **React, TypeScript, Vite, Tailwind CSS, Three.js (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`), Zustand e Web Audio API** (geometria, materiais e áudio 100% procedurais).

---

## Como Executar

```bash
npm install
npm run dev
```

Para validar tipagem e gerar o build de produção:

```bash
npx tsc --noEmit
npm run build
```

---

## Controles (Desktop)

- **`W` / `Seta Cima`**: Acelerar
- **`S` / `Seta Baixo`**: Frear (e marcha ré quando parado no Mundo Aberto)
- **`A` / `Seta Esquerda`**: Esterçar para a esquerda
- **`D` / `Seta Direita`**: Esterçar para a direita
- **`Espaço`**: Freio de mão / Drift (no Modo Mundo Aberto)
- **`M`**: Mutar / desmutar áudio procedural
- **`ESC`**: Abrir Menu de Pausa e Configurações

---

## Estrutura da Experiência

1. **Abertura Cinematográfica (`LandingScreen`)**: O monoposto avança pelo Corredor Principal sob iluminação dramática. Ao clicar em **LIGAR MOTOR / INICIAR**, o `AudioContext` é inicializado e a câmera faz a transição para pilotagem.
2. **Corredor Principal (`Z = 0` até `Z = -3250`)**:
   - **Seguir em frente (`SIGA EM FRENTE — A TRAJETÓRIA`)**: A faixa central é totalmente livre. Ao cruzar `Z = -3250` (ou clicar em `IR PARA A HISTÓRIA`), o visitante entra diretamente no Modo Mundo Aberto.
   - **7 Portais Laterais Opcionais**:
     1. **Mônaco 1984** (`Toleman TG184`) — Chuva intensa contra Alain Prost.
     2. **Estoril 1985** (`Lotus 97T`) — Tempestade e alta velocidade contra Michele Alboreto.
     3. **Suzuka 1988** (`McLaren MP4/4`) — Queda de rotação na largada e escalada até Alain Prost.
     4. **Phoenix 1990** (`McLaren MP4/5B`) — Duelo roda a roda contra Jean Alesi.
     5. **Interlagos 1991** (`McLaren MP4/6`) — Falha de câmbio com trava na 6ª marcha contra Riccardo Patrese.
     6. **Mônaco 1992** (`McLaren MP4/7A`) — Defesa de liderança contra Nigel Mansell.
     7. **Donington Park 1993** (`McLaren MP4/8`) — 4 ultrapassagens sequenciais sob chuva forte.
3. **Modo Mundo Aberto 360° (`Z < -3250`)**: Arena panorâmica ao pôr do sol dourado com condução livre em 360°, drift com marcas de pneu dinâmicas, bússola e **6 Monumentos Narrativos** em sequência até o Legado Eterno.

---

## Arquitetura Principal (`src/`)

- `src/types/game.ts` — Tipagem estrita de runtime, fases, clima, IA e estado persistido.
- `src/data/sennaData.ts` — Dados das 7 corridas puras e dos 6 capítulos do Mundo Aberto.
- `src/utils/runtime.ts` — Objeto mutável `gameRuntime` fora do ciclo de re-renderização do React (60 FPS).
- `src/utils/physics.ts` — Física baseada em `delta`, aderência na chuva, zebras e condução 360°.
- `src/utils/engineAudio.ts` — Síntese procedural contínua de motor F1, chuva, vento e feedbacks.
- `src/store/useGameStore.ts` — Estado discreto da UI e persistência versionada em `localStorage`.
- `src/components/3d/` — `FormulaCar`, `CorridorTrack`, `PortalGate`, `RaceTrack`, `OpponentCar`, `OpenWorldArena`, `Effects`, `Environment`, `SceneLighting`, `CameraController`, `GameCanvas`.
- `src/components/ui/` — `LandingScreen`, `TelemetryHUD`, `PhaseTransition`, `NarrativeCard`, `PauseMenu`, `SettingsPanel`, `AudioControls`, `LoadingScreen`, `EndCredits`.
