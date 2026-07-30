import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fetchDrivingRoute,
  formatDuration,
  formatArrivalTime,
  googleMapsDirectionsUrl,
} from "@/lib/routing";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetchJson(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok, json: async () => body }),
  );
}

describe("formatDuration", () => {
  it("rounds to whole minutes", () => {
    expect(formatDuration(389.4)).toBe("6 min");
  });

  it("never reports less than a minute, so a nearby church doesn't read as '0 min'", () => {
    expect(formatDuration(4)).toBe("1 min");
    expect(formatDuration(0)).toBe("1 min");
  });

  it("switches to hours past 60 minutes", () => {
    expect(formatDuration(60 * 60)).toBe("1 hr");
    expect(formatDuration(72 * 60)).toBe("1 hr 12 min");
  });

  it("omits a zero minute remainder", () => {
    expect(formatDuration(120 * 60)).toBe("2 hr");
  });
});

describe("formatArrivalTime", () => {
  it("adds the trip duration to the departure time", () => {
    const now = new Date("2026-07-29T14:00:00Z");
    // Formatted in the runner's locale/zone, so assert the shift rather than
    // a literal clock string.
    const arrival = formatArrivalTime(30 * 60, now);
    const expected = new Date(now.getTime() + 30 * 60 * 1000).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    expect(arrival).toBe(expected);
  });
});

describe("googleMapsDirectionsUrl", () => {
  it("includes an origin when the viewer's location is known", () => {
    const url = googleMapsDirectionsUrl([30.61, -96.34], [30.62, -96.31]);
    expect(url).toContain("destination=30.61,-96.34");
    expect(url).toContain("origin=30.62,-96.31");
  });

  it("omits the origin when location is unavailable", () => {
    const url = googleMapsDirectionsUrl([30.61, -96.34], null);
    expect(url).toContain("destination=30.61,-96.34");
    expect(url).not.toContain("origin=");
  });
});

describe("fetchDrivingRoute", () => {
  it("flips OSRM's lng,lat geometry into Leaflet's lat,lng order", async () => {
    stubFetchJson({
      code: "Ok",
      routes: [
        {
          duration: 389.4,
          distance: 3979.2,
          geometry: {
            coordinates: [
              [-96.313848, 30.628148],
              [-96.314462, 30.628615],
            ],
          },
        },
      ],
    });

    const route = await fetchDrivingRoute([30.628, -96.313], [30.611, -96.339]);
    expect(route).not.toBeNull();
    expect(route!.path).toEqual([
      [30.628148, -96.313848],
      [30.628615, -96.314462],
    ]);
  });

  it("converts meters to miles", async () => {
    stubFetchJson({
      code: "Ok",
      routes: [
        {
          duration: 389.4,
          distance: 1609.344,
          geometry: {
            coordinates: [
              [-96.31, 30.62],
              [-96.33, 30.61],
            ],
          },
        },
      ],
    });

    const route = await fetchDrivingRoute([30.62, -96.31], [30.61, -96.33]);
    expect(route!.distanceMiles).toBeCloseTo(1, 5);
  });

  it("requests the driving profile with full geometry", async () => {
    stubFetchJson({
      code: "Ok",
      routes: [
        {
          duration: 1,
          distance: 1,
          geometry: { coordinates: [[-96.31, 30.62], [-96.33, 30.61]] },
        },
      ],
    });

    await fetchDrivingRoute([30.62, -96.31], [30.61, -96.33]);
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    // lng,lat pairs in OSRM's order, origin first.
    expect(url).toContain("/driving/-96.31,30.62;-96.33,30.61");
    expect(url).toContain("geometries=geojson");
  });

  it("returns null when OSRM reports no route", async () => {
    stubFetchJson({ code: "NoRoute", routes: [] });
    expect(await fetchDrivingRoute([30.62, -96.31], [30.61, -96.33])).toBeNull();
  });

  it("returns null on a non-ok response", async () => {
    stubFetchJson({}, false);
    expect(await fetchDrivingRoute([30.62, -96.31], [30.61, -96.33])).toBeNull();
  });

  it("returns null rather than throwing when the request fails outright", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await fetchDrivingRoute([30.62, -96.31], [30.61, -96.33])).toBeNull();
  });

  it("returns null on a degenerate one-point geometry", async () => {
    stubFetchJson({
      code: "Ok",
      routes: [{ duration: 1, distance: 1, geometry: { coordinates: [[-96.31, 30.62]] } }],
    });
    expect(await fetchDrivingRoute([30.62, -96.31], [30.61, -96.33])).toBeNull();
  });
});
