export type MbChipTone = 'neutral' | 'brand' | 'danger' | 'success' | 'warning';

export interface MbChipProps {
  label?: string;
  tone?: MbChipTone;
  selected?: boolean;
  dismissible?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}
