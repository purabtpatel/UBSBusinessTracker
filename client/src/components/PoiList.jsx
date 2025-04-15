const PoiList = ({ results }) => {
    if (!results?.length) return <p>No results found.</p>;
  
    return (
      <ul className="space-y-4 mt-4">
        {results.map((poi, i) => (
          <li key={i} className="border p-3 rounded shadow">
            <h3 className="font-semibold">{poi.poi?.name}</h3>
            <p>{poi.address?.freeformAddress}</p>
            <p>Lat: {poi.position?.lat}, Lon: {poi.position?.lon}</p>
          </li>
        ))}
      </ul>
    );
  };
  
  export default PoiList;
  