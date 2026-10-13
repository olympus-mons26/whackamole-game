export const ANIMAL_OPTIONS = [
  { id: 'mole', label: 'Mole' },
  { id: 'bunny', label: 'Bunny' },
  { id: 'cat', label: 'Cat' },
  { id: 'frog', label: 'Frog' },
  { id: 'fox', label: 'Fox' },
] as const;

export type AnimalId = (typeof ANIMAL_OPTIONS)[number]['id'];

type AnimalSpriteProps = { animal: AnimalId };

function eyes(y = 58) {
  return (
    <g fill="#30251f">
      <ellipse cx="39" cy={y} rx="3.2" ry="4.4" />
      <ellipse cx="61" cy={y} rx="3.2" ry="4.4" />
    </g>
  );
}

export function AnimalSprite({ animal }: AnimalSpriteProps) {
  let illustration;

  switch (animal) {
    case 'bunny':
      illustration = (
        <>
          <ellipse cx="34" cy="31" rx="9" ry="25" transform="rotate(-12 34 31)" fill="#eadfcf" />
          <ellipse cx="66" cy="31" rx="9" ry="25" transform="rotate(12 66 31)" fill="#eadfcf" />
          <ellipse cx="34" cy="31" rx="4" ry="17" transform="rotate(-12 34 31)" fill="#e4a9a0" />
          <ellipse cx="66" cy="31" rx="4" ry="17" transform="rotate(12 66 31)" fill="#e4a9a0" />
          <ellipse cx="50" cy="67" rx="34" ry="30" fill="#eadfcf" />
          {eyes(60)}
          <ellipse cx="50" cy="69" rx="5" ry="3.8" fill="#b77372" />
          <path d="M50 73v4m0 0q-5 5-9 0m9 0q5 5 9 0" fill="none" stroke="#80615b" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="30" cy="71" rx="6" ry="3.5" fill="#e6aaa2" opacity=".65" />
          <ellipse cx="70" cy="71" rx="6" ry="3.5" fill="#e6aaa2" opacity=".65" />
        </>
      );
      break;
    case 'cat':
      illustration = (
        <>
          <path d="M19 54 22 20l24 20q4-2 8 0l24-20 3 34q-3 36-31 36T19 54Z" fill="#cb8058" />
          <path d="m27 31 13 11-15 4Z" fill="#e6aaa0" />
          <path d="m73 31-13 11 15 4Z" fill="#e6aaa0" />
          {eyes(59)}
          <ellipse cx="50" cy="70" rx="15" ry="11" fill="#f0dfc8" />
          <path d="m47 67 3 3 3-3q-3-3-6 0Z" fill="#9b6157" />
          <path d="M50 70v4m0 0q-5 4-8 0m8 0q5 4 8 0" fill="none" stroke="#79574d" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M34 69 20 66m14 10-14 2m52-9 14-3M66 76l14 2" fill="none" stroke="#f0dfc8" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
      break;
    case 'frog':
      illustration = (
        <>
          <ellipse cx="50" cy="66" rx="36" ry="29" fill="#79a86c" />
          <ellipse cx="31" cy="43" rx="13" ry="14" fill="#86b978" />
          <ellipse cx="69" cy="43" rx="13" ry="14" fill="#86b978" />
          <ellipse cx="32" cy="43" rx="8" ry="9" fill="#f2e9ce" />
          <ellipse cx="68" cy="43" rx="8" ry="9" fill="#f2e9ce" />
          <ellipse cx="34" cy="44" rx="3.3" ry="4.5" fill="#263326" />
          <ellipse cx="66" cy="44" rx="3.3" ry="4.5" fill="#263326" />
          <path d="M34 70q16 15 32 0" fill="none" stroke="#385f42" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="64" r="2" fill="#547e51" />
          <circle cx="76" cy="64" r="2" fill="#547e51" />
        </>
      );
      break;
    case 'fox':
      illustration = (
        <>
          <path d="M19 53 22 18l25 22q3-1 6 0l25-22 3 35q-2 36-31 38-29-2-31-38Z" fill="#d87943" />
          <path d="m27 30 13 12-15 4Z" fill="#f1c6a2" />
          <path d="m73 30-13 12 15 4Z" fill="#f1c6a2" />
          {eyes(57)}
          <path d="M20 66q9-9 20-2l10 8 10-8q11-7 20 2-6 19-30 23-24-4-30-23Z" fill="#f4e8d5" />
          <path d="m46 68 4 4 4-4q-4-4-8 0Z" fill="#55372f" />
          <path d="M50 72v4m0 0q-4 3-7 0m7 0q4 3 7 0" fill="none" stroke="#73534a" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
      break;
    case 'mole':
    default:
      illustration = (
        <>
          <ellipse cx="32" cy="40" rx="11" ry="13" fill="#89553f" />
          <ellipse cx="68" cy="40" rx="11" ry="13" fill="#89553f" />
          <ellipse cx="32" cy="40" rx="5" ry="7" fill="#d99881" />
          <ellipse cx="68" cy="40" rx="5" ry="7" fill="#d99881" />
          <ellipse cx="50" cy="66" rx="34" ry="31" fill="#bd7e5e" />
          {eyes(58)}
          <ellipse cx="50" cy="69" rx="7" ry="5" fill="#805044" />
          <path d="M50 73v4m0 0q-5 4-9 0m9 0q5 4 9 0" fill="none" stroke="#754c40" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="31" cy="70" rx="6" ry="3.5" fill="#e6aa94" opacity=".6" />
          <ellipse cx="69" cy="70" rx="6" ry="3.5" fill="#e6aa94" opacity=".6" />
        </>
      );
  }

  return (
    <svg className="animal-sprite" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {illustration}
    </svg>
  );
}
