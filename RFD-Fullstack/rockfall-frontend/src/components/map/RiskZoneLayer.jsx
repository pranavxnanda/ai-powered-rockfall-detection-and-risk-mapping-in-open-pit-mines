import { Polygon, Tooltip } from 'react-leaflet';
import { getRiskColor, getRiskLabel } from '../../utils/riskHelpers';

const RiskZoneLayer = ({ zone }) => {
  const color = getRiskColor(zone.riskLevel);

  // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
  const positions = zone.boundary.coordinates[0].map(([lng, lat]) => [lat, lng]);

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 2,
      }}>
      <Tooltip sticky>
        <div>
          <p className="font-semibold">{zone.zoneName}</p>
          <p>{getRiskLabel(zone.riskLevel)}</p>
          <p className="text-xs text-gray-500">
            Confidence: {(zone.confidenceScore * 100).toFixed(1)}%
          </p>
        </div>
      </Tooltip>
    </Polygon>
  );
};

export default RiskZoneLayer;