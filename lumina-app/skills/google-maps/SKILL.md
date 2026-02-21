---
name: google-maps
description: Use this skill when the user wants to add Google Maps features. Provides integration guidance for maps, geocoding, places, directions, and location services.
---

# Google Maps API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Add maps, geocoding, places search, and directions to your app using Google Maps Platform.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://maps.googleapis.com/maps/api`

**Main Endpoints:**
- `/geocode/json` - Convert addresses to coordinates (and reverse)
- `/place/nearbysearch/json` - Find nearby places
- `/place/details/json` - Get place details
- `/directions/json` - Calculate routes and directions

## Environment Variable

- **Variable name:** `GOOGLE_MAPS_API_KEY`
- **Used via:** `config.googleMapsApiKey`
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **API key restrictions required** - Set domain/IP restrictions and API restrictions in Google Cloud Console for security
2. **Different APIs need enabling** - Enable Maps SDK, Geocoding API, Places API separately in console
3. **Rate limits per API** - Each API has different limits; monitor usage in Cloud Console
4. **Billing must be enabled** - Requires credit card on file
5. **Key in URL query param** - Pass as `?key=YOUR_API_KEY` in URL, not header
6. **CORS for web** - Frontend calls work; restrict key to your domains
7. **Results caching limits** - Cannot cache geocoding results longer than 30 days per TOS

## Response Structure

```typescript
// Geocoding response
interface GeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
    types: string[];
  }>;
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED';
}

// Places nearby search
interface PlacesResponse {
  results: Array<{
    name: string;
    place_id: string;
    geometry: {
      location: { lat: number; lng: number };
    };
    rating?: number;
    types: string[];
    vicinity: string;
  }>;
  status: string;
}
```

## Example API Call

```bash
# Geocode address to coordinates
curl "https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=YOUR_API_KEY"

# Reverse geocode (coordinates to address)
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=37.4224764,-122.0842499&key=YOUR_API_KEY"

# Find nearby restaurants
curl "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=37.4224764,-122.0842499&radius=1500&type=restaurant&key=YOUR_API_KEY"

# Get directions
curl "https://maps.googleapis.com/maps/api/directions/json?origin=San+Francisco,CA&destination=Los+Angeles,CA&key=YOUR_API_KEY"

# Place details
curl "https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4&key=YOUR_API_KEY"
```

## Use Cases

- **Store locator** - Find nearest business locations
- **Delivery apps** - Calculate routes and ETAs
- **Real estate** - Display properties on map
- **Travel apps** - Show points of interest
- **Address validation** - Verify and autocomplete addresses

## Security Best Practices

1. **Restrict API key** - Add HTTP referrer restrictions (web) or app restrictions (mobile)
2. **Enable only needed APIs** - Disable unused APIs to prevent abuse
3. **Use backend proxy** - Call from edge functions to hide key from frontend
4. **Monitor usage** - Set up billing alerts in Google Cloud Console
5. **Rotate keys** - Periodically regenerate API keys

## Cost Optimization

- **Cache results** - Cache geocoding, places (respect 30-day limit)
- **Batch requests** - Some APIs support batching (e.g., distance matrix)
- **Use appropriate APIs** - Static map API cheaper than dynamic for non-interactive maps
- **Set quotas** - Prevent runaway costs with daily quotas

## Alternative Recommendations

- **Mapbox** - More flexible styling
- **OpenStreetMap** - Free, open-source (requires self-hosting or third-party service)

Use Google Maps when:
- Need comprehensive place data
- Users expect Google Maps familiarity
- Advanced routing features required
- Budget allows for paid tier

---

**For complete implementation patterns (edge functions, CORS, frontend integration, caching):**
→ See the `integration-patterns` skill

