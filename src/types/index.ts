// Re-export all types
export * from './cotizador'

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined

// Form types
export type FormErrors<T> = Partial<Record<keyof T, string>>
export type FormTouched<T> = Partial<Record<keyof T, boolean>>

// Generic callback types
export type VoidCallback = () => void
export type AsyncVoidCallback = () => Promise<void>
export type ValueCallback<T> = (value: T) => void
export type AsyncValueCallback<T> = (value: T) => Promise<void>
