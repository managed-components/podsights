import { getRequestBody } from '.'

describe('Podsights MC works correctly', () => {
  const fetchedRequests: any = []
  const setCookies: any = []

  const dummyClient = {
    title: 'Zaraz "Test" /t Page',
    timestamp: 1670502437,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    language: 'en-GB',
    referer: '',
    ip: '127.0.0.1',
    emitter: 'browser',
    url: new URL('http://127.0.0.1:1337'),
    fetch: () => undefined,
    set: () => undefined,
    execute: () => undefined,
    return: () => {},
    get: () => undefined,
    attachEvent: () => {},
    detachEvent: () => {},
  }

  const fakeEvent = new Event('event', {}) as MCEvent
  fakeEvent.payload = {
    pid: 'xyz',
  }
  fakeEvent.client = dummyClient

  const settings = {}

  test('Returns correct request body', () => {
    const requestBody = getRequestBody(fakeEvent, settings)

    expect(requestBody.events[0].body.url).toBe('http://127.0.0.1:1337/')
    expect(requestBody.key).toBe(fakeEvent.payload.key)
    expect(requestBody.events[0].action).toBe('init')
    expect(requestBody.events[0].body.windowHeight).toBeTypeOf('number')
    expect(requestBody.events[0].body.windowWidth).toBeTypeOf('number')
    expect(requestBody.uid).toBeTypeOf('string')
    expect(requestBody.sid).toBeTypeOf('string')
    expect(requestBody.pid).toBeTypeOf('string')
  })

  test('Returns correct request body if PDST_NAME is passed', () => {
    fakeEvent.payload.PDST_name = 'TEST'
    const requestBody = getRequestBody(fakeEvent, settings)
    expect(requestBody.events[0].action).toBe('TEST')
  })
})
