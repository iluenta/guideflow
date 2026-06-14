'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Status = 'validating' | 'downloading' | 'error'

export default function InvitePage() {
  const { code } = useParams<{ code: string }>()
  const [status, setStatus]   = useState<Status>('validating')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/invite/${code}`, { method: 'POST' })
        const data = await res.json()

        if (!res.ok) {
          setErrorMsg(data.error ?? 'Enlace inválido.')
          setStatus('error')
          return
        }

        setStatus('downloading')

        // Disparar la descarga automáticamente
        const a = document.createElement('a')
        a.href = data.url
        a.download = 'RecetarioAI.apk'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

      } catch {
        setErrorMsg('No se pudo procesar tu invitación. Inténtalo de nuevo.')
        setStatus('error')
      }
    }

    validate()
  }, [code])

  return (
    <main style={styles.main}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.icon}>🍳</div>
        <h1 style={styles.appName}>Recetario AI</h1>

        {/* Estado: validando */}
        {status === 'validating' && (
          <>
            <p style={styles.title}>Preparando tu descarga...</p>
            <p style={styles.subtitle}>Validando tu invitación</p>
            <div style={styles.spinner} />
          </>
        )}

        {/* Estado: descargando */}
        {status === 'downloading' && (
          <>
            <p style={styles.titleOk}>✓ Descarga iniciada</p>
            <p style={styles.subtitle}>
              Si no empieza automáticamente,{' '}
              <a href={`/api/invite/${code}`} style={styles.link}>
                toca aquí
              </a>
              .
            </p>

            <div style={styles.divider} />

            <h2 style={styles.stepsTitle}>Cómo instalar Recetario AI</h2>
            <ol style={styles.steps}>
              <li style={styles.step}>
                <span style={styles.stepNum}>1</span>
                <span>
                  Abre el archivo <strong>RecetarioAI.apk</strong> desde las
                  notificaciones o tu carpeta de Descargas.
                </span>
              </li>
              <li style={styles.step}>
                <span style={styles.stepNum}>2</span>
                <span>
                  Si Android te pide activar{' '}
                  <strong>&quot;Instalar apps de origen desconocido&quot;</strong>,
                  toca <strong>Ajustes</strong> y actívalo para tu navegador.
                  Es un permiso puntual y seguro.
                </span>
              </li>
              <li style={styles.step}>
                <span style={styles.stepNum}>3</span>
                <span>
                  Toca <strong>Instalar</strong> y espera unos segundos.
                </span>
              </li>
              <li style={styles.step}>
                <span style={styles.stepNum}>4</span>
                <span>
                  ¡Listo! Abre <strong>Recetario AI</strong> y empieza a
                  cocinar. 🎉
                </span>
              </li>
            </ol>
          </>
        )}

        {/* Estado: error */}
        {status === 'error' && (
          <>
            <p style={styles.titleError}>Este enlace no es válido</p>
            <p style={styles.subtitle}>{errorMsg}</p>
            <p style={{ ...styles.subtitle, marginTop: 8 }}>
              Si crees que es un error, contacta con quien te lo envió para que
              genere un nuevo enlace.
            </p>
          </>
        )}
      </div>
    </main>
  )
}

// ── Estilos inline para no depender del sistema de estilos del proyecto ───────
const TERRACOTTA = '#9A442D'
const CREAM      = '#FCF9F4'
const SURFACE    = '#FFFFFF'

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    backgroundColor: CREAM,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: '40px 32px',
    maxWidth: 480,
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center' as const,
  },
  icon: {
    fontSize: 56,
    marginBottom: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: 800,
    color: TERRACOTTA,
    margin: '0 0 24px',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 8px',
  },
  titleOk: {
    fontSize: 20,
    fontWeight: 700,
    color: '#2e7d32',
    margin: '0 0 8px',
  },
  titleError: {
    fontSize: 20,
    fontWeight: 700,
    color: '#c62828',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    margin: 0,
    lineHeight: 1.5,
  },
  link: {
    color: TERRACOTTA,
    fontWeight: 600,
  },
  spinner: {
    width: 36,
    height: 36,
    border: `3px solid ${CREAM}`,
    borderTop: `3px solid ${TERRACOTTA}`,
    borderRadius: '50%',
    margin: '24px auto 0',
    animation: 'spin 0.8s linear infinite',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    margin: '28px 0',
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
    textAlign: 'left' as const,
    margin: '0 0 16px',
  },
  steps: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
    textAlign: 'left' as const,
  },
  step: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    fontSize: 14,
    color: '#333',
    lineHeight: 1.5,
  },
  stepNum: {
    minWidth: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: TERRACOTTA,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
}
