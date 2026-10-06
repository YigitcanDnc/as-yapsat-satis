import { useState } from 'react';
import katSemasiImg from '../assets/kat-semasi.png';
import { FLAT_COORDINATES } from '../data/flatCoordinates';
import { findApartmentByNo } from '../data/apartments';

/**
 * Gerçek İzometrik Çizim Üzerinden Dinamik Daire Vurgulama Bileşeni
 * (AS İNŞAAT YAPILENT YANI KAT ŞEMASI)
 * 
 * 40 bağımsız bölüm (A-1..A-16, B-1..B-24) için izometrik poligon, radar/pulse ve
 * "SEÇİLDİ" işaretçisi sunar.
 */
export default function InteractiveFloorPlan({
  selectedApt,
  onSelectApt = null,
  isPrint = false,
  maxWidth = 'max-w-[540px]',
}) {
  const selectedNo = selectedApt?.no;
  const [hoveredNo, setHoveredNo] = useState(null);

  const selectedCoord = selectedNo ? FLAT_COORDINATES[selectedNo] : null;
  const hoveredCoord = hoveredNo ? FLAT_COORDINATES[hoveredNo] : null;

  return (
    <div className={`relative mx-auto w-full ${maxWidth} select-none`}>
      {/* 1. GERÇEK İZOMETRİK ÇİZİM GÖRSELİ (Yüksek Çözünürlüklü ve Keskin Kontrast) */}
      <img
        src={katSemasiImg}
        alt="As İnşaat Yapılent Yanı Kat Şeması"
        className="w-full h-auto block object-contain"
        style={{
          imageRendering: '-webkit-optimize-contrast',
        }}
        draggable={false}
      />

      {/* 2. REAKTİF SVG OVERLAY (İzometrik Poligonlar, Radar & İşaretçiler) */}
      <svg
        viewBox="0 0 1000 1414.2"
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Radar Pulse Halka Animasyonu */}
          <radialGradient id="radarPulseGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#d97706" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </radialGradient>

          {/* Gölge Efekti */}
          <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* TÜM 40 DAİRE ALANLARI (Tıklanabilir Katman) */}
        {Object.values(FLAT_COORDINATES).map((coord) => {
          const isSelected = coord.no === selectedNo;
          const isHovered = coord.no === hoveredNo;
          const aptObj = findApartmentByNo(coord.no);

          return (
            <g
              key={coord.no}
              className={!isPrint ? 'cursor-pointer group' : ''}
              onClick={() => {
                if (!isPrint && onSelectApt && aptObj) {
                  onSelectApt(aptObj);
                }
              }}
              onMouseEnter={() => !isPrint && setHoveredNo(coord.no)}
              onMouseLeave={() => !isPrint && setHoveredNo(null)}
            >
              {/* Vurgu Poligonu (İzometrik Oda / Daire Alanı) */}
              {isSelected ? (
                // SEÇİLİ DAİRE VURGUSU
                <polygon
                  points={coord.svgPoints}
                  fill="rgba(245, 158, 11, 0.40)"
                  stroke="#b45309"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              ) : isHovered ? (
                // HOVER VURGUSU (Sadece İnteraktif Modda)
                <polygon
                  points={coord.svgPoints}
                  fill="rgba(59, 130, 246, 0.22)"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              ) : (
                // NORMAL DURUM (Tıklama alanı - şeffaf)
                !isPrint && (
                  <polygon
                    points={coord.svgPoints}
                    fill="rgba(0, 0, 0, 0.001)"
                    stroke="transparent"
                    strokeWidth="1"
                  />
                )
              )}
            </g>
          );
        })}

        {/* SEÇİLİ DAİRE İŞARETÇİSİ VE RADAR (Vurgu Odak Noktası) */}
        {selectedCoord && (
          <g className="pointer-events-none">
            {/* 1. Radar Pulse Halkası */}
            <circle
              cx={selectedCoord.cx}
              cy={selectedCoord.cy}
              r="24"
              fill="rgba(245, 158, 11, 0.2)"
              stroke="#f59e0b"
              strokeWidth="2.5"
            >
              {!isPrint && (
                <>
                  <animate
                    attributeName="r"
                    values="14;30;14"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.9;0.2;0.9"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </>
              )}
            </circle>

            {/* 2. Merkez Hedef Noktası */}
            <circle
              cx={selectedCoord.cx}
              cy={selectedCoord.cy}
              r="5"
              fill="#d97706"
              stroke="#ffffff"
              strokeWidth="2"
            />

            {/* 3. Daire İşaretçi Pin / Rozeti [A-14 SEÇİLDİ] */}
            <g
              transform={`translate(${selectedCoord.cx}, ${selectedCoord.cy})`}
              filter="url(#badgeShadow)"
            >
              {/* Pointer İğnesi (Merkeze işaret eder) */}
              <polygon
                points="0,-2 -6,-14 6,-14"
                fill="#0f172a"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />

              {/* Rozet Arka Plan Kutusu */}
              <rect
                x="-48"
                y="-38"
                width="96"
                height="24"
                rx="6"
                fill="#0f172a"
                stroke="#f59e0b"
                strokeWidth="2.5"
              />

              {/* Rozet Metni */}
              <text
                x="0"
                y="-22"
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="11"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.5"
              >
                {selectedCoord.no} SEÇİLDİ
              </text>
            </g>
          </g>
        )}

        {/* HOVER TOOLTIP (Sadece İnteraktif Modda) */}
        {!isPrint && hoveredCoord && hoveredCoord.no !== selectedNo && (
          <g
            transform={`translate(${hoveredCoord.cx}, ${hoveredCoord.cy - 12})`}
            className="pointer-events-none"
            filter="url(#badgeShadow)"
          >
            <rect
              x="-36"
              y="-22"
              width="72"
              height="18"
              rx="4"
              fill="#1e293b"
              stroke="#60a5fa"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="-10"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
            >
              {hoveredCoord.no} Seç
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
