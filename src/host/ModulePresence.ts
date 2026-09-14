import {
  moduleEventBus,
} from './ModuleBus'

export function announceJournalReady(): void {
  moduleEventBus.emit(
    'module.ready',
    {
      capabilities: {
        events: [],
        actions: [],
      },
    },
  )
}