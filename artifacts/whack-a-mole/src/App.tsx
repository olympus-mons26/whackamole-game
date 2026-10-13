import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { soundManager } from '@/lib/sounds';
import { ANIMAL_OPTIONS, AnimalSprite, type AnimalId } from '@/components/AnimalSprite';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ExternalLink, Moon, Play, RotateCcw, Settings, Sun, Trash2, Volume2, VolumeX } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

const HOLES = Array.from({ length: 9 }, (_, index) => index);
const ROUND_LENGTH_OPTIONS = [30, 60] as const;
type RoundLength = (typeof ROUND_LENGTH_OPTIONS)[number];
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
type Phase = 'ready' | 'playing' | 'finished';
type MoleTarget = { hole: number; token: number };
type Hit = { hole: number; token: number } | null;

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
const DIFFICULTIES: Record<
  Difficulty,
  {
    label: string;
    hint: string;
    targetLifetime: number;
    lifetimeRamp: number;
    minimumLifetime: number;
    pause: number;
    pauseRamp: number;
    minimumPause: number;
  }
> = {
  easy: {
    label: 'Easy',
    hint: 'More time',
    targetLifetime: 1500,
    lifetimeRamp: 12,
    minimumLifetime: 850,
    pause: 720,
    pauseRamp: 8,
    minimumPause: 360,
  },
  medium: {
    label: 'Medium',
    hint: 'Steady pace',
    targetLifetime: 1050,
    lifetimeRamp: 17,
    minimumLifetime: 480,
    pause: 530,
    pauseRamp: 10,
    minimumPause: 140,
  },
  hard: {
    label: 'Hard',
    hint: 'Fast',
    targetLifetime: 820,
    lifetimeRamp: 14,
    minimumLifetime: 380,
    pause: 370,
    pauseRamp: 8,
    minimumPause: 110,
  },
  expert: {
    label: 'Expert',
    hint: 'Very fast',
    targetLifetime: 650,
    lifetimeRamp: 16,
    minimumLifetime: 300,
    pause: 240,
    pauseRamp: 7,
    minimumPause: 75,
  },
};

function Home() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [roundLength, setRoundLength] = useState<RoundLength>(30);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(30);
  const [target, setTarget] = useState<MoleTarget | null>(null);
  const [lastHit, setLastHit] = useState<Hit>(null);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('whack-a-mole-theme') !== 'light'; } catch { return true; }
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('whack-a-mole-sound') !== 'off'; } catch { return true; }
  });
  const [animal, setAnimal] = useState<AnimalId>(() => {
    try {
      const saved = localStorage.getItem('whack-a-mole-animal');
      return ANIMAL_OPTIONS.find((option) => option.id === saved)?.id ?? 'mole';
    } catch {
      return 'mole';
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [best, setBest] = useState(() => {
    try { return Number(localStorage.getItem('burrow-best') || 0); } catch { return 0; }
  });
  const [roundId, setRoundId] = useState(0);
  const scoreRef = useRef(0);
  const remainingRef = useRef(30);
  const roundStartRef = useRef(0);
  const targetTokenRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const hitTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('whack-a-mole-theme', dark ? 'dark' : 'light'); } catch { /* Storage can be unavailable in private contexts. */ }
  }, [dark]);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
    try { localStorage.setItem('whack-a-mole-sound', soundEnabled ? 'on' : 'off'); } catch { /* Sound still works for this session. */ }
  }, [soundEnabled]);

  useEffect(() => {
    try { localStorage.setItem('whack-a-mole-animal', animal); } catch { /* The chosen animal still works for this session. */ }
  }, [animal]);

  useEffect(() => () => {
    soundManager.close();
  }, []);

  const clearRoundTimers = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
  }, []);

  const finishRound = useCallback(() => {
    clearRoundTimers();
    setTarget(null);
    setPhase('finished');
    const finalScore = scoreRef.current;
    setBest((previous) => {
      const isRecord = finalScore > previous && finalScore > 0;
      soundManager.playFinish(isRecord);
      const next = Math.max(previous, finalScore);
      try { localStorage.setItem('burrow-best', String(next)); } catch { /* Best score still lives for this session. */ }
      return next;
    });
  }, [clearRoundTimers]);

  const startRound = useCallback(() => {
    clearRoundTimers();
    soundManager.playStart();
    scoreRef.current = 0;
    remainingRef.current = roundLength;
    roundStartRef.current = Date.now();
    setScore(0);
    setRemaining(roundLength);
    setTarget(null);
    setLastHit(null);
    setRoundId((id) => id + 1);
    setPhase('playing');
  }, [clearRoundTimers, roundLength]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const timer = window.setInterval(() => {
      const left = Math.max(0, roundLength - (Date.now() - roundStartRef.current) / 1000);
      remainingRef.current = left;
      setRemaining(left);
      if (left <= 0) finishRound();
    }, 80);
    return () => window.clearInterval(timer);
  }, [phase, roundId, roundLength, finishRound]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    let cancelled = false;
    let spawnTimer = 0;
    const later = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, delay);
      timersRef.current.push(timer);
      return timer;
    };
    const spawn = () => {
      if (cancelled || remainingRef.current <= 0) return;
      const hole = Math.floor(Math.random() * HOLES.length);
      const token = ++targetTokenRef.current;
      const elapsed = roundLength - remainingRef.current;
      const rules = DIFFICULTIES[difficulty];
      const lifetime = Math.max(
        rules.minimumLifetime,
        rules.targetLifetime - elapsed * rules.lifetimeRamp,
      );
      const pause = Math.max(
        rules.minimumPause,
        rules.pause - elapsed * rules.pauseRamp,
      );
      soundManager.playPop();
      setTarget({ hole, token });
      later(() => {
        if (cancelled) return;
        setTarget((current) => current?.token === token ? null : current);
        spawnTimer = later(spawn, pause);
      }, lifetime);
    };
    spawnTimer = later(spawn, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(spawnTimer);
      clearRoundTimers();
    };
  }, [phase, roundId, difficulty, roundLength, clearRoundTimers]);

  const hitTarget = (hole: number) => {
    if (phase !== 'playing') return;
    if (target?.hole === hole) {
      soundManager.playWhack();
      const token = target.token;
      scoreRef.current += 10;
      setScore(scoreRef.current);
      setTarget(null);
      setLastHit({ hole, token });
      if (hitTimerRef.current) window.clearTimeout(hitTimerRef.current);
      hitTimerRef.current = window.setTimeout(() => setLastHit(null), 540);
    } else {
      soundManager.playMiss();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (phase !== 'playing' || event.repeat) return;
      const key = Number(event.key);
      if (key >= 1 && key <= 9) {
        event.preventDefault();
        hitTarget(key - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, target]);

  const clock = Math.ceil(remaining);
  const progress = Math.max(0, (remaining / roundLength) * 100);
  const selectedDifficulty = DIFFICULTIES[difficulty];

  const resetAllGameData = () => {
    try {
      ['burrow-best', 'burrow-theme', 'whack-a-mole-theme', 'whack-a-mole-sound', 'whack-a-mole-animal']
        .forEach((key) => localStorage.removeItem(key));
      window.location.reload();
    } catch {
      window.alert('Whack-a-mole could not clear its saved data in this browser.');
    }
  };

  return (
    <div className="game-shell">
      <div className="game-frame">
        <header className="masthead">
          <a className="brand" href={import.meta.env.BASE_URL} aria-label="Reload Whack-a-mole">
            <img
              className="brand-mark"
              src={`${import.meta.env.BASE_URL}whack-a-mole-logo.svg`}
              alt=""
              aria-hidden="true"
            />
            <span className="brand-name">Whack-a-mole</span>
            <span className="edition">a quick arcade game</span>
          </a>
          <div className="masthead-actions">
            <button
              type="button"
              className="icon-button"
              aria-label="Sound effects"
              aria-pressed={soundEnabled}
              title={soundEnabled ? 'Sound effects on' : 'Sound effects off'}
              data-testid="button-sound-toggle"
              onClick={() => setSoundEnabled((value) => !value)}
            >
              {soundEnabled ? <Volume2 size={17} strokeWidth={1.7} /> : <VolumeX size={17} strokeWidth={1.7} />}
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              data-testid="button-theme-toggle"
              onClick={() => setDark((value) => !value)}
            >
              {dark ? <Sun size={17} strokeWidth={1.7} /> : <Moon size={17} strokeWidth={1.7} />}
            </button>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <button type="button" className="icon-button" aria-label="Open settings" title="Settings" data-testid="button-settings">
                  <Settings size={17} strokeWidth={1.7} />
                </button>
              </DialogTrigger>
              <DialogContent className="settings-content">
                <DialogHeader className="settings-header">
                  <DialogTitle>Game settings</DialogTitle>
                  <DialogDescription>Choose your animal and manage the game data saved in this browser.</DialogDescription>
                </DialogHeader>
                <section className="settings-animal-section" aria-labelledby="settings-animal-title">
                  <div className="settings-animal-copy">
                    <h3 id="settings-animal-title">Choose your animal</h3>
                    <p>This is the character that pops out of the holes.</p>
                  </div>
                  <div className="settings-animal-options" role="group" aria-label="Choose an animal">
                    {ANIMAL_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`settings-animal-option${animal === option.id ? ' is-selected' : ''}`}
                        aria-label={`Use ${option.label}`}
                        aria-pressed={animal === option.id}
                        data-testid={`button-animal-${option.id}`}
                        onClick={() => setAnimal(option.id)}
                      >
                        <span className="settings-animal-preview"><AnimalSprite animal={option.id} /></span>
                        <span className="settings-animal-label">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <div className="settings-reset-row">
                  <div className="settings-reset-copy">
                    <h3>Reset all data</h3>
                    <p>Delete your personal best and saved animal, sound, and theme preferences.</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button type="button" className="settings-reset-button" data-testid="button-reset-data">
                        <Trash2 size={15} aria-hidden="true" />
                        Reset
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="reset-confirm-dialog">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete and reset all data?</AlertDialogTitle>
                        <AlertDialogDescription className="reset-confirm-description">
                          This permanently deletes your personal best and saved animal, sound, and theme preferences from this browser.
                          Your current round will end, and the game will reload with its defaults. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="settings-delete-button" onClick={resetAllGameData}>
                          Delete and reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="main-content">
          <section className="intro" aria-labelledby="game-title">
            <div>
              <p className="eyebrow">A fast, friendly reflex game</p>
              <a className="title-link" href={import.meta.env.BASE_URL} aria-label="Reload Whack-a-mole">
                <h1 className="title" id="game-title">Whack-a-mole</h1>
              </a>
            </div>
            <p className="intro-note">Pick a level and timer, then catch as many moles as you can.</p>
          </section>

          <section className="game-card" aria-label="Whack-a-mole game">
            <div className="scorebar">
              <div className="metric">
                <span className="metric-label">Your score</span>
                <span className="metric-value" data-testid="text-score">{score.toString().padStart(3, '0')}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Time left</span>
                <span className="metric-value timer-value" data-testid="text-timer">{clock}<small>sec</small></span>
              </div>
              <div className="metric">
                <span className="metric-label">Personal best</span>
                <span className="metric-value" data-testid="text-best">{best.toString().padStart(3, '0')}</span>
              </div>
            </div>
            <div className="time-track" aria-hidden="true"><div className="time-fill" style={{ width: `${progress}%` }} /></div>

            <div className={`arena${phase !== 'playing' ? ' arena-setup' : ''}`}>
              <div className="holes" role="group" aria-label="Nine holes. Click or tap the mole when it appears.">
                {HOLES.map((hole) => {
                  const isActive = target?.hole === hole && phase === 'playing';
                  const wasHit = lastHit?.hole === hole;
                  return (
                    <button
                      key={hole}
                      type="button"
                      className={`hole${isActive ? ' is-active' : ''}${wasHit ? ' is-hit' : ''}`}
                      aria-label={`Hole ${hole + 1}${isActive ? ', mole up, hit now' : ''}`}
                      aria-keyshortcuts={String(hole + 1)}
                      data-testid={`button-burrow-${hole + 1}`}
                      disabled={phase !== 'playing'}
                      onClick={() => hitTarget(hole)}
                    >
                      <span className="hole-shadow" />
                      {isActive && <span className="mole" aria-hidden="true"><AnimalSprite animal={animal} /></span>}
                      <span className="hole-ring" />
                      {wasHit && <span className="impact" key={lastHit.token} aria-hidden="true">+10</span>}
                    </button>
                  );
                })}
              </div>

              {phase !== 'playing' && (
                <div className="overlay">
                  <div className="overlay-panel">
                    <p className="overlay-kicker">{phase === 'finished' ? 'Round complete' : 'Ready when you are'}</p>
                    <h2 className="overlay-title">{phase === 'finished' ? `${score} points` : 'Eyes on the holes.'}</h2>
                    <p className="overlay-copy">
                      {phase === 'finished'
                        ? (score >= best && score > 0 ? 'A new personal best. Lovely timing.' : 'Every round is a fresh little challenge.')
                        : 'Choose a level and a time limit. Hit each mole before it ducks away.'}
                    </p>
                    <div className="difficulty-picker">
                      <span className="difficulty-label">Choose your level</span>
                      <div className="difficulty-options" role="group" aria-label="Choose a difficulty level">
                        {DIFFICULTY_ORDER.map((level) => {
                          const option = DIFFICULTIES[level];
                          return (
                            <button
                              key={level}
                              type="button"
                              className={`difficulty-option${difficulty === level ? ' is-selected' : ''}`}
                              aria-pressed={difficulty === level}
                              data-testid={`button-difficulty-${level}`}
                              onClick={() => setDifficulty(level)}
                            >
                              <span>{option.label}</span>
                              <small>{option.hint}</small>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="round-length-picker">
                      <span className="difficulty-label">Choose your time</span>
                      <div className="round-length-options" role="group" aria-label="Choose round length">
                        {ROUND_LENGTH_OPTIONS.map((seconds) => (
                          <button
                            key={seconds}
                            type="button"
                            className={`difficulty-option round-length-option${roundLength === seconds ? ' is-selected' : ''}`}
                            aria-pressed={roundLength === seconds}
                            data-testid={`button-round-length-${seconds}`}
                            onClick={() => {
                              setRoundLength(seconds);
                              remainingRef.current = seconds;
                              setRemaining(seconds);
                            }}
                          >
                            <span>{seconds} seconds</span>
                            <small>{seconds === 30 ? 'Quick round' : 'Longer challenge'}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="button" className={phase === 'finished' ? 'replay-button' : 'start-button'} onClick={startRound} data-testid="button-start">
                      {phase === 'finished' ? <RotateCcw size={16} /> : <Play size={16} />}
                      {phase === 'finished' ? 'Play again' : 'Start a round'}
                    </button>
                  </div>
                </div>
              )}
              {phase !== 'playing' && (
                <div className="arena-hint" aria-hidden="true">
                  Each catch is worth 10 points
                </div>
              )}
            </div>
            <footer className="game-footer">
              <span><strong>Small window, quick hands.</strong> See how many you can catch.</span>
              <span className="footer-right" data-testid="text-round-settings">{selectedDifficulty.label.toUpperCase()} / {roundLength} SEC</span>
            </footer>
          </section>

          <section className="how-to-play" aria-labelledby="how-to-play-title">
            <div className="guide-heading">
              <div>
                <p className="eyebrow">How it works</p>
                <h2 className="guide-title" id="how-to-play-title">Catch them before they duck away.</h2>
              </div>
              <p className="guide-summary">
                Choose one of four levels and a 30- or 60-second round. Each hit earns 10 points.
                Moles pop up one at a time, stay briefly, and appear faster as the clock runs down.
              </p>
            </div>
            <div className="guide-cards">
              <article className="guide-card">
                <span className="guide-label">DESKTOP</span>
                <h3>Click to catch</h3>
                <p>Use your mouse or trackpad to click a hole as soon as a mole appears.</p>
              </article>
              <article className="guide-card">
                <span className="guide-label">MOBILE</span>
                <h3>Tap to catch</h3>
                <p>Tap the mole as soon as it pops up. All nine holes respond to touch.</p>
              </article>
            </div>
          </section>

          <div className="page-foot">
            <span><i className="live-dot" />Made for a small pause</span>
            <span>Take your time. Then don't.</span>
          </div>
          <footer className="creator-credit" aria-label="Game credits">
            <span>A little game by</span>
            <a
              className="creator-link"
              href="https://github.com/olympus-mons26/whackamole-game"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-creator"
            >
              olympus-mons26 <ExternalLink size={12} aria-hidden="true" />
            </a>
            <p className="surge-thanks">
              Thank you,{' '}
              <a
                className="creator-link"
                href="https://surge.sh"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-surge"
              >
                Surge <ExternalLink size={12} aria-hidden="true" />
              </a>
              , for their free web hosting.
            </p>
          </footer>
          <div className="sr-only" role="status" aria-live="polite" data-testid="status-game">
            {phase === 'playing' ? `${clock} seconds remaining. Score ${score}.` : phase === 'finished' ? `Round over. Final score ${score}.` : 'Ready to play.'}
          </div>
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
