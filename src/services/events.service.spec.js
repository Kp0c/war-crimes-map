import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { EventsService } from './events.service.js';

const testEvents = {
  "Luganska": [
    {
      "id": 1804,
      "lat": 48.573989999999995,
      "lon": 39.30801,
      "qualification": 13,
      "event": 75,
      "object_number": 1
    },
    {
      "id": 6142,
      "lat": 48.57373,
      "lon": 39.30766,
      "affected_type": 32,
      "affected_number": [
        {
          "47": 1
        }
      ],
      "event": 55,
      "qualification": 91
    }
  ],
  "CHernigivska": [
    {
      "id": 43396,
      "lat": 51.496489999999994,
      "lon": 31.26859,
      "affected_type": 30,
      "affected_number": [
        {
          "47": 1
        }
      ],
      "event": 48,
      "qualification": 104
    }
  ]
};

const eventsEndpoint = 'https://icc.cpi.int/api/hague/russia/war-crimes/events';

describe('EventsService', () => {
  const server = setupServer(
    rest.get(eventsEndpoint, (req, res, ctx) => {
      return res(ctx.json(testEvents));
    })
  );

  beforeAll(() => server.listen());

  afterAll(() => server.close());

  afterEach(() => server.resetHandlers());

  describe('init', () => {
    it('should load events', async () => {
      const eventsService = new EventsService();
      await eventsService.init(eventsEndpoint, '');

      expect(1).toEqual(2);
      // expect(eventsService.events).toEqual(testEvents);
    });
  });
});
