import { http, HttpResponse } from 'msw'

const API_URL = 'http://localhost:3002/api/operations'

export const handlers = [
  http.get(API_URL, () => {
    return HttpResponse.json([])
  }),
  http.post(API_URL, async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json(
      {
        id: 1,
        ...body,
        isMember: Boolean(body.memberName?.trim()),
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    )
  }),
]

export { API_URL }