/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NYT_TOKEN?: string
  readonly VITE_NYT_SUBSCRIBER_ID?: string
  readonly VITE_ANTHROPIC_KEY?: string
  readonly VITE_WORKER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
