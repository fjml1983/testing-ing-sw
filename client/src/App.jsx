import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:3002/api/operations'

const initialForm = {
  title: '',
  year: '',
  format: '',
  operation: '',
  memberName: '',
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [operations, setOperations] = useState([])
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const isMember = useMemo(() => form.memberName.trim().length > 0, [form.memberName])

  async function refreshOperations() {
    try {
      const response = await fetch(API_URL)
      const data = await response.json()
      setOperations(data)
    } catch {
      setStatus({ type: 'error', message: 'No se pudieron cargar las operaciones registradas.' })
    }
  }

  useEffect(() => {
    let cancelled = false

    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setOperations(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ type: 'error', message: 'No se pudieron cargar las operaciones registradas.' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    if (name === 'year') {
      if (!/^\d{0,4}$/.test(value)) {
        return
      }
    }

    if (name === 'title' && value.length > 25) {
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setStatus({ type: '', message: '' })
  }

  function validateLocal(values) {
    const nextErrors = {}

    if (!values.title.trim()) {
      nextErrors.title = 'El titulo es obligatorio.'
    } else if (!/^[A-Za-z0-9 ]{1,25}$/.test(values.title.trim())) {
      nextErrors.title = 'Solo letras, numeros y espacios (maximo 25).'
    }

    if (!/^\d{4}$/.test(values.year)) {
      nextErrors.year = 'El anio debe tener exactamente 4 digitos.'
    }

    if (!values.format) {
      nextErrors.format = 'Debes elegir un formato.'
    }

    if (!values.operation) {
      nextErrors.operation = 'Debes elegir una operacion.'
    }

    if (values.memberName && !/^[A-Za-z0-9 ]{1,80}$/.test(values.memberName.trim())) {
      nextErrors.memberName = 'Nombre invalido: solo alfanumerico con espacios.'
    }

    const isCurrentMember = values.memberName.trim().length > 0
    if (!isCurrentMember && (values.format !== 'DVD' || values.operation !== 'venta')) {
      nextErrors.operationRule = 'Un no socio solamente puede comprar DVDs.'
    }

    if (isCurrentMember && values.format === 'Xbox' && values.operation !== 'renta') {
      nextErrors.operationRule = 'Un socio solo puede rentar juegos Xbox.'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const localErrors = validateLocal(form)

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        setStatus({ type: 'error', message: data.message || 'No se pudo registrar la operacion.' })
        return
      }

      setStatus({ type: 'success', message: 'Operacion registrada correctamente.' })
      setForm(initialForm)
      setErrors({})
      await refreshOperations()
    } catch {
      setStatus({ type: 'error', message: 'Error de comunicacion con el servidor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">Base didactica sin pruebas</p>
        <h1>Registro de venta y renta</h1>
        <p className="subtitle">DVD y juegos Xbox para un establecimiento pequeno.</p>
      </header>

      <section className="layout">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h2>Nueva operacion</h2>

          <label htmlFor="title">Titulo</label>
          <input
            id="title"
            name="title"
            type="text"
            maxLength={25}
            value={form.title}
            onChange={handleChange}
            placeholder="Ej. Halo Reach"
          />
          {errors.title ? <small className="error">{errors.title}</small> : null}

          <label htmlFor="year">Anio</label>
          <input
            id="year"
            name="year"
            type="text"
            inputMode="numeric"
            value={form.year}
            onChange={handleChange}
            placeholder="4 digitos"
          />
          {errors.year ? <small className="error">{errors.year}</small> : null}

          <label htmlFor="format">Formato</label>
          <select id="format" name="format" value={form.format} onChange={handleChange}>
            <option value="">Selecciona</option>
            <option value="DVD">DVD</option>
            <option value="Xbox">Xbox</option>
          </select>
          {errors.format ? <small className="error">{errors.format}</small> : null}

          <label htmlFor="operation">Operacion</label>
          <select id="operation" name="operation" value={form.operation} onChange={handleChange}>
            <option value="">Selecciona</option>
            <option value="venta">Venta</option>
            <option value="renta">Renta</option>
          </select>
          {errors.operation ? <small className="error">{errors.operation}</small> : null}

          <label htmlFor="memberName">Nombre del socio</label>
          <input
            id="memberName"
            name="memberName"
            type="text"
            value={form.memberName}
            onChange={handleChange}
            placeholder="Si queda vacio, se trata como no socio"
          />
          {errors.memberName ? <small className="error">{errors.memberName}</small> : null}

          <p className="helper">Estado detectado: {isMember ? 'Socio' : 'No socio'}</p>
          {errors.operationRule ? <small className="error">{errors.operationRule}</small> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Confirmar registro'}
          </button>

          {status.message ? (
            <p className={status.type === 'error' ? 'status error' : 'status success'}>{status.message}</p>
          ) : null}
        </form>

        <section className="card history">
          <h2>Operaciones recientes</h2>
          {operations.length === 0 ? (
            <p className="empty">Aun no hay operaciones registradas.</p>
          ) : (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Titulo</th>
                    <th>Anio</th>
                    <th>Formato</th>
                    <th>Operacion</th>
                    <th>Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.year}</td>
                      <td>{row.format}</td>
                      <td>{row.operation}</td>
                      <td>{row.isMember ? row.memberName : 'No socio'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
