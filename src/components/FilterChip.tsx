import { PillChip } from './ui/PillChip';

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export const FilterChip = ({ label, active = false, onPress }: FilterChipProps) => {
  return <PillChip active={active} label={label} onPress={onPress} />;
};
