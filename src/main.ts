import './style.css'

const THEME_KEY = 'tillhome-theme'

type Theme = 'light' | 'dark'

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function storedTheme(): Theme | null {
  const value = localStorage.getItem(THEME_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  const next = theme === 'dark' ? 'light' : 'dark'
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
  if (button) {
    button.setAttribute('aria-label', `Switch to ${next} theme`)
    button.setAttribute('title', `Use ${next} theme`)
  }
}

function initTheme(): void {
  applyTheme(storedTheme() ?? systemTheme())

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    const next: Theme = current === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, next)
    applyTheme(next)
  })

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (storedTheme()) return
    applyTheme(event.matches ? 'dark' : 'light')
  })
}

function initFilter(): void {
  const input = document.querySelector<HTMLInputElement>('[data-filter]')
  const directory = document.querySelector<HTMLElement>('[data-directory]')
  if (!input || !directory) return

  const cards = [...directory.querySelectorAll<HTMLElement>('.card')]
  const sections = [...directory.querySelectorAll<HTMLElement>('.section')]
  const empty = directory.querySelector<HTMLElement>('.empty-filter')

  const apply = () => {
    const query = input.value.trim().toLowerCase()
    let visible = 0

    for (const card of cards) {
      const haystack = card.dataset.search ?? card.textContent ?? ''
      const show = !query || haystack.includes(query)
      card.hidden = !show
      if (show) visible += 1
    }

    for (const section of sections) {
      const any = [...section.querySelectorAll<HTMLElement>('.card')].some((card) => !card.hidden)
      section.hidden = !any
    }

    if (empty) empty.hidden = visible !== 0
  }

  input.addEventListener('input', apply)
}

initTheme()
initFilter()
