---
name: mapbox
description: Use this skill when the user wants to add Mapbox features. Provides integration guidance for custom maps, geocoding, navigation, and location services with extensive styling options.
---

# Mapbox API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Build custom maps and location features with Mapbox's flexible mapping platform.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.mapbox.com`

**Main Endpoints:**
- `/geocoding/v5` - Forward and reverse geocoding
- `/directions/v5` - Turn-by-turn navigation
- `/isochrone/v1` - Travel time polygons
- `/styles/v1` - Map styles and tiles

**SDK:** Mapbox GL JS (web), Mapbox Maps SDK (iOS/Android)

## Environment Variable

- **Variable name:** `MAPBOX_ACCESS_TOKEN`
- **Used via:** `config.mapboxAccessToken`
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **Public token for frontend** - Use public access token with URL restrictions; secret token for backend only
2. **Different token types** - Public vs secret vs temporary; don't confuse them
3. **Style URL required** - Must specify map style URL (e.g., `mapbox://styles/mapbox/streets-v11`)
4. **Tile rate limits** - Implement caching to avoid throttling
5. **Custom styles need publishing** - Studio-created styles must be published before use
6. **Directions API quirks** - Coordinates in `longitude,latitude` format (reversed from typical lat,lng)
7. **SDK bundle size** - Mapbox GL JS is large (~500KB); consider lazy loading

## Response Structure

```typescript
// Geocoding response
interface MapboxGeocodingResponse {
  type: 'FeatureCollection';
  features: Array<{
    place_name: string;
    center: [number, number];  // [longitude, latitude]
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
    context?: Array<{
      id: string;
      text: string;
    }>;
  }>;
}

// Directions response
interface MapboxDirectionsResponse {
  routes: Array<{
    distance: number;  // meters
    duration: number;  // seconds
    geometry: string | object;  // encoded polyline or GeoJSON
    legs: Array<{
      steps: Array<{
        maneuver: {
          instruction: string;
          type: string;
        };
        distance: number;
        duration: number;
      }>;
    }>;
  }>;
}
```

## Example API Call

```bash
# Forward geocoding (address to coordinates)
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/San%20Francisco.json?access_token=YOUR_TOKEN"

# Reverse geocoding (coordinates to address)
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/-122.4194,37.7749.json?access_token=YOUR_TOKEN"

# Directions (driving)
curl "https://api.mapbox.com/directions/v5/mapbox/driving/-122.4194,37.7749;-118.2437,34.0522?access_token=YOUR_TOKEN&geometries=geojson"

# Isochrone (30-minute drive time)
curl "https://api.mapbox.com/isochrone/v1/mapbox/driving/-122.4194,37.7749?contours_minutes=30&access_token=YOUR_TOKEN"
```

## Frontend Integration (React Native)

```typescript
import MapboxGL from '@rnmapbox/maps';

// Initialize (in App.tsx)
MapboxGL.setAccessToken(config.mapboxAccessToken);

// Basic map component
<MapboxGL.MapView
  style={{ flex: 1 }}
  styleURL="mapbox://styles/mapbox/streets-v11"
>
  <MapboxGL.Camera
    centerCoordinate={[-122.4194, 37.7749]}
    zoomLevel={12}
  />
</MapboxGL.MapView>
```

## Map Styles

**Built-in styles:**
- `streets-v11` - Standard street map
- `outdoors-v11` - Hiking, biking, parks
- `light-v10` - Minimal, light background
- `dark-v10` - Dark mode
- `satellite-v9` - Satellite imagery
- `satellite-streets-v11` - Satellite + labels

**Custom styles:** Create in Mapbox Studio, publish, use URL

## Use Cases

- **Delivery tracking** - Real-time vehicle tracking with custom markers
- **Store locator** - Custom branded maps with business locations
- **Fitness apps** - Route tracking, isochrones for workout zones
- **Real estate** - Property maps with custom styling
- **Travel apps** - Offline maps, turn-by-turn navigation

## Cost Optimization

- **Cache tiles** - Reduce repeat tile requests
- **Offline maps** - Pre-download map regions for mobile apps
- **Optimize style** - Fewer layers = fewer tile requests
- **Throttle updates** - Don't update map on every GPS tick

## Alternative Recommendations

- **Google Maps** - More comprehensive place data
- **Apple Maps** - Better iOS integration
- **OpenStreetMap** - Free, community-driven data

Use Mapbox when:
- Need custom map styling/branding
- Usage fits your requirements
- Mobile offline maps required
- Advanced visualization features needed

---

**For complete implementation patterns (edge functions, CORS, frontend integration, offline maps):**
→ See the `integration-patterns` skill

