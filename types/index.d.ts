export type Form = 'rock' | 'drill' | 'lamp' | 'spray' | 'happy' | 'love' | 'munch' | 'spin' | 'sleep'
export type Mood = { form: Form; caption: string; calls: number }
// Pet stats, 0 to 100, kept across sessions in $.store.
export type Pet = { food: number; joy: number; energy: number; bond: number; at: number; asleep: boolean }
// One usage window: five_hour or seven_day.
export type Limit = { kind: string; percentUsed: number; resetsAt?: string | undefined }

declare module 'claude-code' {
  interface PluginState {
    scree: { mood: Shaped<Mood>; recent: Shaped<string[]>; pet: Shaped<Pet>; limits: Shaped<Limit[]> }
  }
}
