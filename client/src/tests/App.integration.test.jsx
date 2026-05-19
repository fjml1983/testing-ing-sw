import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'
import App from '../App'
import { API_URL } from '../mocks/handlers'
import { server } from '../mocks/server'

async function fillValidForm(user) {
  await user.type(screen.getByLabelText('Titulo'), 'Halo Reach')
  await user.type(screen.getByLabelText('Anio'), '2012')
  await user.selectOptions(screen.getByLabelText('Formato'), 'DVD')
  await user.selectOptions(screen.getByLabelText('Operacion'), 'venta')
}

describe('Integracion App con MSW', () => {
  test('muestra vacio cuando no hay operaciones', async () => {
    render(<App />)

    expect(await screen.findByText('Aun no hay operaciones registradas.')).toBeInTheDocument()
  })

  test('muestra operaciones iniciales cuando GET trae datos', async () => {
    server.use(
      http.get(API_URL, () => {
        return HttpResponse.json([
          {
            id: 90,
            title: 'Matrix',
            year: '2004',
            format: 'DVD',
            operation: 'venta',
            memberName: '',
            isMember: false,
            createdAt: '2026-05-18T10:00:00.000Z',
          },
        ])
      }),
    )

    render(<App />)

    expect(await screen.findByText('Matrix')).toBeInTheDocument()
    expect(screen.getByText('No socio')).toBeInTheDocument()
  })

  test('envia POST exitoso y refresca la tabla', async () => {
    const operations = []

    server.use(
      http.get(API_URL, () => HttpResponse.json(operations)),
      http.post(API_URL, async ({ request }) => {
        const body = await request.json()
        const created = {
          id: 1,
          ...body,
          isMember: false,
          createdAt: '2026-05-18T10:00:00.000Z',
        }
        operations.unshift(created)
        return HttpResponse.json(created, { status: 201 })
      }),
    )

    render(<App />)
    const user = userEvent.setup()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar registro' }))

    expect(await screen.findByText('Operacion registrada correctamente.')).toBeInTheDocument()
    expect(await screen.findByText('Halo Reach')).toBeInTheDocument()
    expect(screen.getByLabelText('Titulo')).toHaveValue('')
    expect(screen.getByLabelText('Anio')).toHaveValue('')
  })

  test('muestra mensaje de error del backend cuando POST responde 400', async () => {
    server.use(
      http.post(API_URL, () => {
        return HttpResponse.json(
          { message: 'Un no socio solamente puede comprar DVDs.' },
          { status: 400 },
        )
      }),
    )

    render(<App />)
    const user = userEvent.setup()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar registro' }))

    expect(await screen.findByText('Un no socio solamente puede comprar DVDs.')).toBeInTheDocument()
  })

  test('muestra error cuando falla GET inicial por red', async () => {
    server.use(
      http.get(API_URL, () => {
        return HttpResponse.error()
      }),
    )

    render(<App />)

    expect(
      await screen.findByText('No se pudieron cargar las operaciones registradas.'),
    ).toBeInTheDocument()
  })

  test('muestra error cuando falla POST por red', async () => {
    server.use(
      http.post(API_URL, () => {
        return HttpResponse.error()
      }),
    )

    render(<App />)
    const user = userEvent.setup()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar registro' }))

    expect(await screen.findByText('Error de comunicacion con el servidor.')).toBeInTheDocument()
  })

  test('valida localmente y no hace POST cuando el formulario es invalido', async () => {
    const postSpy = vi.fn()

    server.use(
      http.post(API_URL, async ({ request }) => {
        postSpy()
        const body = await request.json()
        return HttpResponse.json(body, { status: 201 })
      }),
    )

    render(<App />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Confirmar registro' }))

    expect(await screen.findByText('El titulo es obligatorio.')).toBeInTheDocument()
    expect(postSpy).not.toHaveBeenCalled()

    expect(await screen.findByText('El anio debe tener exactamente 4 digitos.')).toBeInTheDocument()
  })
})