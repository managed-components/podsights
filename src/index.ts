import { ComponentSettings, Manager, MCEvent } from '@managed-components/types'

export type PodsightEvent = {
  action: string
  time: number
  group: string | null
  body: {
    url: string
    referrer: string
    inIframe: boolean
    windowWidth?: number
    windowHeight?: number
    timezoneOffset?: number
    params: {
      source: string | null
      placement: string | null
      from: string | null
    }
  }
}

export type RequestBody = {
  uid?: string
  sid?: string
  pid?: string
  key: string
  time: number
  events: Array<PodsightEvent>
}

const asInt = s => {
  try {
    return parseInt(s)
  } catch {
    return undefined
  }
}

export const getRequestBody = (event: MCEvent, settings: ComponentSettings) => {
  const { client, payload } = event

  const body: RequestBody = {
    pid: crypto.randomUUID(),
    key: settings.key,
    time: new Date().valueOf() / 1000 + 1,
    events: [
      {
        action: 'init',
        time: new Date().valueOf() / 1000,
        group: null,
        body: {
          url: client.url.href,
          referrer: client.referer || '',
          inIframe: false,
          windowWidth: asInt(client.viewportWidth),
          windowHeight: asInt(client.viewportHeight),
          timezoneOffset: asInt(client.timezoneOffset),
          params: {
            source: client.url.searchParams.get('source') || null,
            placement: client.url.searchParams.get('placement') || null,
            from: client.url.searchParams.get('from') || null,
          },
        },
      },
    ],
  }

  const pdst = client.get('pdst')
  if (pdst) {
    body.uid = pdst
  } else {
    const uid = crypto.randomUUID()
    body.uid = uid
    client.set('pdst', uid)
  }

  const pdstSession = client.get('pdstSession')
  if (pdstSession) {
    body.sid = pdstSession
  } else {
    const sid = crypto.randomUUID()
    body.sid = sid
    client.set('pdstSession', sid, {
      scope: 'session',
    })
  }

  if (payload.PDST_name) {
    const { PDST_name, ...payloadWithoutPDST } = payload
    body.events[0].action = PDST_name
    body.events[0].body = { ...body.events[0].body, ...payloadWithoutPDST }
  } else {
    body.events[0].body = { ...body.events[0].body, ...payload }
  }

  return body
}

const handler = (event: MCEvent, settings: ComponentSettings) => {
  const { client } = event
  const body = getRequestBody(event, settings)

  client.fetch(
    'https://us-central1-adaptive-growth.cloudfunctions.net/pdst-events-prod-sink',
    {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        referer: client.url.href,
      },
      body: JSON.stringify([body]),
      method: 'POST',
      mode: 'cors',
    }
  )
}

export default async function (manager: Manager, settings: ComponentSettings) {
  manager.addEventListener('pageview', event => {
    handler(event, settings)
  })

  manager.addEventListener('event', event => {
    handler(event, settings)
  })
}
