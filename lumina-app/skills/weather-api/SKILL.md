---
name: weather-api
description: Use this skill when the user wants to add weather data to their app. Provides OpenWeather API integration guidance including environment variable setup, API endpoints, and API-specific gotchas.
---

# Weather API Integration

**⚠️ REQUIRED: Read [integration-patterns.md](references/integration-patterns.md) for implementation patterns before proceeding.**

---

Integrate weather data using the OpenWeather API.

## Quick Reference

**API Documentation:** Use Context7 API to retrieve current docs (see integration-patterns skill)
**Base URL:** `https://api.openweathermap.org/data/2.5`

**Main Endpoints:**
- `/weather` - Current weather for a location
- `/forecast` - 5-day forecast (3-hour intervals)

## Environment Variable

- **Variable name:** `OPENWEATHER_API_KEY`
- **Used via:** `config.openWeatherApiKey`
- **Note:** Woz provides this API key by default. The key is pre-configured, paid for, and will work out of the box. You don't need to worry about API limits or tier restrictions.

## Implementation Gotchas

1. **City names require country code** - Use `q=London,GB` not just `London` (avoids ambiguity)
2. **Coordinates more accurate** - Prefer `lat/lon` parameters over city names when possible
3. **Cache aggressively** - Weather data doesn't change frequently (30-minute cache recommended)
4. **Units parameter required** - Add `&units=metric` for Celsius or `&units=imperial` for Fahrenheit (default is Kelvin)
5. **404 for invalid cities** - Handle `response.status === 404` gracefully with "City not found" message
6. **Icon codes for UI** - Use `https://openweathermap.org/img/wn/{icon}@2x.png` for weather icons

## Response Structure

```typescript
interface WeatherData {
  main: {
    temp: number;          // Temperature in specified units
    feels_like: number;    // Perceived temperature
    humidity: number;      // Humidity percentage
    pressure: number;      // Atmospheric pressure (hPa)
  };
  weather: [{
    description: string;   // e.g., "clear sky", "light rain"
    icon: string;          // Icon code e.g., "01d"
  }];
  wind: {
    speed: number;         // Wind speed (m/s or mph depending on units)
    deg: number;           // Wind direction (degrees)
  };
  name: string;            // City name
  sys: {
    country: string;       // Country code
    sunrise: number;       // Sunrise time (Unix timestamp)
    sunset: number;        // Sunset time (Unix timestamp)
  };
}
```

## Example API Call

```bash
# Current weather by city
curl "https://api.openweathermap.org/data/2.5/weather?q=London,GB&appid=YOUR_API_KEY&units=metric"

# Current weather by coordinates (more accurate)
curl "https://api.openweathermap.org/data/2.5/weather?lat=51.5074&lon=-0.1278&appid=YOUR_API_KEY&units=metric"

# 5-day forecast
curl "https://api.openweathermap.org/data/2.5/forecast?q=London,GB&appid=YOUR_API_KEY&units=metric"
```

## Common Weather Icons

- `01d/01n` - Clear sky
- `02d/02n` - Few clouds
- `09d/09n` - Shower rain
- `10d/10n` - Rain
- `11d/11n` - Thunderstorm
- `13d/13n` - Snow
- `50d/50n` - Mist

---

**For complete implementation patterns (edge functions, CORS, frontend integration, caching):**
→ See the `integration-patterns` skill

