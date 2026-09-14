import { MenuBar } from './components/MenuBar'
import { useEffect } from 'react'
import { announceJournalReady } from './host/ModulePresence'

function App() 
{
  useEffect(() => {
    announceJournalReady()
  }, [])

  return (
    <div className="journal-app">
      <MenuBar />

      <main className="journal-workspace">
  <section className="journal-main-workspace">
    <div className="journal-empty">
      <div className="module-identifier">
        Journal
      </div>

      <h2>
        No Project Loaded
      </h2>

      <p>
        Create or load a project to get started.
      </p>
    </div>
  </section>
</main>
    </div>
  )
}

export default App