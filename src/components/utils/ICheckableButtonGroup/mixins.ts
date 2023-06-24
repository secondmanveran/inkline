import { RenderFunction } from 'vue';

export type CheckableButtonGroupVariant = 'default' | 'group';

export interface CheckableButtonGroupOption {
    id: string | number;
    label: string | number | RenderFunction;
    value: string;
    disabled?: boolean;
    readonly?: boolean;
    buttonProps?: Record<string, unknown>;
}
