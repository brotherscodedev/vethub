import {
  Bird,
  Cat,
  Dog,
  PawPrint,
  Rat,
  Turtle,
  LucideIcon,
} from 'lucide-react';

// Para adicionar uma espécie, basta criar uma nova linha aqui.
const SPECIES_CONFIG: Record<string, { Icon: LucideIcon; color: string }> = {
  cão: { Icon: Dog, color: 'text-blue-500' },
  gato: { Icon: Cat, color: 'text-purple-500' },
  ave: { Icon: Bird, color: 'text-yellow-500' },
  roedor: { Icon: Rat, color: 'text-pink-500' },
  réptil: { Icon: Turtle, color: 'text-emerald-500' },
};

export const getSpeciesIcon = (species: string) => {
  const s = species?.toLowerCase() || '';

  const key = Object.keys(SPECIES_CONFIG).find((k) => s.includes(k));

  const { Icon, color } = SPECIES_CONFIG[key || ''] || {
    Icon: PawPrint,
    color: 'text-gray-400',
  };

  return <Icon className={`h-4 w-4 ${color}`} />;
};
