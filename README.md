# Ayrton Senna — 7 Portais do Legado

Landing page 3D interativa, cinematográfica e jogável para Desktop em homenagem a Ayrton Senna, construída com **React, TypeScript, Vite, Tailwind CSS, Three.js (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`), Zustand e Web Audio API**.

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

## Modelo 3D Customizado (`.glb` opcional no Showroom)

Por padrão, o Showroom 360° renderiza o monoposto F1 procedural em PBR realista (pintura clearcoat, fibra de carbono procedural, discos de freio e pneus slicks).

Se desejar substituir o carro do Showroom por um modelo 3D externo em formato `.glb` **sem alterar nenhuma linha de código**:

1. Crie a pasta `public/models/` na raiz do projeto (caso ainda não exista).
2. Coloque seu arquivo exatamente em:
   ```text
   public/models/senna-showroom.glb
   ```
3. O Showroom detectará o arquivo automaticamente, normalizará escala e centro no piso reflexivo e aplicará as luzes e sombras de estúdio. Se o arquivo for removido, o fallback procedural volta automaticamente.

---

## Controles (Desktop)

- **Showroom 360°**: Arraste com o mouse para girar em 360°, use o scroll para zoom e `←` / `→` para navegar pelos anos na Timeline.
- **Pilotagem**:
  - **`W` / `Seta Cima`**: Acelerar
  - **`S` / `Seta Baixo`**: Frear (e marcha ré quando parado no Mundo Aberto)
  - **`A` / `Seta Esquerda`**: Esterçar para a esquerda
  - **`D` / `Seta Direita`**: Esterçar para a direita
  - **`Espaço`**: Freio de mão / Drift (no Modo Mundo Aberto)
  - **`R`**: Reiniciar corrida atual instantaneamente
  - **`M`**: Mutar / desmutar áudio procedural
  - **`ESC`**: Abrir Menu de Pausa e Configurações

---

## Estrutura da Experiência

1. **Timeline Interativa + Showroom 360° (`LandingScreen` / `CarShowroom`)**: Estúdio automotivo escuro com plataforma giratória, timeline histórica (1984–1993), cards técnicos dinâmicos por quadrante 360° e CTA **VIVER AS CORRIDAS PESSOALMENTE** (ou **CORRER NESTA PISTA** direto em cada ano).
2. **Corredor Principal (`Z = 0` até `Z = -950`)**:
   - **Seguir em frente (`SIGA EM FRENTE — A TRAJETÓRIA`)**: A faixa central é totalmente livre. Ao cruzar `Z = -950` (ou clicar em `IR PARA A HISTÓRIA`), o visitante entra diretamente no Modo Mundo Aberto.
   - **7 Portais Laterais Opcionais** (ou via barra de portais clicável na HUD):
     1. **Mônaco 1984** (`Toleman TG184`) — Chuva intensa contra Alain Prost.
     2. **Estoril 1985** (`Lotus 97T`) — Tempestade e alta velocidade contra Michele Alboreto.
     3. **Suzuka 1988** (`McLaren MP4/4`) — Queda de rotação na largada e escalada até Alain Prost.
     4. **Phoenix 1990** (`McLaren MP4/5B`) — Duelo roda a roda contra Jean Alesi.
     5. **Interlagos 1991** (`McLaren MP4/6`) — Falha de câmbio com trava na 6ª marcha contra Riccardo Patrese.
     6. **Mônaco 1992** (`McLaren MP4/7A`) — Defesa de liderança contra Nigel Mansell.
     7. **Donington Park 1993** (`McLaren MP4/8`) — 4 ultrapassagens sequenciais sob chuva forte.
3. **Modo Mundo Aberto 360° (`Z < -950`)**: Arena panorâmica ao pôr do sol com condução livre em 360°, drift com marcas de pneu dinâmicas, bússola e **6 Monumentos Narrativos** em sequência até o Legado Eterno.

---

## Arquitetura Principal (`src/`)

- `src/types/game.ts` — Tipagem estrita de runtime, timeline, fases, clima, IA e estado persistido.
- `src/data/sennaData.ts` — Dados da Timeline (1984–1993), das 7 corridas e dos 6 capítulos do Mundo Aberto.
- `src/utils/proceduralTextures.ts` — Geradores procedurais de fibra de carbono, asfalto (roughness/bump), banda/parede de pneu, capacete e placas.
- `src/utils/runtime.ts` — Objeto mutável `gameRuntime` fora do ciclo de re-renderização do React (60 FPS).
- `src/utils/physics.ts` — Física baseada em `delta`, wall-slide anti-travamento, aderência na chuva e condução 360°.
- `src/utils/engineAudio.ts` — Síntese procedural contínua de motor F1, chuva, vento e feedbacks.
- `src/store/useGameStore.ts` — Estado discreto da UI e persistência versionada em `localStorage`.
- `src/components/3d/` — `CarShowroom`, `FormulaCar`, `CorridorTrack`, `PortalGate`, `RaceTrack`, `OpponentCar`, `OpenWorldArena`, `Effects`, `Environment`, `SceneLighting`, `CameraController`, `GameCanvas`.
- `src/components/ui/` — `LandingScreen`, `TimelineSection`, `TelemetryHUD`, `PhaseTransition`, `NarrativeCard`, `PauseMenu`, `SettingsPanel`, `AudioControls`, `LoadingScreen`, `EndCredits`.
