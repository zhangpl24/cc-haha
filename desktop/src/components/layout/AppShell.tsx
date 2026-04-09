import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { ContentRouter } from './ContentRouter'
import { ToastContainer } from '../shared/Toast'
import { useSettingsStore } from '../../stores/settingsStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { initializeDesktopServerUrl } from '../../lib/desktopRuntime'
import { TabBar } from './TabBar'
import { useTabStore } from '../../stores/tabStore'
import { useChatStore } from '../../stores/chatStore'

export function AppShell() {
  const fetchSettings = useSettingsStore((s) => s.fetchAll)
  const [ready, setReady] = useState(false)
  const [startupError, setStartupError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        await initializeDesktopServerUrl()
        await fetchSettings()
        // Restore tabs from localStorage
        await useTabStore.getState().restoreTabs()
        const activeId = useTabStore.getState().activeTabId
        if (activeId) {
          useChatStore.getState().connectToSession(activeId)
        }
        if (!cancelled) {
          setReady(true)
        }
      } catch (error) {
        if (!cancelled) {
          setStartupError(error instanceof Error ? error.message : String(error))
          setReady(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [fetchSettings])

  useKeyboardShortcuts()

  if (startupError) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-surface)] px-6">
        <div className="max-w-xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-6">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Local server failed to start
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {startupError}
          </p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
        Launching local workspace...
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <main id="content-area" className="flex-1 flex flex-col overflow-hidden">
        <TabBar />
        <ContentRouter />
      </main>
      <ToastContainer />
    </div>
  )
}
