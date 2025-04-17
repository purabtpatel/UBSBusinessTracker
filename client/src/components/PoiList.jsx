const PoiList = ({ results, center }) => {
  if (!results || results.length === 0) {
    return (
      <div style={{ padding: '1rem', color: '#555' }}>
        No places found. Try adjusting your filters or choosing a new location.
      </div>
    );
  }

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortedResults = [...results].sort((a, b) => {
    const distA = a.position
      ? haversineDistance(center.lat, center.lon, a.position.lat, a.position.lon)
      : Infinity;
    const distB = b.position
      ? haversineDistance(center.lat, center.lon, b.position.lat, b.position.lon)
      : Infinity;
    return distA - distB;
  });

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
        {sortedResults.length} Places Found
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sortedResults.map((place, index) => {
          const name = place.poi?.name || 'Unnamed Place';
          const categories = place.poi?.categories?.join(', ') || 'Uncategorized';
          const address = place.address?.freeformAddress || 'No address';
          const dist =
            place.position
              ? haversineDistance(
                  center.lat,
                  center.lon,
                  place.position.lat,
                  place.position.lon
                ).toFixed(2)
              : null;

          return (
            <li
              key={place.id || index}
              style={{
                padding: '0.75rem 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <div style={{ fontWeight: 500, fontSize: '1rem' }}>
                {name} <span style={{ color: '#666' }}>• {categories}</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#444' }}>{address}</div>
              {dist && (
                <div style={{ fontSize: '0.8rem', color: '#888' }}>{dist} mi away</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PoiList;